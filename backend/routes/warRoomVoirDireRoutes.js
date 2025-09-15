const express = require("express");
const sql = require("mssql");
const router = express.Router();
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD.replace(/"/g, ""), // Remove quotes if present
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10),
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

// Add voir dire question/response
router.post("/cases/:caseId/voir-dire", async (req, res) => {
  const { caseId } = req.params;
  const { question, response, addedBy } = req.body;
  try {
    await sql.connect(config);
    await sql.query`
      INSERT INTO WarRoomVoirDire (CaseId, Question, Response, AddedBy)
      VALUES (${caseId}, ${question}, ${response}, ${addedBy})
    `;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get voir dire for a case
router.get("/cases/:caseId/voir-dire", async (req, res) => {
  const { caseId } = req.params;
  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT * FROM WarRoomVoirDire WHERE CaseId = ${caseId}
    `;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;