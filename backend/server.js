// backend/server.js

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const cron = require('node-cron');
const fs = require('fs-extra');
const mongoose = require('mongoose');

// Logger
const logger = require('./utils/logger');

// Routes
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

// Services
const emailService = require('./services/emailService');
const storageCleaner = require('./cleanup/storageCleaner');
const scheduler = require('./automation/scheduler');
const telegramService = require('./services/telegramService');

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

/* =========================
   DATABASE
========================= */

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("MongoDB Connected");
  } catch (err) {
    logger.error("MongoDB Connection Error", err);
    process.exit(1);
  }
}

connectDB();

/* =========================
   CREATE STORAGE DIR
========================= */

async function createDirectories() {

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

  logger.info("Storage directories ready");
}

createDirectories();

/* =========================
   MIDDLEWARE
========================= */

app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan('combined', {
  stream: {
    write: message => logger.info(message.trim())
  }
}));

/* =========================
   SESSION
========================= */

app.use(session({
  secret: process.env.SESSION_SECRET || 'autolive-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
  })
}));

app.use(passport.initialize());
app.use(passport.session());

require('./config/passport')(passport);

/* =========================
   RATE LIMIT
========================= */

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api', limiter);

/* =========================
   STATIC FILES
========================= */

app.use('/storage', express.static(path.join(__dirname, '../storage')));

/* =========================
   SOCKET.IO
========================= */

io.on('connection', (socket) => {

  logger.info(`Client connected ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Client disconnected ${socket.id}`);
  });

});

/* =========================
   ROUTES
========================= */

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

/* =========================
   HEALTH CHECK
========================= */

app.get('/health', (req,res)=>{

  res.json({
    status:"ok",
    uptime:process.uptime(),
    timestamp:new Date()
  })

})

/* =========================
   CRON JOB
========================= */

cron.schedule('0 3 * * *', async () => {

  logger.info("Running storage cleanup");

  try{

    const result = await storageCleaner.cleanup();

    logger.info(`Cleanup done: ${result.cleaned} files`);

  }catch(err){

    logger.error("Cleanup error",err);

  }

});

/* =========================
   SERVICES INIT
========================= */

scheduler.initialize();
telegramService.initialize();

/* =========================
   ERROR HANDLER
========================= */

app.use((err,req,res,next)=>{

  logger.error(err);

  res.status(500).json({
    success:false,
    message:err.message
  })

});

/* =========================
   START SERVER
========================= */

httpServer.listen(PORT, () => {

  logger.info(`🚀 AUTOLIVE server running`);
  logger.info(`PORT : ${PORT}`);
  logger.info(`ENV  : ${process.env.NODE_ENV}`);

});

/* =========================
   GRACEFUL SHUTDOWN
========================= */

process.on("SIGINT", async () => {

  logger.info("Shutting down server");

  await mongoose.connection.close();

  process.exit(0);

});

module.exports = { app, httpServer, io };
