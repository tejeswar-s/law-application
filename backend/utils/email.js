const nodemailer = require("nodemailer");
const { createEmailVerificationToken } = require("./tokens");

// Create transporter for sending emails
const createTransporter = async () => {
  if (process.env.NODE_ENV === "production") {
    // Production: Use Gmail with consistent environment variables
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // false for port 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });
  } else {
    // Development: prefer Gmail if provided, otherwise use Ethereal test account
    if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
      return nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD,
        },
      });
    }
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
};

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, resetToken, userType) {
  try {
    const transporter = await createTransporter();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&type=${userType}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
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
    const transporter = await createTransporter();

    const signupPath = userType === "attorney" ? "attorney" : "juror";
    const verificationLink = `${process.env.FRONTEND_URL}/signup/${signupPath}?verifyToken=${verificationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
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
 * High-level helper: create token and send verification email
 */
async function createAndSendEmailVerification(email, userType) {
  const token = createEmailVerificationToken(email, userType);
  const sent = await sendEmailVerification(email, token, userType);
  return { token, sent };
}

/**
 * Test email configuration
 */
async function testEmailConfig() {
  try {
    const transporter = await createTransporter();
    await transporter.verify();
    console.log("✅ Email configuration is valid");
    return true;
  } catch (error) {
    console.error("❌ Email configuration error:", error);
    return false;
  }
}

/**
 * Send account declined notification email
 */
async function sendAccountDeclinedEmail(email, userType, reason) {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Quick Verdicts - ${
        userType.charAt(0).toUpperCase() + userType.slice(1)
      } Account Status`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #16305B; text-align: center;">Quick Verdicts</h2>
          <p>Hello,</p>
          <p>Thank you for your interest in joining Quick Verdicts as ${
            userType === "attorney" ? "an" : "a"
          } ${userType}.</p>
          <p>After reviewing your application, we regret to inform you that we are unable to approve your account at this time.</p>
          ${
            reason
              ? `<div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Reason:</strong></p>
                  <p style="margin: 10px 0 0 0;">${reason}</p>
                </div>`
              : ""
          }
          <p>If you believe this was an error or have questions, please contact our support team.</p>
          <p>Best regards,<br/>Quick Verdicts Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Account declined email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Error sending declined email:", error);
    return false;
  }
}

/**
 * Send account verified notification email
 */
async function sendAccountVerifiedEmail(email, userType) {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Quick Verdicts - ${
        userType.charAt(0).toUpperCase() + userType.slice(1)
      } Account Verified`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #16305B; text-align: center;">Quick Verdicts</h2>
          <p>Congratulations!</p>
          <p>Your ${userType} account has been successfully verified by our admin team.</p>
          <div style="background: #f0fdf4; padding: 15px; border-left: 4px solid #16a34a; margin: 20px 0;">
            <p style="margin: 0; color: #16a34a;"><strong>✓ Account Status: Verified</strong></p>
          </div>
          <p>You now have full access to all platform features. You can log in and start using Quick Verdicts.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/login" style="background:#16305B; color:#fff; padding:12px 30px; text-decoration:none; border-radius:5px; display:inline-block;">Login to Your Account</a>
          </p>
          <p>Thank you for joining Quick Verdicts!</p>
          <p>Best regards,<br/>Quick Verdicts Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Account verified email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Error sending verified email:", error);
    return false;
  }
}
/**
 * Send OTP verification email
 */
async function sendOTPEmail(email, otp, userType) {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Quick Verdicts - Email Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #16305B; margin: 0;">Quick Verdicts</h2>
            <p style="color: #666; margin-top: 5px;">Email Verification</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #16305B; margin: 0 0 15px 0;">Hello,</p>
            <p style="color: #666; margin: 0 0 15px 0;">Thank you for signing up as ${
              userType === "attorney" ? "an attorney" : "a juror"
            } on Quick Verdicts.</p>
            <p style="color: #666; margin: 0;">Your verification code is:</p>
            
            <div style="text-align: center; margin: 25px 0;">
              <div style="display: inline-block; background: #16305B; color: white; padding: 20px 40px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px;">
                ${otp}
              </div>
            </div>
            
            <p style="color: #666; margin: 15px 0 0 0; font-size: 14px;">
              <strong>Important:</strong> This code expires in 10 minutes.
            </p>
          </div>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              ⚠️ <strong>Security Notice:</strong> Never share this code with anyone. Quick Verdicts staff will never ask for your verification code.
            </p>
          </div>
          
          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              If you didn't request this code, please ignore this email.
            </p>
            <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
              © ${new Date().getFullYear()} Quick Verdicts. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ OTP email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Error sending OTP email:", error);
    return false;
  }
}

module.exports = {
  sendPasswordResetEmail,
  sendEmailVerification,
  createAndSendEmailVerification,
  testEmailConfig,
  sendAccountDeclinedEmail,
  sendAccountVerifiedEmail,
  sendOTPEmail, // NEW
};
