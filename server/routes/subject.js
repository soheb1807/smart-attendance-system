const router = require("express").Router();
const Subject = require("../models/Subject");
const User = require("../models/User");

// 1. GET STUDENTS BY STREAM (To show list for enrollment)
// Usage: /api/subjects/candidates?stream=MCA
router.get("/candidates", async (req, res) => {
  const streamQuery = req.query.stream;
  try {
    const students = await User.find({ 
      role: "student", 
      stream: streamQuery 
    });
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2. ENROLL STUDENT TO SUBJECT
router.put("/:subjectId/enroll", async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId);
    if (!subject.enrolledStudents.includes(req.body.studentId)) {
      
      // Push student ID to array
      await subject.updateOne({ $push: { enrolledStudents: req.body.studentId } });
      res.status(200).json("Student has been enrolled!");
      
    } else {
      res.status(403).json("Student is already enrolled in this subject");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// 3. REMOVE (DELETE) STUDENT FROM SUBJECT
router.put("/:subjectId/remove", async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId);
    if (subject.enrolledStudents.includes(req.body.studentId)) {
      
      // Pull student ID from array (Remove)
      await subject.updateOne({ $pull: { enrolledStudents: req.body.studentId } });
      res.status(200).json("Student has been removed from the class!");
      
    } else {
      res.status(403).json("Student is not in this class");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;