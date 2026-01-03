const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// --- IMPORTS FROM CONTROLLERS ---
const { 
  startSession, 
  markAttendance, 
  endSession, 
  getStudentStats, 
  getActiveSession,
  getSessionAttendance, 
  getCourseAttendanceStats,
  markManualAttendance
} = require('../controllers/attendanceController');

console.log("✅ Attendance Routes Loaded: Admin Access Enabled for Stats");

// --- 👨‍🏫 TEACHER ROUTES ---

// 1. Start Class (Generates Session ID) - Teachers Only
router.post('/start', protect, authorize('teacher'), startSession);

// 2. End Class (Calculates Stats & Emails Parents) - Teachers Only
router.post('/end', protect, authorize('teacher'), endSession);

// 3. View Live Session Status - Teachers Only
router.get('/active', protect, authorize('teacher'), getActiveSession);

// 4. Get Report for a Specific Session
// 🚀 UPDATE: Added 'admin' so Admins can view session details if needed
router.get('/session/:sessionId', protect, authorize('teacher', 'admin'), getSessionAttendance);

// 5. Get Overall Course Statistics (For Analytics Table)
// 🚀 FIX: Added 'admin' here to fix the 403 Error in Admin Dashboard
router.get('/course-stats/:courseId', protect, authorize('teacher', 'admin'), getCourseAttendanceStats);

// 6. Manual Attendance Marking (Overwrite) - Teachers Only
router.post('/manual', protect, authorize('teacher'), markManualAttendance);


// --- 🎓 STUDENT ROUTES ---

// 7. Mark Attendance (Checks: 🔒 Device ID + 📍 Geofencing + ⏳ 7-Sec Time Rotation)
router.post('/scan', protect, authorize('student'), markAttendance);

// 8. View My Own History
router.get('/my-stats', protect, authorize('student'), getStudentStats);


module.exports = router;