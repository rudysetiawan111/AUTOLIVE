const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Video = require('../models/Video');
const Channel = require('../models/Channel');
const authService = require('../services/authService');
const youtubeDownloader = require('../downloaders/youtubeDownloader');
const tiktokDownloader = require('../downloaders/tiktokDownloader');
const videoClipper = require('../editors/videoClipper');
const subtitleGenerator = require('../editors/subtitleGenerator');
const logger = require('../utils/logger');

// @route   GET /api/videos
// @desc    Get all videos for user
// @access  Private
router.get('/', authService.authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const { 
      page = 1, 
      limit = 20, 
      status, 
      channelId,
      platform,
      startDate,
      endDate,
      search
    } = req.query;
    
    const query = { userId };
    
    if (status) query.status = status;
    if (channelId) query.channelId = channelId;
    if (platform) query.platform = platform;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const videos = await Video.find(query)
      .populate('channelId', 'name platform thumbnail')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Video.countDocuments(query);
    
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
    logger.error('Get videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data video'
    });
  }
});

// @route   GET /api/videos/:id
// @desc    Get single video
// @access  Private
router.get('/:id', authService.authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const videoId = req.params.id;
    
    const video = await Video.findOne({ _id: videoId, userId })
      .populate('channelId', 'name platform thumbnail settings');
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    logger.error('Get video error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data video'
    });
  }
});

// @route   POST /api/videos/download
// @desc    Download video from URL
// @access  Private
router.post('/download',
  authService.authenticate,
  [
    body('url').isURL().withMessage('URL tidak valid'),
    body('platform').isIn(['youtube', 'tiktok']).withMessage('Platform harus youtube atau tiktok')
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
      const { url, platform, title, description } = req.body;
      
      // Create video record
      const video = new Video({
        userId,
        title: title || 'Downloading...',
        description: description || '',
        sourceUrl: url,
        platform,
        status: 'downloading',
        metadata: {
          downloadStarted: new Date()
        }
      });
      
      await video.save();
      
      // Emit socket event
      const io = req.app.get('io');
      io.to(`user:${userId}`).emit('video:download-started', {
        videoId: video._id,
        status: 'downloading'
      });
      
      // Start download asynchronously
      (async () => {
        try {
          let downloadResult;
          
          if (platform === 'youtube') {
            downloadResult = await youtubeDownloader.download(url, video._id);
          } else if (platform === 'tiktok') {
            downloadResult = await tiktokDownloader.download(url, video._id);
          }
          
          // Update video with download info
          video.filePath = downloadResult.filePath;
          video.fileSize = downloadResult.fileSize;
          video.duration = downloadResult.duration;
          video.thumbnail = downloadResult.thumbnail;
          video.title = title || downloadResult.title;
          video.status = 'downloaded';
          video.metadata.downloadCompleted = new Date();
          await video.save();
          
          io.to(`user:${userId}`).emit('video:download-completed', {
            videoId: video._id,
            status: 'downloaded',
            filePath: downloadResult.filePath
          });
        } catch (error) {
          logger.error('Download error:', error);
          video.status = 'failed';
          video.metadata.error = error.message;
          await video.save();
          
          io.to(`user:${userId}`).emit('video:download-failed', {
            videoId: video._id,
            status: 'failed',
            error: error.message
          });
        }
      })();
      
      res.json({
        success: true,
        message: 'Download dimulai',
        data: {
          videoId: video._id,
          status: 'downloading'
        }
      });
    } catch (error) {
      logger.error('Download initiation error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memulai download'
      });
    }
  }
);

// @route   POST /api/videos/:id/process
// @desc    Process video (clip, add subtitles)
// @access  Private
router.post('/:id/process',
  authService.authenticate,
  [
    body('operations').isArray().withMessage('Operations harus berupa array')
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
      const { operations } = req.body;
      
      const video = await Video.findOne({ _id: videoId, userId });
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Video tidak ditemukan'
        });
      }
      
      if (video.status !== 'downloaded') {
        return res.status(400).json({
          success: false,
          message: 'Video harus di-download terlebih dahulu'
        });
      }
      
      // Update status
      video.status = 'processing';
      video.processingSteps = operations;
      await video.save();
      
      const io = req.app.get('io');
      
      // Process operations sequentially
      (async () => {
        try {
          let currentFile = video.filePath;
          
          for (const op of operations) {
            io.to(`user:${userId}`).emit('video:processing-update', {
              videoId: video._id,
              operation: op.type,
              status: 'processing'
            });
            
            if (op.type === 'clip') {
              currentFile = await videoClipper.clipVideo(currentFile, {
                start: op.start,
                end: op.end,
                outputPath: `./storage/processed/${video._id}-clip.mp4`
              });
            } else if (op.type === 'resize') {
              currentFile = await videoClipper.resizeVideo(currentFile, {
                width: op.width,
                height: op.height,
                outputPath: `./storage/processed/${video._id}-resized.mp4`
              });
            } else if (op.type === 'add-subtitles') {
              const subtitles = await subtitleGenerator.generate(currentFile);
              currentFile = await subtitleGenerator.addSubtitles(currentFile, subtitles, {
                outputPath: `./storage/processed/${video._id}-with-subs.mp4`
              });
              video.subtitles = subtitles;
            }
          }
          
          // Update video with processed file
          video.processedFilePath = currentFile;
          video.status = 'processed';
          video.metadata.processingCompleted = new Date();
          await video.save();
          
          io.to(`user:${userId}`).emit('video:processing-completed', {
            videoId: video._id,
            status: 'processed',
            filePath: currentFile
          });
        } catch (error) {
          logger.error('Processing error:', error);
          video.status = 'failed';
          video.metadata.error = error.message;
          await video.save();
          
          io.to(`user:${userId}`).emit('video:processing-failed', {
            videoId: video._id,
            status: 'failed',
            error: error.message
          });
        }
      })();
      
      res.json({
        success: true,
        message: 'Processing dimulai',
        data: {
          videoId: video._id,
          status: 'processing'
        }
      });
    } catch (error) {
      logger.error('Process initiation error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memulai processing'
      });
    }
  }
);

// @route   DELETE /api/videos/:id
// @desc    Delete video
// @access  Private
router.delete('/:id', authService.authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const videoId = req.params.id;
    
    const video = await Video.findOne({ _id: videoId, userId });
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video tidak ditemukan'
      });
    }
    
    // Delete files
    const fs = require('fs-extra');
    if (video.filePath && await fs.pathExists(video.filePath)) {
      await fs.remove(video.filePath);
    }
    if (video.processedFilePath && await fs.pathExists(video.processedFilePath)) {
      await fs.remove(video.processedFilePath);
    }
    
    await video.remove();
    
    res.json({
      success: true,
      message: 'Video berhasil dihapus'
    });
  } catch (error) {
    logger.error('Delete video error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus video'
    });
  }
});

module.exports = router;
