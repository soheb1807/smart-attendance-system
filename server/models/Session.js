const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  active: { type: Boolean, default: true }, // Is the QR code currently scannable?
  
  // --- NEW: Location Security Fields ---
  location: {
    latitude: { type: Number, required: true },  // Teacher's GPS Lat
    longitude: { type: Number, required: true }  // Teacher's GPS Long
  },
  radius: { type: Number, default: 50 }, // Max distance allowed (in meters)
  // -------------------------------------

  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);  