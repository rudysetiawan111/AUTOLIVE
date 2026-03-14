const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/authRoutes');
const channelsRoutes = require('./routes/channelsRoutes');
const videosRoutes = require('./routes/videosRoutes');
const viralRoutes = require('./routes/viralRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const automationRoutes = require('./routes/automationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Initialize express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
app.use(morgan('combined'));

// Rate limiting
app.use('/api/', rateLimiter);

// Static files
app.use('/storage', express.static(path.join(__dirname, '../storage')));
app.use('/uploads', express.static(path.join(__dirname, '../storage/uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/channels', channelsRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/viral', viralRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API documentation redirect
app.get('/', (req, res) => {
  res.redirect('/api/docs');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND'
    }
  });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
