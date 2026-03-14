const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Channel = require('../models/Channel');
const Video = require('../models/Video');
const Workflow = require('../models/Workflow');
const authService = require('../services/authService');
const logger = require('../utils/logger');
const fs = require('fs-extra');
const path = require('path');

// Admin middleware
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Hanya untuk admin.'
      });
    }
    next();
  } catch (error) {
    logger.error('Admin check error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// @route   GET /api/admin/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/users', authService.authenticate, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    
    const users = await User.find(query)
      .select('-password -resetPasswordToken')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    // Get stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [videoCount, channelCount, uploadCount] = await Promise.all([
          Video.countDocuments({ userId: user._id }),
          Channel.countDocuments({ userId: user._id }),
          require('../models/UploadReport').countDocuments({ userId: user._id })
        ]);
        
        return {
          ...user.toObject(),
          stats: {
            videos: videoCount,
            channels: channelCount,
            uploads: uploadCount
          }
        };
      })
    );
    
    res.json({
      success: true,
      data: usersWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data users'
    });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role (admin only)
// @access  Private/Admin
router.put('/users/:id/role',
  authService.authenticate,
  isAdmin,
  [
    body('role').isIn(['user', 'admin']).withMessage('Role tidak valid')
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
      
      const userId = req.params.id;
      const { role } = req.body;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }
      
      user.role = role;
      await user.save();
      
      res.json({
        success: true,
        message: 'Role user berhasil diupdate',
        data: user
      });
    } catch (error) {
      logger.error('Update user role error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengupdate role user'
      });
    }
  }
);

// @route   GET /api/admin/stats
// @desc    Get system stats (admin only)
// @access  Private/Admin
router.get('/stats', authService.authenticate, isAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalChannels,
      totalVideos,
      totalUploads,
      storageUsage
    ] = await Promise.all([
      User.countDocuments(),
      Channel.countDocuments(),
      Video.countDocuments(),
      require('../models/UploadReport').countDocuments(),
      getStorageUsage()
    ]);
    
    // Get recent activity
    const recentUploads = await require('../models/UploadReport').find()
      .populate('userId', 'name email')
      .populate('videoId', 'title')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      success: true,
      data: {
        totals: {
          users: totalUsers,
          channels: totalChannels,
          videos: totalVideos,
          uploads: totalUploads
        },
        storage: storageUsage,
        recentActivity: recentUploads
      }
    });
  } catch (error) {
    logger.error('Get system stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil statistik sistem'
    });
  }
});

// @route   GET /api/admin/settings
// @desc    Get system settings (admin only)
// @access  Private/Admin
router.get('/settings', authService.authenticate, isAdmin, async (req, res) => {
  try {
    const configPath = path.join(__dirname, '../../config/private-mode/settings.json');
    const settings = await fs.readJson(configPath);
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    logger.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil pengaturan'
    });
  }
});

// @route   PUT /api/admin/settings
// @desc    Update system settings (admin only)
// @access  Private/Admin
router.put('/settings',
  authService.authenticate,
  isAdmin,
  async (req, res) => {
    try {
      const settings = req.body;
      const configPath = path.join(__dirname, '../../config/private-mode/settings.json');
      
      await fs.writeJson(configPath, settings, { spaces: 2 });
      
      res.json({
        success: true,
        message: 'Pengaturan berhasil diupdate',
        data: settings
      });
    } catch (error) {
      logger.error('Update settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengupdate pengaturan'
      });
    }
  }
);

// Helper function to get storage usage
async function getStorageUsage() {
  const storageDirs = [
    './storage/downloads',
    './storage/processed',
    './storage/uploads'
  ];
  
  let total = 0;
  const details = {};
  
  for (const dir of storageDirs) {
    try {
      const stats = await fs.stat(dir);
      const size = await getDirectorySize(dir);
      details[path.basename(dir)] = size;
      total += size;
    } catch (error) {
      details[path.basename(dir)] = 0;
    }
  }
  
  return {
    total,
    details,
    formatted: formatBytes(total)
  };
}

async function getDirectorySize(directory) {
  let total = 0;
  const files = await fs.readdir(directory);
  
  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = await fs.stat(filePath);
    
    if (stat.isFile()) {
      total += stat.size;
    } else if (stat.isDirectory()) {
      total += await getDirectorySize(filePath);
    }
  }
  
  return total;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = router;
