const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');
const Video = require('../models/Video');
const Channel = require('../models/Channel');
const UploadReport = require('../models/UploadReport');
const authService = require('../services/authService');
const logger = require('../utils/logger');

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics
// @access  Private
router.get('/dashboard', authService.authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get counts
    const [
      totalVideos,
      totalChannels,
      totalUploads,
      successfulUploads,
      failedUploads,
      recentVideos,
      channelStats
    ] = await Promise.all([
      Video.countDocuments({ userId }),
      Channel.countDocuments({ userId }),
      UploadReport.countDocuments({ userId }),
      UploadReport.countDocuments({ userId, status: 'success' }),
      UploadReport.countDocuments({ userId, status: 'failed' }),
      Video.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title status createdAt thumbnail'),
      Channel.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$platform',
            count: { $sum: 1 },
            totalVideos: { $sum: '$stats.totalVideos' }
          }
        }
      ])
    ]);
    
    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayUploads = await UploadReport.countDocuments({
      userId,
      createdAt: { $gte: today }
    });
    
    const todaySuccess = await UploadReport.countDocuments({
      userId,
      createdAt: { $gte: today },
      status: 'success'
    });
    
    res.json({
      success: true,
      data: {
        overview: {
          totalVideos,
          totalChannels,
          totalUploads,
          successfulUploads,
          failedUploads,
          successRate: totalUploads > 0 ? (successfulUploads / totalUploads * 100).toFixed(1) : 0
        },
        today: {
          uploads: todayUploads,
          success: todaySuccess,
          successRate: todayUploads > 0 ? (todaySuccess / todayUploads * 100).toFixed(1) : 0
        },
        channels: channelStats,
        recentVideos
      }
    });
  } catch (error) {
    logger.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data dashboard'
    });
  }
});

// @route   GET /api/analytics/videos
// @desc    Get video analytics
// @access  Private
router.get('/videos', authService.authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const { timeframe = '30d' } = req.query;
    
    const startDate = new Date();
    if (timeframe === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (timeframe === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (timeframe === '90d') startDate.setDate(startDate.getDate() - 90);
    
    const videos = await Video.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);
    
    const statusBreakdown = await Video.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        timeline: videos,
        breakdown: statusBreakdown
      }
    });
  } catch (error) {
    logger.error('Video analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data video analytics'
    });
  }
});

// @route   GET /api/analytics/uploads
// @desc    Get upload analytics
// @access  Private
router.get('/uploads', authService.authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const { timeframe = '30d' } = req.query;
    
    const startDate = new Date();
    if (timeframe === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (timeframe === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (timeframe === '90d') startDate.setDate(startDate.getDate() - 90);
    
    const uploads = await UploadReport.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            platform: '$platform',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);
    
    const platformBreakdown = await UploadReport.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$platform',
          total: { $sum: 1 },
          success: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        timeline: uploads,
        platforms: platformBreakdown
      }
    });
  } catch (error) {
    logger.error('Upload analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data upload analytics'
    });
  }
});

module.exports = router;
