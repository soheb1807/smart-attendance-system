const User = require('../models/User');

// @desc    Get pending users based on role (INCLUDES IMAGES)
// @route   GET /api/users/pending
exports.getPendingUsers = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized (No User Found)" });
    }

    let queryRole;
    if (req.user.role === 'admin') {
      queryRole = 'teacher';
    } else if (req.user.role === 'teacher') {
      queryRole = 'student';
    } else {
      return res.status(403).json({ message: 'Not authorized to view pending users' });
    }

    // 🚀 .select('-password') ensures profileImage is INCLUDED
    const users = await User.find({ role: queryRole, isApproved: false })
      .select('-password') 
      .sort({ createdAt: -1 });
      
    res.json(users);
  } catch (error) {
    console.error("Get Pending Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🚀 NEW FUNCTION: Get ALL Approved Users (For Total Count & List)
// @route   GET /api/users/approved
exports.getApprovedUsers = async (req, res) => {
  try {
    let queryRole;
    if (req.user.role === 'admin') {
      queryRole = 'teacher';
    } else {
      queryRole = 'student';
    }

    // Fetch all approved users with their images
    const users = await User.find({ role: queryRole, isApproved: true })
      .select('-password') // Includes name, email, profileImage, etc.
      .sort({ name: 1 }); // Alphabetical order

    res.json(users);
  } catch (error) {
    console.error("Get Approved Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve a user AND Auto-Create/Approve Parent Account
// @route   PUT /api/users/approve/:id
exports.approveUser = async (req, res) => {
  try {
    const userToApprove = await User.findById(req.params.id);

    if (!userToApprove) return res.status(404).json({ message: 'User not found' });

    // --- STRICT PERMISSION CHECKS ---
    if (req.user.role === 'admin' && userToApprove.role !== 'teacher') {
      return res.status(400).json({ message: 'Admins can only approve Teachers' });
    }
    if (req.user.role === 'teacher' && userToApprove.role !== 'student') {
      return res.status(400).json({ message: 'Teachers can only approve Students' });
    }

    // --- APPROVAL LOGIC ---
    userToApprove.isApproved = true;
    userToApprove.approvedBy = req.user._id;

    // UPDATE STREAM (Only for Students)
    if (userToApprove.role === 'student') {
      if (req.body.stream) {
        userToApprove.stream = req.body.stream;
      } else if (!userToApprove.stream) {
        userToApprove.stream = 'MCA'; 
      }
    }

    await userToApprove.save();

    // 🚀 --- AUTO-CREATE/APPROVE PARENT ACCOUNT ---
    if (userToApprove.role === 'student' && userToApprove.parentEmail) {
      const parentExists = await User.findOne({ email: userToApprove.parentEmail });

      if (!parentExists) {
        await User.create({
          name: `Parent of ${userToApprove.name}`,
          email: userToApprove.parentEmail,
          password: userToApprove.password, // Syncs password
          role: 'parent',
          isApproved: true, // AUTO-APPROVED
          approvedBy: req.user._id
        });
        console.log(`👨‍👩‍👦 Parent account auto-created: ${userToApprove.parentEmail}`);
      } else {
        parentExists.isApproved = true;
        await parentExists.save();
      }
    }

    res.json({ 
      message: `User ${userToApprove.name} approved. Parent account is also active.` 
    });
    
  } catch (error) {
    console.error("APPROVAL ERROR DETAILS:", error); 
    res.status(500).json({ message: error.message });
  }
};