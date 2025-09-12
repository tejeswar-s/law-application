const nodemailer = require("nodemailer");

// Create transporter for sending emails
const createTransporter = () => {
  if (process.env.NODE_ENV === "production") {
    // Production email configuration
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 465,
      secure: true, // use TLS for port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development configuration using Gmail
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Gmail address
        pass: process.env.EMAIL_APP_PASSWORD, // Gmail App Password
      },
    });
  }
};

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, resetToken, userType) {
  try {
    const transporter = createTransporter();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&type=${userType}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: "Quick Verdicts - Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #16305B; text-align: center;">Quick Verdicts</h2>
          <p>Hello,</p>
          <p>We received a request to reset your ${userType} account password.</p>
          <p>Click below to reset your password:</p>
          <p style="text-align: center;">
            <a href="${resetLink}" style="background:#16305B; color:#fff; padding:10px 20px; text-decoration:none; border-radius:5px;">Reset Password</a>
          </p>
          <p>Or copy this link into your browser:</p>
          <p style="word-break:break-all; background:#f5f5f5; padding:10px; border-radius:5px;">${resetLink}</p>
          <p><strong>Note:</strong> This link expires in 1 hour.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Password reset email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Error sending password reset email:", error);
    return false;
  }
}

/**
 * Send email verification email
 */
async function sendEmailVerification(email, verificationToken, userType) {
  try {
    const transporter = createTransporter();

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&type=${userType}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: "Quick Verdicts - Please Verify Your Email Address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #16305B; text-align: center;">Quick Verdicts</h2>
          <p>Thank you for signing up as ${userType}!</p>
          <p>Click below to verify your email address:</p>
          <p style="text-align: center;">
            <a href="${verificationLink}" style="background:#16305B; color:#fff; padding:10px 20px; text-decoration:none; border-radius:5px;">Verify Email</a>
          </p>
          <p>Or copy this link into your browser:</p>
          <p style="word-break:break-all; background:#f5f5f5; padding:10px; border-radius:5px;">${verificationLink}</p>
          <p><strong>Note:</strong> This link expires in 24 hours.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Verification email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Error sending verification email:", error);
    return false;
  }
}

/**
 * Test email configuration
 */
async function testEmailConfig() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("✅ Email configuration is valid");
    return true;
  } catch (error) {
    console.error("❌ Email configuration error:", error);
    return false;
  }
}

module.exports = {
  sendPasswordResetEmail,
  sendEmailVerification,
  testEmailConfig,
};
