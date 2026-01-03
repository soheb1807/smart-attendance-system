import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import toast from 'react-hot-toast';
// 🚀 Image Compression Library
import imageCompression from 'browser-image-compression'; 
import { 
  User, Mail, Lock, Briefcase, GraduationCap, 
  Eye, EyeOff, FileText, Smartphone, HeartHandshake, Camera, Loader 
} from 'lucide-react';
import { getDeviceId } from '../utils/deviceUtils'; 

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 📸 Image State
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false); // UI feedback state

  const [formData, setFormData] = useState({
    name: '', 
    email: '', 
    password: '', 
    role: 'student', 
    stream: 'MCA', 
    department: '', 
    rollNumber: '', 
    parentEmail: '',
    profileImage: '' 
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ---------------------------------------------------------
  // 1. IMAGE COMPRESSION LOGIC (Fixes "File too large" error)
  // ---------------------------------------------------------
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show UI that we are processing
    setCompressing(true);

    // Options: Max 1MB size, Max 1920px width
    const options = {
      maxSizeMB: 1,          // Target size ~1MB
      maxWidthOrHeight: 1920, 
      useWebWorker: true,    
    };

    try {
      // Compress the file
      const compressedFile = await imageCompression(file, options);
      
      // Save the optimized file
      setImageFile(compressedFile);
      setImagePreview(URL.createObjectURL(compressedFile));
      
      // Log for debugging
      console.log(`Original: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Compressed: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
      
    } catch (error) {
      console.error("Compression Error:", error);
      toast.error("Could not process image. Please try again.");
    } finally {
      setCompressing(false);
    }
  };

  // ---------------------------------------------------------
  // 2. UPLOAD TO CLOUDINARY (Using your keys)
  // ---------------------------------------------------------
  const uploadToCloudinary = async () => {
    if (!imageFile) return null;

    setUploading(true);
    const data = new FormData();
    data.append("file", imageFile);
    
    // ✅ YOUR ACTUAL KEYS
    data.append("upload_preset", "blyk4zvv"); 
    data.append("cloud_name", "dy9p4ifpj"); 

    try {
      // ✅ YOUR ACTUAL CLOUD URL
      const res = await fetch("https://api.cloudinary.com/v1_1/dy9p4ifpj/image/upload", {
        method: "POST",
        body: data,
      });
      
      const result = await res.json();
      setUploading(false);
      
      if (result.secure_url) {
        console.log("Upload Success:", result.secure_url);
        return result.secure_url;
      } else {
        console.error("Cloudinary Response:", result);
        throw new Error("Cloudinary upload failed");
      }
    } catch (error) {
      setUploading(false);
      console.error("Upload Error:", error);
      toast.error("Failed to upload image. Check internet connection.");
      return null;
    }
  };

  // ---------------------------------------------------------
  // 3. FORM SUBMISSION
  // ---------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🛑 Validation
    if (formData.role === 'student') {
      if (!formData.parentEmail) return toast.error("Parent email is required!");
      if (!imageFile) return toast.error("Please upload a Profile Photo / Selfie!");
    }

    setLoading(true);
    try {
      let imageUrl = "";

      // A. Upload Image First (if student)
      if (formData.role === 'student' && imageFile) {
        imageUrl = await uploadToCloudinary();
        if (!imageUrl) {
          setLoading(false);
          return; // Stop if upload failed
        }
      }

      // B. Get Device ID
      const deviceId = getDeviceId();

      // C. Register User with Image URL
      const payload = { 
        ...formData, 
        deviceId,
        profileImage: imageUrl || undefined
      };

      await API.post('/users/register', payload);
      
      toast.success("Registration Successful! Waiting for approval.");
      navigate('/'); 
    } catch (err) {
      console.error("Registration Error:", err);
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <h2 className="text-3xl font-bold mb-2 text-center text-slate-800">Create Account</h2>
        <p className="text-center text-slate-500 text-sm mb-8">College Attendance & Security Portal</p>
        
        {/* --- COMMON FIELDS --- */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input 
              name="name" 
              placeholder="Full Name" 
              onChange={handleChange} 
              required 
              className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" 
            />
          </div>
          
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input 
              name="email" 
              type="email" 
              placeholder="College Email Address" 
              onChange={handleChange} 
              required 
              className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" 
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input 
              name="password" 
              type={showPassword ? "text" : "password"} 
              placeholder="Create Password" 
              onChange={handleChange} 
              required 
              className="w-full pl-10 pr-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" 
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-slate-400 hover:text-blue-600 transition"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        
        {/* --- ROLE SELECTION --- */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest">Account Type</label>
          <div className="grid grid-cols-2 gap-3">
              {['student', 'teacher'].map((role) => (
                <label key={role} className={`cursor-pointer text-center py-2.5 rounded-xl border-2 transition-all font-bold capitalize ${formData.role === role ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'}`}>
                  <input type="radio" name="role" value={role} checked={formData.role === role} onChange={handleChange} className="hidden"/>
                  {role}
                </label>
              ))}
          </div>
        </div>

        {/* --- CONDITIONAL FIELDS --- */}

        {/* 1. STUDENT FIELDS (Security + Image) */}
        {formData.role === 'student' && (
          <div className="bg-slate-50 p-5 rounded-2xl mb-6 space-y-4 animate-fade-in border border-slate-100">
            <div className="flex items-center gap-2 text-[10px] text-blue-600 font-black uppercase tracking-tighter">
               <Smartphone size={14} />
               <span>Hardware Binding Enabled</span>
            </div>

            {/* 📸 IMAGE UPLOAD SECTION */}
            <div className="flex flex-col items-center justify-center mb-4">
                <label className="cursor-pointer relative group">
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200 flex items-center justify-center relative">
                        {/* Loading Spinner during compression */}
                        {compressing && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                            <Loader className="animate-spin text-white" size={24}/>
                          </div>
                        )}
                        
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <User size={40} className="text-gray-400" />
                        )}
                    </div>
                    <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-md group-hover:bg-blue-700 transition">
                        <Camera size={16} />
                    </div>
                    {/* capture="user" forces front camera on mobile */}
                    <input type="file" accept="image/*" capture="user" onChange={handleImageChange} className="hidden" />
                </label>
                <p className="text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-widest">
                    {compressing ? "Optimizing Image..." : imageFile ? "Photo Ready" : "Tap to take Selfie"}
                </p>
            </div>

            <div className="relative">
                <FileText className="absolute left-3 top-3.5 text-blue-500" size={18} />
                <input 
                  name="rollNumber" 
                  placeholder="Roll Number" 
                  onChange={handleChange} 
                  required 
                  className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                />
            </div>

            <div className="relative">
                <HeartHandshake className="absolute left-3 top-3.5 text-pink-500" size={18} />
                <input 
                  name="parentEmail" 
                  type="email"
                  placeholder="Father/Parent Email for Alerts" 
                  onChange={handleChange} 
                  required 
                  className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                />
            </div>

            <div className="relative">
                <GraduationCap className="absolute left-3 top-3.5 text-blue-500" size={18} />
                <select 
                  name="stream" 
                  onChange={handleChange} 
                  value={formData.stream}
                  className="w-full pl-10 p-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none bg-white appearance-none"
                >
                  <option value="MCA">MCA (Master of Computer App)</option>
                  <option value="MBA">MBA (Master of Business Admin)</option>
                </select>
            </div>
          </div>
        )}

        {/* 2. TEACHER FIELDS */}
        {formData.role === 'teacher' && (
          <div className="bg-slate-50 p-5 rounded-2xl mb-6 animate-fade-in border border-slate-100">
              <div className="relative">
                <Briefcase className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input 
                  name="department" 
                  placeholder="Department (e.g. IT, Management)" 
                  onChange={handleChange} 
                  required 
                  className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                />
             </div>
          </div>
        )}

        <button 
          disabled={loading || uploading || compressing}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-blue-600 transition shadow-lg transform active:scale-95 disabled:bg-slate-300 flex items-center justify-center gap-2"
        >
          {(loading || uploading || compressing) ? (
             <><Loader className="animate-spin" size={20}/> {compressing ? "Compressing..." : uploading ? "Uploading..." : "Creating..."}</>
          ) : "Complete Registration"}
        </button>
        
        <p className="mt-8 text-center text-sm text-slate-500">
          Member already? <Link to="/" className="text-blue-600 hover:underline font-bold">Login here</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;