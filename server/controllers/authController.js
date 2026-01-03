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
    profileImage // <--- 1. Accept profileImage from frontend
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
      profileImage: user.profileImage, // <--- Return image in response
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
        profileImage: user.profileImage, // <--- 2. Send Profile Image on Login
        token: generateToken(user._id),
      });

    } else {
      res.status(41).json({ message: 'Invalid email or password' });
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

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; 
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/resetpassword/${resetToken}`;
    const message = `Password Reset Request: \n\n ${resetUrl}`;

    await sendEmail(email, 'Password Reset Request', message);
    res.status(200).json({ message: 'Email sent' });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.status(500).json({ message: 'Email error' });
  }
};

// @desc    Reset Password
exports.resetPassword = async (req, res) => {
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) return res.status(400).json({ message: 'Invalid token' });

  user.password = req.body.password; 
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(201).json({ message: 'Password updated' });
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
      
      // 3. Allow updating profile image
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
        profileImage: updatedUser.profileImage, // <--- Return updated image
        token: req.headers.authorization.split(' ')[1] 
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};