const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const multer = require("multer");
const { google } = require("googleapis");
const path = require("path");
require("dotenv").config();
const mysql = require('mysql2/promise');

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
              'Starting Rate', 'Current Monthly Rate', 'Current Daily Rate',
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
      startingRate, currentMonthlyRate, currentDailyRate
    } = req.body;
  
    // Required fields validation
    if (!firstName || !lastName || !employeeNo || !status || !position || !dateHire ||
        !personalContact || !personalEmail || !corporateEmail || !birthday || !address ||
        !startingRate || !currentMonthlyRate || !currentDailyRate) {
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
          currentMonthlyRate, currentDailyRate, bdoAccount, sssNumber,
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
                  currentMonthlyRate, currentDailyRate, bdoAccount, sssNumber,
                  pagIbigNumber, philhealthNumber, tinNumber,
                  joiningContractUrl, probationContractUrl, regularContractUrl
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                  firstName, middleName || null, lastName, employeeNo, status, position,
                  dateHire, endDate || null, footSize || null, weight || null, height || null, personalContact,
                  personalEmail, corporateEmail, birthday, address, startingRate,
                  currentMonthlyRate, currentDailyRate, bdoAccount || null, sssNumber || null,
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
              currentMonthlyRate, currentDailyRate, bdoAccount, sssNumber,
              pagIbigNumber, philhealthNumber, tinNumber,
              joiningContractUrl, probationContractUrl, regularContractUrl
          } = req.body;

          // Update employee data in MySQL
          await connection.query(
              `UPDATE employees SET 
                  firstName = ?, middleName = ?, lastName = ?, employeeNo = ?, status = ?, position = ?,
                  dateHire = ?, endDate = ?, footSize = ?, weight = ?, height = ?, personalContact = ?,
                  personalEmail = ?, corporateEmail = ?, birthday = ?, address = ?, startingRate = ?,
                  currentMonthlyRate = ?, currentDailyRate = ?, bdoAccount = ?, sssNumber = ?,
                  pagIbigNumber = ?, philhealthNumber = ?, tinNumber = ?,
                  joiningContractUrl = ?, probationContractUrl = ?, regularContractUrl = ?
              WHERE id = ?`,
              [
                  firstName, middleName || null, lastName, employeeNo, status, position,
                  dateHire, endDate || null, footSize || null, weight || null, height || null, personalContact,
                  personalEmail, corporateEmail, birthday, address, startingRate,
                  currentMonthlyRate, currentDailyRate, bdoAccount || null, sssNumber || null,
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
    try {
      const employeeId = req.params.id;
      const [result] = await pool.query('DELETE FROM employees WHERE id = ?', [employeeId]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Employee not found" });
      }
      
      res.status(200).json({ message: "Employee deleted successfully" });
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ error: "Failed to delete employee" });
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
      console.log(`Server running on port ${PORT}`);
  } catch (error) {
      console.error('Failed to initialize Google Sheet:', error);
      process.exit(1);
  }
});