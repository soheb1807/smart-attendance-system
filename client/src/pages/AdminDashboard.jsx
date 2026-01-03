import { useState, useEffect, useContext } from 'react';
import API from '../api';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, Users, BookOpen, Mail, Settings, LogOut, 
  Trash2, CheckCircle, ChevronRight, User, Menu, X, Search, HeartHandshake, 
  Eye, GraduationCap, BarChart2
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state

  // Render Content Based on Tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardHome />;
      case 'departments': return <DepartmentsView />;
      case 'teachers': return <TeachersManagement />;
      case 'parents': return <ParentDirectory />;
      case 'notice': return <NoticeBoard />;
      case 'settings': return <ProfileSettings user={user} />;
      default: return <DashboardHome />;
    }
  };

  const NavItem = ({ icon, label, id }) => (
    <button 
      onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all mb-1 ${activeTab === id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
    >
      {icon} <span className="font-medium text-sm">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-100 flex-col md:flex-row">
      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <h1 className="text-xl font-bold text-blue-400">Admin Panel</h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-800 rounded-lg">
          {isSidebarOpen ? <X size={28}/> : <Menu size={28}/>}
        </button>
      </div>

      {/* --- SIDEBAR (Responsive) --- */}
      <div className={`${isSidebarOpen ? 'fixed inset-0 z-40 flex' : 'hidden'} md:relative md:flex md:w-64 bg-slate-900 text-white flex-col transition-all duration-300`}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">Admin Panel</h1>
            <p className="text-xs text-slate-400 mt-1">Welcome, {user?.name?.split(' ')[0]}</p>
          </div>
          <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}><X size={24}/></button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <NavItem icon={<LayoutDashboard size={20} />} label="Approvals" id="dashboard" />
          <NavItem icon={<BookOpen size={20} />} label="All Courses" id="departments" />
          <NavItem icon={<Users size={20} />} label="Teachers" id="teachers" />
          <NavItem icon={<HeartHandshake size={20} />} label="Parent Directory" id="parents" />
          <NavItem icon={<Mail size={20} />} label="Send Notice" id="notice" />
          <NavItem icon={<Settings size={20} />} label="Settings" id="settings" />
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition font-bold">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 overflow-auto p-4 md:p-8 w-full">
        {renderContent()}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 1. DASHBOARD HOME (Pending Approvals with Images)
// ----------------------------------------------------------------------
const DashboardHome = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPending(); }, []);

  const fetchPending = async () => {
    try {
      const { data } = await API.get('/users/pending');
      setPendingUsers(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const approveUser = async (id) => {
    try {
      await API.put(`/users/approve/${id}`);
      toast.success("User Approved Successfully");
      fetchPending();
    } catch (err) { toast.error("Approval Failed"); }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Pending Registrations</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        {loading ? <div className="p-10 text-center">Loading...</div> : pendingUsers.length === 0 ? <p className="p-10 text-center text-gray-500 italic font-medium">No pending requests at the moment.</p> : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-gray-400 uppercase text-[10px] font-bold tracking-widest">
              <tr>
                <th className="px-6 py-4">Photo</th>
                <th className="px-6 py-4">User Detail</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pendingUsers.map(u => (
                <tr key={u._id} className="border-b hover:bg-blue-50/30 transition">
                  <td className="px-6 py-4">
                    <img 
                      src={u.profileImage || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"} 
                      alt="User" 
                      className="w-10 h-10 rounded-full border border-gray-200 object-cover"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{u.name}</p>
                    <p className="text-xs text-slate-400 font-medium">{u.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="uppercase text-[10px] font-black text-blue-600 bg-blue-100 rounded-full px-3 py-1 border border-blue-200">{u.role}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => approveUser(u._id)} className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 shadow-md transition">
                      <CheckCircle size={14} /> Approve
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
// 2. PARENT DIRECTORY (With Photos)
// ----------------------------------------------------------------------
const ParentDirectory = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const mca = await API.get('/courses/candidates?stream=MCA');
        const mba = await API.get('/courses/candidates?stream=MBA');
        setStudents([...mca.data, ...mba.data]);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchStudents();
  }, []);

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNumber?.includes(search));

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <HeartHandshake className="text-pink-500"/> Parent Contact Directory
        </h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
          <input 
            type="text" placeholder="Search by name or roll..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b text-gray-500 font-bold uppercase text-[10px] tracking-widest">
            <tr>
              <th className="px-6 py-4">Profile</th>
              <th className="px-6 py-4">Student Name</th>
              <th className="px-6 py-4">Field</th>
              <th className="px-6 py-4">Father / Parent Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan="4" className="p-10 text-center">Loading Data...</td></tr> : 
             filtered.map((std) => (
              <tr key={std._id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <img 
                    src={std.profileImage || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"} 
                    alt="Std" 
                    className="w-10 h-10 rounded-full border border-gray-200 object-cover"
                  />
                </td>
                <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{std.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">{std.rollNumber}</p>
                </td>
                <td className="px-6 py-4"><span className="text-[10px] font-black bg-slate-100 px-2.5 py-1 rounded-md border">{std.stream}</span></td>
                <td className="px-6 py-4 font-bold text-blue-600 flex items-center gap-2 underline decoration-blue-200">
                    <Mail size={14} className="text-gray-400"/> {std.parentEmail || 'Not Provided'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 3. DEPARTMENTS VIEW (Enhanced with Detailed Modal & Analytics)
// ----------------------------------------------------------------------
const DepartmentsView = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [viewingCourse, setViewingCourse] = useState(null);
  const [courseStats, setCourseStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    const fetchAllCourses = async () => {
      try {
        const { data } = await API.get('/courses/all');
        setCourses(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAllCourses();
  }, []);

  // Fetch stats when a course is opened
  useEffect(() => {
    if (viewingCourse) {
      setLoadingStats(true);
      // NOTE: Ensure your backend '/attendance/course-stats/:id' allows Admin role access
      API.get(`/attendance/course-stats/${viewingCourse._id}`)
         .then(res => setCourseStats(res.data))
         .catch(err => toast.error("Could not load attendance stats. Check permissions."))
         .finally(() => setLoadingStats(false));
    }
  }, [viewingCourse]);

  const filteredStats = courseStats.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
    s.rollNumber?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Course Catalog & Analytics</h2>
      
      {/* GRID VIEW */}
      {loading ? <p>Loading courses...</p> : courses.length === 0 ? <p className="bg-white p-8 rounded-xl border border-dashed text-center italic text-gray-400">No courses published yet.</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div key={course._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-8 border-l-blue-500 hover:shadow-lg transition group">
              <div className="flex justify-between items-start mb-4">
                <div>
                   <h3 className="font-black text-slate-800 uppercase tracking-tight text-lg">{course.name}</h3>
                   <p className="text-xs text-gray-400 font-mono uppercase">{course.code}</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                   <BookOpen size={20}/>
                </div>
              </div>
              
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                <div>
                   <p className="text-[10px] text-gray-400 font-bold uppercase">Assigned Teacher</p>
                   <p className="text-sm font-bold text-slate-700">{course.teacher?.name || "Pending"}</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-blue-600">{course.students?.length || 0}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-black">Enrolled</p>
                </div>
              </div>

              <button 
                onClick={() => setViewingCourse(course)}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition shadow-md flex items-center justify-center gap-2"
              >
                <BarChart2 size={16}/> View Attendance Roster
              </button>
            </div>
          ))}
        </div>
      )}

      {/* DETAILED MODAL */}
      {viewingCourse && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border-4 border-white">
            
            {/* Modal Header */}
            <div className="p-6 border-b bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{viewingCourse.name}</h2>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Course Code: {viewingCourse.code} • Teacher: {viewingCourse.teacher?.name}
                </p>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                  <input 
                    type="text" 
                    placeholder="Find Student..." 
                    className="pl-9 pr-4 py-2 border rounded-xl text-sm w-full md:w-64 outline-blue-500 shadow-sm"
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </div>
                <button onClick={() => setViewingCourse(null)} className="p-2 bg-white border rounded-xl hover:bg-red-50 hover:text-red-500 transition shadow-sm"><X size={20}/></button>
              </div>
            </div>

            {/* Modal Body (Table) */}
            <div className="flex-1 overflow-y-auto p-0">
              {loadingStats ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                  <p className="text-xs font-bold uppercase tracking-widest">Calculating Attendance...</p>
                </div>
              ) : filteredStats.length === 0 ? (
                <div className="p-20 text-center text-gray-400 italic">No student records found for this course.</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-white sticky top-0 z-10 shadow-sm text-[10px] text-gray-400 font-black uppercase tracking-widest border-b">
                    <tr>
                      <th className="px-6 py-4 bg-gray-50">Student</th>
                      <th className="px-6 py-4 bg-gray-50 text-center">Total Classes</th>
                      <th className="px-6 py-4 bg-gray-50 text-center">Present</th>
                      <th className="px-6 py-4 bg-gray-50 text-center">Absent</th>
                      <th className="px-6 py-4 bg-gray-50">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredStats.map((std) => (
                      <tr key={std._id} className="hover:bg-blue-50/50 transition group">
                        <td className="px-6 py-3 flex items-center gap-3">
                          {/* Note: If your course stats API doesn't return profileImage, you might need to update the controller. 
                              Otherwise this fallback handles it nicely. */}
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border">
                             <img src={std.profileImage || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"} className="w-full h-full object-cover" alt=""/>
                          </div>
                          <div>
                            <p className="font-bold text-slate-700 group-hover:text-blue-700 transition">{std.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{std.rollNumber}</p>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-center font-bold text-gray-500">{std.totalClasses}</td>
                        <td className="px-6 py-3 text-center font-bold text-green-600 bg-green-50/30 rounded-lg">{std.present}</td>
                        <td className="px-6 py-3 text-center font-bold text-red-500 bg-red-50/30 rounded-lg">{std.totalClasses - std.present}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${std.percentage < 75 ? 'bg-red-500' : 'bg-green-500'}`} 
                                style={{ width: `${std.percentage}%` }}
                              ></div>
                            </div>
                            <span className={`text-xs font-black ${std.percentage < 75 ? 'text-red-500' : 'text-green-600'}`}>{std.percentage}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t text-right">
              <button onClick={() => setViewingCourse(null)} className="px-6 py-2 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition shadow-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------
// 4. TEACHERS MANAGEMENT
// ----------------------------------------------------------------------
const TeachersManagement = () => {
  const [teachers, setTeachers] = useState([]);

  useEffect(() => { fetchTeachers(); }, []);

  const fetchTeachers = async () => {
    try {
      const { data } = await API.get('/users/teachers');
      setTeachers(data);
    } catch (e) { console.error(e); }
  };

  const deleteTeacher = async (id) => {
    if(!window.confirm("Danger: This will delete the teacher account permanently. Continue?")) return;
    try {
      await API.delete(`/users/${id}`);
      toast.success("Teacher Removed");
      fetchTeachers();
    } catch (e) { toast.error("Failed to delete"); }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">Staff Directory</h2>
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden overflow-x-auto">
        {teachers.length === 0 ? <p className="p-8 text-center italic text-gray-400">No staff accounts found.</p> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b text-gray-500 font-bold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-4">Teacher Name</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Branch</th>
                <th className="px-6 py-4 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {teachers.map(t => (
                <tr key={t._id} className="hover:bg-red-50/30 transition">
                  <td className="px-6 py-4 font-bold text-slate-800">{t.name}</td>
                  <td className="px-6 py-4 text-slate-500">{t.email}</td>
                  <td className="px-6 py-4"><span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded text-[10px] font-bold">{t.department || "General Staff"}</span></td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => deleteTeacher(t._id)} className="text-red-500 hover:bg-red-100 p-2 rounded-xl transition shadow-sm border border-red-50">
                      <Trash2 size={18} />
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
// 5. NOTICE BOARD (Updated to show mass email logic)
// ----------------------------------------------------------------------
const NoticeBoard = () => {
  const [formData, setFormData] = useState({ recipientGroup: 'students', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/users/send-notice', formData);
      toast.success("Notice Published & Emailed!");
      setFormData({ recipientGroup: 'students', subject: '', message: '' });
    } catch (err) { toast.error("Broadcast failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl animate-fade-in">
      <h2 className="text-2xl font-bold mb-2">Mass Broadcast</h2>
      <p className="text-sm text-gray-400 mb-6 font-medium">Published notices will be instantly emailed to the selected recipient group.</p>
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 border-t-8 border-t-blue-600">
        <form onSubmit={handleSend} className="space-y-5">
          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Recipient Channel</label>
            <select 
              className="w-full p-3 border rounded-xl mt-1 bg-white font-bold text-sm outline-blue-500 shadow-sm"
              value={formData.recipientGroup}
              onChange={e => setFormData({...formData, recipientGroup: e.target.value})}
            >
              <option value="students">📢 Every Student (Email Only)</option>
              <option value="teachers">👨‍🏫 Every Teacher (Email Only)</option>
              <option value="parents">🛡️ Every Father/Parent (Silent Alert Email)</option>
              <option value="all">🌐 Universal Broadcast (Staff + Students + Parents)</option>
            </select>
          </div>
          
          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Headline</label>
            <input 
              type="text" className="w-full p-3 border rounded-xl mt-1 text-sm outline-blue-500 font-medium" 
              placeholder="e.g., Mandatory Semester Briefing"
              value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} required
            />
          </div>

          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Detailed Message</label>
            <textarea 
              className="w-full p-3 border rounded-xl mt-1 h-32 text-sm outline-blue-500 resize-none font-medium" 
              placeholder="Write the official content here..."
              value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} required
            ></textarea>
          </div>

          <button disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-blue-600 transition flex justify-center items-center gap-3 tracking-widest text-xs transform active:scale-95">
            <Mail size={18} /> {loading ? "TRANSMITTING..." : "FIRE BROADCAST"}
          </button>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 6. PROFILE SETTINGS
// ----------------------------------------------------------------------
const ProfileSettings = ({ user }) => {
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '' });

  const handleChangePass = async (e) => {
    e.preventDefault();
    try {
      await API.put('/users/change-password', passData);
      toast.success("Identity Key Rotated Successfully");
      setPassData({ currentPassword: '', newPassword: '' });
    } catch (err) { toast.error("Security Sync Error"); }
  };

  return (
    <div className="max-w-xl animate-fade-in pb-10">
      <h2 className="text-2xl font-bold mb-6">Security & Identity</h2>
      <div className="bg-slate-900 p-8 rounded-3xl shadow-xl mb-8 flex items-center gap-6 border-b-8 border-blue-600">
        <div className="bg-blue-600 p-4 rounded-2xl shadow-lg">
          <User size={32} className="text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{user?.name}</h3>
          <p className="text-blue-400 font-mono text-xs uppercase tracking-widest mt-1">{user?.role} Access Authorized</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-6 text-slate-800 uppercase tracking-tight">Rotate Security Key</h3>
        <form onSubmit={handleChangePass} className="space-y-4">
          <input 
            type="password" placeholder="Current Secret Key" 
            className="w-full p-3 border rounded-xl outline-red-500 font-medium text-sm shadow-sm bg-slate-50"
            onChange={e => setPassData({...passData, currentPassword: e.target.value})}
          />
          <input 
            type="password" placeholder="New Secret Key" 
            className="w-full p-3 border rounded-xl outline-blue-500 font-medium text-sm shadow-sm bg-slate-50"
            onChange={e => setPassData({...passData, newPassword: e.target.value})}
          />
          <button className="w-full bg-slate-900 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition shadow-lg mt-4">
            Sync New Credentials
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;