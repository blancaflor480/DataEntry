const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const multer = require("multer");
const { google } = require("googleapis");
const path = require("path");
require("dotenv").config();
const mysql = require('mysql2/promise');
const leaveEmployee = require('./leaveEmployee');

const app = express();
app.use(cors());
app.use(express.json());

// Firebase Setup
const serviceAccount = require("./firebase-service-account.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://dataentry-cd202.com",
});

const db = admin.firestore();
const auth = admin.auth();

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

// Google Drive setup with service account
const drive = google.drive({
    version: "v3",
    auth: new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, "firebase-service-account.json"), // Your service account key file
      scopes: ["https://www.googleapis.com/auth/drive"],
    }),
  });

// Google Sheets setup
const sheets = google.sheets({
  version: 'v4',
  auth: new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, "firebase-service-account.json"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  }),
});

const SPREADSHEET_ID = '1niZXidIiHwRI4itEJgswcXCvaJtiBfHDSa1CbOqZayw';
const SHEET_NAME = 'Employees'; // Update this to match your sheet name

// Modified insertEmployeeToSheet function
async function verifySheetExists() {
  try {
      const spreadsheet = await sheets.spreadsheets.get({
          spreadsheetId: SPREADSHEET_ID,
          fields: 'sheets.properties'
      });
      
      const sheetExists = spreadsheet.data.sheets.some(
          sheet => sheet.properties.title === SHEET_NAME
      );
      
      if (!sheetExists) {
          await sheets.spreadsheets.batchUpdate({
              spreadsheetId: SPREADSHEET_ID,
              resource: {
                  requests: [{
                      addSheet: {
                          properties: {
                              title: SHEET_NAME
                          }
                      }
                  }]
              }
          });
          console.log(`Created new sheet: ${SHEET_NAME}`);
      }
  } catch (error) {
      console.error('Error verifying sheet existence:', error);
      throw error;
  }
}
async function insertEmployeeToSheet(employeeData) {
  try {
      // First, check if the sheet exists and has headers
      let headers;
      try {
          const headerResponse = await sheets.spreadsheets.values.get({
              spreadsheetId: SPREADSHEET_ID,
              range: `${SHEET_NAME}!1:1` // Get the first row (headers)
          });
          headers = headerResponse.data.values ? headerResponse.data.values[0] : null;
      } catch (error) {
          console.error('Error checking sheet headers:', error);
          throw new Error('Unable to access sheet headers');
      }

      // If no headers exist, create them (first time setup)
      if (!headers || headers.length === 0) {
          const headerRow = [
              'ID', 'First Name', 'Middle Name', 'Last Name', 'Employee No', 
              'Status', 'Position', 'Date Hired', 'End Date', 'Personal Contact',
              'Personal Email', 'Corporate Email', 'Birthday', 'Address',
              'Starting Rate', 'Current Monthly Rate', 'Current Daily Rate','Hours Rate',
              'Foot Size', 'Weight', 'Height', 'BDO Account', 'SSS Number',
              'Pag-IBIG Number', 'PhilHealth Number', 'TIN Number',
              'Joining Contract URL', 'Probation Contract URL', 'Regular Contract URL'
          ];

          await sheets.spreadsheets.values.update({
              spreadsheetId: SPREADSHEET_ID,
              range: `${SHEET_NAME}!A1`, // Update the first row
              valueInputOption: 'USER_ENTERED',
              resource: {
                  values: [headerRow]
              }
          });
      }

      // Prepare the row data
      const row = [
          employeeData.id || '',
          employeeData.firstName,
          employeeData.middleName || '',
          employeeData.lastName,
          employeeData.employeeNo,
          employeeData.status,
          employeeData.position,
          employeeData.dateHire ? new Date(employeeData.dateHire).toLocaleDateString() : '',
          employeeData.endDate ? new Date(employeeData.endDate).toLocaleDateString() : '',
          employeeData.personalContact,
          employeeData.personalEmail,
          employeeData.corporateEmail,
          employeeData.birthday ? new Date(employeeData.birthday).toLocaleDateString() : '',
          employeeData.address,
          employeeData.startingRate,
          employeeData.currentMonthlyRate,
          employeeData.currentDailyRate,
          employeeData.hoursRate || '', // Added hoursRate
          employeeData.footSize || '',
          employeeData.weight || '',
          employeeData.height || '',
          employeeData.bdoAccount || '',
          employeeData.sssNumber || '',
          employeeData.pagIbigNumber || '',
          employeeData.philhealthNumber || '',
          employeeData.tinNumber || '',
          employeeData.joiningContractUrl || '',
          employeeData.probationContractUrl || '',
          employeeData.regularContractUrl || ''
      ];

      // Append the row to the sheet
      const response = await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A:Z`, // More flexible range
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          resource: {
              values: [row]
          }
      });

      console.log('Employee data inserted into Google Sheets:', response.data.updates.updatedRange);
      return response;
  } catch (error) {
      console.error('Error inserting employee to Google Sheets:', error);
      
      if (error.response) {
          console.error('Detailed error:', JSON.stringify(error.response.data, null, 2));
      }
      
      throw error;
  }
}

// Modified updateEmployeeInSheet function
async function updateEmployeeInSheet(employeeData) {
  try {
      // Get all data from the sheet
      const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A:Z`
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
          // If sheet is empty, just insert as new row
          return insertEmployeeToSheet(employeeData);
      }

      const headerRow = rows[0];
      const employeeNoIndex = headerRow.findIndex(header => header.toLowerCase().includes('employee'));
      
      if (employeeNoIndex === -1) {
          throw new Error('Employee No column not found in spreadsheet');
      }

      // Find the row with matching employee number
      const rowIndex = rows.findIndex((row, index) => 
          index > 0 && row[employeeNoIndex] === employeeData.employeeNo
      );

      if (rowIndex === -1) {
          // If not found, append as new row
          return insertEmployeeToSheet(employeeData);
      }

      // Prepare the updated row data
      const updatedRow = [
          employeeData.id,
          employeeData.firstName,
          employeeData.middleName || '',
          employeeData.lastName,
          employeeData.employeeNo,
          employeeData.status,
          employeeData.position,
          employeeData.dateHire ? new Date(employeeData.dateHire).toLocaleDateString() : '',
          employeeData.endDate ? new Date(employeeData.endDate).toLocaleDateString() : '',
          employeeData.personalContact,
          employeeData.personalEmail,
          employeeData.corporateEmail,
          employeeData.birthday ? new Date(employeeData.birthday).toLocaleDateString() : '',
          employeeData.address,
          employeeData.startingRate,
          employeeData.currentMonthlyRate,
          employeeData.currentDailyRate,
          employeeData.hoursRate || '', // Added hoursRate
          employeeData.footSize || '',
          employeeData.weight || '',
          employeeData.height || '',
          employeeData.bdoAccount || '',
          employeeData.sssNumber || '',
          employeeData.pagIbigNumber || '',
          employeeData.philhealthNumber || '',
          employeeData.tinNumber || '',
          employeeData.joiningContractUrl || '',
          employeeData.probationContractUrl || '',
          employeeData.regularContractUrl || ''
      ];

      // Update the specific row
      await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A${rowIndex + 1}`, // +1 because sheets are 1-indexed
          valueInputOption: 'USER_ENTERED',
          resource: {
              values: [updatedRow]
          }
      });

      console.log('Employee data updated in Google Sheets');
  } catch (error) {
      console.error('Error updating employee in Google Sheets:', error);
      if (error.response) {
          console.error('Detailed error:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
  }
}


// Add this function to your server.js
async function deleteEmployeeFromSheet(employeeNo) {
    try {
      // Get all data from the sheet
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:Z`
      });
  
      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return; // Nothing to delete
      }
  
      const headerRow = rows[0];
      const employeeNoIndex = headerRow.findIndex(header => 
        header.toLowerCase().includes('employee no') || 
        header.toLowerCase().includes('employeeno')
      );
      
      if (employeeNoIndex === -1) {
        throw new Error('Employee No column not found in spreadsheet');
      }
  
      // Find the row with matching employee number
      const rowIndex = rows.findIndex((row, index) => 
        index > 0 && row[employeeNoIndex] === employeeNo.toString()
      );
  
      if (rowIndex === -1) {
        return; // Employee not found in sheet
      }
  
      // Delete the row (adding 2 because Sheets starts at 1 and header row)
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: 0,
                dimension: "ROWS",
                startIndex: rowIndex,
                endIndex: rowIndex + 1
              }
            }
          }]
        }
      });
  
      console.log('Employee deleted from Google Sheets');
    } catch (error) {
      console.error('Error deleting employee from Google Sheets:', error);
      throw error;
    }
  }
// Endpoint to handle file upload to Google Drive
app.post("/upload", upload.single("profile"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const fileMetadata = {
            name: req.file.originalname,
            parents: ["1GXIhhayccVZS9lWRHWia7X8cUXHUMIcp"], // Replace with your Google Drive folder ID
        };

        const media = {
            mimeType: req.file.mimetype,
            body: require("fs").createReadStream(req.file.path),
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: "id",
        });

        const fileId = response.data.id;

        // Make the file publicly accessible
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: "reader",
                type: "anyone",
            },
        });

        const fileUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

        // Delete the temporary file
        require("fs").unlinkSync(req.file.path);

        res.status(200).json({ fileUrl });
    } catch (error) {
        console.error("Error uploading file to Google Drive:", error);
        res.status(500).json({ error: "Failed to upload file" });
    }
});

// Endpoint to handle file upload to Google Drive for employee attachments
app.post("/upload-attachment", upload.single("attachment"), async (req, res) => {
  try {
      if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
      }

      const fileMetadata = {
          name: req.file.originalname,
          // Folder ID for employee attachments
          parents: ["1fIqyPpe2LFjaF1JYywgoe9-028fiMrgq"], // Updated folder ID
      };

      const media = {
          mimeType: req.file.mimetype,
          body: require("fs").createReadStream(req.file.path),
      };

      const response = await drive.files.create({
          resource: fileMetadata,
          media: media,
          fields: "id",
      });

      const fileId = response.data.id;

      // Make the file publicly accessible
      await drive.permissions.create({
          fileId: fileId,
          requestBody: {
              role: "reader",
              type: "anyone",
          },
      });

      const fileUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

      // Delete the temporary file
      require("fs").unlinkSync(req.file.path);

      res.status(200).json({ fileUrl });
  } catch (error) {
      console.error("Error uploading attachment to Google Drive:", error);
      res.status(500).json({ error: "Failed to upload attachment" });
  }
});

// Create MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dataentry',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

// Validation middleware
const validateEmployeeData = (req, res, next) => {
    const { 
      firstName, lastName, employeeNo, status, position, dateHire,
      personalContact, personalEmail, corporateEmail, birthday, address,
      startingRate, currentMonthlyRate, currentDailyRate, hoursRate
    } = req.body;
  
    // Required fields validation
    if (!firstName || !lastName || !employeeNo || !status || !position || !dateHire ||
        !personalContact || !personalEmail || !corporateEmail || !birthday || !address ||
        !startingRate || !currentMonthlyRate || !currentDailyRate || !hoursRate) {
      return res.status(400).json({ error: "Missing required fields" });
    }
  
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personalEmail) || !emailRegex.test(corporateEmail)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
  
    // Date validation
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateHire) || (req.body.endDate && !dateRegex.test(req.body.endDate))) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }
  
    // Numeric validation for rates
    if (isNaN(parseFloat(startingRate)) || isNaN(parseFloat(currentMonthlyRate)) || isNaN(parseFloat(currentDailyRate))) {
      return res.status(400).json({ error: "Rates must be numeric values" });
    }
  
    next();
  };
  
 // Modified employee creation endpoint
 app.post("/employees", validateEmployeeData, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
      const {
          firstName, middleName, lastName, employeeNo, status, position,
          dateHire, endDate, footSize, weight, height, personalContact,
          personalEmail, corporateEmail, birthday, address, startingRate,
          currentMonthlyRate, currentDailyRate, hoursRate, bdoAccount, sssNumber,
          pagIbigNumber, philhealthNumber, tinNumber,
          joiningContractUrl, probationContractUrl, regularContractUrl
      } = req.body;

      try {
          // Check if employee number already exists
          const [existingEmployee] = await connection.query(
              'SELECT id FROM employees WHERE employeeNo = ?',
              [employeeNo]
          );

          if (existingEmployee.length > 0) {
              await connection.release();
              return res.status(400).json({ error: "Employee number already exists" });
          }

          // Prepare the data for insertion with null handling
          const employeeData = {
              firstName, 
              middleName: middleName || '', 
              lastName, 
              employeeNo, 
              status, 
              position,
              dateHire, 
              endDate: endDate || '', 
              footSize: footSize || '', 
              weight: weight || '', 
              height: height || '', 
              personalContact,
              personalEmail, 
              corporateEmail, 
              birthday, 
              address, 
              startingRate,
              currentMonthlyRate, 
              currentDailyRate,
              hoursRate: hoursRate || '', // Added hoursRate 
              bdoAccount: bdoAccount || '', 
              sssNumber: sssNumber || '',
              pagIbigNumber: pagIbigNumber || '', 
              philhealthNumber: philhealthNumber || '', 
              tinNumber: tinNumber || '',
              joiningContractUrl: joiningContractUrl || '', 
              probationContractUrl: probationContractUrl || '', 
              regularContractUrl: regularContractUrl || ''
          };

          // Insert employee data into MySQL
          const [result] = await connection.query(
              `INSERT INTO employees (
                  firstName, middleName, lastName, employeeNo, status, position,
                  dateHire, endDate, footSize, weight, height, personalContact,
                  personalEmail, corporateEmail, birthday, address, startingRate,
                  currentMonthlyRate, currentDailyRate, hoursRate, bdoAccount, sssNumber,
                  pagIbigNumber, philhealthNumber, tinNumber,
                  joiningContractUrl, probationContractUrl, regularContractUrl
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                  firstName, middleName || null, lastName, employeeNo, status, position,
                  dateHire, endDate || null, footSize || null, weight || null, height || null, personalContact,
                  personalEmail, corporateEmail, birthday, address, startingRate,
                  currentMonthlyRate, currentDailyRate, hoursRate, bdoAccount || null, sssNumber || null,
                  pagIbigNumber || null, philhealthNumber || null, tinNumber || null,
                  joiningContractUrl || null, probationContractUrl || null, regularContractUrl || null
              ]
          );

          // Fetch the inserted employee data to get the auto-generated ID
          const [insertedEmployee] = await connection.query(
              'SELECT * FROM employees WHERE id = ?',
              [result.insertId]
          );

          // Add the ID to the employeeData object for Google Sheets
          employeeData.id = result.insertId;

          // Insert into Google Sheets with more robust error handling
          try {
              await insertEmployeeToSheet(employeeData);
          } catch (sheetError) {
              console.error('Failed to insert into Google Sheets:', sheetError);
              // Log the detailed error, but don't stop the process
          }

          await connection.release();
          res.status(201).json({ 
              message: "Employee created successfully", 
              employeeId: result.insertId 
          });
      } catch (error) {
          await connection.release();
          throw error;
      }
  } catch (error) {
      console.error("Error creating employee:", error);
      res.status(500).json({ error: "Failed to create employee" });
  }
});

// Endpoint to get all employees
app.get("/employees", async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM employees ORDER BY createdAt DESC');
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

  // Endpoint to get a specific employee
  app.get("/employees/:id", async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ error: "Employee not found" });
      }
      res.status(200).json(rows[0]);
    } catch (error) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ error: "Failed to fetch employee" });
    }
  });
  
  // Modify the update endpoint to also update the Google Sheet
app.put("/employees/:id", validateEmployeeData, async (req, res) => {
  try {
      const employeeId = req.params.id;
      const connection = await pool.getConnection();
      
      try {
          // Check if employee exists
          const [existingEmployee] = await connection.query(
              'SELECT id FROM employees WHERE id = ?',
              [employeeId]
          );

          if (existingEmployee.length === 0) {
              await connection.release();
              return res.status(404).json({ error: "Employee not found" });
          }

          const {
              firstName, middleName, lastName, employeeNo, status, position,
              dateHire, endDate, footSize, weight, height, personalContact,
              personalEmail, corporateEmail, birthday, address, startingRate,
              currentMonthlyRate, currentDailyRate, hoursRate, bdoAccount, sssNumber,
              pagIbigNumber, philhealthNumber, tinNumber,
              joiningContractUrl, probationContractUrl, regularContractUrl
          } = req.body;

          // Update employee data in MySQL
          await connection.query(
              `UPDATE employees SET 
                  firstName = ?, middleName = ?, lastName = ?, employeeNo = ?, status = ?, position = ?,
                  dateHire = ?, endDate = ?, footSize = ?, weight = ?, height = ?, personalContact = ?,
                  personalEmail = ?, corporateEmail = ?, birthday = ?, address = ?, startingRate = ?,
                  currentMonthlyRate = ?, currentDailyRate = ?, hoursRate = ?, bdoAccount = ?, sssNumber = ?,
                  pagIbigNumber = ?, philhealthNumber = ?, tinNumber = ?,
                  joiningContractUrl = ?, probationContractUrl = ?, regularContractUrl = ?
              WHERE id = ?`,
              [
                  firstName, middleName || null, lastName, employeeNo, status, position,
                  dateHire, endDate || null, footSize || null, weight || null, height || null, personalContact,
                  personalEmail, corporateEmail, birthday, address, startingRate,
                  currentMonthlyRate, currentDailyRate, hoursRate, bdoAccount || null, sssNumber || null,
                  pagIbigNumber || null, philhealthNumber || null, tinNumber || null,
                  joiningContractUrl || null, probationContractUrl || null, regularContractUrl || null,
                  employeeId
              ]
          );

          // Fetch the updated employee data
          const [updatedEmployee] = await connection.query(
              'SELECT * FROM employees WHERE id = ?',
              [employeeId]
          );

          // Update row in Google Sheets
          // Note: This requires finding the correct row in the sheet based on employeeNo or ID
          await updateEmployeeInSheet(updatedEmployee[0]);

          await connection.release();
          res.status(200).json({ message: "Employee updated successfully" });
      } catch (error) {
          await connection.release();
          throw error;
      }
  } catch (error) {
      console.error("Error updating employee:", error);
      res.status(500).json({ error: "Failed to update employee" });
  }
});
  
  // Endpoint to delete an employee
  app.delete("/employees/:id", async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const employeeId = req.params.id;
      
      // First get the employee data before deleting (for Google Sheets)
      const [employee] = await connection.query(
        'SELECT * FROM employees WHERE id = ?', 
        [employeeId]
      );
  
      if (employee.length === 0) {
        await connection.release();
        return res.status(404).json({ error: "Employee not found" });
      }
  
      const employeeNo = employee[0].employeeNo;
  
      // Delete from MySQL
      const [result] = await connection.query(
        'DELETE FROM employees WHERE id = ?', 
        [employeeId]
      );
  
      if (result.affectedRows === 0) {
        await connection.release();
        return res.status(404).json({ error: "Employee not found" });
      }
  
      // Delete from Google Sheets using employee number
      try {
        await deleteEmployeeFromSheet(employeeNo);
      } catch (sheetError) {
        console.error('Failed to delete from Google Sheets:', sheetError);
        // Continue even if sheet deletion fails
      }
  
      await connection.release();
      res.status(200).json({ 
        message: "Employee deleted successfully from both database and spreadsheet" 
      });
    } catch (error) {
      await connection.release();
      console.error("Error deleting employee:", error);
      res.status(500).json({ error: "Failed to delete employee" });
    }
  });

//Record
// Add these constants at the top with other configurations
const RECORDS_SHEET_NAME = 'Employee_Records';
const DRIVE_RECORDS_FOLDER_ID = '1RLnXZNZhnJzcBdauSdmruqqJweFD-lXy'; // Your shared folder ID
const fs = require('fs');
const e = require("express");

// Add this function to create employee folders
async function getOrCreateEmployeeFolder(employeeNo, lastName) {
  try {
    const folderName = `Employee_${lastName}_${employeeNo}`;
    
    // Check if folder already exists
    const { data: { files } } = await drive.files.list({
      q: `'${DRIVE_RECORDS_FOLDER_ID}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id, name)'
    });

    if (files.length > 0) {
      return files[0].id; // Return existing folder ID
    }

    // Create new folder if it doesn't exist
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [DRIVE_RECORDS_FOLDER_ID]
    };

    const { data: folder } = await drive.files.create({
      resource: folderMetadata,
      fields: 'id'
    });

    return folder.id;
  } catch (error) {
    console.error('Error creating employee folder:', error);
    throw error;
  }
}

// Add this function to verify records sheet exists
async function verifyRecordsSheetExists() {
  try {
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      fields: 'sheets.properties'
    });
    
    const sheetExists = spreadsheet.data.sheets.some(
      sheet => sheet.properties.title === RECORDS_SHEET_NAME
    );
    
    if (!sheetExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: RECORDS_SHEET_NAME
              }
            }
          }]
        }
      });
      
      // Add headers to the new sheet
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${RECORDS_SHEET_NAME}!A1`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[
            'Record ID', 'Employee No', 'Employee Name', 'Type', 
            'Date Issued', 'Details', 'Attachment', 'Status'
          ]]
        }
      });
    }
  } catch (error) {
    console.error('Error verifying records sheet:', error);
    throw error;
  }
}

// Add this function to sync record to Google Sheets
async function syncRecordToSheet(record, employeeName) {
  try {
    await verifyRecordsSheetExists();
    
    // Format the date properly
    let formattedDate;
    if (record.dateIssued instanceof Date) {
      formattedDate = record.dateIssued.toISOString().split('T')[0];
    } else if (typeof record.dateIssued === 'string') {
      // If it's already in YYYY-MM-DD format, use as-is
      formattedDate = record.dateIssued.includes('T') 
        ? record.dateIssued.split('T')[0]
        : record.dateIssued;
    } else {
      formattedDate = 'N/A';
    }

    const row = [
      record.recordID,
      record.employeeNo,
      employeeName,
      record.type,
      formattedDate,  // Use the properly formatted date
      record.details,
      record.attachment || 'N/A',
      record.status
    ];

    // Rest of the function remains the same
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${RECORDS_SHEET_NAME}!A:H`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: [row] }
    });
  } catch (error) {
    console.error('Error syncing record to sheet:', error);
    throw error;
  }
}

// Add this function to update record in Google Sheets
async function updateRecordInSheet(record, employeeName) {
  try {
    // Get all records from sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${RECORDS_SHEET_NAME}!A:H`
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return;

    // Find the row with matching record ID
    const rowIndex = rows.findIndex((row, index) => 
      index > 0 && row[0] === record.recordID.toString()
    );

    let formattedDate;
    if (record.dateIssued instanceof Date) {
      formattedDate = record.dateIssued.toISOString().split('T')[0];
    } else if (typeof record.dateIssued === 'string') {
      formattedDate = record.dateIssued.includes('T') 
        ? record.dateIssued.split('T')[0]
        : record.dateIssued;
    } else {
      formattedDate = 'N/A';
    }

    if (rowIndex === -1) return; // Record not found in sheet

    // Update the specific row
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${RECORDS_SHEET_NAME}!A${rowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[
          record.recordID,
          record.employeeNo,
          employeeName,
          record.type,
          record.formattedDate,
          record.details,
          record.attachment || 'N/A',
          record.status
        ]]
      }
    });
  } catch (error) {
    console.error('Error updating record in sheet:', error);
    throw error;
  }
}

// Add this function to delete record from Google Sheets
async function deleteRecordFromSheet(recordId) {
  try {
    // Get all records from sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${RECORDS_SHEET_NAME}!A:H`
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return;

    // Find the row with matching record ID
    const rowIndex = rows.findIndex((row, index) => 
      index > 0 && row[0] === recordId.toString()
    );

    if (rowIndex === -1) return; // Record not found in sheet

    // Delete the row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: await getSheetId(RECORDS_SHEET_NAME),
              dimension: "ROWS",
              startIndex: rowIndex,
              endIndex: rowIndex + 1
            }
          }
        }]
      }
    });
  } catch (error) {
    console.error('Error deleting record from sheet:', error);
    throw error;
  }
}

// Helper function to get sheet ID by name
async function getSheetId(sheetName) {
  const { data } = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: 'sheets.properties'
  });
  
  const sheet = data.sheets.find(s => s.properties.title === sheetName);
  return sheet ? sheet.properties.sheetId : null;
}


// Endpoint to get all records with employee names
app.get("/records", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT er.*, e.firstName, e.lastName 
      FROM employee_records er
      LEFT JOIN employees e ON er.employeeNo = e.employeeNo
      ORDER BY er.dateIssued DESC
    `);
    
    // Format the data to include full employee name
    const records = rows.map(row => ({
      ...row,
      employeeName: `${row.firstName} ${row.lastName}`
    }));
    
    res.status(200).json(records);
  } catch (error) {
    console.error("Error fetching records:", error);
    res.status(500).json({ error: "Failed to fetch records" });
  }
});

// Update the POST /records endpoint
app.post("/records", upload.single('attachment'), async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);
    const { employeeNo, type, dateIssued, details, status } = req.body;
    // Detailed logging of input validation
    console.log("Employee No:", employeeNo);
    console.log("Type:", type);
    console.log("Date Issued:", dateIssued);
    console.log("Details:", details);
    console.log("Status:", status);
    // Get employee details to create folder
    const [employee] = await pool.query(
      'SELECT lastName FROM employees WHERE employeeNo = ?',
      [employeeNo]
    );
    
    if (!employee.length) {
      return res.status(400).json({ error: "Employee not found" });
    }

    // Create or get employee folder
    const folderId = await getOrCreateEmployeeFolder(employeeNo, employee[0].lastName);
    
    let attachmentUrl = '';
    
    // If there's a file upload, handle it
    if (req.file) {
      // Format the filename as Type_LastName_DateIssued.ext
      const fileExt = path.extname(req.file.originalname);
      const formattedDate = new Date(dateIssued).toISOString().split('T')[0];
      const fileName = `${type}_${employee[0].lastName}_${formattedDate}${fileExt}`;

      const fileMetadata = {
        name: fileName,
        parents: [folderId]
      };

      const media = {
        mimeType: req.file.mimetype,
        body: fs.createReadStream(req.file.path),
      };

      const response = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: "id",
      });

      const fileId = response.data.id;
      await drive.permissions.create({
        fileId: fileId,
        requestBody: { role: "reader", type: "anyone" },
      });

      attachmentUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      fs.unlinkSync(req.file.path);
    }

    // Insert record into MySQL
    const [result] = await pool.query(
      `INSERT INTO employee_records 
      (employeeNo, type, dateIssued, details, attachment, status) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [employeeNo, type, dateIssued, details, attachmentUrl || null, status || 'Pending']
    );
    
    // Get the full record with employee name for Google Sheets
    const [newRecord] = await pool.query(
      `SELECT er.*, CONCAT(e.firstName, ' ', e.lastName) as employeeName 
       FROM employee_records er
       JOIN employees e ON er.employeeNo = e.employeeNo
       WHERE er.recordID = ?`,
      [result.insertId]
    );

    // Sync to Google Sheets
    await syncRecordToSheet(newRecord[0], newRecord[0].employeeName);
    
    res.status(201).json({ 
      message: "Record created successfully", 
      recordId: result.insertId 
    });
  } catch (error) {
    console.error("Error creating record:", error);
    res.status(500).json({ error: "Failed to create record" });
  }
});

// Update the PUT /records/:id endpoint
app.put("/records/:id", upload.single('attachment'), async (req, res) => {
  try {
    const recordId = req.params.id;
    const { employeeNo, type, dateIssued, details, status } = req.body;
    
    // First get the existing record and employee details
    const [record] = await pool.query(
      'SELECT * FROM employee_records WHERE recordID = ?',
      [recordId]
    );
    
    if (!record.length) {
      return res.status(404).json({ error: "Record not found" });
    }

    const [employee] = await pool.query(
      'SELECT lastName FROM employees WHERE employeeNo = ?',
      [employeeNo]
    );

    if (!employee.length) {
      return res.status(400).json({ error: "Employee not found" });
    }

    let attachmentUrl = record[0].attachment;
    
    // If there's a new file upload, handle it
    if (req.file) {
      // Format the filename as Type_LastName_DateIssued.ext
      const fileExt = path.extname(req.file.originalname);
      const formattedDate = new Date(dateIssued).toISOString().split('T')[0];
      const fileName = `${type}_${employee[0].lastName}_${formattedDate}${fileExt}`;

      const folderId = await getOrCreateEmployeeFolder(employeeNo, employee[0].lastName);

      const fileMetadata = {
        name: fileName,
        parents: [folderId]
      };

      const media = {
        mimeType: req.file.mimetype,
        body: fs.createReadStream(req.file.path),
      };

      const response = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: "id",
      });

      const fileId = response.data.id;
      await drive.permissions.create({
        fileId: fileId,
        requestBody: { role: "reader", type: "anyone" },
      });

      attachmentUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      fs.unlinkSync(req.file.path);
    }

    // Update record in MySQL
    const [result] = await pool.query(
      `UPDATE employee_records SET 
        employeeNo = ?, type = ?, dateIssued = ?, 
        details = ?, attachment = ?, status = ?
      WHERE recordID = ?`,
      [employeeNo, type, dateIssued, details, attachmentUrl || null, status, recordId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Record not found" });
    }
    
    // Get the updated record with employee name
    const [updatedRecord] = await pool.query(
      `SELECT er.*, CONCAT(e.firstName, ' ', e.lastName) as employeeName 
       FROM employee_records er
       JOIN employees e ON er.employeeNo = e.employeeNo
       WHERE er.recordID = ?`,
      [recordId]
    );

    // Update Google Sheets
    await updateRecordInSheet(updatedRecord[0], updatedRecord[0].employeeName);
    
    res.status(200).json({ message: "Record updated successfully" });
  } catch (error) {
    console.error("Error updating record:", error);
    res.status(500).json({ error: "Failed to update record" });
  }
});

// Update the DELETE /records/:id endpoint
app.delete("/records/:id", async (req, res) => {
  try {
    const recordId = req.params.id;
    
    // First get the record before deleting (for Google Sheets sync)
    const [record] = await pool.query(
      'SELECT * FROM employee_records WHERE recordID = ?',
      [recordId]
    );
    
    if (!record.length) {
      return res.status(404).json({ error: "Record not found" });
    }

    // Delete from MySQL
    const [result] = await pool.query(
      'DELETE FROM employee_records WHERE recordID = ?',
      [recordId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Record not found" });
    }
    
    // Delete from Google Sheets
    await deleteRecordFromSheet(recordId);
    
    res.status(200).json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error("Error deleting record:", error);
    res.status(500).json({ error: "Failed to delete record" });
  }
});


const API_BASE = '/api/v1';
// Leave Routes
app.get('/api/v1/leaves', async (req, res) => {
  try {
    const leaves = await leaveEmployee.getAllLeaves();
    res.status(200).json(leaves);
  } catch (error) {
    console.error("Error fetching leaves:", error);
    res.status(500).json({ error: "Failed to fetch leaves" });
  }
});

app.get('/api/v1/employees', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM employees');
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

app.post(`${API_BASE}/leaves`, upload.single('leave_form'), async (req, res) => {
  try {
    const leaveId = await leaveEmployee.createLeave(req.body, req.file);
    res.status(201).json({ 
      message: "Leave created successfully", 
      leaveId 
    });
  } catch (error) {
    console.error("Error creating leave:", error);
    res.status(500).json({ error: error.message || "Failed to create leave" });
  }
});

app.put('/leaves/:id', upload.single('leave_form'), async (req, res) => {
  try {
    const success = await leaveEmployee.updateLeave(req.params.id, req.body, req.file);
    if (success) {
      res.status(200).json({ message: "Leave updated successfully" });
    } else {
      res.status(404).json({ error: "Leave not found" });
    }
  } catch (error) {
    console.error("Error updating leave:", error);
    res.status(500).json({ error: error.message || "Failed to update leave" });
  }
});

app.delete('/leaves/:id', async (req, res) => {
  try {
    const success = await leaveEmployee.deleteLeave(req.params.id);
    if (success) {
      res.status(200).json({ message: "Leave deleted successfully" });
    } else {
      res.status(404).json({ error: "Leave not found" });
    }
  } catch (error) {
    console.error("Error deleting leave:", error);
    res.status(500).json({ error: "Failed to delete leave" });
  }
});

// Default route
app.get("/", (req, res) => {
    res.send("Server is Running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  try {
      await verifySheetExists();
      await verifyRecordsSheetExists();
      console.log(`Server running on port ${PORT}`);
  } catch (error) {
      console.error('Failed to initialize Google Sheet:', error);
      process.exit(1);
  }
});