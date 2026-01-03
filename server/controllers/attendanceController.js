// const Session = require('../models/Session');
// const Attendance = require('../models/Attendance');
// const Course = require('../models/Course');
// const User = require('../models/User');
// const { sendEmail } = require('../utils/emailService');

// // --- HELPER: Calculate Distance (Haversine Formula) ---
// function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
//   const R = 6371e3; // Radius of Earth in meters
//   const dLat = (lat2 - lat1) * (Math.PI / 180);
//   const dLon = (lon2 - lon1) * (Math.PI / 180);
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
//     Math.sin(dLon / 2) * Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c; 
// }

// // 1. START CLASS (Teacher)
// exports.startSession = async (req, res) => {
//   const { courseId, latitude, longitude, radius } = req.body;

//   if (!latitude || !longitude) {
//     return res.status(400).json({ message: "GPS Location is required." });
//   }

//   try {
//     // End any other active sessions for this course
//     await Session.updateMany({ course: courseId, active: true }, { active: false });

//     const session = await Session.create({
//       course: courseId,
//       teacher: req.user._id,
//       active: true,
//       location: { latitude, longitude },
//       // 🚀 FINAL FIX: Radius set to 600km (600,000 meters)
//       // This ensures Laptop ISP vs Mobile GPS distance is ignored.
//       radius: 600000 
//     });
    
//     res.status(201).json(session);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // 2. SCAN QR CODE (Student) - SECURE 🔒 + 📸 SELFIE
// exports.markAttendance = async (req, res) => {
//   try {
//     const { sessionId, latitude, longitude, deviceId, timestamp, capturedImage } = req.body; 

//     if (!sessionId || !latitude || !longitude || !timestamp) {
//       return res.status(400).json({ message: "Invalid Data" });
//     }

//     // ⏳ TIME FIX: 90 Seconds Window (Allows AI + Slow Internet)
//     const currentTime = Date.now();
//     const qrTime = parseInt(timestamp);
    
//     if (currentTime - qrTime > 90000) { 
//         return res.status(400).json({ message: "⚠️ QR Code Expired! Please scan faster." });
//     }

//     const session = await Session.findById(sessionId).populate('course');
//     if (!session || !session.active) return res.status(400).json({ message: 'Session inactive' });

//     // 🔒 Enrollment Check 
//     const isEnrolled = session.course.students.some(id => id.toString() === req.user._id.toString());
//     if (!isEnrolled) return res.status(403).json({ message: "⛔ Access Denied: You are not in this course!" });

//     // 🚫 Device Check (Proxy Prevention)
//     if (deviceId) {
//       const deviceUsage = await Attendance.findOne({ session: sessionId, deviceId });
//       if (deviceUsage && deviceUsage.student.toString() !== req.user._id.toString()) {
//          return res.status(403).json({ message: "🚫 Device already used by another student!" });
//       }
//     }

//     // 📍 DISTANCE FIX: Hardcoded 600km Limit
//     const distance = getDistanceFromLatLonInM(
//       session.location.latitude, session.location.longitude, 
//       latitude, longitude
//     );

//     // We check against the stored radius OR force 600km if something is wrong
//     // This allows attendance even if the teacher is in "Mumbai" (ISP) and student in "Nipani" (GPS)
//     if (distance > (session.radius || 600000)) {
//       return res.status(403).json({ message: `Too far! (${Math.round(distance)}m).` });
//     }

//     const existing = await Attendance.findOne({ session: sessionId, student: req.user._id });
//     if (existing) return res.status(400).json({ message: 'Attendance already marked' });

//     // ✅ SAVE ATTENDANCE + SELFIE
//     await Attendance.create({
//       session: sessionId, 
//       student: req.user._id, 
//       course: session.course._id,
//       status: 'Present', 
//       deviceId: deviceId, 
//       date: new Date(),
//       capturedImage: capturedImage || "" 
//     });

//     res.json({ message: 'Attendance marked successfully ✅' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // 3. END CLASS & AUTO-NOTIFY PARENTS
// exports.endSession = async (req, res) => {
//   const { sessionId } = req.body;
//   try {
//     const session = await Session.findById(sessionId).populate('course');
//     if (!session) return res.status(404).json({ message: "Session not found" });

//     session.active = false;
//     await session.save();

//     const course = await Course.findById(session.course).populate({
//       path: 'students',
//       select: 'name email parentEmail' 
//     });

//     const presentRecords = await Attendance.find({ session: sessionId });
//     const presentIds = presentRecords.map(a => a.student.toString());

//     for (const student of course.students) {
//       const isPresent = presentIds.includes(student._id.toString());
      
//       if (!isPresent) {
//         await Attendance.create({
//           session: sessionId, student: student._id, course: session.course._id,
//           status: 'Absent', date: new Date()
//         });
//       }

//       const allHistory = await Attendance.find({ student: student._id, course: session.course._id });
//       const totalClasses = allHistory.length;
//       const totalPresent = allHistory.filter(r => r.status === 'Present').length;
//       const percentage = totalClasses > 0 ? ((totalPresent / totalClasses) * 100).toFixed(1) : 0;

//       if (student.parentEmail) {
//         const subject = `${isPresent ? '✅ Present' : '❌ Absent'} Alert: ${student.name}`;
//         const emailBody = `
//           Student: ${student.name}
//           Class: ${session.course.name}
//           Status: ${isPresent ? 'PRESENT' : 'ABSENT'}
//           Current Attendance: ${percentage}%
//         `;
//         await sendEmail(student.parentEmail, subject, "", emailBody);
//       }
//     }
//     res.json({ message: 'Session ended & Parents notified.' });
//   } catch (error) { 
//     res.status(500).json({ message: error.message }); 
//   }
// };

// // 4. GET STUDENT STATISTICS
// exports.getStudentStats = async (req, res) => {
//   try {
//     const attendance = await Attendance.find({ student: req.user._id }).populate('course', 'name code');
//     const stats = {};
//     attendance.forEach(record => {
//       if (!record.course) return;
//       const courseId = record.course._id.toString();
//       if (!stats[courseId]) {
//         stats[courseId] = { 
//             name: record.course.name, 
//             code: record.course.code, 
//             total: 0, present: 0, absent: 0 
//         };
//       }
//       stats[courseId].total++;
//       if (record.status === 'Present') stats[courseId].present++;
//       else stats[courseId].absent++;
//     });

//     const result = Object.keys(stats).map(key => ({
//       ...stats[key],
//       percentage: ((stats[key].present / stats[key].total) * 100).toFixed(2)
//     }));
//     res.json(result);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // 5. GET ACTIVE SESSION
// exports.getActiveSession = async (req, res) => {
//   try {
//     const activeSession = await Session.findOne({ teacher: req.user._id, active: true }).populate('course', 'name');
//     if (activeSession) res.json(activeSession);
//     else res.status(204).send(); 
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // 6. GET SESSION REPORT (With Selfies for Teacher Audit)
// exports.getSessionAttendance = async (req, res) => {
//   try {
//     const { sessionId } = req.params;
//     const records = await Attendance.find({ session: sessionId }).populate('student', 'name rollNumber email profileImage');
//     res.json(records);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // 7. GET COURSE STATS (With Images)
// exports.getCourseAttendanceStats = async (req, res) => {
//   const { courseId } = req.params;
//   try {
//     const course = await Course.findById(courseId).populate('students', 'name rollNumber email parentEmail profileImage');
//     if (!course) return res.status(404).json({ message: "Course not found" });
    
//     const totalSessions = await Session.countDocuments({ course: courseId });
//     const attendanceRecords = await Attendance.find({ course: courseId });

//     const stats = course.students.map(student => {
//       const presentCount = attendanceRecords.filter(r => r.student.toString() === student._id.toString() && r.status === 'Present').length;
//       return {
//         _id: student._id,
//         name: student.name,
//         rollNumber: student.rollNumber,
//         parentEmail: student.parentEmail,
//         profileImage: student.profileImage, 
//         totalClasses: totalSessions,
//         present: presentCount,
//         percentage: totalSessions === 0 ? 0 : ((presentCount / totalSessions) * 100).toFixed(1)
//       };
//     });
//     res.json(stats);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // 8. MANUAL ATTENDANCE
// exports.markManualAttendance = async (req, res) => {
//   const { studentId, courseId, status } = req.body; 
//   try {
//     let session = await Session.findOne({ course: courseId, active: true });
//     if (!session) return res.status(400).json({ message: "No active class." });

//     const existing = await Attendance.findOne({ session: session._id, student: studentId });
//     if (existing) {
//       existing.status = status || 'Present';
//       await existing.save();
//     } else {
//       await Attendance.create({
//         session: session._id, student: studentId, course: courseId,
//         status: status || 'Present', date: new Date()
//       });
//     }
//     res.json({ message: `Student marked as ${status || 'Present'}` });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');

// --- HELPER: Calculate Distance (Haversine Formula) ---
function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius of Earth in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

// 1. START CLASS (Teacher)
exports.startSession = async (req, res) => {
  const { courseId, latitude, longitude, radius } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ message: "GPS Location is required." });
  }

  try {
    // End any other active sessions for this course
    await Session.updateMany({ course: courseId, active: true }, { active: false });

    const session = await Session.create({
      course: courseId,
      teacher: req.user._id,
      active: true,
      location: { latitude, longitude },
      // 🎯 STRICT MODE: 20 Meters Radius
      radius: radius || 20 
    });
    
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. SCAN QR CODE (Student)
exports.markAttendance = async (req, res) => {
  try {
    const { sessionId, latitude, longitude, deviceId, timestamp, capturedImage } = req.body; 

    if (!sessionId || !latitude || !longitude || !timestamp) {
      return res.status(400).json({ message: "Invalid Data" });
    }

    // ⏳ 90 Seconds Time Window
    const currentTime = Date.now();
    const qrTime = parseInt(timestamp);
    if (currentTime - qrTime > 90000) { 
        return res.status(400).json({ message: "⚠️ QR Code Expired! Please scan faster." });
    }

    const session = await Session.findById(sessionId).populate('course');
    if (!session || !session.active) return res.status(400).json({ message: 'Session inactive' });

    const isEnrolled = session.course.students.some(id => id.toString() === req.user._id.toString());
    if (!isEnrolled) return res.status(403).json({ message: "⛔ Access Denied: You are not in this course!" });

    if (deviceId) {
      const deviceUsage = await Attendance.findOne({ session: sessionId, deviceId });
      if (deviceUsage && deviceUsage.student.toString() !== req.user._id.toString()) {
         return res.status(403).json({ message: "🚫 Device already used by another student!" });
      }
    }

    const distance = getDistanceFromLatLonInM(
      session.location.latitude, session.location.longitude, 
      latitude, longitude
    );

    if (distance > (session.radius || 20)) {
      return res.status(403).json({ 
        message: `Too far! You are ${Math.round(distance)}m away. Max allowed: ${session.radius || 20}m.` 
      });
    }

    const existing = await Attendance.findOne({ session: sessionId, student: req.user._id });
    if (existing) return res.status(400).json({ message: 'Attendance already marked' });

    await Attendance.create({
      session: sessionId, 
      student: req.user._id, 
      course: session.course._id,
      status: 'Present', 
      deviceId: deviceId, 
      date: new Date(),
      capturedImage: capturedImage || "" 
    });

    res.json({ message: 'Attendance marked successfully ✅' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. END CLASS & AUTO-NOTIFY PARENTS (🚀 UPDATED EMAIL TEMPLATE)
exports.endSession = async (req, res) => {
  const { sessionId } = req.body;
  try {
    const session = await Session.findById(sessionId).populate('course');
    if (!session) return res.status(404).json({ message: "Session not found" });

    session.active = false;
    await session.save();

    const course = await Course.findById(session.course).populate({
      path: 'students',
      select: 'name email parentEmail' 
    });

    const presentRecords = await Attendance.find({ session: sessionId });
    const presentIds = presentRecords.map(a => a.student.toString());
    
    // Get formatted date/time
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    const classDate = new Date().toLocaleDateString('en-US', dateOptions);
    const classTime = new Date().toLocaleTimeString('en-US', timeOptions);

    for (const student of course.students) {
      const isPresent = presentIds.includes(student._id.toString());
      
      if (!isPresent) {
        await Attendance.create({
          session: sessionId, student: student._id, course: session.course._id,
          status: 'Absent', date: new Date()
        });
      }

      const allHistory = await Attendance.find({ student: student._id, course: session.course._id });
      const totalClasses = allHistory.length;
      const totalPresent = allHistory.filter(r => r.status === 'Present').length;
      const percentage = totalClasses > 0 ? ((totalPresent / totalClasses) * 100).toFixed(1) : 0;
      
      // Determine Color & Status Text
      const statusColor = isPresent ? "#22c55e" : "#ef4444"; // Green or Red
      const statusText = isPresent ? "PRESENT" : "ABSENT";
      const progressColor = percentage >= 75 ? "#22c55e" : (percentage >= 50 ? "#eab308" : "#ef4444");

      if (student.parentEmail) {
        const subject = `${isPresent ? '✅' : '❌'} Attendance Alert: ${student.name}`;
        
        // 📧 PROFESSIONAL EMAIL HTML
        const emailBody = `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
            
            <div style="background-color: #1e293b; padding: 20px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 1px;">🎓 Attendance Notification</h2>
            </div>

            <div style="padding: 30px 20px;">
              <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 0;">Daily report for <strong>${student.name}</strong></p>
              
              <div style="text-align: center; margin: 25px 0;">
                <span style="background-color: ${statusColor}; color: white; padding: 12px 30px; border-radius: 50px; font-weight: bold; font-size: 18px; letter-spacing: 1px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  ${statusText}
                </span>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-top: 30px; font-size: 14px;">
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 12px 0; color: #6b7280;">Subject</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #1f2937;">${session.course.name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 12px 0; color: #6b7280;">Date</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #1f2937;">${classDate}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 12px 0; color: #6b7280;">Time</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #1f2937;">${classTime}</td>
                </tr>
              </table>

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 10px; margin-top: 25px; border: 1px solid #e5e7eb;">
                <p style="margin: 0 0 10px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold;">Course Overview</p>
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 5px;">
                  <span style="font-size: 24px; font-weight: bold; color: #1f2937;">${percentage}%</span>
                  <span style="font-size: 14px; color: #6b7280;">(${totalPresent} / ${totalClasses} classes)</span>
                </div>
                
                <div style="width: 100%; height: 8px; background-color: #e5e7eb; border-radius: 4px; overflow: hidden;">
                  <div style="width: ${percentage}%; height: 100%; background-color: ${progressColor};"></div>
                </div>
                
                <p style="margin: 10px 0 0 0; font-size: 12px; color: ${percentage < 75 ? '#ef4444' : '#22c55e'};">
                  ${percentage < 75 ? "⚠️ Attendance is below 75%. Please improve." : "✅ Good attendance record."}
                </p>
              </div>

            </div>

            <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                This is an automated message from the Smart Attendance System.<br/>
                Please do not reply to this email.
              </p>
            </div>
          </div>
        `;

        await sendEmail(student.parentEmail, subject, "", emailBody);
      }
    }
    res.json({ message: 'Session ended & Parents notified.' });
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

// ... (Rest of functions 4, 5, 6, 7, 8 remain unchanged) ...
exports.getStudentStats = async (req, res) => {
  try {
    const attendance = await Attendance.find({ student: req.user._id }).populate('course', 'name code');
    const stats = {};
    attendance.forEach(record => {
      if (!record.course) return;
      const courseId = record.course._id.toString();
      if (!stats[courseId]) {
        stats[courseId] = { name: record.course.name, code: record.course.code, total: 0, present: 0, absent: 0 };
      }
      stats[courseId].total++;
      if (record.status === 'Present') stats[courseId].present++;
      else stats[courseId].absent++;
    });

    const result = Object.keys(stats).map(key => ({
      ...stats[key],
      percentage: ((stats[key].present / stats[key].total) * 100).toFixed(2)
    }));
    res.json(result);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getActiveSession = async (req, res) => {
  try {
    const activeSession = await Session.findOne({ teacher: req.user._id, active: true }).populate('course', 'name');
    if (activeSession) res.json(activeSession);
    else res.status(204).send(); 
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getSessionAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const records = await Attendance.find({ session: sessionId }).populate('student', 'name rollNumber email profileImage');
    res.json(records);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getCourseAttendanceStats = async (req, res) => {
  const { courseId } = req.params;
  try {
    const course = await Course.findById(courseId).populate('students', 'name rollNumber email parentEmail profileImage');
    if (!course) return res.status(404).json({ message: "Course not found" });
    const totalSessions = await Session.countDocuments({ course: courseId });
    const attendanceRecords = await Attendance.find({ course: courseId });

    const stats = course.students.map(student => {
      const presentCount = attendanceRecords.filter(r => r.student.toString() === student._id.toString() && r.status === 'Present').length;
      return {
        _id: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        parentEmail: student.parentEmail,
        profileImage: student.profileImage, 
        totalClasses: totalSessions,
        present: presentCount,
        percentage: totalSessions === 0 ? 0 : ((presentCount / totalSessions) * 100).toFixed(1)
      };
    });
    res.json(stats);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.markManualAttendance = async (req, res) => {
  const { studentId, courseId, status } = req.body; 
  try {
    let session = await Session.findOne({ course: courseId, active: true });
    if (!session) return res.status(400).json({ message: "No active class." });
    const existing = await Attendance.findOne({ session: session._id, student: studentId });
    if (existing) {
      existing.status = status || 'Present';
      await existing.save();
    } else {
      await Attendance.create({
        session: session._id, student: studentId, course: courseId,
        status: status || 'Present', date: new Date()
      });
    }
    res.json({ message: `Student marked as ${status || 'Present'}` });
  } catch (error) { res.status(500).json({ message: error.message }); }
};