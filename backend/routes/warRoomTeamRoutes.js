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

// Add a team member
router.post("/cases/:caseId/team", async (req, res) => {
  const { caseId } = req.params;
  const { name, role, email } = req.body;
  try {
    await sql.connect(config);
    await sql.query`
      INSERT INTO WarRoomTeamMembers (CaseId, Name, Role, Email)
      VALUES (${caseId}, ${name}, ${role}, ${email})
    `;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get team members for a case
router.get("/cases/:caseId/team", async (req, res) => {
  const { caseId } = req.params;
  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT * FROM WarRoomTeamMembers WHERE CaseId = ${caseId}
    `;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;