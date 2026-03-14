const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const authService = require('../services/authService');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

// @route   POST /api/auth/register
// @desc    Register new user with email/password
// @access  Public
router.post('/register',
  [
    body('name').notEmpty().withMessage('Nama harus diisi'),
    body('email').isEmail().withMessage('Email tidak valid'),
    body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      
      const { name, email, password } = req.body;
      
      // Check if user exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah terdaftar'
        });
      }
      
      // Create new user
      user = new User({
        name,
        email,
        password,
        authProvider: 'local',
        isVerified: false
      });
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      
      await user.save();
      
      // Generate verification token
      const verificationToken = authService.generateToken({ userId: user._id }, '24h');
      
      // Send verification email
      await emailService.sendEmail({
        to: email,
        subject: 'Verifikasi Email AUTOLIVE',
        template: 'verification',
        data: {
          name,
          verificationLink: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
        }
      });
      
      // Generate JWT for auto-login
      const token = authService.generateToken({ userId: user._id });
      const refreshToken = authService.generateRefreshToken({ userId: user._id });
      
      res.status(201).json({
        success: true,
        message: 'Registrasi berhasil. Silakan cek email untuk verifikasi.',
        data: {
          token,
          refreshToken,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        }
      });
    } catch (error) {
      logger.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login with email/password
// @access  Public
router.post('/login',
  [
    body('email').isEmail().withMessage('Email tidak valid'),
    body('password').notEmpty().withMessage('Password harus diisi')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      
      const { email, password } = req.body;
      
      // Find user
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Email atau password salah'
        });
      }
      
      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Email atau password salah'
        });
      }
      
      // Update last login
      user.lastLogin = new Date();
      await user.save();
      
      // Generate tokens
      const token = authService.generateToken({ userId: user._id });
      const refreshToken = authService.generateRefreshToken({ userId: user._id });
      
      res.json({
        success: true,
        message: 'Login berhasil',
        data: {
          token,
          refreshToken,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            isVerified: user.isVerified
          }
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  }
);

// @route   GET /api/auth/google
// @desc    Authenticate with Google
// @access  Public
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/youtube.upload'] 
  })
);

// @route   GET /api/auth/google/callback
// @desc    Google auth callback
// @access  Public
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  async (req, res) => {
    try {
      const user = req.user;
      
      // Generate JWT
      const token = authService.generateToken({ userId: user._id });
      const refreshToken = authService.generateRefreshToken({ userId: user._id });
      
      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}`);
    } catch (error) {
      logger.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
  }
);

// @route   POST /api/auth/tiktok
// @desc    Authenticate with TikTok
// @access  Public
router.post('/tiktok', async (req, res) => {
  try {
    const { code } = req.body;
    
    // Exchange code for token
    const tokenData = await authService.exchangeTikTokCode(code);
    
    // Get user info from TikTok
    const tiktokUser = await authService.getTikTokUser(tokenData.access_token);
    
    // Find or create user
    let user = await User.findOne({ tiktokId: tiktokUser.open_id });
    
    if (!user) {
      user = await User.findOne({ email: tiktokUser.email });
      
      if (user) {
        // Link TikTok account
        user.tiktokId = tiktokUser.open_id;
        user.tiktokAccessToken = tokenData.access_token;
        user.tiktokRefreshToken = tokenData.refresh_token;
        user.authProvider = 'tiktok';
        await user.save();
      } else {
        // Create new user
        user = new User({
          tiktokId: tiktokUser.open_id,
          name: tiktokUser.display_name,
          avatar: tiktokUser.avatar_url,
          tiktokAccessToken: tokenData.access_token,
          tiktokRefreshToken: tokenData.refresh_token,
          authProvider: 'tiktok',
          isVerified: true
        });
        await user.save();
      }
    }
    
    // Generate JWT
    const token = authService.generateToken({ userId: user._id });
    const refreshToken = authService.generateRefreshToken({ userId: user._id });
    
    res.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role
        }
      }
    });
  } catch (error) {
    logger.error('TikTok auth error:', error);
    res.status(500).json({
      success: false,
      message: 'TikTok authentication failed'
    });
  }
});

// @route   POST /api/auth/refresh-token
// @desc    Get new access token using refresh token
// @access  Public
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required'
      });
    }
    
    const decoded = authService.verifyRefreshToken(refreshToken);
    
    // Generate new access token
    const token = authService.generateToken({ userId: decoded.userId });
    
    res.json({
      success: true,
      data: { token }
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// @route   GET /api/auth/verify-email
// @desc    Verify email with token
// @access  Public
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }
    
    user.isVerified = true;
    await user.save();
    
    res.json({
      success: true,
      message: 'Email berhasil diverifikasi'
    });
  } catch (error) {
    logger.error('Verify email error:', error);
    res.status(400).json({
      success: false,
      message: 'Token tidak valid atau sudah kadaluarsa'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password',
  [body('email').isEmail().withMessage('Email tidak valid')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      
      const { email } = req.body;
      
      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if user exists
        return res.json({
          success: true,
          message: 'Jika email terdaftar, tautan reset password akan dikirim'
        });
      }
      
      // Generate reset token
      const resetToken = authService.generateToken({ userId: user._id }, '1h');
      
      // Save reset token
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      await user.save();
      
      // Send reset email
      await emailService.sendEmail({
        to: email,
        subject: 'Reset Password AUTOLIVE',
        template: 'password-reset',
        data: {
          name: user.name,
          resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
        }
      });
      
      res.json({
        success: true,
        message: 'Jika email terdaftar, tautan reset password akan dikirim'
      });
    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  }
);

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password',
  [
    body('token').notEmpty().withMessage('Token required'),
    body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      
      const { token, password } = req.body;
      
      // Find user with valid reset token
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
      
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Token tidak valid atau sudah kadaluarsa'
        });
      }
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      res.json({
        success: true,
        message: 'Password berhasil direset'
      });
    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authService.authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password -resetPasswordToken -resetPasswordExpires');
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authService.authenticate, (req, res) => {
  // Invalidate token on client side
  res.json({
    success: true,
    message: 'Logout berhasil'
  });
});

module.exports = router;
