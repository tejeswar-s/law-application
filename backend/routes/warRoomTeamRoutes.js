const express = require("express");
const { poolPromise } = require("../config/db");
const router = express.Router();

// POST - Add a team member
router.post("/cases/:caseId/team", async (req, res) => {
  const { caseId } = req.params;
  const { name, role, email } = req.body;

  // Validate required fields
  if (!name || !role || !email) {
    return res.status(400).json({
      error: "Missing required fields: name, role, and email are required",
    });
  }

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("caseId", caseId)
      .input("name", name)
      .input("role", role)
      .input("email", email).query(`
        INSERT INTO WarRoomTeamMembers (CaseId, Name, Role, Email, AddedAt)
        VALUES (@caseId, @name, @role, @email, GETUTCDATE())
      `);

    res.json({
      success: true,
      message: "Team member added successfully",
    });
  } catch (err) {
    console.error("Add team member error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET - Get team members for a case
router.get("/cases/:caseId/team", async (req, res) => {
  const { caseId } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool.request().input("caseId", caseId).query(`
        SELECT Id, CaseId, Name, Role, Email, AddedAt
        FROM WarRoomTeamMembers
        WHERE CaseId = @caseId
        ORDER BY AddedAt DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Fetch team members error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Remove a team member (optional - add if needed)
router.delete("/cases/:caseId/team/:memberId", async (req, res) => {
  const { caseId, memberId } = req.params;

  try {
    const pool = await poolPromise;

    // Verify the team member belongs to this case
    const result = await pool
      .request()
      .input("memberId", memberId)
      .input("caseId", caseId).query(`
        DELETE FROM WarRoomTeamMembers
        WHERE Id = @memberId AND CaseId = @caseId
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Team member not found" });
    }

    res.json({
      success: true,
      message: "Team member removed successfully",
    });
  } catch (err) {
    console.error("Delete team member error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
