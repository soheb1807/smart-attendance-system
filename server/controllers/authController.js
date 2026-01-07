const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../utils/emailService');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
exports.registerUser = async (req, res) => {
  const { 
    name, email, password, role, 
    stream, rollNumber, deviceId, parentEmail, department, 
    profileImage 
  } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const isApproved = role === 'admin' ? true : false;

    const user = await User.create({
      name, 
      email, 
      password, 
      role, 
      stream: role === 'student' ? stream : undefined, 
      rollNumber: role === 'student' ? rollNumber : undefined, 
      parentEmail: role === 'student' ? parentEmail : undefined, 
      department: role === 'teacher' ? department : undefined,
      isApproved,
      
      // 🔒 Students bind device immediately
      trustedDeviceId: role === 'student' ? deviceId : undefined,
      
      // 📸 Save the Cloudinary URL
      profileImage: profileImage || undefined 
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      role: user.role,
      profileImage: user.profileImage, 
      message: role === 'admin' ? 'Admin registered' : 'Registration successful. Please wait for approval.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user (STUDENT LOCKED TO DEVICE)
exports.loginUser = async (req, res) => {
  const { email, password, deviceId } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      
      // 1. Approval Check
      if (!user.isApproved) {
        return res.status(403).json({ message: 'Account not approved yet. Please contact Admin/Teacher.' });
      }

      // 2. 🛡️ ROLE-BASED DEVICE SECURITY
      if (user.role === 'student') {
        // --- STUDENT IS LOCKED TO ONE DEVICE ---
        if (user.trustedDeviceId && user.trustedDeviceId !== deviceId) {
           console.warn(`🚨 SECURITY ALERT: Student ${user.name} mismatched device.`);
           
           // Notify Admin
           const adminEmail = process.env.ADMIN_EMAIL || "admin@college.com"; 
           await sendEmail(
             adminEmail,
             "🚨 PROXY ALERT: Student Login Blocked",
             `Student: ${user.name}\nRegistered Device: ${user.trustedDeviceId}\nAttempted Device: ${deviceId}`
           );

           return res.status(403).json({ 
             message: "🚫 DEVICE ERROR: You must use your registered phone to login." 
           });
        }
      } 
      // Note: Parents/Teachers are not locked to devices in this logic

      // 3. Success Response
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        stream: user.stream,
        rollNumber: user.rollNumber,
        parentEmail: user.parentEmail,
        department: user.department,
        profileImage: user.profileImage, 
        token: generateToken(user._id),
      });

    } else {
      // FIX: Changed status 41 to 401 (Unauthorized)
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot Password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate Token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 Minutes
    await user.save();

    // Create Reset URL
    // Ensure CLIENT_URL in .env does NOT have a trailing slash (e.g., https://myapp.com)
    const resetUrl = `${process.env.CLIENT_URL}/resetpassword/${resetToken}`;

    // 📧 Create Email Content
    const subject = 'Password Reset Request';
    
    // Plain text version
    const message = `You requested a password reset. Please go to this link to reset your password: \n\n ${resetUrl}`;
    
    // HTML Version (Clickable Link)
    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Password Reset</h2>
        <p>You have requested to reset your password.</p>
        <p>Please click the button below to proceed:</p>
        <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        <p style="margin-top: 20px;">Or copy this link:</p>
        <p>${resetUrl}</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `;

    // Send using the updated sendEmail utility
    await sendEmail(
      user.email, 
      subject, 
      message,    // text version
      htmlMessage // html version
    );

    res.status(200).json({ message: 'Email sent' });

  } catch (error) {
    // Rollback if email fails
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: 'Email could not be sent. Please try again later.' });
  }
};

// @desc    Reset Password
exports.resetPassword = async (req, res) => {
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');
  
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

  user.password = req.body.password; 
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(201).json({ message: 'Password updated successfully' });
};

// @desc    Change Password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Invalid current password' });

    user.password = newPassword;
    await user.save();
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update User Profile
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      
      // Allow updating profile image
      if (req.body.profileImage) {
        user.profileImage = req.body.profileImage;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        stream: updatedUser.stream,
        rollNumber: updatedUser.rollNumber,
        parentEmail: updatedUser.parentEmail,
        department: updatedUser.department,
        profileImage: updatedUser.profileImage, 
        token: req.headers.authorization.split(' ')[1] 
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};