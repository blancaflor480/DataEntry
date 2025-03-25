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
  
  // Endpoint to create a new employee
  app.post("/employees", validateEmployeeData, async (req, res) => {
    try {
      const {
        firstName, middleName, lastName, employeeNo, status, position,
        dateHire, endDate, footSize, weight, height, personalContact,
        personalEmail, corporateEmail, birthday, address, startingRate,
        currentMonthlyRate, currentDailyRate, bdoAccount, sssNumber,
        pagIbigNumber, philhealthNumber, tinNumber,
        joiningContractUrl, probationContractUrl, regularContractUrl
      } = req.body;
  
      const connection = await pool.getConnection();
      
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
  
        // Insert employee data
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
  
  // Endpoint to update an employee
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
  
        // Update employee data
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));