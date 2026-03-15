const winston = require('winston');
const path = require('path');
const DailyRotateFile = require('winston-daily-rotate-file');

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

// Add colors to winston
winston.addColors(colors);

// Custom format for logs
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
);

// Custom format for error logs with stack traces
const errorFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Define which transports to use
const transports = [
    // Console transport for all logs
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
    }),
    
    // Error log rotation
    new DailyRotateFile({
        filename: path.join(__dirname, 'logs/error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        format: errorFormat,
        maxSize: '20m',
        maxFiles: '14d',
        handleExceptions: true,
    }),
    
    // Access log rotation
    new DailyRotateFile({
        filename: path.join(__dirname, 'logs/access-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'http',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
        maxSize: '20m',
        maxFiles: '30d',
    }),
    
    // Combined log rotation for all levels
    new DailyRotateFile({
        filename: path.join(__dirname, 'logs/combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
        maxSize: '20m',
        maxFiles: '7d',
    }),
    
    // Stream events specific log
    new DailyRotateFile({
        filename: path.join(__dirname, 'logs/streams-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
        maxSize: '50m',
        maxFiles: '7d',
    }),
    
    // Performance metrics log
    new DailyRotateFile({
        filename: path.join(__dirname, 'logs/metrics-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'debug',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
        maxSize: '10m',
        maxFiles: '3d',
    }),
];

// Create the logger instance
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    levels,
    format,
    transports,
    exceptionHandlers: [
        new winston.transports.File({ filename: path.join(__dirname, 'logs/exceptions.log') })
    ],
    rejectionHandlers: [
        new winston.transports.File({ filename: path.join(__dirname, 'logs/rejections.log') })
    ],
});

// Morgan stream for HTTP logging
logger.stream = {
    write: (message) => {
        logger.http(message.trim());
    },
};

// Custom logging methods for specific events
logger.logStreamEvent = (event, data) => {
    logger.info(`STREAM_EVENT: ${event}`, { 
        event, 
        ...data,
        timestamp: new Date().toISOString() 
    });
};

logger.logUserAction = (userId, action, details) => {
    logger.info(`USER_ACTION: ${userId} - ${action}`, {
        userId,
        action,
        ...details,
        timestamp: new Date().toISOString()
    });
};

logger.logSystemMetric = (metric, value, tags = {}) => {
    logger.debug(`METRIC: ${metric} = ${value}`, {
        metric,
        value,
        tags,
        timestamp: new Date().toISOString()
    });
};

logger.logSecurityEvent = (event, userId, ip, details) => {
    logger.warn(`SECURITY: ${event} - User: ${userId || 'anonymous'} - IP: ${ip}`, {
        event,
        userId,
        ip,
        ...details,
        timestamp: new Date().toISOString()
    });
};

logger.logAPIRequest = (req, res, responseTime) => {
    const logData = {
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        responseTime: `${responseTime}ms`,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        userId: req.user?._id || 'anonymous',
        timestamp: new Date().toISOString()
    };

    if (res.statusCode >= 400) {
        logger.error(`API Request Failed: ${req.method} ${req.url}`, logData);
    } else {
        logger.http(`API Request: ${req.method} ${req.url}`, logData);
    }
};

// Performance tracking
logger.trackPerformance = (operation, startTime) => {
    const duration = Date.now() - startTime;
    logger.debug(`PERF: ${operation} took ${duration}ms`);
    
    // Alert if performance is degraded
    if (duration > 1000) {
        logger.warn(`PERF_WARNING: ${operation} took ${duration}ms - exceeding threshold`);
    }
    
    return duration;
};

// Database query logging
logger.logQuery = (collection, operation, query, duration) => {
    logger.debug(`DB_QUERY: ${collection}.${operation} - ${duration}ms`, {
        collection,
        operation,
        query: JSON.stringify(query).substring(0, 200),
        duration
    });
};

// Stream health monitoring
logger.logStreamHealth = (streamId, metrics) => {
    logger.info(`STREAM_HEALTH: ${streamId}`, {
        streamId,
        ...metrics,
        timestamp: new Date().toISOString()
    });

    // Alert on stream issues
    if (metrics.bitrate < 1000) {
        logger.warn(`STREAM_QUALITY: ${streamId} - Low bitrate detected: ${metrics.bitrate}kbps`);
    }
    
    if (metrics.packetLoss > 5) {
        logger.error(`STREAM_QUALITY: ${streamId} - High packet loss: ${metrics.packetLoss}%`);
    }
};

// Error tracking with context
logger.logErrorWithContext = (error, context = {}) => {
    const errorLog = {
        message: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name,
        ...context,
        timestamp: new Date().toISOString()
    };

    logger.error(`ERROR: ${error.message}`, errorLog);

    // Additional handling for specific error types
    if (error.code === 'ECONNREFUSED') {
        logger.logSecurityEvent('database_connection_failed', null, null, errorLog);
    }
    
    if (error.name === 'ValidationError') {
        logger.warn('Validation Error', errorLog);
    }
};

// Create log summary for monitoring
logger.getLogSummary = async () => {
    const fs = require('fs').promises;
    const logsDir = path.join(__dirname, 'logs');
    
    try {
        const files = await fs.readdir(logsDir);
        const stats = await Promise.all(
            files.map(async (file) => {
                const filePath = path.join(logsDir, file);
                const stat = await fs.stat(filePath);
                return {
                    file,
                    size: stat.size,
                    modified: stat.mtime
                };
            })
        );
        
        return {
            totalFiles: files.length,
            totalSize: stats.reduce((acc, s) => acc + s.size, 0),
            files: stats.sort((a, b) => b.modified - a.modified)
        };
    } catch (error) {
        logger.error('Failed to get log summary', error);
        return null;
    }
};

module.exports = logger;
