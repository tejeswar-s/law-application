const express = require("express");
const {
  authMiddleware,
  requireJuror,
  requireJurorOnboarding,
} = require("../middleware/authMiddleware");

const router = express.Router();

// All routes here require authentication as juror
router.use(authMiddleware);
router.use(requireJuror);

// Get juror dashboard data
router.get("/dashboard", async (req, res) => {
  try {
    const juror = req.user;

    res.json({
      success: true,
      data: {
        juror: {
          id: juror.id,
          name: juror.name,
          email: juror.email,
          county: juror.county,
          state: juror.state,
          verified: juror.verified,
          verificationStatus: juror.verificationStatus,
          onboardingCompleted: juror.onboardingCompleted,
        },
        availableJobs: [],
        assignedCases: [],
      },
    });
  } catch (error) {
    console.error("Juror dashboard error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get juror profile
const Juror = require("../models/Juror");
router.get("/profile", async (req, res) => {
  try {
    const jurorId = req.user.id;
    const juror = await Juror.findById(jurorId);
    if (!juror) {
      return res
        .status(404)
        .json({ success: false, message: "Juror not found" });
    }
    res.json({
      success: true,
      juror: {
        id: juror.JurorId,
        name: juror.Name,
        email: juror.Email,
        phone: juror.PhoneNumber,
        county: juror.County,
        state: juror.State,
        verified: juror.IsVerified,
        verificationStatus: juror.VerificationStatus,
        onboardingCompleted: juror.OnboardingCompleted,
        IntroVideoCompleted: juror.IntroVideoCompleted,
        JurorQuizCompleted: juror.JurorQuizCompleted,
      },
    });
  } catch (error) {
    console.error("Get juror profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update task completion (video or quiz)
router.post("/profile/task/:taskType", async (req, res) => {
  try {
    const jurorId = req.user.id;
    const { taskType } = req.params;

    await Juror.updateTaskCompletion(jurorId, taskType, true);
    await Juror.updateOnboardingStatus(jurorId);

    res.json({
      success: true,
      message: `${taskType} marked as completed`,
    });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update juror profile
router.put("/profile", async (req, res) => {
  const controller = require("../controllers/jurorController");
  return controller.updateJurorProfile(req, res);
});

// Delete juror account
router.delete("/profile", async (req, res) => {
  const controller = require("../controllers/jurorController");
  return controller.deleteJurorAccount(req, res);
});

// Get onboarding tasks
router.get("/onboarding", async (req, res) => {
  try {
    const juror = req.user;

    const tasks = [
      {
        id: "intro_video",
        title: "Introduction to Quick Verdicts Video",
        duration: "5 minutes",
        completed: false,
        description: "Learn about the platform and your role as a juror",
      },
      {
        id: "juror_quiz",
        title: "Juror Quiz",
        duration: "3 minutes",
        completed: false,
        description: "Test your understanding of jury service basics",
      },
    ];

    res.json({
      success: true,
      tasks,
      onboardingCompleted: juror.onboardingCompleted,
    });
  } catch (error) {
    console.error("Get onboarding tasks error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Complete onboarding task
router.post("/onboarding/:taskId/complete", async (req, res) => {
  try {
    const { taskId } = req.params;

    res.json({
      success: true,
      message: `Task ${taskId} marked as completed`,
      taskId,
    });
  } catch (error) {
    console.error("Complete onboarding task error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get job board (requires completed onboarding)
router.get("/jobs", requireJurorOnboarding, async (req, res) => {
  try {
    const jobs = [
      {
        id: 1,
        title: "Vehicle Damage Case",
        date: "2025-11-12",
        time: "11:00 AM - 4:00 PM",
        compensation: 50,
        status: "available",
      },
      {
        id: 2,
        title: "Property Theft Case",
        date: "2025-12-15",
        time: "10:00 AM - 3:00 PM",
        compensation: 75,
        status: "available",
      },
    ];

    res.json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error("Get job board error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Apply for job
router.post("/jobs/:jobId/apply", requireJurorOnboarding, async (req, res) => {
  try {
    const { jobId } = req.params;

    res.json({
      success: true,
      message: "Application submitted successfully",
      jobId: parseInt(jobId),
    });
  } catch (error) {
    console.error("Apply for job error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get available cases for juror (job board)
router.get("/cases/available", requireJurorOnboarding, async (req, res) => {
  try {
    const juror = req.user;
    console.log("=== Juror requesting cases ===");
    console.log("State:", juror.state);
    console.log("County:", juror.county);

    const Case = require("../models/Case");

    const availableCases = await Case.getAvailableCasesForJuror(
      juror.state,
      juror.county
    );

    console.log("Cases found:", availableCases.length);

    res.json({
      success: true,
      cases: availableCases,
      jurorLocation: {
        state: juror.state,
        county: juror.county,
      },
    });
  } catch (error) {
    console.error("Get available cases error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available cases",
    });
  }
});

// Submit application for a case
router.post("/applications/apply", async (req, res) => {
  try {
    const jurorId = req.user.id;
    const { caseId, voirDireResponses } = req.body;

    if (!caseId || !voirDireResponses) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const JurorApplication = require("../models/JurorApplication");
    const Case = require("../models/Case");

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    const existingApplication = await JurorApplication.findByJurorAndCase(
      jurorId,
      caseId
    );
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You have already applied to this case",
      });
    }

    const responses = JSON.parse(voirDireResponses);

    const applicationId = await JurorApplication.createApplication({
      jurorId,
      caseId,
      voirDire1Responses: responses.part1 || [],
      voirDire2Responses: responses.part2 || [],
    });

    const Notification = require("../models/Notification");
    await Notification.createNotification({
      userId: caseData.AttorneyId,
      userType: "attorney",
      caseId,
      type: "APPLICATION_SUBMITTED",
      title: "New Juror Application",
      message: `A juror has applied to your case "${caseData.CaseTitle}"`,
    });

    res.json({
      success: true,
      message: "Application submitted successfully",
      applicationId,
    });
  } catch (error) {
    console.error("Submit application error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit application",
    });
  }
});

// Get my applications
// Get my applications
router.get("/applications", async (req, res) => {
  try {
    const jurorId = req.user.id;
    const JurorApplication = require("../models/JurorApplication");

    const applications = await JurorApplication.getApplicationsByJuror(jurorId);

    res.json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error("Get my applications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
    });
  }
});

module.exports = router;
