const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User'); 
const { sendEmail } = require('../utils/emailService');

console.log("✅ User Routes Loaded: Hardware Security & Silent Parent Alerts Active");

// --- IMPORTS FROM CONTROLLERS ---
const { 
  registerUser, 
  loginUser, 
  forgotPassword, 
  resetPassword,
  changePassword,
  updateUserProfile 
} = require('../controllers/authController');

const { 
  getPendingUsers, 
  approveUser,
  getApprovedUsers // 🚀 ADDED THIS IMPORT
} = require('../controllers/approvalController');

// --- PUBLIC ROUTES ---
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resetToken', resetPassword);

// --- PROTECTED ROUTES ---
router.put('/change-password', protect, changePassword);
router.put('/profile', protect, updateUserProfile);

// --- APPROVAL SYSTEM ---
router.get('/pending', protect, authorize('admin', 'teacher'), getPendingUsers);
router.put('/approve/:id', protect, authorize('admin', 'teacher'), approveUser);

// 🚀 NEW ROUTE: Get Approved Users (For Total Count List)
router.get('/approved', protect, authorize('admin', 'teacher'), getApprovedUsers);

// ---------------------------------------------------------
// 🔒 SECURITY & DEVICE MANAGEMENT
// ---------------------------------------------------------

// RESET DEVICE ID: Allows teacher to unlock a student's hardware binding
router.put('/reset-device/:id', protect, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    user.trustedDeviceId = undefined; 
    await user.save();
    
    res.json({ message: `Hardware lock removed for ${user.name}. They can now link a new phone.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------------------------------------------------------
// 📢 AUTOMATED NOTICE DISPATCH (EMAIL ONLY)
// ---------------------------------------------------------

// SEND NOTICE: Sends mass emails based on the group
router.post('/send-notice', protect, authorize('admin'), async (req, res) => {
  const { recipientGroup, subject, message } = req.body; 

  try {
    let emails = [];

    if (recipientGroup === 'parents') {
      const students = await User.find({ role: 'student' }).select('parentEmail');
      emails = [...new Set(students.map(s => s.parentEmail).filter(e => e))];
    } else {
      let query = {};
      if (recipientGroup === 'teachers') query.role = 'teacher';
      else if (recipientGroup === 'students') query.role = 'student';
      else if (recipientGroup === 'all') query = { role: { $in: ['teacher', 'student'] } };

      const users = await User.find(query).select('email');
      emails = users.map(u => u.email);
    }

    if (emails.length === 0) {
      return res.status(404).json({ message: "No recipients found for this group." });
    }

    const htmlTemplate = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">College Announcement</h2>
        <p style="font-size: 16px; font-weight: bold;">Subject: ${subject}</p>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; color: #334155; line-height: 1.6;">
          ${message}
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">This is an official notice sent via the College Attendance Portal.</p>
      </div>
    `;

    const emailPromises = emails.map(email => 
      sendEmail(email, `OFFICIAL NOTICE: ${subject}`, "", htmlTemplate)
    );
    
    await Promise.all(emailPromises);
    
    res.json({ message: `Successfully emailed ${emails.length} recipients.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------------------------------------------------------
// 3. User Management
// ---------------------------------------------------------

// DELETE USER (Updated: Teachers allowed to reject/delete students)
router.delete('/:id', protect, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Safety check: Teachers cannot delete Admins or other Teachers
    if (req.user.role === 'teacher' && user.role !== 'student') {
        return res.status(403).json({ message: "Teachers can only delete Students." });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET TEACHERS (Admin Only)
router.get('/teachers', protect, authorize('admin'), async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher', isApproved: true }).select('-password');
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;