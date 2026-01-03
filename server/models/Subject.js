const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema({
  subjectName: {
    type: String,
    required: true,
  },
  streamName: {
    type: String,
    required: true, // e.g., "MCA" or "MBA" - helps filter subjects
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Links to the Teacher who owns this subject
    required: true,
  },
  // This array stores the IDs of all enrolled students
  enrolledStudents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model("Subject", SubjectSchema);