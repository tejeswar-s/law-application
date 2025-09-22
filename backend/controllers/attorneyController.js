const { updateProfile, deleteAttorney } = require("../models/Attorney");

/**
 * Update attorney profile
 */
async function updateProfileHandler(req, res) {
  try {
    const attorneyId = req.user.id;
    const { firstName, lastName, phoneNumber } = req.body;

    // Validate input
    if (!firstName && !lastName && !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "At least one field must be provided for update",
      });
    }

    // Update profile
    await updateProfile(attorneyId, { firstName, lastName, phoneNumber });

    // Fetch updated attorney data
    const updatedAttorney = await require("../models/Attorney").findById(
      attorneyId
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      attorney: {
        id: updatedAttorney.AttorneyId,
        firstName: updatedAttorney.FirstName,
        lastName: updatedAttorney.LastName,
        lawFirmName: updatedAttorney.LawFirmName,
        email: updatedAttorney.Email,
        phoneNumber: updatedAttorney.PhoneNumber,
        verified: updatedAttorney.IsVerified,
        verificationStatus: updatedAttorney.VerificationStatus,
      },
    });
  } catch (error) {
    console.error("Update attorney profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

/**
 * Delete attorney account
 */
async function deleteAccountHandler(req, res) {
  try {
    const attorneyId = req.user.id;

    // Delete attorney
    await deleteAttorney(attorneyId);

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete attorney account error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

module.exports = {
  updateProfileHandler,
  deleteAccountHandler,
};
