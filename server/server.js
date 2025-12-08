import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import sqlRoutes from './routes/sql.routes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

// Load environment variables
config();

// Application initialization
const app = express();
const PORT = process.env.PORT || 3000;

// Logging
console.log('🔑 API Key loaded:', process.env.GEMINI_API_KEY ? 'Yes' : 'No');
console.log('🚀 Starting DataSpeaks SQL Query API Server...');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'DataSpeaks SQL Query API',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/',
      sql: '/api/sql',
      dashboards: '/api/dashboards'
    }
  });
});

// API Routes
app.use('/api/sql', sqlRoutes);
app.use('/api/dashboards', dashboardRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: ['/api/sql', '/api/dashboards']
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
