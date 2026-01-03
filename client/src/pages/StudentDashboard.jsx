import { useState, useEffect, useContext, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import API from '../api';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import * as faceapi from 'face-api.js'; 
import { 
  LayoutDashboard, QrCode, BookOpen, User, LogOut, 
  CheckCircle, AlertTriangle, Camera, X, Save, Lock, Smartphone, MapPin, Brain, Loader
} from 'lucide-react';

// --- 📉 HELPER: COMPRESS IMAGE (SPEED FIX) ---
const compressImage = (file, maxWidth = 600) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const ratio = maxWidth / img.width;
                canvas.width = maxWidth;
                canvas.height = img.height * ratio;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    resolve(new File([blob], "compressed.jpg", { type: "image/jpeg" }));
                }, 'image/jpeg', 0.7); // 70% Quality
            };
        };
    });
};

const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');

  // 🚀 GLOBAL STATE FOR AI MODELS
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // 🚀 LOAD MODELS IN BACKGROUND IMMEDIATELY
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models'; 
        console.log("🧠 Starting AI Model Load...");
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setModelsLoaded(true);
        console.log("✅ AI Models Loaded Successfully");
      } catch (err) {
        console.error("❌ AI Model Load Failed:", err);
        toast.error("AI functionality limited (Check internet)");
      }
    };
    loadModels();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardHome user={user} />;
      case 'scan': return <ScanPanel user={user} modelsLoaded={modelsLoaded} />;
      case 'courses': return <MyCoursesPanel />;
      case 'profile': return <StudentProfile user={user} />;
      default: return <DashboardHome user={user} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* SIDEBAR */}
      <div className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-700 text-center">
            <div className="flex justify-center mb-3">
                <img 
                  src={user?.profileImage || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full border-4 border-indigo-500 object-cover shadow-lg"
                />
            </div>
            <h1 className="text-xl font-bold text-white">{user?.name || 'Student'}</h1>
            <p className="text-xs text-indigo-400 font-mono mt-1">{user?.rollNumber || 'N/A'}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Overview" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={<QrCode size={20} />} label="Scan Attendance" active={activeTab === 'scan'} onClick={() => setActiveTab('scan')} />
          <SidebarItem icon={<BookOpen size={20} />} label="My Courses" active={activeTab === 'courses'} onClick={() => setActiveTab('courses')} />
          <SidebarItem icon={<User size={20} />} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-2 text-red-400 hover:bg-slate-800 rounded transition">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* MOBILE HEADER */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 text-white flex justify-around p-3 z-50 shadow-2xl">
          <button onClick={() => setActiveTab('dashboard')} className={`p-2 rounded ${activeTab === 'dashboard' ? 'bg-indigo-600' : ''}`}><LayoutDashboard/></button>
          <button onClick={() => setActiveTab('scan')} className={`p-2 rounded ${activeTab === 'scan' ? 'bg-indigo-600' : ''}`}><QrCode/></button>
          <button onClick={() => setActiveTab('courses')} className={`p-2 rounded ${activeTab === 'courses' ? 'bg-indigo-600' : ''}`}><BookOpen/></button>
          <button onClick={() => setActiveTab('profile')} className={`p-2 rounded ${activeTab === 'profile' ? 'bg-indigo-600' : ''}`}><User/></button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-auto p-4 md:p-8 mb-16 md:mb-0">
        {renderContent()}
      </div>
    </div>
  );
};

// --- HELPER COMPONENTS ---
const SidebarItem = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition ${active ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
  >
    {icon} <span className="font-medium">{label}</span>
  </button>
);

// ----------------------------------------------------------------------
// 1. DASHBOARD HOME
// ----------------------------------------------------------------------
const DashboardHome = ({ user }) => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await API.get('/attendance/my-stats');
        if (Array.isArray(data)) setStats(data);
        else setStats([]);
      } catch (err) {
        console.error(err);
        setStats([]);
      } finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  let totalClasses = 0;
  let totalPresent = 0;

  stats.forEach(sub => {
    totalClasses += (Number(sub.present) || 0) + (Number(sub.absent) || 0);
    totalPresent += (Number(sub.present) || 0);
  });

  const overallPercentage = totalClasses === 0 ? 0 : Math.round((totalPresent / totalClasses) * 100);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500 shadow-md md:hidden">
            <img src={user?.profileImage || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"} alt="Profile" className="w-full h-full object-cover"/>
        </div>
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Hello, {user?.name?.split(' ')[0] || 'Student'}! 👋</h2>
            <p className="text-slate-500 text-sm">Here is your attendance overview.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 flex flex-col justify-between">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Overall Attendance</p>
          <p className={`text-5xl font-black mt-2 ${overallPercentage < 75 ? 'text-red-500' : 'text-green-600'}`}>
            {overallPercentage}%
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Classes Attended</p>
          <p className="text-5xl font-black mt-2 text-slate-800">{totalPresent}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Enrolled Subjects</p>
          <p className="text-5xl font-black mt-2 text-slate-800">{stats.length}</p>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><BookOpen size={20} className="text-indigo-600"/> Subject Breakdown</h3>
      {loading ? <p>Loading stats...</p> : stats.length === 0 ? <p className="text-gray-500 p-8 bg-white rounded-xl border border-dashed text-center">No attendance records found yet.</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((sub, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition border border-gray-50">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-bold text-lg text-slate-800 leading-tight">{sub.name || "Unknown Course"}</h4>
                <span className={`px-2 py-1 rounded-md text-xs font-black ${sub.percentage < 75 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {sub.percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                <div 
                  className={`h-2 rounded-full ${sub.percentage < 75 ? 'bg-red-500' : 'bg-green-500'}`} 
                  style={{ width: `${sub.percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 uppercase font-bold tracking-wider">
                <span>✅ Present: <b className="text-slate-800 ml-1">{sub.present}</b></span>
                <span>❌ Absent: <b className="text-slate-800 ml-1">{sub.absent}</b></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------
// 2. SCAN PANEL (AI FACE RECOGNITION + GPS + QR)
// ----------------------------------------------------------------------
const ScanPanel = ({ user, modelsLoaded }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [aiStatus, setAiStatus] = useState('');
  const scannerRef = useRef(null); 

  useEffect(() => {
    // Check Secure Context
    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
        setCameraError("⚠️ GPS BLOCKED: Use HTTPS/Ngrok.");
    }
    return () => { if (scannerRef.current) scannerRef.current.clear().catch(console.warn); };
  }, []);

  const startScanning = () => {
    if (!modelsLoaded) return toast("⏳ AI Models loading... please wait 10s", { icon: "🧠" });
    
    setCameraError('');
    setIsScanning(true);

    setTimeout(() => {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      html5QrCode.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        async (decodedText) => {
          // 🛑 PAUSE SCANNING
          await html5QrCode.stop();
          setIsScanning(false);
          scannerRef.current.clear();
          
          // 🏁 START AI VERIFICATION
          verifyFaceAndAttendance(decodedText);
        },
        (errorMessage) => { }
      ).catch((err) => {
        setIsScanning(false);
        setCameraError("🚫 Camera blocked. Check permissions.");
        toast.error("Camera failed.");
      });
    }, 300);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        scannerRef.current.clear();
        setIsScanning(false);
      }).catch(err => console.warn(err));
    } else setIsScanning(false);
  };

  // ☁️ HELPER: Upload Proof to Cloudinary
  const uploadProof = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "blyk4zvv"); 
    data.append("cloud_name", "dy9p4ifpj"); 

    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/dy9p4ifpj/image/upload", {
        method: "POST", body: data
      });
      const result = await res.json();
      return result.secure_url;
    } catch (error) {
      console.error("Upload Failed", error);
      return null;
    }
  };

  // 🤖 AI LOGIC + ATTENDANCE MARKING
  const verifyFaceAndAttendance = async (qrData) => {
    try {
      // A. CAPTURE IMAGE
      setAiStatus("📸 Capturing Proof...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      const videoTrack = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(videoTrack);
      const blob = await imageCapture.takePhoto();
      
      // 🚀 COMPRESS IMAGE (Speed Boost)
      const compressedFile = await compressImage(blob, 600);
      
      // B. AI FACE CHECK
      if (user?.profileImage) {
        setAiStatus("🤖 Comparing Faces...");
        
        // Load Live Image
        const liveImg = await faceapi.bufferToImage(blob);
        const liveDetect = await faceapi.detectSingleFace(liveImg).withFaceLandmarks().withFaceDescriptor();

        // Load Profile Image (Cached)
        const profileImg = await faceapi.fetchImage(user.profileImage);
        const profileDetect = await faceapi.detectSingleFace(profileImg).withFaceLandmarks().withFaceDescriptor();

        if (liveDetect && profileDetect) {
           const distance = faceapi.euclideanDistance(profileDetect.descriptor, liveDetect.descriptor);
           console.log("AI Score:", distance);
           
           if (distance > 0.6) { 
             videoTrack.stop();
             setAiStatus("⛔ FACE MISMATCH");
             return toast.error("Identity Verification Failed! Face does not match.");
           }
        } else {
           console.warn("Face not detected clearly. Proceeding with warning.");
           toast('⚠️ AI Warning: Face unclear, but logging.', { icon: '⚠️' });
        }
      }
      
      videoTrack.stop(); // Stop camera

      // C. UPLOAD PROOF
      setAiStatus("☁️ Uploading Proof...");
      const proofUrl = await uploadProof(compressedFile);

      // D. GPS & BACKEND
      handleBackendSubmission(qrData, proofUrl);

    } catch (err) {
      console.error("AI Error:", err);
      toast.error("AI Verification Error. Retrying fallback...");
      handleBackendSubmission(qrData, null); // Fallback
    }
  };

  const handleBackendSubmission = (qrData, proofUrl) => {
    setAiStatus("🛰️ Checking Location...");
    try {
      const parsedData = JSON.parse(qrData);
      
      if (!navigator.geolocation) return toast.error("Geolocation required");

      const gpsOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await API.post('/attendance/scan', {
              sessionId: parsedData.sessionId,
              timestamp: parsedData.timestamp,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              capturedImage: proofUrl // Send the proof
            });
            setAiStatus("");
            toast.success("Attendance Marked Successfully! ✅");
          } catch (err) {
            setAiStatus("");
            toast.error(err.response?.data?.message || "Attendance Failed");
          }
        },
        (error) => {
          setAiStatus("");
          toast.error("GPS Location Failed. Move to open area.");
        },
        gpsOptions
      );
    } catch (e) { setAiStatus(""); toast.error("Invalid QR Data"); }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 animate-fade-in">
      <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-md text-center border-t-8 border-indigo-600">
        <h2 className="text-2xl font-black mb-1 text-slate-800 uppercase tracking-tighter">Secure Scanner</h2>
        <p className="text-xs text-slate-400 mb-6 font-bold uppercase tracking-widest">AI Face • GPS • Time Locked</p>

        {/* 🚀 AI LOADING STATUS */}
        {!modelsLoaded && (
            <div className="bg-orange-50 text-orange-700 p-3 rounded-xl mb-4 text-xs font-bold flex items-center justify-center gap-2 animate-pulse border border-orange-200">
                <Loader className="animate-spin" size={14}/> AI Models Loading... Please wait.
            </div>
        )}

        {aiStatus && (
            <div className="bg-indigo-50 text-indigo-700 p-3 rounded-xl mb-4 font-bold animate-pulse text-sm border border-indigo-200">
                {aiStatus}
            </div>
        )}

        {cameraError && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-xs font-bold border border-red-200">{cameraError}</div>}
        
        <div className="relative w-full mb-6 bg-black rounded-2xl overflow-hidden border-4 border-slate-200 shadow-inner">
           {isScanning ? (
              <div id="reader" style={{ width: '100%' }}></div>
           ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-100">
                 <Camera size={48} className="mb-2 opacity-50"/>
                 <p className="text-xs font-bold uppercase tracking-widest">Camera Inactive</p>
              </div>
           )}
        </div>

        {!isScanning ? (
          <button 
            onClick={startScanning} 
            disabled={!modelsLoaded}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition shadow-lg flex items-center justify-center gap-2 transform active:scale-95 ${!modelsLoaded ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            {modelsLoaded ? <><Camera size={18} /> Open AI Scanner</> : "Loading AI..."}
          </button>
        ) : (
          <button onClick={stopScanner} className="w-full bg-red-100 text-red-600 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-200 transition flex items-center justify-center gap-2 transform active:scale-95">
            <X size={18} /> Stop Scanner
          </button>
        )}
        
        <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
           <span className={`flex items-center gap-1 ${modelsLoaded ? 'text-green-500' : 'text-orange-400'}`}><Brain size={14}/> {modelsLoaded ? "AI Ready" : "Loading..."}</span>
           <span className="flex items-center gap-1"><MapPin size={14}/> GPS Ready</span>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 3. MY COURSES PANEL
// ----------------------------------------------------------------------
const MyCoursesPanel = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await API.get('/attendance/my-stats');
        if (Array.isArray(data)) setCourses(data);
        else setCourses([]);
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchCourses();
  }, []);

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">My Enrolled Courses</h2>
      {loading ? <p>Loading...</p> : courses.length === 0 ? (
        <p className="text-gray-500 italic">No courses enrolled.</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b text-gray-400 font-black uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4 text-center">Classes</th>
                <th className="px-6 py-4 text-center">Attended</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {courses.map((c, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-slate-700">{c.name || "Unknown"}</td>
                  <td className="px-6 py-4 text-center font-medium text-slate-500">{c.present + c.absent}</td>
                  <td className="px-6 py-4 text-center text-green-600 font-bold">{c.present}</td>
                  <td className="px-6 py-4 text-center">
                    {c.percentage < 75 ? (
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 uppercase tracking-wider">
                        <AlertTriangle size={10}/> Low
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 uppercase tracking-wider">
                        <CheckCircle size={10}/> Good
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------
// 4. PROFILE PANEL
// ----------------------------------------------------------------------
const StudentProfile = ({ user }) => {
  const [profileData, setProfileData] = useState({ 
    name: user?.name || '', 
    email: user?.email || '' 
  });
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '' });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await API.put('/users/profile', profileData); 
      toast.success("Profile Updated! Please re-login.");
    } catch (err) {
      toast.error("Failed to update profile");
    }
  };

  const handleChangePass = async (e) => {
    e.preventDefault();
    try {
      await API.put('/users/change-password', passData);
      toast.success("Password Updated!");
      setPassData({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error("Failed to update password");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-20">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Student Profile</h2>
      
      {/* HEADER CARD WITH IMAGE */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-8 rounded-3xl shadow-xl mb-8 flex flex-col sm:flex-row items-center gap-8">
        <div className="relative group">
            <img 
              src={user?.profileImage || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"} 
              alt="Profile" 
              className="w-28 h-28 rounded-full border-4 border-white/30 object-cover shadow-2xl"
            />
            <div className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-4 border-indigo-600"></div>
        </div>
        <div className="text-center sm:text-left">
          <h3 className="text-3xl font-black uppercase tracking-tight">{user?.name || "Student"}</h3>
          <p className="opacity-80 text-sm font-medium">{user?.email}</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-4">
             <span className="bg-black/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md border border-white/10">
               Roll: {user?.rollNumber || "N/A"}
             </span>
             <span className="bg-white/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md border border-white/10">
               {user?.stream || "General"}
             </span>
          </div>
        </div>
      </div>

      {/* PERSONAL INFO EDIT */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="font-black text-lg mb-6 text-slate-800 flex items-center gap-2 uppercase tracking-tight">
          <User size={20} className="text-indigo-500" /> Edit Personal Information
        </h3>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
            <input 
              type="text" 
              className="w-full p-4 border rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition font-medium text-slate-700 bg-slate-50"
              value={profileData.name} 
              onChange={e => setProfileData({...profileData, name: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
            <input 
              type="email" 
              className="w-full p-4 border rounded-2xl bg-gray-100 text-gray-400 cursor-not-allowed font-medium"
              value={profileData.email} 
              readOnly
            />
          </div>
          <div className="pt-2 text-right">
             <button className="bg-indigo-600 text-white px-8 py-3 rounded-2xl hover:bg-indigo-700 font-bold text-sm uppercase tracking-widest flex items-center gap-2 ml-auto shadow-lg transform active:scale-95 transition">
               <Save size={18}/> Save Changes
             </button>
          </div>
        </form>
      </div>

      {/* SECURITY SETTINGS */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="font-black text-lg mb-6 text-slate-800 flex items-center gap-2 uppercase tracking-tight">
          <Lock size={20} className="text-red-500" /> Security Settings
        </h3>
        <form onSubmit={handleChangePass}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Current Password</label>
              <input type="password" className="w-full p-4 border rounded-2xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 outline-none transition bg-slate-50"
                value={passData.currentPassword} onChange={e => setPassData({...passData, currentPassword: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">New Password</label>
              <input type="password" className="w-full p-4 border rounded-2xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 outline-none transition bg-slate-50"
                value={passData.newPassword} onChange={e => setPassData({...passData, newPassword: e.target.value})} />
            </div>
            <div className="pt-2 text-right">
                <button className="bg-slate-900 text-white px-8 py-3 rounded-2xl hover:bg-black font-bold text-sm uppercase tracking-widest flex items-center gap-2 ml-auto shadow-lg transform active:scale-95 transition">
                  <Lock size={18} /> Update Password
                </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentDashboard;