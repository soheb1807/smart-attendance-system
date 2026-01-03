const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

// Load Config
dotenv.config();

const app = express();

// --- 🕵️‍♂️ THE SPY (DEBUG MIDDLEWARE) ---
// This prints every single request to your terminal.
// It helps you verify if the Frontend is connecting to the Backend.

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cors({
  origin: '*', 
  credentials: true
}));
app.use(helmet()); // Production security headers

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.log('❌ DB Error:', err));

// --- ROUTES ---
// Debug log to ensure routes are loading
console.log("Loading Routes...");

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));

// Test Route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error Handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));