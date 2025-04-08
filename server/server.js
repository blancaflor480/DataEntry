const express = require("express");
const cors = require("cors");
const fs = require('fs');
const https = require('https');
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
const DRIVE_RECORDS_FOLDER_ID = '1RLnXZNZhnJzcBdauSdmruqqJweFD-lXy';
// Add this function near the top of server.js after the Google Drive setup
async function getOrCreateEmployeeFolder(employeeNo, lastName) {
  try {
    const folderName = `${lastName}_${employeeNo}`;
    
    // Check if folder already exists in the main records folder
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
    console.error('Error creating/getting employee folder:', error);
    throw error;
  }
}
// Add this function after getOrCreateEmployeeFolder
async function uploadEmployeeFile(file, employeeNo, lastName, fileType, dateIssued) {
  try {
    // Get or create employee folder
    const employeeFolderId = await getOrCreateEmployeeFolder(employeeNo, lastName);
    
    // Format the filename: TYPE_SURNAME_DATE.ext
    const fileExt = path.extname(file.originalname);
    const formattedDate = new Date(dateIssued).toISOString().split('T')[0];
    const fileName = `${fileType}_${lastName}_${formattedDate}${fileExt}`;

    const fileMetadata = {
      name: fileName,
      parents: [employeeFolderId]
    };

    const media = {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.path)
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
    });

    // Make file publicly accessible
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    const fileUrl = `https://drive.google.com/uc?export=view&id=${response.data.id}`;
    fs.unlinkSync(file.path); // Clean up temp file

    return fileUrl;
  } catch (error) {
    console.error('Error uploading employee file:', error);
    throw error;
  }
}
//Record IR
// Add this function after your existing upload functions
async function uploadIncidentAttachment(file, employeeNo, lastName) {
  try {
    // Get or create employee folder - reuse existing function
    const employeeFolderId = await getOrCreateEmployeeFolder(employeeNo, lastName);
    
    // Upload file
    const fileExt = path.extname(file.originalname);
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const fileName = `IR_${lastName}_${employeeNo}_${timestamp}${fileExt}`;

    const fileMetadata = {
      name: fileName,
      parents: [employeeFolderId]
    };

    const media = {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.path)
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
    });

    // Make file publicly accessible
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    const fileUrl = `https://drive.google.com/uc?export=view&id=${response.data.id}`;
    fs.unlinkSync(file.path); // Clean up temp file

    return {
      path: fileUrl,
      name: fileName
    };
  } catch (error) {
    console.error('Error uploading incident attachment:', error);
    throw error;
  }
}

// Add this middleware before your routes
app.use(async (req, res, next) => {
  try {
    // Get the Firebase token from headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user info
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Get user role from Firestore
    const userDoc = await db.collection('admin').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return res.status(403).json({ error: "User not found in admin collection" });
    }
    
    const userData = userDoc.data();
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email,
      role: userData.role // Get role from Firestore document
    };
    
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    res.status(401).json({ error: "Authentication failed" });
  }
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
              'Status', 'Employment Type','Position', 'Date Hired', 'End Date', 'Personal Contact',
              'Personal Email', 'Corporate Email', 'Birthday', 'Address',
              'Starting Rate', 'Current Monthly Rate', 'Current Daily Rate','Hours Rate',
              'Foot Size', 'Weight', 'Height', 'BDO Account', 'SSS Number',
              'Pag-IBIG Number', 'PhilHealth Number', 'TIN Number',
              'Joining Contract URL', 'Probation Contract URL', 'Regular Contract URL', 'Profile Image URL'
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
          employeeData.employmentType || '', // Added employmentType
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
          employeeData.regularContractUrl || '',
          employeeData.profileImageUrl || '' // Added profileImageUrl
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
          employeeData.employmentType || '', // Added employmentType
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
          employeeData.regularContractUrl || '',
          employeeData.profileImageUrl || '' // Added profileImageUrl
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

// Create uploads directory if it doesn't exist
const createUploadsDirectory = () => {
  const uploadsDir = path.join(__dirname, 'uploads', 'profiles');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
};

// Call this after all your imports and middleware, but before your routes
const uploadsDir = createUploadsDirectory();

// Update the /upload-profile endpoint
app.post("/upload-profile", upload.single("profileImage"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { employeeNo, lastName } = req.body;
    if (!employeeNo || !lastName) {
      return res.status(400).json({ error: "Employee number and last name are required" });
    }

    const fileUrl = await uploadEmployeeFile(
      req.file,
      employeeNo,
      lastName,
      'PROFILE',
      new Date().toISOString()
    );

    res.status(200).json({ fileUrl });
  } catch (error) {
    console.error("Error uploading profile image:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: "Failed to upload profile image" });
  }
});

// Add this to serve the static files if not already present
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
// Update the /upload-attachment endpoint
app.post("/upload-attachment", upload.single("attachment"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { employeeNo, lastName, fileType, dateIssued } = req.body;
    if (!employeeNo || !lastName || !fileType || !dateIssued) {
      return res.status(400).json({ 
        error: "Employee number, last name, file type, and date issued are required" 
      });
    }

    const fileUrl = await uploadEmployeeFile(
      req.file,
      employeeNo,
      lastName,
      fileType.toUpperCase(), // CONTRACT_JOINING, CONTRACT_PROBATION, CONTRACT_REGULAR
      dateIssued
    );

    res.status(200).json({ fileUrl });
  } catch (error) {
    console.error("Error uploading attachment:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
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
      firstName, lastName, employeeNo, status,position, dateHire,
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
          firstName, middleName, lastName, employeeNo, status, employmentType, position,
          dateHire, endDate, footSize, weight, height, personalContact,
          personalEmail, corporateEmail, birthday, address, startingRate,
          currentMonthlyRate, currentDailyRate, hoursRate, bdoAccount, sssNumber,
          pagIbigNumber, philhealthNumber, tinNumber,
          joiningContractUrl, probationContractUrl, regularContractUrl, profileImageUrl
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
              employmentType, // Added employmentType
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
              regularContractUrl: regularContractUrl || '',
              profileImageUrl: profileImageUrl || '' // Added profileImageUrl
          };

          // Insert employee data into MySQL
          const [result] = await connection.query(
              `INSERT INTO employees (
                  firstName, middleName, lastName, employeeNo, status, employmentType, position,
                  dateHire, endDate, footSize, weight, height, personalContact,
                  personalEmail, corporateEmail, birthday, address, startingRate,
                  currentMonthlyRate, currentDailyRate, hoursRate, bdoAccount, sssNumber,
                  pagIbigNumber, philhealthNumber, tinNumber,
                  joiningContractUrl, probationContractUrl, regularContractUrl, profileImageUrl
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                  firstName, middleName || null, lastName, employeeNo, status, employmentType, position,
                  dateHire, endDate || null, footSize || null, weight || null, height || null, personalContact,
                  personalEmail, corporateEmail, birthday, address, startingRate,
                  currentMonthlyRate, currentDailyRate, hoursRate, bdoAccount || null, sssNumber || null,
                  pagIbigNumber || null, philhealthNumber || null, tinNumber || null,
                  joiningContractUrl || null, probationContractUrl || null, regularContractUrl || null, profileImageUrl || null
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
        const connection = await pool.getConnection();
        
        try {
            const employeeId = req.params.id;
            const userId = req.user?.uid; // Assuming you have user authentication
            const userRole = req.user.role;
            const userEmail = req.user?.email; // Get email from req.user
            
            if (!userId || !userEmail) {
                await connection.release();
                return res.status(401).json({ error: "Authentication required" });
            }

            // Check if employee exists
            const [existingEmployee] = await connection.query(
                'SELECT * FROM employees WHERE id = ?',
                [employeeId]
            );
    
            if (existingEmployee.length === 0) {
                await connection.release();
                return res.status(404).json({ error: "Employee not found" });
            }
                
            const currentEmployee = existingEmployee[0];
            const changes = [];   

            // Compare each field for changes
            Object.keys(req.body).forEach(key => {
                if (key === 'id' || req.body[key] === undefined) return; // Skip ID and undefined fields

                const oldValue = currentEmployee[key];
                const newValue = req.body[key];
                
                // Skip if both values are null/undefined
                if (!oldValue && !newValue) return;
                
                // Handle date fields specifically
                const dateFields = ['dateHire', 'endDate', 'birthday'];
                if (dateFields.includes(key)) {
                    const oldDate = oldValue ? new Date(oldValue).toISOString().split('T')[0] : '';
                    const newDate = newValue ? new Date(newValue).toISOString().split('T')[0] : '';
                    
                    if (oldDate !== newDate) {
                        changes.push({
                            field: key,
                            oldValue: oldDate,
                            newValue: newDate
                        });
                    }
                } 
                // Handle all other fields
                else {
                    const oldStringValue = oldValue?.toString() || '';
                    const newStringValue = newValue?.toString() || '';
                    
                    if (oldStringValue !== newStringValue) {
                        changes.push({
                            field: key,
                            oldValue: oldStringValue,
                            newValue: newStringValue
                        });
                    }
                }
            });

            // If no changes, return immediately
            if (changes.length === 0) {
                await connection.release();
                return res.status(200).json({ message: "No changes detected" });
            }
    
            // If user is Super Admin, apply changes directly
            if (userRole === "Super Admin") {
                await connection.beginTransaction();
                
                try {
                    const {
                        firstName, middleName, lastName, employeeNo, status, employmentType, position,
                        dateHire, endDate, footSize, weight, height, personalContact,
                        personalEmail, corporateEmail, birthday, address, startingRate,
                        currentMonthlyRate, currentDailyRate, hoursRate, bdoAccount, sssNumber,
                        pagIbigNumber, philhealthNumber, tinNumber,
                        joiningContractUrl, probationContractUrl, regularContractUrl
                    } = req.body;
            
                    // Update employee data in MySQL
                    await connection.query(
                        `UPDATE employees SET 
                            firstName = ?, middleName = ?, lastName = ?, employeeNo = ?, status = ?, employmentType = ?, position = ?,
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
            
                    // Update Google Sheets
                    const [updatedEmployee] = await connection.query(
                        'SELECT * FROM employees WHERE id = ?',
                        [employeeId]
                    );
                    await updateEmployeeInSheet(updatedEmployee[0]);
        
                    await connection.commit();
                    await connection.release();
                    return res.status(200).json({ 
                        message: "Employee updated successfully",
                        changesApplied: changes.length
                    });
                } catch (error) {
                    await connection.rollback();
                    await connection.release();
                    throw error;
                }
            } 
            // For Admin role, ONLY CREATE approval requests (NO DIRECT UPDATES)
            else if (userRole === "Admin") {
                await connection.beginTransaction();
                
                try {
                    const employeeName = `${currentEmployee.firstName} ${currentEmployee.lastName}`;
                    const employeeNo = currentEmployee.employeeNo;
        
                    // Create approval records for each change, but DO NOT update the employee record
                    for (const change of changes) {
                        await connection.query(
                            `INSERT INTO edit_approvals (
                                employeeId, employeeName, employeeNo, field, 
                                oldValue, newValue, requestedBy, requestedByEmail,
                                status, requestedAt
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
                            [
                                employeeId,
                                employeeName,
                                employeeNo,
                                change.field,
                                change.oldValue,
                                change.newValue,
                                userId,
                                userEmail
                            ]
                        );
                    }
                    
                    // No employee record update happens here - changes only go to edit_approvals table
                    
                    await connection.commit();
                    await connection.release();
                    return res.status(200).json({ 
                        message: "Changes submitted for approval",
                        requiresApproval: true,
                        changesSubmitted: changes.length,
                        changedFields: changes.map(change => ({
                            field: change.field,
                            currentValue: change.oldValue,
                            proposedValue: change.newValue
                        }))
                    });
                } catch (error) {
                    await connection.rollback();
                    await connection.release();
                    throw error;
                }
            } else {
                await connection.release();
                return res.status(403).json({ error: "Unauthorized - Insufficient permissions" });
            }
        } catch (error) {
            console.error("Error updating employee:", error);
            if (connection) {
                await connection.release();
            }
            res.status(500).json({ error: "Failed to update employee" });
        
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

// Get pending approvals
// Add this new endpoint after your existing /approvals/pending endpoint
app.get("/approvals/history", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ea.*, e.firstName, e.lastName 
       FROM edit_approvals ea
       JOIN employees e ON ea.employeeId = e.id
       WHERE ea.status IN ('approved', 'rejected')
       ORDER BY 
         CASE 
           WHEN ea.approvedAt IS NOT NULL THEN ea.approvedAt
           ELSE ea.rejectedAt
         END DESC`
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching approval history:", error);
    res.status(500).json({ error: "Failed to fetch approval history" });
  }
});
app.get("/approvals/pending", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ea.*, e.firstName, e.lastName 
       FROM edit_approvals ea
       JOIN employees e ON ea.employeeId = e.id
       WHERE ea.status = 'pending'
       ORDER BY ea.requestedAt DESC`
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    res.status(500).json({ error: "Failed to fetch pending approvals" });
  }
});

// Approve an edit
app.put("/approvals/:id/approve", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Check if authentication header exists
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await connection.release();
      return res.status(401).json({ error: "Authentication token required" });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userDoc = await db.collection('admin').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      await connection.release();
      return res.status(403).json({ error: "User not found in admin collection" });
    }

    const userData = userDoc.data();
    
    // Only Super Admin can approve changes
    if (userData.role !== "Super Admin") {
      await connection.release();
      return res.status(403).json({ error: "Only Super Admin can approve changes" });
    }

    // Get the approval request
    const [approvals] = await connection.query(
      `SELECT * FROM edit_approvals WHERE id = ? AND status = 'pending'`,
      [req.params.id]
    );

    if (approvals.length === 0) {
      await connection.release();
      return res.status(404).json({ error: "Approval request not found" });
    }

    const approval = approvals[0];

    // Update the employee record
    await connection.query(
      `UPDATE employees SET ${approval.field} = ? WHERE id = ?`,
      [approval.newValue, approval.employeeId]
    );

    // Update the approval status
    await connection.query(
      `UPDATE edit_approvals 
       SET status = 'approved', 
           approvedBy = ?, 
           approvedByEmail = ?, 
           approvedAt = NOW() 
       WHERE id = ?`,
      [decodedToken.uid, decodedToken.email, req.params.id]
    );

    // Update Google Sheets
    const [employee] = await connection.query(
      'SELECT * FROM employees WHERE id = ?',
      [approval.employeeId]
    );
   
    try {
      await updateEmployeeInSheet(employee[0]);
    } catch (sheetError) {
      console.error('Failed to update Google Sheets:', sheetError);
    }

    await connection.commit();
    await connection.release();
    
    res.status(200).json({ 
      message: "Edit approved and applied successfully",
      updatedField: approval.field,
      oldValue: approval.oldValue,
      newValue: approval.newValue
    });
  } catch (error) {
    await connection.rollback();
    await connection.release();
    console.error("Error approving edit:", error);
    res.status(500).json({ error: "Failed to approve edit" });
  }
});

// Reject an edit
app.put("/approvals/:id/reject", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Check if authentication header exists
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await connection.release();
      return res.status(401).json({ error: "Authentication token required" });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userDoc = await db.collection('admin').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      await connection.release();
      return res.status(403).json({ error: "User not found in admin collection" });
    }

    const userData = userDoc.data();
    
    // Only Super Admin can reject changes
    if (userData.role !== "Super Admin") {
      await connection.release();
      return res.status(403).json({ error: "Only Super Admin can reject changes" });
    }

    // Get the approval request
    const [approvals] = await connection.query(
      `SELECT * FROM edit_approvals WHERE id = ? AND status = 'pending'`,
      [req.params.id]
    );

    if (approvals.length === 0) {
      await connection.release();
      return res.status(404).json({ error: "Approval request not found" });
    }

    // Update the approval status
    await connection.query(
      `UPDATE edit_approvals 
       SET status = 'rejected', 
           rejectedBy = ?, 
           rejectedByEmail = ?, 
           rejectedAt = NOW() 
       WHERE id = ?`,
      [decodedToken.uid, decodedToken.email, req.params.id]
    );

    await connection.commit();
    await connection.release();
    
    res.status(200).json({ 
      message: "Edit rejected successfully"
    });
  } catch (error) {
    await connection.rollback();
    await connection.release();
    console.error("Error rejecting edit:", error);
    res.status(500).json({ error: "Failed to reject edit" });
  }
});

//Record
// Add these constants at the top with other configurations
// Add these constants at the top of server.js
const IR_SHEET_NAME = 'Incident_Reports';

// Add this function after other sheet verification functions
async function verifyIncidentReportSheetExists() {
  try {
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      fields: 'sheets.properties'
    });
    
    let sheetId = null;
    const existingSheet = spreadsheet.data.sheets.find(
      sheet => sheet.properties.title === IR_SHEET_NAME
    );
    
    if (existingSheet) {
      sheetId = existingSheet.properties.sheetId;
    } else {
      // Create new sheet
      const addSheetResponse = await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: IR_SHEET_NAME,
                gridProperties: {
                  frozenRowCount: 1 // Freeze the header row
                }
              }
            }
          }]
        }
      });
      sheetId = addSheetResponse.data.replies[0].addSheet.properties.sheetId;
    }

    // Always update headers and their formatting
    // First, update the header values
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${IR_SHEET_NAME}!A1:T1`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[
          'Incident ID', 
          'Reported By',
          'Employee No',
          'Employee Name',
          'Department Head',
          'Incident Category',
          'Incident Type',
          'Incident Date',
          'Incident Time',
          'Department',
          'Location',
          'Description',
          'Witnesses',
          'Severity',
          'Status',
          'Attachments',
          'Resolution Details',
          'Reviewed By',
          'Review Date',
          'Created At'
        ]]
      }
    });

    // Then, apply header formatting
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 20
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.2,
                    green: 0.2,
                    blue: 0.2
                  },
                  textFormat: {
                    bold: true,
                    foregroundColor: {
                      red: 1.0,
                      green: 1.0,
                      blue: 1.0
                    }
                  },
                  horizontalAlignment: 'CENTER',
                  verticalAlignment: 'MIDDLE'
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
            }
          },
          {
            updateSheetProperties: {
              properties: {
                sheetId: sheetId,
                gridProperties: {
                  frozenRowCount: 1
                }
              },
              fields: 'gridProperties.frozenRowCount'
            }
          }
        ]
      }
    });

  } catch (error) {
    console.error('Error verifying incident report sheet:', error);
    throw error;
  }
}

// Add sync function for incident reports
async function syncIncidentToSheet(incident, employeeName) {
  try {
    await verifyIncidentReportSheetExists();
    
    // Format dates
    const incidentDate = incident.incident_date ? new Date(incident.incident_date).toLocaleDateString() : '';
    const reviewDate = incident.review_date ? new Date(incident.review_date).toLocaleDateString() : '';
    const createdAt = incident.created_at ? new Date(incident.created_at).toLocaleDateString() : '';
    
    // Format attachments
    const attachments = [
      incident.attachment1_path,
      incident.attachment2_path,
      incident.attachment3_path
    ].filter(Boolean).join(', ');

    const row = [
      incident.incident_id,
      incident.reported_by,
      incident.employee_no,
      employeeName,
      incident.department_head,
      incident.incident_category,
      incident.incident_type,
      incidentDate,
      incident.incident_time,
      incident.department,
      incident.location,
      incident.description,
      incident.witnesses || '',
      incident.severity,
      incident.status,
      attachments,
      incident.resolution_details || '',
      incident.reviewed_by || '',
      reviewDate,
      createdAt
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${IR_SHEET_NAME}!A:R`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: [row] }
    });
  } catch (error) {
    console.error('Error syncing incident to sheet:', error);
    throw error;
  }
}

// Add update function for incident reports
async function updateIncidentInSheet(incident, employeeName) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${IR_SHEET_NAME}!A:R`
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return;

    const rowIndex = rows.findIndex((row, index) => 
      index > 0 && row[0] === incident.incident_id.toString()
    );

    if (rowIndex === -1) return;

    // Format the data same as sync function
    const incidentDate = incident.incident_date ? new Date(incident.incident_date).toLocaleDateString() : '';
    const reviewDate = incident.review_date ? new Date(incident.review_date).toLocaleDateString() : '';
    const createdAt = incident.created_at ? new Date(incident.created_at).toLocaleDateString() : '';
    
    const attachments = [
      incident.attachment1_path,
      incident.attachment2_path,
      incident.attachment3_path
    ].filter(Boolean).join(', ');

    const updatedRow = [
      incident.incident_id,
      incident.reported_by,
      incident.employee_no,
      employeeName,
      incident.department_head,
      incident.incident_category,
      incident.incident_type,
      incidentDate,
      incident.incident_time,
      incident.department,
      incident.location,
      incident.description,
      incident.witnesses || '',
      incident.severity,
      incident.status,
      attachments,
      incident.resolution_details || '',
      incident.reviewed_by || '',
      reviewDate,
      createdAt
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${IR_SHEET_NAME}!A${rowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [updatedRow] }
    });
  } catch (error) {
    console.error('Error updating incident in sheet:', error);
    throw error;
  }
}

// Add delete function for incident reports
async function deleteIncidentFromSheet(incidentId) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${IR_SHEET_NAME}!A:R`
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return;

    const rowIndex = rows.findIndex((row, index) => 
      index > 0 && row[0] === incidentId.toString()
    );

    if (rowIndex === -1) return;

    const sheetId = await getSheetId(IR_SHEET_NAME);
    
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: "ROWS",
              startIndex: rowIndex,
              endIndex: rowIndex + 1
            }
          }
        }]
      }
    });
  } catch (error) {
    console.error('Error deleting incident from sheet:', error);
    throw error;
  }
}

// Get all incident reports
app.get("/incident-reports", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ir.*, 
             e.firstName, 
             e.lastName,
             CONCAT(e.firstName, ' ', e.lastName) as employee_name
      FROM incident_reports ir
      LEFT JOIN employees e ON ir.employee_no = e.employeeNo
      ORDER BY ir.incident_date DESC, ir.incident_time DESC
    `);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching incident reports:", error);
    res.status(500).json({ error: "Failed to fetch incident reports" });
  }
});

// Update the POST /records endpoint
// Update the POST endpoint for incident reports
app.post("/incident-reports", upload.array('attachments', 3), async (req, res) => {
  try {
    const {
      reported_by,
      employee_no,
      department_head,
      incident_category,
      incident_type,
      incident_date,
      incident_time,
      department,
      location,
      description,
      witnesses,
      severity,
      status = 'Open'
    } = req.body;

    // Get employee details
    const [employee] = await pool.query(
      'SELECT firstName, lastName FROM employees WHERE employeeNo = ?',
      [employee_no]
    );

    if (!employee.length) {
      return res.status(400).json({ error: "Employee not found" });
    }

    const employeeName = `${employee[0].firstName} ${employee[0].lastName}`;
    const attachmentResults = [];

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const attachmentResult = await uploadIncidentAttachment(
          req.files[i],
          employee_no,
          employee[0].lastName
        );
        attachmentResults.push(attachmentResult);
      }
    }

    // Insert into database
    const [result] = await pool.query(
      `INSERT INTO incident_reports (
        reported_by, employee_no, department_head, incident_category, incident_type,
        incident_date, incident_time, department, location, description,
        witnesses, severity, status,
        attachment1_path, attachment1_name,
        attachment2_path, attachment2_name,
        attachment3_path, attachment3_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reported_by,
        employee_no,
        department_head,
        incident_category,
        incident_type,
        incident_date,
        incident_time,
        department,
        location,
        description,
        witnesses,
        severity,
        status,
        attachmentResults[0]?.path || null,
        attachmentResults[0]?.name || null,
        attachmentResults[1]?.path || null,
        attachmentResults[1]?.name || null,
        attachmentResults[2]?.path || null,
        attachmentResults[2]?.name || null
      ]
    );

    // Get the full incident report data
    const [newIncident] = await pool.query(
      'SELECT * FROM incident_reports WHERE incident_id = ?',
      [result.insertId]
    );

    // Sync to Google Sheets
    await syncIncidentToSheet(newIncident[0], employeeName);

    res.status(201).json({
      message: "Incident report created successfully",
      incident_id: result.insertId
    });
  } catch (error) {
    console.error("Error creating incident report:", error);
    res.status(500).json({ error: "Failed to create incident report" });
  }
});

// Similarly update the PUT and DELETE endpoints to include sheet operations

// Update the PUT /records/:id endpoint
app.put("/incident-reports/:id", upload.array('attachments', 3), async (req, res) => {
  try {
    const incidentId = req.params.id;
    const {
      reported_by,
      employee_no,
      department_head,
      incident_category,
      incident_type,
      incident_date,
      incident_time,
      department,
      location,
      description,
      witnesses,
      severity,
      status,
      resolution_details
    } = req.body;

    // Get employee details
    const [employee] = await pool.query(
      'SELECT firstName, lastName FROM employees WHERE employeeNo = ?',
      [employee_no]
    );

    if (!employee.length) {
      return res.status(400).json({ error: "Employee not found" });
    }

    const employeeName = `${employee[0].firstName} ${employee[0].lastName}`;
    const attachmentResults = [];

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const attachmentResult = await uploadIncidentAttachment(
          req.files[i],
          employee_no,
          employee[0].lastName
        );
        attachmentResults.push(attachmentResult);
      }
    }

    // Get current incident data for attachment handling
    const [currentIncident] = await pool.query(
      'SELECT attachment1_path, attachment2_path, attachment3_path FROM incident_reports WHERE incident_id = ?',
      [incidentId]
    );

    if (!currentIncident.length) {
      return res.status(404).json({ error: "Incident report not found" });
    }

    // Update incident report in database
    const [result] = await pool.query(
      `UPDATE incident_reports SET
        reported_by = ?,
        employee_no = ?,
        department_head = ?,
        incident_category = ?,
        incident_type = ?,
        incident_date = ?,
        incident_time = ?,
        department = ?,
        location = ?,
        description = ?,
        witnesses = ?,
        severity = ?,
        status = ?,
        resolution_details = ?,
        attachment1_path = ?,
        attachment1_name = ?,
        attachment2_path = ?,
        attachment2_name = ?,
        attachment3_path = ?,
        attachment3_name = ?,
        updated_at = NOW()
      WHERE incident_id = ?`,
      [
        reported_by,
        employee_no,
        department_head,
        incident_category,
        incident_type,
        incident_date,
        incident_time,
        department,
        location,
        description,
        witnesses,
        severity,
        status,
        resolution_details,
        attachmentResults[0]?.path || currentIncident[0].attachment1_path,
        attachmentResults[0]?.name || null,
        attachmentResults[1]?.path || currentIncident[0].attachment2_path,
        attachmentResults[1]?.name || null,
        attachmentResults[2]?.path || currentIncident[0].attachment3_path,
        attachmentResults[2]?.name || null,
        incidentId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Incident report not found" });
    }

    // Get the updated incident data
    const [updatedIncident] = await pool.query(
      'SELECT * FROM incident_reports WHERE incident_id = ?',
      [incidentId]
    );

    // Update Google Sheets
    await updateIncidentInSheet(updatedIncident[0], employeeName);

    res.status(200).json({
      message: "Incident report updated successfully",
      incident_id: incidentId
    });
  } catch (error) {
    console.error("Error updating incident report:", error);
    res.status(500).json({ error: "Failed to update incident report" });
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
      //await verifyRecordsSheetExists();
      await verifyIncidentReportSheetExists();
      console.log(`Server running on port ${PORT}`);
  } catch (error) {
      console.error('Failed to initialize Google Sheet:', error);
      process.exit(1);
  }
});