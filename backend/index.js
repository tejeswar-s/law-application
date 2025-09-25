require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/authRoutes');
const attorneyRoutes = require('./routes/attorneyRoutes');
const jurorRoutes = require('./routes/jurorRoutes');
const scheduleTrialRoutes = require("./routes/scheduleTrial");
const warRoomTeamRoutes = require("./routes/warRoomTeamRoutes");
const warRoomDocumentRoutes = require("./routes/warRoomDocumentRoutes");
const warRoomVoirDireRoutes = require("./routes/warRoomVoirDireRoutes");
const warRoomInfoRoutes = require("./routes/warRoomInfoRoutes"); // <-- Add this import
const adminRoutes = require('./routes/admin');
// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Import database connection
const { poolPromise } = require('./config/db');

const app = express();
const { BlobServiceClient } = require("@azure/storage-blob");

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests to static assets
  skip: (req, res) => res.statusCode < 400,
});

app.use('/api', globalLimiter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request().query('SELECT 1 as test');
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed'
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/attorney', attorneyRoutes);
app.use('/api/juror', jurorRoutes);
app.use('/api',scheduleTrialRoutes);
app.use('/api', require('./routes/caseRoutes'));
app.use("/api", warRoomTeamRoutes);
app.use("/api", warRoomDocumentRoutes);
app.use("/api", warRoomVoirDireRoutes);
app.use("/api", warRoomInfoRoutes); // <-- Add this line after other app.use("/api", ...) routes
app.use('/api/admin', adminRoutes);

// Test route for database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT @@VERSION as version, GETDATE() as currentTime');
    res.json({
      success: true,
      database: result.recordset[0]
    });
  } catch (err) {
    console.error('Database test error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Database connection failed',
      message: err.message 
    });
  }
});

// Test route for existing TestDump table (if exists)
app.get('/api/test-dump', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT TOP 10 * FROM TestDump');
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (err) {
    console.error('TestDump query error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching from TestDump table',
      message: err.message 
    });
  }
});

// 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler (should be last middleware)
app.use(errorHandler);

// Initialize database connection and start server
async function startServer() {
  try {
    // Test database connection
    await poolPromise;
    console.log('✅ Database connection established successfully');
    
    const PORT = process.env.PORT || 4000;
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received. Shutting down gracefully...');
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();