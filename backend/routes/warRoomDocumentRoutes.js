const express = require("express");
const multer = require("multer");
const sql = require("mssql");
const path = require("path");
const { uploadToBlob } = require("../utils/azureBlob");

const router = express.Router();
const upload = multer();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD.replace(/"/g, ""),
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10),
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

router.post("/cases/:caseId/documents", upload.single("file"), async (req, res) => {
  const { caseId } = req.params;
  const { description } = req.body;
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  try {
    // 🔹 Upload to Azure Blob
    const fileUrl = await uploadToBlob(file.buffer, file.originalname, file.mimetype);

    // 🔹 Detect type from extension
    const fileExt = path.extname(file.originalname).toLowerCase();
    let type = "document";
    if ([".jpg", ".jpeg", ".png", ".gif"].includes(fileExt)) type = "image";
    else if (fileExt === ".pdf") type = "pdf";

    // 🔹 Save into DB
    await sql.connect(config);
    await sql.query`
      INSERT INTO WarRoomDocuments (CaseId, Type, FileName, FileUrl, Description, Size, MimeType)
      VALUES (${caseId}, ${type}, ${file.originalname}, ${fileUrl}, ${description || ""}, ${file.size}, ${file.mimetype})
    `;

    res.json({ 
      success: true, 
      message: "File uploaded successfully", 
      fileUrl, 
      caseId, 
      type 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/cases/:caseId/documents", async (req, res) => {
  const { caseId } = req.params;
  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT * FROM WarRoomDocuments WHERE CaseId = ${caseId}
    `;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
