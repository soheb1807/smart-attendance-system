import { useState, useEffect, useContext } from 'react';
import API from '../api';
import { AuthContext } from '../context/AuthContext';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, PlusCircle, BookOpen, Settings, 
  LogOut, RefreshCw, User, Trash2, UserCheck, 
  CheckCircle, XCircle, Eye, X, GraduationCap, Users, AlertCircle, 
  Play, ClipboardList, Hand, Mail, Lock, Save, Smartphone, ShieldAlert,
  Menu, HeartHandshake, Search, Camera, Brain, List, ZoomIn
} from 'lucide-react';

// --- 🖼️ FULL SCREEN IMAGE VIEWER COMPONENT ---
const ImageViewer = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      {/* Close Button */}
      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 text-white bg-slate-800 p-3 rounded-full hover:bg-red-600 transition shadow-lg border border-slate-600 z-50 group"
      >
        <X size={28} className="group-hover:rotate-90 transition-transform duration-300"/>
      </button>
      
      {/* Image */}
      <img 
        src={src} 
        alt="Full View" 
        className="max-w-full max-h-[90vh] rounded-xl shadow-2xl border-4 border-slate-900 object-contain animate-scale-up" 
        onClick={(e) => e.stopPropagation()} 
      />
    </div>
  );
};

// --- 🖼️ SMART AVATAR COMPONENT (Handles Clicks & Fallbacks) ---
const StudentAvatar = ({ src, alt, size = "w-10 h-10", className="", onClick }) => {
  const [imgSrc, setImgSrc] = useState(src);
  
  useEffect(() => { setImgSrc(src); }, [src]);

  const fallback = "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg";

  return (
    <div className={`relative group ${className}`}>
      <img 
        src={imgSrc || fallback} 
        alt={alt || "Student"} 
        className={`${size} rounded-full border border-gray-200 object-cover bg-white shadow-sm ${onClick ? 'cursor-zoom-in group-hover:opacity-90 transition' : ''}`}
        onError={() => setImgSrc(fallback)} 
        onClick={() => onClick && onClick(imgSrc || fallback)}
      />
      {onClick && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-full transition pointer-events-none flex items-center justify-center">
           {/* Optional: Add small zoom icon on hover if desired */}
        </div>
      )}
    </div>
  );
};

const TeacherDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('classroom');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // 🚀 STATE FOR IMAGE VIEWER
  const [previewImage, setPreviewImage] = useState(null);

  const renderContent = () => {
    switch (activeTab) {
      case 'classroom': return <ClassroomPanel onImageClick={setPreviewImage} />;
      case 'attendance': return <AttendanceStatsPanel onImageClick={setPreviewImage} />;
      case 'approvals': return <ApproveStudentsPanel onImageClick={setPreviewImage} />;
      case 'directory': return <ParentContactDirectory onImageClick={setPreviewImage} />;
      case 'courses': return <CoursesManagement onImageClick={setPreviewImage} />;
      case 'profile': return <TeacherProfile user={user} />;
      default: return <ClassroomPanel onImageClick={setPreviewImage} />;
    }
  };

  const NavLinks = () => (
    <>
      <SidebarItem icon={<LayoutDashboard size={20} />} label="Live Classroom" active={activeTab === 'classroom'} onClick={() => { setActiveTab('classroom'); setIsMobileMenuOpen(false); }} />
      <SidebarItem icon={<ClipboardList size={20} />} label="Attendance Records" active={activeTab === 'attendance'} onClick={() => { setActiveTab('attendance'); setIsMobileMenuOpen(false); }} />
      <SidebarItem icon={<UserCheck size={20} />} label="Student Approvals" active={activeTab === 'approvals'} onClick={() => { setActiveTab('approvals'); setIsMobileMenuOpen(false); }} />
      <SidebarItem icon={<Users size={20} />} label="Parent Directory" active={activeTab === 'directory'} onClick={() => { setActiveTab('directory'); setIsMobileMenuOpen(false); }} />
      <SidebarItem icon={<BookOpen size={20} />} label="My Courses" active={activeTab === 'courses'} onClick={() => { setActiveTab('courses'); setIsMobileMenuOpen(false); }} />
      <SidebarItem icon={<Settings size={20} />} label="Profile" active={activeTab === 'profile'} onClick={() => { setActiveTab('profile'); setIsMobileMenuOpen(false); }} />
    </>
  );

  return (
    <div className="flex h-screen bg-gray-100 flex-col md:flex-row">
      {/* 🚀 GLOBAL IMAGE VIEWER */}
      {previewImage && <ImageViewer src={previewImage} onClose={() => setPreviewImage(null)} />}

      {/* MOBILE HEADER */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <h1 className="text-xl font-bold text-blue-400 text-center">Teacher Panel</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1 hover:bg-slate-800 rounded-lg transition">
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* MOBILE NAV OVERLAY */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900 z-40 p-6 pt-20 animate-fade-in flex flex-col">
          <nav className="flex-1 space-y-2">
            <NavLinks />
          </nav>
          <button onClick={logout} className="flex items-center gap-3 w-full p-4 text-red-400 bg-slate-800 rounded-xl mt-4 transition font-bold">
            <LogOut size={20} /> Logout Account
          </button>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <div className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex h-full">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-blue-400">Teacher Panel</h1>
          <p className="text-xs text-slate-400 mt-1">{user?.name}</p>
          <p className="text-[10px] text-slate-500 uppercase">{user?.department} Dept</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavLinks />
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-2 text-red-400 hover:bg-slate-800 rounded transition font-bold">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-auto p-4 md:p-8 w-full">
        {renderContent()}
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition ${active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
  >
    {icon} <span className="font-medium">{label}</span>
  </button>
);

// ----------------------------------------------------------------------
// 1. CLASSROOM PANEL 
// ----------------------------------------------------------------------
const ClassroomPanel = ({ onImageClick }) => {
  const [courses, setCourses] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attendanceReport, setAttendanceReport] = useState(null); 
  const [qrCodeValue, setQrCodeValue] = useState("");

  useEffect(() => {
    fetchCourses();
    checkActiveSession(); 
  }, []);

  // ⚡ ROTATING QR LOGIC (10 Seconds)
  useEffect(() => {
    let interval;
    if (activeSession) {
      const updateQR = () => {
        const data = JSON.stringify({
          sessionId: activeSession._id,
          timestamp: Date.now() 
        });
        setQrCodeValue(data);
      };
      updateQR(); 
      interval = setInterval(updateQR, 10000); 
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  const fetchCourses = async () => {
    try {
      const { data } = await API.get('/courses');
      setCourses(data);
    } catch(err) { console.error(err); }
  };

  const checkActiveSession = async () => {
    try {
      const { data } = await API.get('/attendance/active');
      if (data) setActiveSession(data);
    } catch (err) { console.log("No active session"); }
  };

  const startSession = async (courseId) => {
    setLoading(true);
    setAttendanceReport(null); 
    
    if (!navigator.geolocation) {
       setLoading(false);
       return toast.error("Geolocation not supported");
    }

    const options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const { data } = await API.post('/attendance/start', {
          courseId, latitude, longitude, 
          radius: 20 // 🎯 Strict Mode: 20 Meters
        });
        setActiveSession(data);
        toast.success("Class Started! Location Locked.");
      } catch (err) { toast.error("Failed to start class"); } 
      finally { setLoading(false); }
    }, (err) => {
      console.error(err);
      toast.error("Weak GPS Signal. Move near a window.");
      setLoading(false);
    }, options);
  };

  const endSession = async () => {
    if (!activeSession) return;
    const sessionId = activeSession._id;
    if(!window.confirm("Stop Attendance? This will mark all remaining students as Absent.")) return;
    try {
      setLoading(true);
      await API.post('/attendance/end', { sessionId });
      
      const { data } = await API.get(`/attendance/session/${sessionId}`);
      const presentList = data.filter(r => r.status === 'Present');
      const absentList = data.filter(r => r.status === 'Absent');
      
      setAttendanceReport({
        subject: activeSession.course?.name || "Class",
        date: new Date().toLocaleString(),
        present: presentList,
        absent: absentList
      });
      setActiveSession(null);
      toast.success("Class Ended & Stats Generated");
    } catch (err) { 
      toast.error("Session ended, but could not fetch report.");
      setActiveSession(null);
    } finally {
      setLoading(false);
    }
  };

  if (attendanceReport) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Attendance Summary</h2>
          <button onClick={() => setAttendanceReport(null)} className="px-6 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition font-bold shadow-md">
            Close & Return
          </button>
        </div>
        <div className="bg-white p-6 rounded-xl shadow mb-6 border-l-8 border-blue-500">
          <h3 className="text-lg font-bold">{attendanceReport.subject}</h3>
          <p className="text-gray-500 text-sm">{attendanceReport.date}</p>
          <div className="flex gap-6 mt-4">
             <div className="flex items-center gap-2 text-green-700 font-bold bg-green-50 px-3 py-1 rounded">
               <Users size={18}/> Present: {attendanceReport.present.length}
             </div>
             <div className="flex items-center gap-2 text-red-700 font-bold bg-red-50 px-3 py-1 rounded">
               <AlertCircle size={18}/> Absent: {attendanceReport.absent.length}
             </div>
          </div>
        </div>
        
        {/* AI AUDIT VIEW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow overflow-hidden border">
            <div className="bg-green-100 p-3 border-b border-green-200 flex justify-between items-center">
              <h4 className="font-bold text-green-800 uppercase text-xs tracking-widest">Present (AI Verified)</h4>
              <CheckCircle size={20} className="text-green-600"/>
            </div>
            <div className="max-h-[400px] overflow-y-auto p-2">
               {attendanceReport.present.length === 0 ? <p className="text-gray-400 text-center py-4 italic">No one present.</p> : (
                 <ul className="divide-y divide-gray-50">
                   {attendanceReport.present.map((rec, i) => (
                     <li key={i} className="p-3 hover:bg-green-50 flex justify-between items-center transition">
                       <div className="flex items-center gap-3">
                          {/* 🚀 DUAL IMAGE CHECK: CLICKABLE */}
                          <div className="flex -space-x-3 relative" title="Click to Zoom">
                            <StudentAvatar 
                                src={rec.student?.profileImage} 
                                alt="Profile" 
                                onClick={onImageClick}
                            />
                            <StudentAvatar 
                                src={rec.capturedImage} 
                                alt="Proof" 
                                size="w-10 h-10 border-green-500 border-2"
                                onClick={onImageClick}
                            />
                          </div>
                          <div>
                           <p className="font-bold text-gray-800 text-sm">{rec.student?.name}</p>
                           <p className="text-[10px] text-gray-500 font-mono">{rec.student?.rollNumber}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-1 bg-green-200 text-green-800 px-2 py-0.5 rounded-full">
                          <Brain size={12}/> <span className="text-[10px] font-black uppercase">Match</span>
                       </div>
                     </li>
                   ))}
                 </ul>
               )}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow overflow-hidden border">
            <div className="bg-red-100 p-3 border-b border-red-200 flex justify-between items-center">
              <h4 className="font-bold text-red-800 uppercase text-xs tracking-widest">Absent Students</h4>
              <XCircle size={20} className="text-red-600"/>
            </div>
            <div className="max-h-[400px] overflow-y-auto p-2">
               {attendanceReport.absent.length === 0 ? <p className="text-gray-400 text-center py-4 italic">Everyone present!</p> : (
                 <ul className="divide-y divide-gray-50">
                   {attendanceReport.absent.map((rec, i) => (
                     <li key={i} className="p-3 hover:bg-red-50 flex justify-between items-center transition">
                       <div>
                         <p className="font-bold text-gray-800">{rec.student?.name}</p>
                         <p className="text-xs text-gray-500">{rec.student?.rollNumber}</p>
                       </div>
                       <span className="text-[10px] bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-black uppercase">Absent</span>
                     </li>
                   ))}
                 </ul>
               )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeSession) {
    return (
      <div className="animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col items-center justify-center bg-white p-10 rounded-2xl shadow-xl border-4 border-green-500 h-fit">
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full mb-6 font-black text-xs flex items-center gap-2 uppercase tracking-tighter shadow-sm">
                <RefreshCw size={16} className="animate-spin"/> Class in Progress
              </div>
              <h2 className="text-2xl font-black text-gray-800 mb-2 uppercase tracking-tight">QR Authentication</h2>
              <div className="p-4 bg-white border-8 border-slate-900 rounded-3xl mt-4 shadow-2xl relative">
                <QRCode value={qrCodeValue || "Loading..."} size={260} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>
              </div>
              <p className="mt-6 text-sm text-gray-400 font-medium">Code rotates every 10 seconds.</p>
              <button onClick={endSession} disabled={loading} className="mt-8 bg-red-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-red-700 transition flex items-center gap-3 w-full justify-center transform active:scale-95">
                {loading ? "Closing..." : <><XCircle size={22}/> STOP ATTENDANCE</>}
              </button>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border-t-8 border-amber-500 overflow-hidden sticky top-8">
               <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-center gap-2 text-amber-800 font-bold uppercase text-xs tracking-widest">
                  <ShieldAlert size={20}/> Real-time Monitor
               </div>
               <div className="p-5">
                  <p className="text-[10px] text-gray-400 mb-4 font-black uppercase tracking-widest">Security Watchdog</p>
                  <div className="space-y-4">
                     <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                            <p className="text-xs font-black text-red-700 uppercase tracking-tighter">Device Verification Active</p>
                            <span className="text-[9px] font-bold text-red-400">SYNCED</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 leading-relaxed">System is automatically blocking students attempting to login from <b>Unauthorized Hardware</b>.</p>
                     </div>
                     <div className="bg-slate-50 p-6 rounded-2xl text-center border-2 border-dashed border-slate-200">
                        <Brain size={40} className="mx-auto text-indigo-400 mb-3"/>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">AI Face Detection is <b>Active</b> on student devices.</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Live Classroom</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.length === 0 ? <p className="text-gray-500 italic p-10 bg-white rounded-xl border border-dashed text-center col-span-full">No courses created yet.</p> : 
          courses.map(course => (
          <div key={course._id} className="bg-white p-6 rounded-2xl shadow-sm border border-transparent hover:border-blue-400 hover:shadow-md transition-all group">
            <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                <BookOpen size={24}/>
            </div>
            <h3 className="text-xl font-bold text-slate-800 truncate uppercase tracking-tight">{course.name}</h3>
            <p className="text-xs text-gray-400 font-mono mb-6 mt-1">{course.code} • {course.stream}</p>
            <button onClick={() => startSession(course._id)} disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded-xl hover:bg-blue-600 transition shadow-sm flex justify-center items-center gap-2 font-black text-xs uppercase tracking-widest">
                {loading ? "Starting..." : <><Play size={18} fill="currentColor"/> Start Session</>}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 2. PARENT DIRECTORY (CLICKABLE IMAGES)
// ----------------------------------------------------------------------
const ParentContactDirectory = ({ onImageClick }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchDirectory(); }, []);

  const fetchDirectory = async () => {
    setLoading(true);
    try {
      const mca = await API.get('/courses/candidates?stream=MCA');
      const mba = await API.get('/courses/candidates?stream=MBA');
      const allStudents = [...mca.data, ...mba.data];
      setStudents(allStudents);
    } catch (err) { toast.error("Error loading directory"); }
    finally { setLoading(false); }
  };

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNumber?.includes(search));

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="text-blue-600"/> Parent Contact Directory
        </h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
          <input 
            type="text" placeholder="Search student..." 
            className="w-full pl-10 pr-4 py-2 border rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b text-gray-500 font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-6 py-4">Photo</th>
              <th className="px-6 py-4">Student Name</th>
              <th className="px-6 py-4">Stream</th>
              <th className="px-6 py-4">Father / Parent Email</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? <tr><td colSpan="4" className="p-10 text-center">Loading...</td></tr> : 
             filtered.length === 0 ? <tr><td colSpan="4" className="p-10 text-center text-gray-400">No students found.</td></tr> :
             filtered.map((std) => (
              <tr key={std._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  {/* 🚀 CLICKABLE AVATAR */}
                  <StudentAvatar src={std.profileImage} alt={std.name} size="w-12 h-12" onClick={onImageClick} />
                </td>
                <td className="px-6 py-4 font-bold text-slate-800">{std.name}<p className="text-[10px] font-mono text-gray-400 uppercase">{std.rollNumber || "No Roll No"}</p></td>
                <td className="px-6 py-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs border font-medium">{std.stream}</span></td>
                <td className="px-6 py-4 font-medium text-blue-600 flex items-center gap-2"><Mail size={14} className="text-gray-400"/>{std.parentEmail || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 3. ATTENDANCE STATS & MANUAL ENTRY
// ----------------------------------------------------------------------
const AttendanceStatsPanel = ({ onImageClick }) => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseStats(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const { data } = await API.get('/courses');
      setCourses(data);
      if(data.length > 0) setSelectedCourse(data[0]._id);
    } catch(err) { console.error(err); }
  };

  const fetchCourseStats = async (courseId) => {
    setLoading(true);
    try {
      const { data } = await API.get(`/attendance/course-stats/${courseId}`);
      setStudents(data);
    } catch (err) {
      toast.error("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const handleManualMark = async (studentId, studentName) => {
    if(!window.confirm(`Mark ${studentName} as PRESENT for the currently running class?`)) return;

    try {
      const { data } = await API.post('/attendance/manual', {
        studentId,
        courseId: selectedCourse,
        status: 'Present'
      });
      toast.success(data.message);
      fetchCourseStats(selectedCourse);
    } catch (err) {
      toast.error(err.response?.data?.message || "Manual marking failed. Start a class first.");
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ClipboardList className="text-blue-600"/> Attendance Register
        </h2>
        
        <select 
          className="p-2 border rounded-lg bg-white shadow-sm min-w-[200px]"
          value={selectedCourse || ''}
          onChange={(e) => setSelectedCourse(e.target.value)}
        >
          {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading attendance data...</div>
        ) : students.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No students enrolled or no course selected.</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4 text-center">Total Classes</th>
                <th className="px-6 py-4 text-center">Attended</th>
                <th className="px-6 py-4">Percentage</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map((std) => (
                <tr key={std._id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <StudentAvatar src={std.profileImage} alt={std.name} onClick={onImageClick} />
                       <div>
                          <p className="font-bold text-gray-800">{std.name}</p>
                          <p className="text-xs text-gray-500 font-mono">Roll: {std.rollNumber || 'N/A'}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-gray-600">
                    {std.totalClasses}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-green-600">
                    {std.present}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${std.percentage < 75 ? 'bg-red-500' : 'bg-green-500'}`} 
                          style={{ width: `${std.percentage}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs font-bold ${std.percentage < 75 ? 'text-red-600' : 'text-green-600'}`}>
                        {std.percentage}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleManualMark(std._id, std.name)}
                      className="bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition flex items-center gap-2 ml-auto"
                    >
                      <Hand size={14}/> Mark Present
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 4. APPROVAL & STUDENT LIST PANEL 
// ----------------------------------------------------------------------
const ApproveStudentsPanel = ({ onImageClick }) => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [viewMode, setViewMode] = useState('pending'); // 'pending' or 'approved'
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchAllStudents(); }, []);

  const fetchAllStudents = async () => {
    setLoading(true);
    try {
      const pendingRes = await API.get('/users/pending');
      setPendingUsers(pendingRes.data.map(u => ({ ...u, tempStream: u.stream || 'MCA' })));

      const approvedRes = await API.get('/users/approved');
      setApprovedUsers(approvedRes.data);

    } catch (err) { toast.error("Failed to fetch students"); } 
    finally { setLoading(false); }
  };

  const handleApprove = async (user) => {
    try {
      await API.put(`/users/approve/${user._id}`, { stream: user.tempStream });
      toast.success(`Approved ${user.name}.`);
      fetchAllStudents(); 
    } catch (err) { toast.error("Approval failed"); }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Delete User? This cannot be undone.")) return;
    try {
      await API.delete(`/users/${userId}`);
      toast.success("User Deleted");
      fetchAllStudents();
    } catch (err) { toast.error("Delete failed"); }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div onClick={() => setViewMode('pending')} className={`p-6 rounded-2xl border-2 cursor-pointer transition ${viewMode === 'pending' ? 'bg-orange-50 border-orange-400' : 'bg-white border-transparent shadow'}`}>
           <h3 className="text-gray-500 font-bold uppercase text-xs tracking-widest">Pending Approvals</h3>
           <p className="text-4xl font-black text-orange-600 mt-2">{pendingUsers.length}</p>
        </div>
        <div onClick={() => setViewMode('approved')} className={`p-6 rounded-2xl border-2 cursor-pointer transition ${viewMode === 'approved' ? 'bg-green-50 border-green-400' : 'bg-white border-transparent shadow'}`}>
           <h3 className="text-gray-500 font-bold uppercase text-xs tracking-widest">Total Approved Students</h3>
           <p className="text-4xl font-black text-green-600 mt-2">{approvedUsers.length}</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          {viewMode === 'pending' ? <UserCheck className="text-orange-600"/> : <CheckCircle className="text-green-600"/>}
          {viewMode === 'pending' ? "Pending Requests" : "Approved Student List"}
        </h2>
      </div>

      <div className="bg-white rounded-2xl shadow border overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-400">Loading data...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b text-gray-500 uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="px-6 py-4">Selfie</th>
                  <th className="px-6 py-4">Student Details</th>
                  <th className="px-6 py-4">Stream</th>
                  <th className="px-6 py-4">Parent Email Link</th>
                  <th className="px-6 py-4 text-center">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(viewMode === 'pending' ? pendingUsers : approvedUsers).length === 0 ? (
                    <tr><td colSpan="5" className="p-10 text-center text-gray-400 italic font-medium">No records found.</td></tr>
                ) : (viewMode === 'pending' ? pendingUsers : approvedUsers).map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                        <StudentAvatar src={user.profileImage} alt={user.name} size="w-12 h-12" onClick={onImageClick} />
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">{user.name}<p className="text-[10px] text-gray-400 uppercase font-normal tracking-tight">{user.email}</p></td>
                    
                    <td className="px-6 py-4">
                      {viewMode === 'pending' ? (
                        <select value={user.tempStream} onChange={(e) => {
                          const newUser = {...user, tempStream: e.target.value};
                          setPendingUsers(pendingUsers.map(u => u._id === user._id ? newUser : u));
                        }} className="border rounded-lg px-2 py-1 bg-white text-xs font-bold outline-blue-500">
                          <option value="MCA">MCA</option>
                          <option value="MBA">MBA</option>
                        </select>
                      ) : (
                        <span className="bg-slate-100 px-2 py-1 rounded text-xs border font-medium">{user.stream}</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-pink-600 font-bold text-xs uppercase tracking-tighter">
                          <HeartHandshake size={16}/> {user.parentEmail || <span className="text-gray-300">N/A</span>}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 flex justify-center gap-2">
                      {viewMode === 'pending' && (
                        <button onClick={() => handleApprove(user)} className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 shadow-sm" title="Approve"><CheckCircle size={18} /></button>
                      )}
                      <button onClick={() => handleDelete(user._id)} className="bg-red-50 text-red-600 p-2 rounded-xl hover:bg-red-100" title="Delete User"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 5. COURSES MANAGEMENT
// ----------------------------------------------------------------------
const CoursesManagement = ({ onImageClick }) => {
  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState({ name: '', code: '', stream: 'MCA' });
  const [viewingCourse, setViewingCourse] = useState(null);

  useEffect(() => { fetchMyCourses(); }, []);

  const fetchMyCourses = async () => {
    try {
      const { data } = await API.get('/courses');
      setCourses(data);
    } catch(err) { console.error(err); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post('/courses', newCourse);
      toast.success(data.message);
      setNewCourse({ name: '', code: '', stream: 'MCA' });
      fetchMyCourses();
    } catch (err) {
      toast.error("Failed to create course");
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if(!window.confirm("Are you sure? This will delete the course and all its data.")) return;
    try {
      await API.delete(`/courses/${courseId}`);
      toast.success("Course Deleted");
      fetchMyCourses();
    } catch (err) {
      toast.error("Failed to delete course");
    }
  };

  const handleRemoveStudent = async (courseId, studentId) => {
    if(!window.confirm("Remove student?")) return;
    try {
      await API.put('/courses/remove', { courseId, studentId });
      toast.success("Student Removed");
      setViewingCourse(prev => ({
        ...prev,
        students: prev.students.filter(s => s._id !== studentId)
      }));
      fetchMyCourses();
    } catch (err) {
      toast.error("Failed to remove student");
    }
  };

  const handleResetDevice = async (userId, userName) => {
    if (!window.confirm(`Reset device lock for ${userName}?`)) return;
    try {
      const { data } = await API.put(`/users/reset-device/${userId}`);
      toast.success(data.message);
    } catch (err) { toast.error("Failed to reset device lock"); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* CREATE FORM */}
      <div className="lg:col-span-1 h-fit sticky top-8">
        <div className="bg-white p-8 rounded-2xl shadow border-t-8 border-blue-600">
          <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-slate-800 uppercase tracking-tighter">
            <PlusCircle className="text-blue-600" /> New Subject
          </h3>
          <p className="text-[10px] text-gray-400 mb-6 bg-slate-50 p-3 rounded-lg font-bold border-l-2 border-slate-300">
            Approved students in the selected branch will be <b>automatically enrolled</b>.
          </p>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Subject Name</label>
              <input className="w-full p-3 border rounded-xl mt-1 text-sm outline-blue-600 font-medium shadow-sm" placeholder="e.g. Operating Systems"
                value={newCourse.name} onChange={e => setNewCourse({...newCourse, name: e.target.value})} required />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Subject Code</label>
              <input className="w-full p-3 border rounded-xl mt-1 text-sm outline-blue-600 font-medium shadow-sm" placeholder="e.g. CS-404"
                value={newCourse.code} onChange={e => setNewCourse({...newCourse, code: e.target.value})} required />
            </div>
            <div className="mb-4">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Academic Stream</label>
              <div className="relative">
                <select className="w-full p-3 border rounded-xl mt-1 bg-white appearance-none font-bold text-sm outline-blue-600 cursor-pointer shadow-sm"
                  value={newCourse.stream} onChange={e => setNewCourse({...newCourse, stream: e.target.value})}>
                  <option value="MCA">MCA (Computing)</option>
                  <option value="MBA">MBA (Business)</option>
                </select>
                <GraduationCap className="absolute right-3 top-4.5 text-gray-400 pointer-events-none" size={16}/>
              </div>
            </div>
            <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-black hover:bg-blue-600 transition shadow-lg text-xs tracking-widest uppercase transform active:scale-95">
              Publish Course
            </button>
          </form>
        </div>
      </div>

      {/* COURSE LIST */}
      <div className="lg:col-span-2">
        <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-slate-800 uppercase tracking-tight"><BookOpen className="text-blue-600"/> Published Courses</h3>
        <div className="bg-white rounded-2xl shadow border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b text-gray-500 font-black uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Batch</th>
                <th className="px-6 py-4">Roster</th>
                <th className="px-6 py-4 text-center">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {courses.map(c => (
                <tr key={c._id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="font-black text-slate-800">{c.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">{c.code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-700 text-[10px] px-2.5 py-1 rounded-full font-black border border-blue-100 shadow-sm">
                      {c.stream}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-600">
                    {c.students?.length || 0} students
                  </td>
                  <td className="px-6 py-4 text-center flex justify-center gap-2 pt-6">
                        <button onClick={() => setViewingCourse(c)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Eye size={20}/></button>
                        <button onClick={() => handleDeleteCourse(c._id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {courses.length === 0 && <p className="text-center p-12 text-gray-300 italic uppercase text-[10px] font-bold">No active courses published.</p>}
        </div>
      </div>

      {/* MODAL: VIEW STUDENTS */}
      {viewingCourse && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] border-4 border-white">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{viewingCourse.name}</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Enrolled Students: {viewingCourse.students?.length || 0}</p>
              </div>
              <button onClick={() => setViewingCourse(null)} className="p-2 bg-white text-gray-400 hover:text-red-600 rounded-xl shadow-sm border transition transform hover:rotate-90"><X size={20}/></button>
            </div>
            
            <div className="p-0 overflow-y-auto flex-1 bg-white">
              {(!viewingCourse.students || viewingCourse.students.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                    <User size={60} className="mb-4 opacity-10"/>
                    <p className="font-bold uppercase text-[10px] tracking-widest">No enrollment records</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-[10px] text-gray-400 uppercase font-black tracking-widest sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4">Identification</th>
                      <th className="px-6 py-4">Student Name</th>
                      <th className="px-6 py-4 text-center">Security</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {viewingCourse.students.map(std => (
                      <tr key={std._id} className="hover:bg-slate-50 transition group">
                        <td className="px-6 py-4">
                            <StudentAvatar src={std.profileImage} alt={std.name} size="w-8 h-8" onClick={onImageClick} />
                        </td>
                        <td className="px-6 py-4 text-gray-400 font-mono text-[11px] uppercase">{std.rollNumber || '2024-X'}</td>
                        <td className="px-6 py-4 font-black text-slate-700">{std.name}</td>
                        <td className="px-6 py-4 text-center">
                            <button onClick={() => handleResetDevice(std._id, std.name)} className="text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-1 rounded-lg border border-amber-200 hover:bg-amber-600 hover:text-white transition uppercase tracking-tighter" title="Force unbind hardware">Reset Phone</button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleRemoveStudent(viewingCourse._id, std._id)} className="text-gray-300 hover:text-red-600 p-2 rounded-xl transition"><XCircle size={18} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="p-6 border-t bg-slate-50 text-right">
              <button onClick={() => setViewingCourse(null)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition shadow-lg">Finalize List</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------
// 6. PROFILE
// ----------------------------------------------------------------------
const TeacherProfile = ({ user }) => {
  const [profileData, setProfileData] = useState({ name: '', email: '' });
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '' });

  useEffect(() => {
    if(user) setProfileData({ name: user.name, email: user.email });
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await API.put('/users/profile', profileData); 
      toast.success("Identity Updated!");
    } catch (err) {
      toast.error("Failed to update profile");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await API.put('/users/change-password', passData);
      toast.success("Security Credentials Refreshed!");
      setPassData({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || "Password change failed");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Account Center</h2>

      <div className="bg-white rounded-3xl shadow p-8 border border-gray-100 transition-all hover:shadow-lg">
        <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-slate-700 uppercase tracking-tighter">
          <User className="text-blue-500" size={26}/> Personal Credentials
        </h3>
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Full Identity</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-3.5 text-gray-300"/>
                <input 
                  type="text" 
                  value={profileData.name}
                  onChange={e => setProfileData({...profileData, name: e.target.value})}
                  className="w-full pl-12 p-3.5 border rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-700 transition shadow-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Work Email (Protected)</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-3.5 text-gray-300"/>
                <input 
                  type="email" 
                  value={profileData.email}
                  className="w-full pl-12 p-3.5 border rounded-2xl bg-gray-50 text-gray-400 font-bold outline-none cursor-not-allowed"
                  readOnly
                />
              </div>
            </div>
          </div>
          <div className="pt-2 text-right">
            <button className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition flex items-center gap-2 ml-auto shadow-xl transform active:scale-95">
              <Save size={18}/> Update Identity
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow p-8 border border-gray-100 transition-all hover:shadow-lg">
        <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-slate-700 uppercase tracking-tighter">
          <Lock className="text-red-500" size={26}/> Access Control
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Current Secret</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={passData.currentPassword}
                onChange={e => setPassData({...passData, currentPassword: e.target.value})}
                className="w-full p-3.5 border rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none font-bold shadow-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">New Identity Key</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={passData.newPassword}
                onChange={e => setPassData({...passData, newPassword: e.target.value})}
                className="w-full p-3.5 border rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold shadow-sm"
              />
            </div>
          </div>
          <div className="pt-2 text-right">
            <button className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition flex items-center gap-2 ml-auto shadow-xl transform active:scale-95">
              <RefreshCw size={18}/> Refresh Credentials
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherDashboard;