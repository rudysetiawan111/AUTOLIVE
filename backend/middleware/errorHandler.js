const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.userId,
    timestamp: new Date().toISOString()
  });

  // Default error
  let error = {
    message: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    statusCode: err.statusCode || 500
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    // Mongoose validation error
    error = {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      details: Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }))
    };
  }

  if (err.name === 'CastError') {
    // Mongoose cast error (invalid ID)
    error = {
      message: 'Invalid resource ID',
      code: 'INVALID_ID',
      statusCode: 400
    };
  }

  if (err.code === 11000) {
    // MongoDB duplicate key error
    const field = Object.keys(err.keyPattern)[0];
    error = {
      message: `${field} already exists`,
      code: 'DUPLICATE_ERROR',
      statusCode: 409
    };
  }

  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Invalid token',
      code: 'INVALID_TOKEN',
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token expired',
      code: 'TOKEN_EXPIRED',
      statusCode: 401
    };
  }

  if (err.name === 'MulterError') {
    // File upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = {
        message: 'File too large',
        code: 'FILE_TOO_LARGE',
        statusCode: 400
      };
    } else {
      error = {
        message: err.message,
        code: 'UPLOAD_ERROR',
        statusCode: 400
      };
    }
  }

  // Handle axios errors
  if (err.isAxiosError) {
    error = {
      message: err.response?.data?.message || 'External API error',
      code: 'EXTERNAL_API_ERROR',
      statusCode: err.response?.status || 502,
      details: {
        service: err.config?.url,
        status: err.response?.status
      }
    };
  }

  // Handle rate limit errors
  if (err.name === 'RateLimitError') {
    error = {
      message: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429
    };
  }

  // Handle file system errors
  if (err.code === 'ENOENT') {
    error = {
      message: 'File not found',
      code: 'FILE_NOT_FOUND',
      statusCode: 404
    };
  }

  if (err.code === 'EACCES') {
    error = {
      message: 'Permission denied',
      code: 'PERMISSION_DENIED',
      statusCode: 403
    };
  }

  // Send response
  res.status(error.statusCode).json({
    success: false,
    error: {
      message: error.message,
      code: error.code,
      ...(error.details && { details: error.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Route not found: ${req.method} ${req.originalUrl}`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

// Unhandled rejection handler
const unhandledRejectionHandler = (err) => {
  logger.error('UNHANDLED REJECTION:', err);
  process.exit(1);
};

// Uncaught exception handler
const uncaughtExceptionHandler = (err) => {
  logger.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
};

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler,
  unhandledRejectionHandler,
  uncaughtExceptionHandler
};
