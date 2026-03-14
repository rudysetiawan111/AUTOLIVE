// backend/config/environment.js
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  // Server Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  API_VERSION: process.env.API_VERSION || 'v1',
  
  // Database Configuration
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 5432,
  DB_NAME: process.env.DB_NAME || 'autolive',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_SSL: process.env.DB_SSL === 'true',
  
  // Redis Configuration
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: process.env.REDIS_PORT || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  
  // Encryption
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'encryption-key-32-chars-long!!',
  
  // Email Configuration
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: process.env.EMAIL_PORT || 587,
  EMAIL_SECURE: process.env.EMAIL_SECURE === 'true',
  EMAIL_USER: process.env.EMAIL_USER || 'noreply@autolive.com',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'AUTOLIVE <noreply@autolive.com>',
  
  // Storage Configuration
  STORAGE_TYPE: process.env.STORAGE_TYPE || 'local', // local, s3, gcs
  STORAGE_PATH: process.env.STORAGE_PATH || path.join(__dirname, '../../storage'),
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES?.split(',') || ['mp4', 'mov', 'avi', 'jpg', 'png'],
  
  // AWS S3 Configuration (if using S3)
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_BUCKET: process.env.AWS_BUCKET,
  
  // Google Cloud Storage (if using GCS)
  GCS_PROJECT_ID: process.env.GCS_PROJECT_ID,
  GCS_KEY_FILE: process.env.GCS_KEY_FILE,
  GCS_BUCKET: process.env.GCS_BUCKET,
  
  // YouTube API Configuration
  YOUTUBE_CLIENT_ID: process.env.YOUTUBE_CLIENT_ID,
  YOUTUBE_CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET,
  YOUTUBE_REDIRECT_URI: process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/auth/youtube/callback',
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
  
  // TikTok API Configuration
  TIKTOK_CLIENT_KEY: process.env.TIKTOK_CLIENT_KEY,
  TIKTOK_CLIENT_SECRET: process.env.TIKTOK_CLIENT_SECRET,
  TIKTOK_REDIRECT_URI: process.env.TIKTOK_REDIRECT_URI || 'http://localhost:3000/auth/tiktok/callback',
  
  // OpenAI Configuration (for AI features)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  
  // File Upload Limits
  AVATAR_MAX_SIZE: parseInt(process.env.AVATAR_MAX_SIZE) || 2 * 1024 * 1024, // 2MB
  VIDEO_MAX_SIZE: parseInt(process.env.VIDEO_MAX_SIZE) || 500 * 1024 * 1024, // 500MB
  ALLOWED_AVATAR_TYPES: process.env.ALLOWED_AVATAR_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/gif'],
  ALLOWED_VIDEO_TYPES: process.env.ALLOWED_VIDEO_TYPES?.split(',') || ['video/mp4', 'video/quicktime'],
  
  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:8080',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || path.join(__dirname, '../../logs/app.log'),
  
  // Session Configuration
  SESSION_SECRET: process.env.SESSION_SECRET || 'session-secret-key',
  SESSION_MAX_AGE: parseInt(process.env.SESSION_MAX_AGE) || 7 * 24 * 60 * 60 * 1000, // 7 days
  
  // 2FA Configuration
  TWO_FACTOR_APP_NAME: process.env.TWO_FACTOR_APP_NAME || 'AUTOLIVE',
  
  // Backup Configuration
  BACKUP_ENABLED: process.env.BACKUP_ENABLED === 'true',
  BACKUP_SCHEDULE: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
  BACKUP_RETENTION_DAYS: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
  
  // Monitoring
  SENTRY_DSN: process.env.SENTRY_DSN,
  
  // Frontend URL
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:8080',
  
  // API URL
  API_URL: process.env.API_URL || 'http://localhost:3000/api/v1',
  
  // Feature Flags
  FEATURE_AI_TITLES: process.env.FEATURE_AI_TITLES === 'true',
  FEATURE_AI_HASHTAGS: process.env.FEATURE_AI_HASHTAGS === 'true',
  FEATURE_VIDEO_ANALYSIS: process.env.FEATURE_VIDEO_ANALYSIS === 'true',
  FEATURE_ADVANCED_ANALYTICS: process.env.FEATURE_ADVANCED_ANALYTICS === 'true',
  
  // Maintenance Mode
  MAINTENANCE_MODE: process.env.MAINTENANCE_MODE === 'true',
  MAINTENANCE_MESSAGE: process.env.MAINTENANCE_MESSAGE || 'System under maintenance',
  
  // Helper function to check if in production
  isProduction: () => process.env.NODE_ENV === 'production',
  
  // Helper function to check if in development
  isDevelopment: () => process.env.NODE_ENV === 'development',
  
  // Helper function to check if in test
  isTest: () => process.env.NODE_ENV === 'test'
};
