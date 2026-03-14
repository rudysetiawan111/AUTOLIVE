// backend/server.js
const express = require('express');
const config = require('./config/environment');
const app = require('./app');

const server = app.listen(config.PORT, () => {
  console.log(`Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
  console.log(`API URL: ${config.API_URL}`);
  console.log(`Frontend URL: ${config.FRONTEND_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const cron = require('node-cron');
const fs = require('fs-extra');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

// Import utilities
const logger = require('./utils/logger');

// Import database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('MongoDB Connected Successfully');
  } catch (error) {
    logger.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
};

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

// Import services
const emailService = require('./services/emailService');
const storageCleaner = require('./cleanup/storageCleaner');
const scheduler = require('./automation/scheduler');
const telegramService = require('./services/telegramService');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Create storage directories
const createDirectories = async () => {
  const dirs = [
    './storage/downloads',
    './storage/processed',
    './storage/uploads',
    './storage/temp',
    './logs'
  ];
  
  for (const dir of dirs) {
    await fs.ensureDir(dir);
  }
  logger.info('Storage directories created');
};

createDirectories();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'autolive-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60 // 14 days
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 14,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});
app.use('/api/', limiter);

// Static files
app.use('/storage/downloads', express.static(path.join(__dirname, '../storage/downloads')));
app.use('/storage/processed', express.static(path.join(__dirname, '../storage/processed')));
app.use('/storage/uploads', express.static(path.join(__dirname, '../storage/uploads')));

// Socket.IO for real-time monitoring
io.on('connection', (socket) => {
  logger.info(`New client connected: ${socket.id}`);
  
  socket.on('authenticate', (token) => {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.join(`user:${decoded.userId}`);
      socket.emit('authenticated', { success: true });
      logger.info(`Socket ${socket.id} authenticated as user ${decoded.userId}`);
    } catch (err) {
      socket.emit('error', 'Authentication failed');
    }
  });
  
  socket.on('subscribe:automation', (automationId) => {
    if (socket.userId) {
      socket.join(`automation:${automationId}`);
    }
  });
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

app.set('io', io);

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
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Schedule automatic storage cleanup (runs daily at 3 AM)
cron.schedule('0 3 * * *', async () => {
  logger.info('Running scheduled storage cleanup');
  try {
    const result = await storageCleaner.cleanup();
    logger.info(`Storage cleanup completed: ${result.cleaned} files removed, ${result.freedSpace} bytes freed`);
    
    // Send report to admin
    await emailService.sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: 'Storage Cleanup Report',
      html: `
        <h2>Storage Cleanup Report</h2>
        <p>Files removed: ${result.cleaned}</p>
        <p>Space freed: ${(result.freedSpace / 1024 / 1024).toFixed(2)} MB</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      `
    });
  } catch (error) {
    logger.error('Storage cleanup failed:', error);
  }
});

// Initialize automation scheduler
scheduler.initialize();

// Initialize Telegram bot
telegramService.initialize();

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`Frontend URL: ${process.env.FRONTEND_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    mongoose.connection.close();
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    mongoose.connection.close();
    logger.info('Process terminated');
    process.exit(0);
  });
});

module.exports = { app, httpServer, io };
