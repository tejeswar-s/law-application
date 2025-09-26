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
  
  try {
    await sql.connect(config);
    console.log("Received userId:", userId);

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    console.log("Filtering for attorneyEmail:", userId);
    const result = await sql.query`
      SELECT * FROM ScheduledTrials 
      WHERE Email = ${userId.trim()} 
      ORDER BY Id DESC
    `;
    
    console.log("Query result:", result.recordset);
    
    if (result.recordset.length === 0) {
      return res.json([]);
    }

    return res.json(result.recordset);
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ error: "Database error occurred" });
  } finally {
    sql.close();
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