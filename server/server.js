import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { config } from 'dotenv';
import { passport } from './config/passport.js';
import authRoutes from './routes/authRoutes.js';
import sqlRoutes from './routes/sql.routes.js';
import mongodbRoutes from './routes/mongodb.routes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

// Load environment variables
config();

// Application initialization
const app = express();
const PORT = process.env.PORT || 3000;

// Logging
console.log('🔑 API Key loaded:', process.env.GEMINI_API_KEY ? 'Yes' : 'No');
console.log('🚀 Starting DataSpeaks Multi-Database Query API Server...');

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'dataspeaks-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'DataSpeaks Multi-Database Query API',
    version: '4.0.0',
    timestamp: new Date().toISOString(),
    databases: ['SQL (MySQL, PostgreSQL, SQLite, SQL Server)', 'MongoDB'],
    endpoints: {
      health: '/',
      auth: '/api/auth',
      sql: '/api/sql',
      mongodb: '/api/mongodb',
      dashboards: '/api/dashboards'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sql', sqlRoutes);
app.use('/api/mongodb', mongodbRoutes);
app.use('/api/dashboards', dashboardRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: ['/api/auth', '/api/sql', '/api/mongodb', '/api/dashboards']
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err.details 
    })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🎉 Server running successfully!`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}\n`);
});
