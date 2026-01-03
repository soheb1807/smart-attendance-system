const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  role: { 
    type: String, 
    enum: ['admin', 'teacher', 'student', 'parent'], 
    default: 'student' 
  },
  
  // 🔒 Hardware Security
  trustedDeviceId: { type: String }, 
  isApproved: { type: Boolean, default: false },
  
  approvedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },

  department: { type: String },

  stream: { 
    type: String, 
    enum: ['MCA', 'MBA'], 
    required: function() { return this.role === 'student'; }
  },
  
  rollNumber: { type: String },
  
  // 📧 IMPORTANT: This links the student to the parent
  parentEmail: { type: String },

  // 📸 NEW: Profile Image / Selfie Reference (Stores Cloudinary URL)
  profileImage: { 
    type: String, 
    default: "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg" 
  },

}, { timestamps: true });

// --- Encryption Middleware ---
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);