const express = require("express");
const multer = require("multer");
const sql = require("mssql");
const { uploadToBlob } = require("../utils/azureBlob"); // <-- Import your blob utility
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

// Get all war room info for a case
router.get("/cases/:caseId/warroom-info", async (req, res) => {
  const { caseId } = req.params;
  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT TeamMembers, Documents, VoirDire FROM WarRoomInfo WHERE CaseId = ${caseId}
    `;
    if (result.recordset.length === 0) {
      return res.json({ TeamMembers: [], Documents: [], VoirDire: [] });
    }
    const row = result.recordset[0];
    res.json({
      TeamMembers: JSON.parse(row.TeamMembers || "[]"),
      Documents: JSON.parse(row.Documents || "[]"),
      VoirDire: JSON.parse(row.VoirDire || "[]"),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add or update war room info for a case (supports file upload for documents)
router.post(
  "/cases/:caseId/warroom-info",
  upload.single("file"),
  async (req, res) => {
    const { caseId } = req.params;
    const { teamMember, document, voirDire, description } = req.body;
    try {
      await sql.connect(config);
      let result = await sql.query`
        SELECT TeamMembers, Documents, VoirDire FROM WarRoomInfo WHERE CaseId = ${caseId}
      `;
      let teamMembers = [], documents = [], voirDireArr = [];
      if (result.recordset.length > 0) {    
        const row = result.recordset[0];
        teamMembers = JSON.parse(row.TeamMembers || "[]");
        documents = JSON.parse(row.Documents || "[]");
        voirDireArr = JSON.parse(row.VoirDire || "[]");
      }

      // Handle document upload
      if (req.file) {
        const fileName = req.file.originalname;
        const mimeType = req.file.mimetype;
        const fileBuffer = req.file.buffer;
        const fileUrl = await uploadToBlob(fileBuffer, fileName, mimeType);
        documents.push({ name: fileName, description, fileUrl });
      } else if (document) {
        documents.push(document);
      }

      if (teamMember) teamMembers.push(teamMember);
      if (voirDire) voirDireArr.push(voirDire);

      // Upsert row
      if (result.recordset.length === 0) {
        await sql.query`
          INSERT INTO WarRoomInfo (CaseId, TeamMembers, Documents, VoirDire)
          VALUES (${caseId}, ${JSON.stringify(teamMembers)}, ${JSON.stringify(documents)}, ${JSON.stringify(voirDireArr)})
        `;
      } else {
        await sql.query`
          UPDATE WarRoomInfo
          SET TeamMembers = ${JSON.stringify(teamMembers)},
              Documents = ${JSON.stringify(documents)},
              VoirDire = ${JSON.stringify(voirDireArr)}
          WHERE CaseId = ${caseId}
        `;
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Delete war room info for a case
// Delete a specific document from WarRoomInfo for a case
router.delete("/cases/:caseId/warroom-info/documents/:docName", async (req, res) => {
  const { caseId, docName } = req.params;

  try {
    await sql.connect(config);

    // Fetch current documents
    const result = await sql.query`
      SELECT Documents FROM WarRoomInfo WHERE CaseId = ${caseId}
    `;

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "No war room info found for this case" });
    }

    let documents = JSON.parse(result.recordset[0].Documents || "[]");

    // Filter out the document by name
    const updatedDocs = documents.filter((doc) => doc.name !== docName);

    if (updatedDocs.length === documents.length) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Update row with filtered documents
    await sql.query`
      UPDATE WarRoomInfo
      SET Documents = ${JSON.stringify(updatedDocs)}
      WHERE CaseId = ${caseId}
    `;

    res.json({ success: true, message: "Document deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;