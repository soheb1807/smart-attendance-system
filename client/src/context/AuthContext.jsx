import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api'; // Ensure you import your API instance

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Prevents flickering on refresh
  const navigate = useNavigate();

  // 1. Check if user is logged in when the app starts
  useEffect(() => {
    const checkLoginStatus = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // CRITICAL: Set the token for all API requests immediately
          API.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } catch (error) {
          console.error("Session Error:", error);
          localStorage.clear();
        }
      }
      setLoading(false); // App is ready to render
    };

    checkLoginStatus();
  }, []);

  // 2. Login Function
  const login = (userData) => {
    // userData comes from backend: { _id, name, role, stream, rollNumber, token... }
    
    // Save Token & User separately
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Set State
    setUser(userData);

    // Set Token for API calls (Fixes "Unauthorized" errors)
    API.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;

    // Redirect based on Role
    if (userData.role === 'admin') navigate('/admin');
    else if (userData.role === 'teacher') navigate('/teacher');
    else if (userData.role === 'student') navigate('/student');
    else if (userData.role === 'parent') navigate('/parent-dashboard');
    else navigate('/');
  };

  // 3. Logout Function
  const logout = () => {
    // Clear everything
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete API.defaults.headers.common['Authorization'];
    
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};