const db = require("../config/db");
const sql = require("mssql");

// Save jury charge questions for a case (Attorney only)
exports.saveJuryChargeQuestions = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { questions } = req.body; // Array of {questionText, questionType, options}
    const attorneyId = req.user.id;

    // Verify attorney owns this case
    const caseResult = await db
      .request()
      .input("caseId", sql.Int, caseId)
      .input("attorneyId", sql.Int, attorneyId)
      .query(
        "SELECT CaseId FROM Cases WHERE CaseId = @caseId AND AttorneyId = @attorneyId"
      );

    if (caseResult.recordset.length === 0) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to modify this case",
        });
    }

    // Delete existing questions for this case
    await db
      .request()
      .input("caseId", sql.Int, caseId)
      .query("DELETE FROM JuryChargeQuestions WHERE CaseId = @caseId");

    // Insert new questions
    if (questions && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];

        // For multiple choice, convert options array to JSON string
        let optionsJson = null;
        if (question.questionType === "Multiple Choice" && question.options) {
          optionsJson = JSON.stringify(question.options);
        }

        await db
          .request()
          .input("caseId", sql.Int, caseId)
          .input("questionText", sql.NVarChar, question.questionText)
          .input("questionType", sql.NVarChar, question.questionType)
          .input("options", sql.NVarChar, optionsJson)
          .input("orderIndex", sql.Int, i).query(`
            INSERT INTO JuryChargeQuestions (CaseId, QuestionText, QuestionType, Options, OrderIndex)
            VALUES (@caseId, @questionText, @questionType, @options, @orderIndex)
          `);
      }
    }

    res.json({
      success: true,
      message: "Jury charge questions saved successfully",
    });
  } catch (error) {
    console.error("Error saving jury charge questions:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to save jury charge questions",
      });
  }
};

// Get jury charge questions for a case (Attorney and Admin)
exports.getJuryChargeQuestions = async (req, res) => {
  try {
    const { caseId } = req.params;

    const result = await db
      .request()
      .input("caseId", sql.Int, caseId)
      .query(
        "SELECT * FROM JuryChargeQuestions WHERE CaseId = @caseId ORDER BY OrderIndex ASC"
      );

    // Parse JSON options for multiple choice questions
    const questions = result.recordset.map((q) => {
      if (q.Options) {
        try {
          q.Options = JSON.parse(q.Options);
        } catch (e) {
          q.Options = [];
        }
      }
      return q;
    });

    res.json({ success: true, questions });
  } catch (error) {
    console.error("Error fetching jury charge questions:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch jury charge questions",
      });
  }
};

// Update a single question (Attorney only)
exports.updateJuryChargeQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { questionText, questionType, options } = req.body;
    const attorneyId = req.user.id;

    // Verify attorney owns the case this question belongs to
    const verifyResult = await db
      .request()
      .input("questionId", sql.Int, questionId)
      .input("attorneyId", sql.Int, attorneyId).query(`
        SELECT jcq.QuestionId 
        FROM JuryChargeQuestions jcq 
        JOIN Cases c ON jcq.CaseId = c.CaseId 
        WHERE jcq.QuestionId = @questionId AND c.AttorneyId = @attorneyId
      `);

    if (verifyResult.recordset.length === 0) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    // Convert options to JSON if provided
    let optionsJson = null;
    if (questionType === "Multiple Choice" && options) {
      optionsJson = JSON.stringify(options);
    }

    // Update question
    await db
      .request()
      .input("questionId", sql.Int, questionId)
      .input("questionText", sql.NVarChar, questionText)
      .input("questionType", sql.NVarChar, questionType)
      .input("options", sql.NVarChar, optionsJson).query(`
        UPDATE JuryChargeQuestions 
        SET QuestionText = @questionText, QuestionType = @questionType, Options = @options 
        WHERE QuestionId = @questionId
      `);

    res.json({ success: true, message: "Question updated successfully" });
  } catch (error) {
    console.error("Error updating jury charge question:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update question" });
  }
};

// Delete a question (Attorney only)
exports.deleteJuryChargeQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const attorneyId = req.user.id;

    // Verify attorney owns the case this question belongs to
    const verifyResult = await db
      .request()
      .input("questionId", sql.Int, questionId)
      .input("attorneyId", sql.Int, attorneyId).query(`
        SELECT jcq.QuestionId 
        FROM JuryChargeQuestions jcq 
        JOIN Cases c ON jcq.CaseId = c.CaseId 
        WHERE jcq.QuestionId = @questionId AND c.AttorneyId = @attorneyId
      `);

    if (verifyResult.recordset.length === 0) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    // Delete question
    await db
      .request()
      .input("questionId", sql.Int, questionId)
      .query("DELETE FROM JuryChargeQuestions WHERE QuestionId = @questionId");

    res.json({ success: true, message: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting jury charge question:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete question" });
  }
};

// Export questions as text file format (Admin)
exports.exportAsText = async (req, res) => {
  try {
    const { caseId } = req.params;

    const result = await db
      .request()
      .input("caseId", sql.Int, caseId)
      .query(
        "SELECT * FROM JuryChargeQuestions WHERE CaseId = @caseId ORDER BY OrderIndex ASC"
      );

    let textContent = "JURY CHARGE QUESTIONS\n";
    textContent += "======================\n\n";

    result.recordset.forEach((q, index) => {
      textContent += `Question ${index + 1}: ${q.QuestionText}\n`;
      textContent += `Type: ${q.QuestionType}\n`;

      if (q.Options) {
        try {
          const options = JSON.parse(q.Options);
          textContent += "Options:\n";
          options.forEach((opt, optIndex) => {
            textContent += `  ${optIndex + 1}. ${opt}\n`;
          });
        } catch (e) {
          // Skip if options can't be parsed
        }
      }

      textContent += "\n---\n\n";
    });

    res.setHeader("Content-Type", "text/plain");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="jury-charge-case-${caseId}.txt"`
    );
    res.send(textContent);
  } catch (error) {
    console.error("Error exporting jury charge questions:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to export questions" });
  }
};

// Export questions as MS Forms template (Admin)
exports.exportAsMSFormsTemplate = async (req, res) => {
  try {
    const { caseId } = req.params;

    const result = await db
      .request()
      .input("caseId", sql.Int, caseId)
      .query(
        "SELECT * FROM JuryChargeQuestions WHERE CaseId = @caseId ORDER BY OrderIndex ASC"
      );

    // Create a JSON template that can be used to create MS Forms
    const formTemplate = {
      title: `Jury Charge - Case ${caseId}`,
      description:
        "Please answer the following questions based on the evidence presented.",
      questions: [],
    };

    result.recordset.forEach((q, index) => {
      const questionObj = {
        id: index + 1,
        text: q.QuestionText,
        type: q.QuestionType,
        required: true,
      };

      if (q.QuestionType === "Multiple Choice" && q.Options) {
        try {
          questionObj.choices = JSON.parse(q.Options);
        } catch (e) {
          questionObj.choices = [];
        }
      } else if (q.QuestionType === "Yes/No") {
        questionObj.choices = ["Yes", "No"];
      }

      formTemplate.questions.push(questionObj);
    });

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="ms-forms-template-case-${caseId}.json"`
    );
    res.json(formTemplate);
  } catch (error) {
    console.error("Error exporting MS Forms template:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to export MS Forms template" });
  }
};
