const express = require("express");
const { poolPromise } = require("../config/db");
const router = express.Router();

// POST - Add voir dire question/response
router.post("/cases/:caseId/voir-dire", async (req, res) => {
  const { caseId } = req.params;
  const { question, response, addedBy } = req.body;

  // Validate required fields
  if (!question || !response || !addedBy) {
    return res.status(400).json({
      error:
        "Missing required fields: question, response, and addedBy are required",
    });
  }

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("caseId", caseId)
      .input("question", question)
      .input("response", response)
      .input("addedBy", addedBy).query(`
        INSERT INTO WarRoomVoirDire (CaseId, Question, Response, AddedBy, AddedAt)
        VALUES (@caseId, @question, @response, @addedBy, GETUTCDATE())
      `);

    res.json({
      success: true,
      message: "Voir dire entry added successfully",
    });
  } catch (err) {
    console.error("Add voir dire error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET - Get voir dire for a case
router.get("/cases/:caseId/voir-dire", async (req, res) => {
  const { caseId } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool.request().input("caseId", caseId).query(`
        SELECT Id, CaseId, Question, Response, AddedBy, AddedAt
        FROM WarRoomVoirDire
        WHERE CaseId = @caseId
        ORDER BY AddedAt DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Fetch voir dire error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Remove a voir dire entry (optional - add if needed)
router.delete("/cases/:caseId/voir-dire/:entryId", async (req, res) => {
  const { caseId, entryId } = req.params;

  try {
    const pool = await poolPromise;

    // Verify the entry belongs to this case
    const result = await pool
      .request()
      .input("entryId", entryId)
      .input("caseId", caseId).query(`
        DELETE FROM WarRoomVoirDire
        WHERE Id = @entryId AND CaseId = @caseId
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Voir dire entry not found" });
    }

    res.json({
      success: true,
      message: "Voir dire entry removed successfully",
    });
  } catch (err) {
    console.error("Delete voir dire error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
