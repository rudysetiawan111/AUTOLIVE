const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Channel = require('../models/Channel');
const authService = require('../services/authService');
const youtubeService = require('../services/youtubeService');
const tiktokService = require('../services/tiktokService');
const logger = require('../utils/logger');

// @route   GET /api/channels
// @desc    Get all channels for user
// @access  Private
router.get('/', authService.authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10, platform } = req.query;
    
    const query = { userId };
    if (platform) query.platform = platform;
    
    const channels = await Channel.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Channel.countDocuments(query);
    
    // Get real-time stats for each channel
    const channelsWithStats = await Promise.all(
      channels.map(async (channel) => {
        try {
          let stats = {};
          if (channel.platform === 'youtube' && channel.status === 'active') {
            stats = await youtubeService.getChannelStats(channel.channelId);
          } else if (channel.platform === 'tiktok' && channel.status === 'active') {
            stats = await tiktokService.getUserStats(channel.channelId);
          }
          return { ...channel.toObject(), liveStats: stats };
        } catch (error) {
          logger.error(`Error getting stats for channel ${channel._id}:`, error);
          return channel.toObject();
        }
      })
    );
    
    res.json({
      success: true,
      data: channelsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get channels error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data channel'
    });
  }
});

// @route   POST /api/channels/youtube
// @desc    Add YouTube channel
// @access  Private
router.post('/youtube',
  authService.authenticate,
  [
    body('code').notEmpty().withMessage('Authorization code required')
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
      
      const userId = req.userId;
      const { code } = req.body;
      
      // Exchange code for tokens
      const tokens = await youtubeService.exchangeCode(code);
      
      // Get channel info
      const channelInfo = await youtubeService.getChannelInfo(tokens.access_token);
      
      // Check if channel already exists
      let channel = await Channel.findOne({
        userId,
        channelId: channelInfo.id,
        platform: 'youtube'
      });
      
      if (channel) {
        // Update tokens
        channel.accessToken = tokens.access_token;
        channel.refreshToken = tokens.refresh_token;
        channel.tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);
        channel.status = 'active';
        await channel.save();
      } else {
        // Create new channel
        channel = new Channel({
          userId,
          name: channelInfo.title,
          platform: 'youtube',
          channelId: channelInfo.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
          thumbnail: channelInfo.thumbnails?.default?.url,
          stats: {
            subscribers: channelInfo.subscriberCount,
            totalViews: channelInfo.viewCount,
            totalVideos: channelInfo.videoCount
          },
          status: 'active'
        });
        await channel.save();
      }
      
      res.json({
        success: true,
        message: 'YouTube channel berhasil ditambahkan',
        data: channel
      });
    } catch (error) {
      logger.error('Add YouTube channel error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menambahkan channel YouTube'
      });
    }
  }
);

// @route   POST /api/channels/tiktok
// @desc    Add TikTok channel
// @access  Private
router.post('/tiktok',
  authService.authenticate,
  [
    body('code').notEmpty().withMessage('Authorization code required')
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
      
      const userId = req.userId;
      const { code } = req.body;
      
      // Exchange code for tokens
      const tokens = await tiktokService.exchangeCode(code);
      
      // Get user info
      const userInfo = await tiktokService.getUserInfo(tokens.access_token);
      
      // Check if channel already exists
      let channel = await Channel.findOne({
        userId,
        channelId: userInfo.open_id,
        platform: 'tiktok'
      });
      
      if (channel) {
        // Update tokens
        channel.accessToken = tokens.access_token;
        channel.refreshToken = tokens.refresh_token;
        channel.tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);
        channel.status = 'active';
        await channel.save();
      } else {
        // Create new channel
        channel = new Channel({
          userId,
          name: userInfo.display_name,
          platform: 'tiktok',
          channelId: userInfo.open_id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
          thumbnail: userInfo.avatar_url,
          stats: {
            followers: userInfo.follower_count,
            following: userInfo.following_count,
            totalLikes: userInfo.like_count,
            totalVideos: userInfo.video_count
          },
          status: 'active'
        });
        await channel.save();
      }
      
      res.json({
        success: true,
        message: 'TikTok channel berhasil ditambahkan',
        data: channel
      });
    } catch (error) {
      logger.error('Add TikTok channel error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menambahkan channel TikTok'
      });
    }
  }
);

// @route   GET /api/channels/:id
// @desc    Get single channel
// @access  Private
router.get('/:id', authService.authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const channelId = req.params.id;
    
    const channel = await Channel.findOne({ _id: channelId, userId });
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel tidak ditemukan'
      });
    }
    
    // Get detailed stats
    let detailedStats = {};
    if (channel.platform === 'youtube' && channel.status === 'active') {
      detailedStats = await youtubeService.getDetailedStats(channel.channelId, channel.accessToken);
    } else if (channel.platform === 'tiktok' && channel.status === 'active') {
      detailedStats = await tiktokService.getDetailedStats(channel.channelId, channel.accessToken);
    }
    
    res.json({
      success: true,
      data: {
        ...channel.toObject(),
        detailedStats
      }
    });
  } catch (error) {
    logger.error('Get channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data channel'
    });
  }
});

// @route   PUT /api/channels/:id
// @desc    Update channel settings
// @access  Private
router.put('/:id',
  authService.authenticate,
  [
    body('name').optional().notEmpty(),
    body('settings').optional().isObject()
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
      
      const userId = req.userId;
      const channelId = req.params.id;
      const updates = req.body;
      
      const channel = await Channel.findOne({ _id: channelId, userId });
      if (!channel) {
        return res.status(404).json({
          success: false,
          message: 'Channel tidak ditemukan'
        });
      }
      
      // Update allowed fields
      if (updates.name) channel.name = updates.name;
      if (updates.settings) channel.settings = { ...channel.settings, ...updates.settings };
      
      channel.updatedAt = new Date();
      await channel.save();
      
      res.json({
        success: true,
        message: 'Channel berhasil diupdate',
        data: channel
      });
    } catch (error) {
      logger.error('Update channel error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengupdate channel'
      });
    }
  }
);

// @route   DELETE /api/channels/:id
// @desc    Delete channel
// @access  Private
router.delete('/:id', authService.authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const channelId = req.params.id;
    
    const channel = await Channel.findOneAndDelete({ _id: channelId, userId });
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel tidak ditemukan'
      });
    }
    
    // TODO: Also delete related videos and analytics
    
    res.json({
      success: true,
      message: 'Channel berhasil dihapus'
    });
  } catch (error) {
    logger.error('Delete channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus channel'
    });
  }
});

// @route   POST /api/channels/:id/refresh-token
// @desc    Refresh access token
// @access  Private
router.post('/:id/refresh-token', authService.authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const channelId = req.params.id;
    
    const channel = await Channel.findOne({ _id: channelId, userId });
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel tidak ditemukan'
      });
    }
    
    let newTokens;
    if (channel.platform === 'youtube') {
      newTokens = await youtubeService.refreshToken(channel.refreshToken);
      channel.accessToken = newTokens.access_token;
      channel.tokenExpiry = new Date(Date.now() + newTokens.expires_in * 1000);
    } else if (channel.platform === 'tiktok') {
      newTokens = await tiktokService.refreshToken(channel.refreshToken);
      channel.accessToken = newTokens.access_token;
      channel.refreshToken = newTokens.refresh_token || channel.refreshToken;
      channel.tokenExpiry = new Date(Date.now() + newTokens.expires_in * 1000);
    }
    
    await channel.save();
    
    res.json({
      success: true,
      message: 'Token berhasil diperbarui',
      data: { expiresAt: channel.tokenExpiry }
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui token'
    });
  }
});

module.exports = router;
