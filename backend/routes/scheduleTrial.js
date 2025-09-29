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
router.get("/all-cases", async (req, res) => {
  console.log("Fetching all cases");
  try {
    await sql.connect(config);
    const result = await sql.query("SELECT * FROM ScheduledTrials");
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch cases" });
  }
});


router.post("/schedule-trial", async (req, res) => {
  try {
    console.log("Received data:", req.body); // Debug
    await sql.connect(config);
    const {
      county,
      caseType,
      caseTier,
      caseDescription,
      paymentMethod,
      paymentAmount,
      plaintiffGroups,
      defendantGroups,
      scheduledDate,
      scheduledTime,
      name,
      email,
      UserId,
    } = req.body;
    await sql.query`
      INSERT INTO ScheduledTrials (
        County, CaseType, CaseTier, CaseDescription, PaymentMethod, PaymentAmount,
        PlaintiffGroups, DefendantGroups, ScheduledDate, ScheduledTime, Name, Email, UserId
      ) VALUES (
        ${county}, ${caseType}, ${caseTier}, ${caseDescription},
        ${paymentMethod}, ${paymentAmount},
        ${JSON.stringify(plaintiffGroups)}, ${JSON.stringify(defendantGroups)},
        ${scheduledDate}, ${scheduledTime}, ${name}, ${email}, ${UserId}
      )
    `;
    res.json({ success: true });
  } catch (err) {
    console.error("Schedule trial error:", err); // Log error
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;