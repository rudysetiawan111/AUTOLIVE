const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const { createClient } = require('redis');

let redisClient;
let store;

// Initialize Redis client if available
if (process.env.REDIS_URL) {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      legacyMode: false
    });

    redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
    });

    redisClient.connect().then(() => {
      console.log('Redis connected for rate limiting');
    });

    store = new RedisStore({
      // @ts-expect-error - Known issue with redis client types
      client: redisClient,
      prefix: 'rl:'
    });
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    store = new rateLimit.MemoryStore();
  }
} else {
  store = new rateLimit.MemoryStore();
}

// General API rate limiter
const apiLimiter = rateLimit({
  store,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.userId || req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for certain paths
    const skipPaths = ['/health', '/api/docs'];
    return skipPaths.includes(req.path);
  }
});

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  store,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful requests
});

// Upload rate limiter
const uploadLimiter = rateLimit({
  store,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each user to 20 uploads per hour
  message: {
    success: false,
    error: {
      message: 'Upload limit exceeded, please try again later.',
      code: 'UPLOAD_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId // Use user ID for upload limits
});

// Download rate limiter
const downloadLimiter = rateLimit({
  store,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each user to 50 downloads per hour
  message: {
    success: false,
    error: {
      message: 'Download limit exceeded, please try again later.',
      code: 'DOWNLOAD_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId
});

// API key rate limiter for external services
const apiKeyLimiter = rateLimit({
  store,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // Higher limit for API keys
  message: {
    success: false,
    error: {
      message: 'API rate limit exceeded.',
      code: 'API_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use API key for limiting
    return req.headers['x-api-key'] || req.ip;
  }
});

// Create custom rate limiter with options
const createRateLimiter = (options) => {
  return rateLimit({
    store,
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: options.message || {
      success: false,
      error: {
        message: 'Too many requests, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator,
    skip: options.skip,
    ...options
  });
};

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  downloadLimiter,
  apiKeyLimiter,
  createRateLimiter
};
