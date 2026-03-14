const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
    
    return conn;
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

// backend/config/database.js
const config = require('./environment');

module.exports = {
  development: {
    username: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME + '_dev',
    host: config.DB_HOST,
    port: config.DB_PORT,
    dialect: 'postgres',
    logging: true
  },
  test: {
    username: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME + '_test',
    host: config.DB_HOST,
    port: config.DB_PORT,
    dialect: 'postgres',
    logging: false
  },
  production: {
    username: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    host: config.DB_HOST,
    port: config.DB_PORT,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: config.DB_SSL ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
};

module.exports = connectDB;
