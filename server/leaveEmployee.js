// server/leaveEmployee.js
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const pool = require('./db');
const { format } = require('date-fns');

// Google Drive setup
const drive = google.drive({
  version: 'v3',
  auth: new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'firebase-service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
  }),
});

// Google Sheets setup
const sheets = google.sheets({
  version: 'v4',
  auth: new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'firebase-service-account.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  }),
});

// Configuration
const DRIVE_LEAVES_FOLDER_ID = '1fIqyPpe2LFjaF1JYywgoe9-028fiMrgq';
const SPREADSHEET_ID = '1niZXidIiHwRI4itEJgswcXCvaJtiBfHDSa1CbOqZayw';
const LEAVES_SHEET_NAME = 'Employee_Leaves';

// Helper functions
const calculateDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
};

const getOrCreateLeaveFolder = async (employeeNo, lastName) => {
  try {
    const folderName = `Employee_Leave_Record_${lastName}_${employeeNo}`;
    
    const { data: { files } } = await drive.files.list({
      q: `'${DRIVE_LEAVES_FOLDER_ID}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id, name)'
    });

    if (files.length > 0) return files[0].id;

    const { data: folder } = await drive.files.create({
      resource: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [DRIVE_LEAVES_FOLDER_ID]
      },
      fields: 'id'
    });

    return folder.id;
  } catch (error) {
    console.error('Error in getOrCreateLeaveFolder:', error);
    throw error;
  }
};

const uploadLeaveFile = async (file, fileName, folderId) => {
  try {
    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };

    const media = {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.path),
    };

    const { data: uploadedFile } = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });

    await drive.permissions.create({
      fileId: uploadedFile.id,
      requestBody: { role: 'reader', type: 'anyone' },
    });

    const fileUrl = `https://drive.google.com/uc?export=view&id=${uploadedFile.id}`;
    fs.unlinkSync(file.path);
    
    return fileUrl;
  } catch (error) {
    console.error('Error in uploadLeaveFile:', error);
    throw error;
  }
};

const syncToGoogleSheets = async (leaveData, employeeName) => {
  try {
    // First verify the sheet exists
    await verifySheetExists();

    const days = calculateDays(leaveData.start_date, leaveData.end_date);

    const row = [
      leaveData.leave_id,
      leaveData.employee_no,
      employeeName,
      leaveData.date_applied,
      leaveData.leave_type,
      leaveData.start_date,
      leaveData.end_date,
      days,
      leaveData.reason,
      leaveData.leave_form || 'N/A',
      leaveData.status,
      leaveData.approved_by || 'N/A',
      leaveData.remarks || 'N/A'
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${LEAVES_SHEET_NAME}!A:M`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [row] }
    });
  } catch (error) {
    console.error('Error syncing to Google Sheets:', error);
    throw error;
  }
};

const verifySheetExists = async () => {
  try {
    const { data } = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      fields: 'sheets.properties'
    });

    const sheetExists = data.sheets.some(
      sheet => sheet.properties.title === LEAVES_SHEET_NAME
    );

    if (!sheetExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: LEAVES_SHEET_NAME
              }
            }
          }]
        }
      });

      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${LEAVES_SHEET_NAME}!A1`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[
            'Leave ID', 'Employee No', 'Employee Name', 'Date Applied', 
            'Leave Type', 'Start Date', 'End Date', 'Days', 'Reason',
            'Leave Form', 'Status', 'Approved By', 'Remarks'
          ]]
        }
      });
    }
  } catch (error) {
    console.error('Error verifying sheet:', error);
    throw error;
  }
};
// Main functions
const getAllLeaves = async () => {
  const [rows] = await pool.query(`
    SELECT el.*, e.firstName, e.lastName 
    FROM employee_leave el
    LEFT JOIN employees e ON el.employee_no = e.employeeNo
    ORDER BY el.date_applied DESC
  `);
  return rows;
};

// Main functions
const createLeave = async (leaveData, file) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Get employee details
    const [employee] = await connection.query(
      'SELECT lastName FROM employees WHERE employeeNo = ?',
      [leaveData.employee_no]
    );
    
    if (!employee.length) throw new Error("Employee not found");

    // 2. Handle Google Drive upload
    let leaveFormUrl = '';
    if (file) {
      const folderId = await getOrCreateLeaveFolder(leaveData.employee_no, employee[0].lastName);
      const fileExt = path.extname(file.originalname);
      const fileName = `Leave_${employee[0].lastName}_${format(new Date(), 'yyyy-MM-dd')}${fileExt}`;
      leaveFormUrl = await uploadLeaveFile(file, fileName, folderId);
    }

    // 3. Insert to MySQL
    const [result] = await connection.query(
      `INSERT INTO employee_leave 
      (employee_no, date_applied, leave_type, start_date, end_date, reason, leave_form, status) 
      VALUES (?, CURDATE(), ?, ?, ?, ?, ?, ?)`,
      [
        leaveData.employee_no, 
        leaveData.leave_type, 
        leaveData.start_date, 
        leaveData.end_date, 
        leaveData.reason, 
        leaveFormUrl || null, 
        leaveData.status || 'Pending'
      ]
    );

    // 4. Get the complete record for Google Sheets
    const [newLeave] = await connection.query(
      `SELECT el.*, CONCAT(e.firstName, ' ', e.lastName) as employee_name 
       FROM employee_leave el
       JOIN employees e ON el.employee_no = e.employeeNo
       WHERE el.leave_id = ?`,
      [result.insertId]
    );

    // 5. Sync to Google Sheets
    await syncToGoogleSheets(newLeave[0], newLeave[0].employee_name);

    await connection.commit();
    return result.insertId;
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error in createLeave:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

const updateLeave = async (leaveId, leaveData, file) => {
  const { employee_no, leave_type, start_date, end_date, reason, status, approved_by, remarks } = leaveData;

  // Get existing leave
  const [leave] = await pool.query(
    'SELECT * FROM employee_leave WHERE leave_id = ?',
    [leaveId]
  );
  
  if (!leave.length) throw new Error("Leave not found");

  // Get employee details
  const [employee] = await pool.query(
    'SELECT lastName FROM employees WHERE employeeNo = ?',
    [employee_no]
  );

  if (!employee.length) throw new Error("Employee not found");

  let leaveFormUrl = leave[0].leave_form;
  
  // Handle new file upload
  if (file) {
    const folderId = await getOrCreateLeaveFolder(employee_no, employee[0].lastName);
    const fileExt = path.extname(file.originalname);
    const fileName = `Leave_${employee[0].lastName}_${format(new Date(), 'yyyy-MM-dd')}${fileExt}`;
    leaveFormUrl = await uploadLeaveFile(file, fileName, folderId);
  }

  // Update database
  const [result] = await pool.query(
    `UPDATE employee_leave SET 
      employee_no = ?, leave_type = ?, start_date = ?, 
      end_date = ?, reason = ?, leave_form = ?,
      status = ?, approved_by = ?, remarks = ?
    WHERE leave_id = ?`,
    [
      employee_no, leave_type, start_date, 
      end_date, reason, leaveFormUrl || null,
      status, approved_by || null, remarks || null,
      leaveId
    ]
  );
  
  return result.affectedRows > 0;
};

const deleteLeave = async (leaveId) => {
  const [result] = await pool.query(
    'DELETE FROM employee_leave WHERE leave_id = ?',
    [leaveId]
  );
  
  return result.affectedRows > 0;
};

// Export all functions
module.exports = {
  getAllLeaves,
  createLeave,
  updateLeave,
  deleteLeave
};