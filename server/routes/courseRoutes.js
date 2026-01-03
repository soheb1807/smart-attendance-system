const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// Import all functions
const { 
  createCourse, 
  enrollStudent, 
  removeStudent, 
  getCandidates, 
  getMyCourses, 
  getAllCourses, 
  deleteCourse
} = require('../controllers/courseController');

console.log("✅ Course Routes Loaded: Access Control Synchronized");

// --- SHARED ROUTES (Teacher & Admin) ---

// 1. Get list of students filtered by stream (Used by both Teacher & Admin Directory)
// 🚀 FIX: Added 'admin' to authorization to stop the 403 error
router.get('/candidates', protect, authorize('teacher', 'admin'), getCandidates);

// 2. Delete a Course (Both can delete)
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteCourse);


// --- TEACHER ROUTES ---

// 3. Create a new Course
router.post('/', protect, authorize('teacher'), createCourse);

// 4. Enroll a student into a course manually
router.post('/enroll', protect, authorize('teacher'), enrollStudent);

// 5. Manually remove a student from a course
router.put('/remove', protect, authorize('teacher'), removeStudent);

// 6. Get all courses created by the logged-in teacher
router.get('/', protect, authorize('teacher'), getMyCourses);


// --- ADMIN EXCLUSIVE ROUTES ---

// 7. View every course in the system (Master List)
router.get('/all', protect, authorize('admin'), getAllCourses);


module.exports = router;