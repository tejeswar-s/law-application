const { poolPromise } = require("../config/db");
const sql = require("mssql");

// Add or update witnesses for a case (Attorney only)
exports.saveWitnesses = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { witnesses } = req.body; // Array of {name, side, description}
    const attorneyId = req.user.id;

    const pool = await poolPromise;

    // Verify attorney owns this case
    const caseResult = await pool
      .request()
      .input("caseId", sql.Int, caseId)
      .input("attorneyId", sql.Int, attorneyId)
      .query(
        "SELECT CaseId FROM Cases WHERE CaseId = @caseId AND AttorneyId = @attorneyId"
      );

    if (caseResult.recordset.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to modify this case",
      });
    }

    // Delete existing witnesses for this case
    await pool
      .request()
      .input("caseId", sql.Int, caseId)
      .query("DELETE FROM CaseWitnesses WHERE CaseId = @caseId");

    // Insert new witnesses
    if (witnesses && witnesses.length > 0) {
      for (let i = 0; i < witnesses.length; i++) {
        const witness = witnesses[i];
        await pool
          .request()
          .input("caseId", sql.Int, caseId)
          .input("witnessName", sql.NVarChar, witness.name)
          .input("side", sql.NVarChar, witness.side)
          .input("description", sql.NVarChar, witness.description || null)
          .input("orderIndex", sql.Int, i).query(`
            INSERT INTO CaseWitnesses (CaseId, WitnessName, Side, Description, OrderIndex)
            VALUES (@caseId, @witnessName, @side, @description, @orderIndex)
          `);
      }
    }

    res.json({ success: true, message: "Witnesses saved successfully" });
  } catch (error) {
    console.error("Error saving witnesses:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to save witnesses" });
  }
};

// Get witnesses for a case (Attorney and Admin)
exports.getWitnesses = async (req, res) => {
  try {
    const { caseId } = req.params;

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("caseId", sql.Int, caseId)
      .query(
        "SELECT * FROM CaseWitnesses WHERE CaseId = @caseId ORDER BY OrderIndex ASC"
      );

    res.json({ success: true, witnesses: result.recordset });
  } catch (error) {
    console.error("Error fetching witnesses:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch witnesses",
        error: error.message,
      });
  }
};

// Update a single witness (Attorney only)
exports.updateWitness = async (req, res) => {
  try {
    const { witnessId } = req.params;
    const { name, side, description } = req.body;
    const attorneyId = req.user.id;

    const pool = await poolPromise;

    // Verify attorney owns the case this witness belongs to
    const verifyResult = await pool
      .request()
      .input("witnessId", sql.Int, witnessId)
      .input("attorneyId", sql.Int, attorneyId).query(`
        SELECT cw.WitnessId 
        FROM CaseWitnesses cw 
        JOIN Cases c ON cw.CaseId = c.CaseId 
        WHERE cw.WitnessId = @witnessId AND c.AttorneyId = @attorneyId
      `);

    if (verifyResult.recordset.length === 0) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    // Update witness
    await pool
      .request()
      .input("witnessId", sql.Int, witnessId)
      .input("name", sql.NVarChar, name)
      .input("side", sql.NVarChar, side)
      .input("description", sql.NVarChar, description || null).query(`
        UPDATE CaseWitnesses 
        SET WitnessName = @name, Side = @side, Description = @description 
        WHERE WitnessId = @witnessId
      `);

    res.json({ success: true, message: "Witness updated successfully" });
  } catch (error) {
    console.error("Error updating witness:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update witness" });
  }
};

// Delete a witness (Attorney only)
exports.deleteWitness = async (req, res) => {
  try {
    const { witnessId } = req.params;
    const attorneyId = req.user.id;

    const pool = await poolPromise;

    // Verify attorney owns the case this witness belongs to
    const verifyResult = await pool
      .request()
      .input("witnessId", sql.Int, witnessId)
      .input("attorneyId", sql.Int, attorneyId).query(`
        SELECT cw.WitnessId 
        FROM CaseWitnesses cw 
        JOIN Cases c ON cw.CaseId = c.CaseId 
        WHERE cw.WitnessId = @witnessId AND c.AttorneyId = @attorneyId
      `);

    if (verifyResult.recordset.length === 0) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    // Delete witness
    await pool
      .request()
      .input("witnessId", sql.Int, witnessId)
      .query("DELETE FROM CaseWitnesses WHERE WitnessId = @witnessId");

    res.json({ success: true, message: "Witness deleted successfully" });
  } catch (error) {
    console.error("Error deleting witness:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete witness" });
  }
};

// Export witnesses as text file format (Admin)
exports.exportAsText = async (req, res) => {
  try {
    const { caseId } = req.params;

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("caseId", sql.Int, caseId)
      .query(
        "SELECT * FROM CaseWitnesses WHERE CaseId = @caseId ORDER BY OrderIndex ASC"
      );

    let textContent = "WITNESSES FOR CREDIBILITY EVALUATION\n";
    textContent += "=====================================\n\n";

    if (result.recordset.length === 0) {
      textContent += "No witnesses have been added for this case.\n";
    } else {
      result.recordset.forEach((witness, index) => {
        textContent += `Witness ${index + 1}: ${witness.WitnessName}\n`;
        textContent += `Side: ${witness.Side}\n`;
        if (witness.Description) {
          textContent += `Description: ${witness.Description}\n`;
        }
        textContent += "\n---\n\n";
      });
    }

    res.setHeader("Content-Type", "text/plain");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="witnesses-case-${caseId}.txt"`
    );
    res.send(textContent);
  } catch (error) {
    console.error("Error exporting witnesses:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to export witnesses" });
  }
};
