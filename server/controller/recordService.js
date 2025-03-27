// recordService.js
const { google } = require("googleapis");
const path = require("path");
const admin = require("firebase-admin");

// Constants
const RECORDS_SHEET_NAME = 'Employee_Records';
const DRIVE_RECORDS_FOLDER_ID = '1RLnXZNZhnJzcBdauSdmruqqJweFD-lXy';

class RecordService {
    constructor(pool, drive, sheets) {
        this.pool = pool;
        this.drive = drive;
        this.sheets = sheets;
    }

    // ==================== MySQL CRUD Operations ====================

    // GET all records
    async getAllRecords() {
        try {
            const [rows] = await this.pool.query('SELECT * FROM employee_records ORDER BY dateIssued DESC');
            return rows;
        } catch (error) {
            console.error("Error fetching all records:", error);
            throw error;
        }
    }

    // GET records by employeeNo
    async getRecordsByEmployee(employeeNo) {
        try {
            const [rows] = await this.pool.query(
                'SELECT * FROM employee_records WHERE employeeNo = ? ORDER BY dateIssued DESC',
                [employeeNo]
            );
            return rows;
        } catch (error) {
            console.error("Error fetching employee records:", error);
            throw error;
        }
    }

    // GET single record by ID
    async getRecordById(recordId) {
        try {
            const [rows] = await this.pool.query(
                'SELECT * FROM employee_records WHERE recordID = ?',
                [recordId]
            );
            return rows[0] || null;
        } catch (error) {
            console.error("Error fetching record:", error);
            throw error;
        }
    }

    // POST (create) new record
    async createRecord(recordData) {
        const connection = await this.pool.getConnection();
        try {
            await connection.beginTransaction();
    
            // First get employee details
            const [employee] = await connection.query(
                'SELECT lastName, firstName FROM employees WHERE employeeNo = ?',
                [recordData.employeeNo]
            );
            
            if (!employee.length) {
                throw new Error("Employee not found");
            }
    
            let attachmentUrl = null;
            
            // Handle file upload if exists
            if (recordData.attachment) {
                const employeeData = employee[0];
                const folderId = await this.getOrCreateEmployeeFolder(
                    recordData.employeeNo, 
                    employeeData.lastName
                );
    
                // Upload file to Google Drive
                const fileMetadata = {
                    name: `${employeeData.lastName}_${recordData.type}_${Date.now()}`,
                    parents: [folderId]
                };
    
                const media = {
                    mimeType: recordData.attachment.mimetype,
                    body: recordData.attachment.buffer
                };
    
                const { data: file } = await this.drive.files.create({
                    resource: fileMetadata,
                    media: media,
                    fields: 'id'
                });
    
                // Make the file publicly accessible
                await this.drive.permissions.create({
                    fileId: file.id,
                    requestBody: {
                        role: "reader",
                        type: "anyone"
                    }
                });
    
                attachmentUrl = `https://drive.google.com/uc?export=view&id=${file.id}`;
            }
    
            // Insert into MySQL
            const [result] = await connection.query(
                `INSERT INTO employee_records 
                (employeeNo, type, dateIssued, details, attachment, status) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    recordData.employeeNo,
                    recordData.type,
                    recordData.dateIssued,
                    recordData.details,
                    attachmentUrl,
                    recordData.status || 'Pending'
                ]
            );
    
            // Get the full record with employee name for Google Sheets
            const [newRecord] = await connection.query(
                `SELECT er.*, CONCAT(e.firstName, ' ', e.lastName) as employeeName 
                 FROM employee_records er
                 JOIN employees e ON er.employeeNo = e.employeeNo
                 WHERE er.recordID = ?`,
                [result.insertId]
            );
    
            // Sync to Google Sheets
            await this.syncRecordToSheet(newRecord[0], newRecord[0].employeeName);
    
            await connection.commit();
            return {
                recordId: result.insertId,
                record: newRecord[0]
            };
        } catch (error) {
            await connection.rollback();
            console.error("Error creating record:", error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // PUT (update) existing record
    async updateRecord(recordId, recordData) {
        const connection = await this.pool.getConnection();
        try {
            await connection.beginTransaction();

            // Check if record exists
            const [existingRecord] = await connection.query(
                'SELECT * FROM employee_records WHERE recordID = ?',
                [recordId]
            );
            
            if (!existingRecord.length) {
                throw new Error("Record not found");
            }

            // Update record in MySQL
            const [result] = await connection.query(
                `UPDATE employee_records SET 
                    employeeNo = ?, type = ?, dateIssued = ?, 
                    details = ?, attachment = ?, status = ?
                WHERE recordID = ?`,
                [
                    recordData.employeeNo,
                    recordData.type,
                    recordData.dateIssued,
                    recordData.details,
                    recordData.attachment || null,
                    recordData.status || 'Pending',
                    recordId
                ]
            );

            // Get the updated record with employee name
            const [updatedRecord] = await connection.query(
                `SELECT er.*, CONCAT(e.firstName, ' ', e.lastName) as employeeName 
                 FROM employee_records er
                 JOIN employees e ON er.employeeNo = e.employeeNo
                 WHERE er.recordID = ?`,
                [recordId]
            );

            // Update Google Sheets
            await this.updateRecordInSheet(updatedRecord[0], updatedRecord[0].employeeName);

            await connection.commit();
            return updatedRecord[0];
        } catch (error) {
            await connection.rollback();
            console.error("Error updating record:", error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // DELETE record
    async deleteRecord(recordId) {
        const connection = await this.pool.getConnection();
        try {
            await connection.beginTransaction();

            // First get the record before deleting (for Google Sheets sync)
            const [record] = await connection.query(
                'SELECT * FROM employee_records WHERE recordID = ?',
                [recordId]
            );
            
            if (!record.length) {
                throw new Error("Record not found");
            }

            // Delete from MySQL
            const [result] = await connection.query(
                'DELETE FROM employee_records WHERE recordID = ?',
                [recordId]
            );
            
            // Delete from Google Sheets
            await this.deleteRecordFromSheet(recordId);

            await connection.commit();
            return { success: true, deletedCount: result.affectedRows };
        } catch (error) {
            await connection.rollback();
            console.error("Error deleting record:", error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // ==================== Google Drive & Sheets Operations ====================

    async getOrCreateEmployeeFolder(employeeNo, lastName) {
        try {
            const folderName = `Employee_${lastName}_${employeeNo}`;
            
            const { data: { files } } = await this.drive.files.list({
                q: `'${DRIVE_RECORDS_FOLDER_ID}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
                fields: 'files(id, name)'
            });

            if (files.length > 0) {
                return files[0].id;
            }

            const folderMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [DRIVE_RECORDS_FOLDER_ID]
            };

            const { data: folder } = await this.drive.files.create({
                resource: folderMetadata,
                fields: 'id'
            });

            return folder.id;
        } catch (error) {
            console.error('Error creating employee folder:', error);
            throw error;
        }
    }

    async verifyRecordsSheetExists() {
        try {
            const spreadsheet = await this.sheets.spreadsheets.get({
                spreadsheetId: process.env.SPREADSHEET_ID,
                fields: 'sheets.properties'
            });
            
            const sheetExists = spreadsheet.data.sheets.some(
                sheet => sheet.properties.title === RECORDS_SHEET_NAME
            );
            
            if (!sheetExists) {
                await this.sheets.spreadsheets.batchUpdate({
                    spreadsheetId: process.env.SPREADSHEET_ID,
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
                
                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: process.env.SPREADSHEET_ID,
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

    async syncRecordToSheet(record, employeeName) {
        try {
            await this.verifyRecordsSheetExists();
            
            const row = [
                record.recordID,
                record.employeeNo,
                employeeName,
                record.type,
                record.dateIssued.split('T')[0],
                record.details,
                record.attachment || 'N/A',
                record.status
            ];

            await this.sheets.spreadsheets.values.append({
                spreadsheetId: process.env.SPREADSHEET_ID,
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

    async updateRecordInSheet(record, employeeName) {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: process.env.SPREADSHEET_ID,
                range: `${RECORDS_SHEET_NAME}!A:H`
            });

            const rows = response.data.values;
            if (!rows || rows.length === 0) return;

            const rowIndex = rows.findIndex((row, index) => 
                index > 0 && row[0] === record.recordID.toString()
            );

            if (rowIndex === -1) return;

            await this.sheets.spreadsheets.values.update({
                spreadsheetId: process.env.SPREADSHEET_ID,
                range: `${RECORDS_SHEET_NAME}!A${rowIndex + 1}`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [[
                        record.recordID,
                        record.employeeNo,
                        employeeName,
                        record.type,
                        record.dateIssued.split('T')[0],
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

    async deleteRecordFromSheet(recordId) {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: process.env.SPREADSHEET_ID,
                range: `${RECORDS_SHEET_NAME}!A:H`
            });

            const rows = response.data.values;
            if (!rows || rows.length === 0) return;

            const rowIndex = rows.findIndex((row, index) => 
                index > 0 && row[0] === recordId.toString()
            );

            if (rowIndex === -1) return;

            const sheetId = await this.getSheetId(RECORDS_SHEET_NAME);
            
            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: process.env.SPREADSHEET_ID,
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
            console.error('Error deleting record from sheet:', error);
            throw error;
        }
    }

    async getSheetId(sheetName) {
        const { data } = await this.sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            fields: 'sheets.properties'
        });
        
        const sheet = data.sheets.find(s => s.properties.title === sheetName);
        return sheet ? sheet.properties.sheetId : null;
    }
}

module.exports = RecordService;