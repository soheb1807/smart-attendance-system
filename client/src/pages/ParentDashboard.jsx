import { useState, useEffect, useContext } from 'react';
import API from '../api';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  User, Calendar, AlertTriangle, CheckCircle, 
  Bell, BookOpen, LogOut, ChevronRight, Info
} from 'lucide-react';

const ParentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await API.get('/attendance/parent-dashboard');
      setData(res.data);
    } catch (err) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* --- SIDEBAR --- */}
      <div className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-blue-400">Parent Portal</h2>
          <p className="text-xs text-slate-400 mt-1">Logged in: {user?.name}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <div className="px-4 py-2 bg-blue-600 rounded-lg flex items-center gap-3">
            <User size={20} /> <span className="font-medium">My Children</span>
          </div>
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-2 text-red-400 hover:bg-slate-800 rounded transition">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 p-4 md:p-8 overflow-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Welcome, Mr. {user?.name.split(' ').pop()}</h1>
            <p className="text-slate-500">Monitor your ward's academic progress</p>
          </div>
          <button onClick={fetchDashboardData} className="p-2 bg-white border rounded-full hover:bg-gray-100 shadow-sm transition">
             <Bell size={20} className="text-blue-600"/>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: CHILDREN LIST & STATS */}
          <div className="lg:col-span-2 space-y-8">
            {data?.children.length === 0 ? (
              <div className="bg-white p-10 text-center rounded-xl shadow border">
                <Info size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No students found linked to this parent email.</p>
              </div>
            ) : (
              data?.children.map((child, idx) => (
                <div key={idx} className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                      <User size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">{child.name}</h2>
                      <p className="text-sm text-slate-500 uppercase tracking-wider">Roll No: {child.rollNumber}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {child.attendanceStats.map((stat, sIdx) => (
                      <div key={sIdx} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-slate-700">{stat.courseName}</h3>
                            <p className="text-xs text-slate-400">{stat.courseCode}</p>
                          </div>
                          <span className={`text-lg font-bold ${stat.percentage < 75 ? 'text-red-500' : 'text-green-600'}`}>
                            {stat.percentage}%
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${stat.percentage < 75 ? 'bg-red-500' : 'bg-green-500'}`} 
                            style={{ width: `${stat.percentage}%` }}
                          ></div>
                        </div>

                        {/* Skipped Dates Accordion Logic */}
                        <div className="mt-4 pt-4 border-t border-slate-50">
                          <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                            <AlertTriangle size={14} className={stat.absentDates.length > 0 ? "text-amber-500" : "text-gray-300"} />
                            Missed Classes ({stat.absentDates.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {stat.absentDates.length > 0 ? (
                              stat.absentDates.map((date, dIdx) => (
                                <span key={dIdx} className="px-2 py-1 bg-red-50 text-red-600 text-[10px] rounded font-medium border border-red-100">
                                  {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-green-500 font-medium">Perfect attendance!</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* RIGHT: NOTICES PANEL */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden sticky top-8">
              <div className="bg-slate-800 p-4 flex items-center gap-3 text-white">
                <Bell size={20} className="text-blue-400" />
                <h3 className="font-bold">Official Notices</h3>
              </div>
              <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                {data?.notices.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-8">No recent notices from Admin.</p>
                ) : (
                  data?.notices.map((notice) => (
                    <div key={notice._id} className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 group">
                      <h4 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-blue-600 transition">{notice.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed mb-3">
                        {notice.content}
                      </p>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(notice.createdAt).toLocaleDateString()}</span>
                        <span className="uppercase text-blue-500 tracking-tighter">Official</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;