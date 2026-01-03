const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  
  status: { type: String, enum: ['Present', 'Absent'], default: 'Absent' },
  date: { type: Date, default: Date.now },

  // Hardware Binding: Prevents one phone from marking for multiple people
  deviceId: { type: String },

  // ✅ NEW FIELD: Stores the selfie proof taken during the scan
  capturedImage: { type: String } 
});

module.exports = mongoose.model('Attendance', attendanceSchema);