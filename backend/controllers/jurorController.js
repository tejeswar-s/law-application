// Mark juror as qualified in quiz (100% score)
exports.setQualifiedInQuiz = async (req, res) => {
  try {
    const juror = req.user;
    await Juror.setQualifiedInQuiz(juror.id);
    res.json({ success: true, message: "Quiz qualification updated" });
  } catch (error) {
    console.error("Set qualified in quiz error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const Juror = require("../models/Juror");
const bcrypt = require("bcryptjs");

exports.updateJurorProfile = async (req, res) => {
  try {
    const juror = req.user;
    const { name, email, phone, password } = req.body;
    let passwordHash = undefined;
    if (password && password.length > 0 && password !== "************") {
      passwordHash = await bcrypt.hash(password, 10);
    }
    await Juror.updateJurorProfile(juror.id, {
      name,
      email,
      phone,
      passwordHash,
    });
    res.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update juror profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteJurorAccount = async (req, res) => {
  try {
    const juror = req.user;
    await Juror.deactivateJuror(juror.id);
    res.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete juror account error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
