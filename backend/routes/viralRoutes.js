const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const ViralVideo = require('../models/ViralVideo');
const authService = require('../services/authService');
const viralityPredictor = require('../../ai/virality-engine/predictor');
const youtubeCollector = require('../collectors/youtubeCollector');
const tiktokCollector = require('../collectors/tiktokCollector');
const logger = require('../utils/logger');

// @route   GET /api/viral/videos
// @desc    Get viral videos
// @access  Private
router.get('/videos', authService.authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const { 
      page = 1, 
      limit = 20, 
      platform,
      minScore = 70,
      category,
      sortBy = 'viralScore',
      sortOrder = 'desc'
    } = req.query;
    
    const query = { viralScore: { $gte: parseInt(minScore) } };
    if (platform) query.platform = platform;
    if (category) query.category = category;
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const videos = await ViralVideo.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await ViralVideo.countDocuments(query);
    
    res.json({
      success: true,
      data: videos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get viral videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data viral videos'
    });
  }
});

// @route   POST /api/viral/discover
// @desc    Start viral discovery
// @access  Private
router.post('/discover',
  authService.authenticate,
  [
    body('platforms').isArray().withMessage('Platforms harus berupa array'),
    body('keywords').optional().isArray(),
    body('categories').optional().isArray(),
    body('maxResults').optional().isInt({ min: 1, max: 50 })
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
      const { platforms, keywords, categories, maxResults = 20 } = req.body;
      
      const discoveryId = `discovery_${Date.now()}`;
      const io = req.app.get('io');
      
      // Start discovery process
      (async () => {
        try {
          let allVideos = [];
          
          for (const platform of platforms) {
            let videos = [];
            
            if (platform === 'youtube') {
              videos = await youtubeCollector.discoverViral({
                keywords,
                categories,
                maxResults: Math.floor(maxResults / platforms.length)
              });
            } else if (platform === 'tiktok') {
              videos = await tiktokCollector.discoverViral({
                keywords,
                categories,
                maxResults: Math.floor(maxResults / platforms.length)
              });
            }
            
            // Predict virality for each video
            for (const video of videos) {
              const prediction = await viralityPredictor.predictVirality(video);
              
              const viralVideo = new ViralVideo({
                ...video,
                viralScore: prediction.score,
                viralFactors: prediction.factors,
                discoveredBy: userId,
                discoveredAt: new Date()
              });
              
              await viralVideo.save();
              allVideos.push(viralVideo);
              
              // Emit for real-time updates
              io.to(`user:${userId}`).emit('viral:discovered', {
                discoveryId,
                video: viralVideo
              });
            }
          }
          
          io.to(`user:${userId}`).emit('viral:discovery-completed', {
            discoveryId,
            total: allVideos.length
          });
        } catch (error) {
          logger.error('Discovery error:', error);
          io.to(`user:${userId}`).emit('viral:discovery-failed', {
            discoveryId,
            error: error.message
          });
        }
      })();
      
      res.json({
        success: true,
        message: 'Viral discovery dimulai',
        data: { discoveryId }
      });
    } catch (error) {
      logger.error('Start discovery error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memulai viral discovery'
      });
    }
  }
);

// @route   POST /api/viral/:id/approve
// @desc    Approve viral video for processing
// @access  Private
router.post('/:id/approve',
  authService.authenticate,
  [
    body('action').isIn(['download', 'save', 'ignore']).withMessage('Action tidak valid'),
    body('channelId').optional()
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
      const videoId = req.params.id;
      const { action, channelId, notes } = req.body;
      
      const video = await ViralVideo.findById(videoId);
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Video tidak ditemukan'
        });
      }
      
      video.approvedBy = userId;
      video.approvedAt = new Date();
      video.approvalAction = action;
      video.approvalNotes = notes;
      if (channelId) video.targetChannelId = channelId;
      
      await video.save();
      
      // If action is download, queue it
      if (action === 'download' && channelId) {
        const Video = require('../models/Video');
        const downloadVideo = new Video({
          userId,
          channelId,
          title: video.title,
          sourceUrl: video.url,
          platform: video.platform,
          sourceVideoId: video.originalId,
          status: 'pending',
          metadata: {
            viralScore: video.viralScore,
            approvedFrom: video._id
          }
        });
        
        await downloadVideo.save();
        
        // Queue download (implementation in videos routes)
      }
      
      res.json({
        success: true,
        message: 'Video berhasil di-approve',
        data: video
      });
    } catch (error) {
      logger.error('Approve viral video error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal meng-approve video'
      });
    }
  }
);

// @route   GET /api/viral/trending
// @desc    Get trending topics
// @access  Private
router.get('/trending', authService.authenticate, async (req, res) => {
  try {
    const { platform = 'all' } = req.query;
    
    let trends = [];
    
    if (platform === 'all' || platform === 'youtube') {
      const youtubeTrends = await youtubeCollector.getTrendingTopics();
      trends.push(...youtubeTrends.map(t => ({ ...t, platform: 'youtube' })));
    }
    
    if (platform === 'all' || platform === 'tiktok') {
      const tiktokTrends = await tiktokCollector.getTrendingTopics();
      trends.push(...tiktokTrends.map(t => ({ ...t, platform: 'tiktok' })));
    }
    
    // Sort by volume
    trends.sort((a, b) => b.volume - a.volume);
    
    res.json({
      success: true,
      data: trends.slice(0, 20)
    });
  } catch (error) {
    logger.error('Get trending error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data trending'
    });
  }
});

// @route   GET /api/viral/:id/analytics
// @desc    Get viral video analytics
// @access  Private
router.get('/:id/analytics', authService.authenticate, async (req, res) => {
  try {
    const videoId = req.params.id;
    
    const video = await ViralVideo.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video tidak ditemukan'
      });
    }
    
    // Get detailed analytics
    const analytics = {
      current: video.stats,
      growth: video.viralFactors,
      predictions: await viralityPredictor.predictFuture(video),
      demographics: video.demographics || {},
      engagement: {
        likeRatio: video.stats.likes / video.stats.views * 100,
        commentRatio: video.stats.comments / video.stats.views * 100,
        shareRatio: video.stats.shares / video.stats.views * 100
      }
    };
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Get viral analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data analytics'
    });
  }
});

module.exports = router;
