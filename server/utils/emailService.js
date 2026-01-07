const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Enhanced SendEmail Utility
 * Supports both plain text and HTML for professional parent alerts
 */
exports.sendEmail = async (to, subject, text, html = null) => {
  if (!to) {
    console.log("⚠️ Email skipped: No recipient address provided.");
    return;
  }

  const mailOptions = {
    from: `"College Attendance System" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text, // Fallback for old email clients
    html: html || text.replace(/\n/g, '<br>'), // Use HTML if provided, else convert text newlines
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email successfully sent to: ${to}`);
  } catch (error) {
    // Detailed error logging to help you troubleshoot Gmail limits or auth issues
    console.error(`❌ Mailer Error (${to}): ${error.message}`);
    
    if (error.message.includes('EAUTH')) {
      console.error("🔑 Hint: Check your GMAIL_PASS (App Password) in .env");
    }
  }
};