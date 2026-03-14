const winston = require('winston');
const path = require('path');
const fs = require('fs-extra');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
fs.ensureDirSync(logsDir);

// Define log formats
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta) : ''
    }`;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat
    }),
    
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    })
  ]
});

// Create child logger with context
logger.child = (context) => {
  return logger.child(context);
};

// Request logging middleware
logger.requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.userId
    };

    if (res.statusCode >= 500) {
      logger.error('Request failed', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request warning', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};

// Performance logging
logger.performance = (operation, duration) => {
  logger.info('Performance metric', {
    operation,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString()
  });
};

// Database query logging
logger.query = (collection, operation, duration, query) => {
  logger.debug('Database query', {
    collection,
    operation,
    duration: `${duration}ms`,
    query: JSON.stringify(query)
  });
};

// API call logging
logger.apiCall = (service, endpoint, duration, status) => {
  logger.info('External API call', {
    service,
    endpoint,
    duration: `${duration}ms`,
    status
  });
};

// User action logging
logger.userAction = (userId, action, details) => {
  logger.info('User action', {
    userId,
    action,
    ...details,
    timestamp: new Date().toISOString()
  });
};

// System event logging
logger.system = (event, details) => {
  logger.info('System event', {
    event,
    ...details,
    timestamp: new Date().toISOString()
  });
};

// Security event logging
logger.security = (event, userId, ip, details) => {
  logger.warn('Security event', {
    event,
    userId,
    ip,
    ...details,
    timestamp: new Date().toISOString()
  });
};

// Stream for morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;
