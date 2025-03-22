const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const multer = require("multer");
const { google } = require("googleapis");
const path = require("path");
require("dotenv").config();

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

// Default route
app.get("/", (req, res) => {
    res.send("Server is Running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));