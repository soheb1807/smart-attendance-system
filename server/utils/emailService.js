const nodemailer = require('nodemailer');

// ⬇️ UPDATE THIS SECTION ⬇️
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',  // explicit host
  port: 465,               // explicit port (Use 465 for SSL)
  secure: true,            // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Adding connection timeout settings can help debug if it still hangs
  connectionTimeout: 10000, 
});
// ⬆️ END UPDATE ⬆️

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
    text, 
    html: html || text.replace(/\n/g, '<br>'), 
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email successfully sent to: ${to}`);
  } catch (error) {
    console.error(`❌ Mailer Error (${to}): ${error.message}`);
    
    if (error.message.includes('EAUTH')) {
      console.error("🔑 Hint: Check your GMAIL_PASS (App Password) in .env");
    }
  }
};