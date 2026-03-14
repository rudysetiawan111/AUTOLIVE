const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

class AuthService {
  // Generate JWT token
  generateToken(payload, expiresIn = '7d') {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  }
  
  // Generate refresh token
  generateRefreshToken(payload) {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
  }
  
  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
  
  // Verify refresh token
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
  
  // Authentication middleware
  authenticate = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = this.verifyToken(token);
        req.userId = decoded.userId;
        next();
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }
    } catch (error) {
      logger.error('Auth middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication error'
      });
    }
  };
  
  // Exchange TikTok code for token
  async exchangeTikTokCode(code) {
    const axios = require('axios');
    
    try {
      const response = await axios.post('https://open-api.tiktok.com/oauth/access_token/', {
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code'
      });
      
      return response.data.data;
    } catch (error) {
      logger.error('TikTok code exchange error:', error);
      throw new Error('Failed to exchange TikTok code');
    }
  }
  
  // Get TikTok user info
  async getTikTokUser(accessToken) {
    const axios = require('axios');
    
    try {
      const response = await axios.get('https://open-api.tiktok.com/user/info/', {
        params: {
          access_token: accessToken
        }
      });
      
      return response.data.data;
    } catch (error) {
      logger.error('Get TikTok user error:', error);
      throw new Error('Failed to get TikTok user info');
    }
  }
}

module.exports = new AuthService();
