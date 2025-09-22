// backend/routes/caseRoutes.js
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
router.get("/cases", async (req, res) => {
  const userId = req.query.userId;
  await sql.connect(config);

  if (userId) {
    // Attorney dashboard: show only their cases
    const result = await sql.query`
      SELECT * FROM ScheduledTrials WHERE UserId = ${userId} ORDER BY Id DESC
    `;
    return res.json(result.recordset);
  } else {
    // Juror dashboard: show all cases
    const result = await sql.query`
      SELECT * FROM ScheduledTrials ORDER BY Id DESC
    `;
    return res.json(result.recordset);
  }
});

router.get("/cases/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await sql.connect(config);
    const result = await sql.query`SELECT * FROM ScheduledTrials WHERE Id = ${id}`;
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Case not found" });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;