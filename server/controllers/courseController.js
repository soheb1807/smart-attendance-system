const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Create a Course (Subject) & AUTO-ENROLL Students by Stream
// @route   POST /api/courses
exports.createCourse = async (req, res) => {
  try {
    const { name, code, stream } = req.body; 
    
    // Find ALL approved students belonging to this stream
    const studentsInStream = await User.find({ 
      role: 'student', 
      stream: stream, 
      isApproved: true 
    }).select('_id');

    const studentIds = studentsInStream.map(student => student._id);

    const course = await Course.create({
      name,
      code,
      stream, 
      teacher: req.user._id,
      students: studentIds 
    });
    
    res.status(201).json({ 
      message: `Course created successfully! Auto-enrolled ${studentIds.length} ${stream} students.`,
      course 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a Course
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (course.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to delete this course' });
    }

    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove Student from Course Manually
exports.removeStudent = async (req, res) => {
  const { courseId, studentId } = req.body;
  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (course.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Course.findByIdAndUpdate(courseId, { $pull: { students: studentId } });
    res.json({ message: 'Student removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Teacher's Courses
exports.getMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({ teacher: req.user._id })
      // 🚀 UPDATED: Added profileImage to population
      .populate('students', 'name email rollNumber stream parentEmail profileImage'); 
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get All Courses (Admin View)
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('teacher', 'name email')
      // 🚀 UPDATED: Added profileImage to population
      .populate('students', 'name email rollNumber parentEmail profileImage');
      
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Students available for Enrollment (Powers Directory Tab)
exports.getCandidates = async (req, res) => {
  try {
    const { stream } = req.query; 
    
    // 🚀 FIX: Explicitly added 'profileImage' to the select string
    const students = await User.find({ 
      role: 'student', 
      stream: stream, 
      isApproved: true 
    }).select('name email rollNumber stream parentEmail profileImage'); 

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Enroll Student Manually
exports.enrollStudent = async (req, res) => {
  const { courseId, studentId } = req.body; 
  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (course.students.includes(studentId)) {
      return res.status(400).json({ message: 'Student is already enrolled' });
    }

    course.students.push(studentId);
    await course.save();
    res.json({ message: 'Student enrolled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};