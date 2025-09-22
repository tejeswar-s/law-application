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
          verified: juror.verified,
          verificationStatus: juror.verificationStatus,
          onboardingCompleted: juror.onboardingCompleted,
        },
        // Add more dashboard data as needed
        availableJobs: [], // Placeholder for job board
        assignedCases: [], // Placeholder for assigned cases
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
        verified: juror.IsVerified,
        verificationStatus: juror.VerificationStatus,
        onboardingCompleted: juror.OnboardingCompleted,
        isQualifiedInQuiz: !!juror.isQualifiedInQuiz,
      },
    });
    // Mark juror as qualified in quiz (100% score)
    const jurorController = require("../controllers/jurorController");
    router.post("/profile/qualified", (req, res) =>
      jurorController.setQualifiedInQuiz(req, res)
    );
  } catch (error) {
    console.error("Get juror profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update juror profile
router.put("/profile", async (req, res) => {
  // Controller logic in jurorController.js
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

    // This would typically come from the database
    const tasks = [
      {
        id: "intro_video",
        title: "Introduction to Quick Verdicts Video",
        duration: "5 minutes",
        completed: false, // Get from database
        description: "Learn about the platform and your role as a juror",
      },
      {
        id: "juror_quiz",
        title: "Juror Quiz",
        duration: "3 minutes",
        completed: false, // Get from database
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
    const juror = req.user;

    // Add task completion logic here
    // This would update the database to mark task as completed

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
    // This would typically come from the database
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
    const juror = req.user;

    // Add job application logic here

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

module.exports = router;
