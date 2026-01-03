const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  }, 
  code: { 
    type: String, 
    required: true, 
    unique: true 
  },
  
  // 👇 ADD THIS MISSING PART 👇
  stream: { 
    type: String, 
    required: true,
    enum: ['MCA', 'MBA'], 
    default: 'MCA' 
  },
  // ---------------------------

  teacher: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  students: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }] 
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);