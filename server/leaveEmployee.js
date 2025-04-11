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
const DRIVE_LEAVES_FOLDER_ID = '1RLnXZNZhnJzcBdauSdmruqqJweFD-lXy';
const SPREADSHEET_ID = '1niZXidIiHwRI4itEJgswcXCvaJtiBfHDSa1CbOqZayw';
const LEAVES_SHEET_NAME = 'Employee_Leaves';

// Helper functions
const calculateDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
};
const getOrCreateEmployeeFolder = async (employeeNo, lastName) => {
  try {
    const folderName = `${lastName}_${employeeNo}`;
    
    const { data: { files } } = await drive.files.list({
      q: `'${DRIVE_LEAVES_FOLDER_ID}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id, name)'
    });

    if (files.length > 0) return files[0].id;

    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [DRIVE_LEAVES_FOLDER_ID]
    };

    const { data: folder } = await drive.files.create({
      resource: folderMetadata,
      fields: 'id',
    });

    return folder.id;
  } catch (error) {
    console.error('Error in creating/getting employee folder:', error);
    throw error;
  }
};

const uploadLeaveFile = async (file, employeeNo, lastName, fileType, dateIssued) => {
  try {

    const folderId = await getOrCreateEmployeeFolder(employeeNo, lastName);
    const fileExt = path.extname(file.originalname);
    let formattedDate;
    try {
      // Handle different date formats
      if (typeof dateIssued === 'string') {
        // If date string contains 'T' (ISO format)
        if (dateIssued.includes('T')) {
          formattedDate = dateIssued.split('T')[0];
        } else {
          // Try parsing the date string
          const date = new Date(dateIssued);
          if (isNaN(date.getTime())) {
            // If invalid date, use current date
            formattedDate = new Date().toISOString().split('T')[0];
          } else {
            formattedDate = date.toISOString().split('T')[0];
          }
        }
      } else {
        // If not a string, use current date
        formattedDate = new Date().toISOString().split('T')[0];
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      // Fallback to current date if there's an error
      formattedDate = new Date().toISOString().split('T')[0];
    }

    const fileName = `Leave_${fileType}_${lastName}_${formattedDate}${fileExt}`;

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
    
    return {
      path: fileUrl,
      name: fileName
    };
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
      const fileUploadResult = await uploadLeaveFile(
        file, 
        leaveData.employee_no, 
        employee[0].lastName,
        'LEAVE',
        new Date().toISOString()
      );
      leaveFormUrl = fileUploadResult.path; // Use only the path from the result
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
        leaveFormUrl, 
        leaveData.status || 'Pending for Approval'
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

// Update the updateLeave function
const updateLeave = async (leaveId, leaveData, file) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Get current leave data
    const [currentLeave] = await connection.query(
      'SELECT el.*, e.lastName FROM employee_leave el JOIN employees e ON el.employee_no = e.employeeNo WHERE el.leave_id = ?',
      [leaveId]
    );

    if (!currentLeave.length) {
      throw new Error('Leave not found');
    }

    let leaveFormUrl = currentLeave[0].leave_form;
    if (file) {
      const folderId = await getOrCreateEmployeeFolder(currentLeave[0].employee_no, currentLeave[0].lastName);
      const fileExt = path.extname(file.originalname);
      const fileName = `Leave_${currentLeave[0].lastName}_${format(new Date(), 'yyyy-MM-dd')}${fileExt}`;
      leaveFormUrl = await uploadLeaveFile(file, fileName, folderId);
    }

    // Format dates for MySQL
    
    // Update database with all fields including leave_form
    const [result] = await connection.query(
      `UPDATE employee_leave SET 
        start_date = ?,
        end_date = ?,
        leave_type = ?,
        leave_form = ?,
        status = ?
      WHERE leave_id = ?`,
      [
        leaveData.start_date, // Use directly without formatting
        leaveData.end_date,   // Use directly without formatting
        leaveData.leave_type,
        leaveFormUrl,
        leaveData.status,
        leaveId
      ]
    );

    // Get updated leave data for Google Sheets
    const [updatedLeave] = await connection.query(
      `SELECT el.*, 
              CONCAT(e.firstName, ' ', e.lastName) as employee_name
       FROM employee_leave el
       JOIN employees e ON el.employee_no = e.employeeNo
       WHERE el.leave_id = ?`,
      [leaveId]
    );

    if (updatedLeave.length > 0) {
      await updateLeaveInSheet(updatedLeave[0], updatedLeave[0].employee_name);
    }

    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
// Add this function
const updateLeaveInSheet = async (leaveData, employeeName) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${LEAVES_SHEET_NAME}!A:M`
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return;

    const rowIndex = rows.findIndex((row) => 
      row[0] === leaveData.leave_id.toString()
    );

    if (rowIndex === -1) {
      // If not found, append as new row
      return syncToGoogleSheets(leaveData, employeeName);
    }

    const days = calculateDays(leaveData.start_date, leaveData.end_date);

    const updatedRow = [
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
      leaveData.approver_name || 'N/A',
      leaveData.remarks || 'N/A'
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${LEAVES_SHEET_NAME}!A${rowIndex + 1}:M${rowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [updatedRow] }
    });
  } catch (error) {
    console.error('Error updating leave in sheet:', error);
    throw error;
  }
};
const processLeave = async (leaveId, processData) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Update the leave record
    const [result] = await connection.query(
      `UPDATE employee_leave SET 
        status = ?,
        approved_by = ?,
        remarks = ?,
        start_date = ?,
        end_date = ?
      WHERE leave_id = ?`,
      [
        processData.status,
        processData.approved_by,
        processData.remarks,
        processData.start_date,
        processData.end_date,
        leaveId
      ]
    );

    // Get the updated leave record with employee and approver details
    const [updatedLeave] = await connection.query(
      `SELECT el.*, 
              CONCAT(e.firstName, ' ', e.lastName) as employee_name,
              e.firstName, e.lastName,
              CONCAT(a.firstName, ' ', a.lastName) as approver_name
       FROM employee_leave el
       JOIN employees e ON el.employee_no = e.employeeNo
       LEFT JOIN employees a ON el.approved_by = a.employeeNo
       WHERE el.leave_id = ?`,
      [leaveId]
    );

    if (updatedLeave.length > 0) {
      // Update Google Sheets
      await updateLeaveInSheet(updatedLeave[0], updatedLeave[0].employee_name);
    }

    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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
  processLeave,
  deleteLeave
};