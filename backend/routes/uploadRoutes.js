const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { body, validationResult } = require('express-validator');
const Video = require('../models/Video');
const Channel = require('../models/Channel');
const UploadReport = require('../models/UploadReport');
const authService = require('../services/authService');
const youtubeUploader = require('../uploaders/youtubeUploader');
const tiktokUploader = require('../uploaders/tiktokUploader');
const titleGenerator = require('../../ai/title-generator/generator');
const hashtagGenerator = require('../../ai/hashtag-generator/generator');
const logger = require('../utils/logger');

// Configure multer for local upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './storage/uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /mp4|mov|avi|mkv|webm/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter
});

// @route   POST /api/upload/video
// @desc    Upload video file
// @access  Private
router.post('/video',
  authService.authenticate,
  upload.single('video'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No video file uploaded'
        });
      }
      
      const userId = req.userId;
      const { title, description, channelId, tags, scheduledFor } = req.body;
      
      // Generate AI title if not provided
      let finalTitle = title;
      if (!finalTitle) {
        const generated = await titleGenerator.generateFromVideo(req.file.path);
        finalTitle = generated[0];
      }
      
      // Generate hashtags if not provided
      let finalTags = tags ? JSON.parse(tags) : [];
      if (finalTags.length === 0) {
        finalTags = await hashtagGenerator.generateFromVideo(req.file.path, 10);
      }
      
      const video = new Video({
        userId,
        channelId,
        title: finalTitle,
        description: description || '',
        tags: finalTags,
        scheduledFor: scheduledFor || null,
        status: 'uploaded',
        filePath: req.file.path,
        fileSize: req.file.size,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype
      });
      
      await video.save();
      
      // Create upload report
      const report = new UploadReport({
        userId,
        videoId: video._id,
        channelId,
        status: 'uploaded',
        message: 'Video uploaded successfully'
      });
      
      await report.save();
      
      res.status(201).json({
        success: true,
        message: 'Video uploaded successfully',
        data: {
          video,
          report
        }
      });
    } catch (error) {
      logger.error('Upload video error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengupload video'
      });
    }
  }
);

// @route   POST /api/upload/youtube
// @desc    Upload to YouTube
// @access  Private
router.post('/youtube',
  authService.authenticate,
  [
    body('videoId').notEmpty().withMessage('Video ID required'),
    body('channelId').notEmpty().withMessage('Channel ID required')
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
      const { videoId, channelId, privacyStatus = 'private' } = req.body;
      
      const video = await Video.findOne({ _id: videoId, userId });
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Video tidak ditemukan'
        });
      }
      
      const channel = await Channel.findOne({ _id: channelId, userId, platform: 'youtube' });
      if (!channel) {
        return res.status(404).json({
          success: false,
          message: 'YouTube channel tidak ditemukan'
        });
      }
      
      // Update status
      video.status = 'uploading';
      video.uploadStarted = new Date();
      await video.save();
      
      const io = req.app.get('io');
      
      // Upload to YouTube asynchronously
      (async () => {
        try {
          const result = await youtubeUploader.uploadVideo({
            videoPath: video.filePath || video.processedFilePath,
            title: video.title,
            description: video.description,
            tags: video.tags,
            privacyStatus,
            accessToken: channel.accessToken,
            onProgress: (progress) => {
              io.to(`user:${userId}`).emit('upload:progress', {
                videoId: video._id,
                platform: 'youtube',
                progress
              });
            }
          });
          
          // Update video
          video.platformVideoId = result.id;
          video.platformUrl = `https://youtube.com/watch?v=${result.id}`;
          video.status = 'published';
          video.publishedAt = new Date();
          video.uploadCompleted = new Date();
          await video.save();
          
          // Create report
          const report = new UploadReport({
            userId,
            videoId: video._id,
            channelId,
            platform: 'youtube',
            status: 'success',
            platformVideoId: result.id,
            platformUrl: video.platformUrl,
            message: 'Video berhasil diupload ke YouTube'
          });
          
          await report.save();
          
          io.to(`user:${userId}`).emit('upload:completed', {
            videoId: video._id,
            platform: 'youtube',
            result
          });
          
          // Send email report
          const emailService = require('../services/emailService');
          await emailService.sendEmail({
            to: req.user.email,
            subject: 'Upload YouTube Berhasil',
            template: 'upload-success',
            data: {
              title: video.title,
              platform: 'YouTube',
              url: video.platformUrl
            }
          });
        } catch (error) {
          logger.error('YouTube upload error:', error);
          video.status = 'failed';
          video.uploadError = error.message;
          await video.save();
          
          const report = new UploadReport({
            userId,
            videoId: video._id,
            channelId,
            platform: 'youtube',
            status: 'failed',
            message: error.message
          });
          
          await report.save();
          
          io.to(`user:${userId}`).emit('upload:failed', {
            videoId: video._id,
            platform: 'youtube',
            error: error.message
          });
        }
      })();
      
      res.json({
        success: true,
        message: 'Upload ke YouTube dimulai',
        data: {
          videoId: video._id,
          status: 'uploading'
        }
      });
    } catch (error) {
      logger.error('Start YouTube upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memulai upload ke YouTube'
      });
    }
  }
);

// @route   POST /api/upload/tiktok
// @desc    Upload to TikTok
// @access  Private
router.post('/tiktok',
  authService.authenticate,
  [
    body('videoId').notEmpty().withMessage('Video ID required'),
    body('channelId').notEmpty().withMessage('Channel ID required')
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
      const { videoId, channelId, privacyStatus = 'public' } = req.body;
      
      const video = await Video.findOne({ _id: videoId, userId });
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Video tidak ditemukan'
        });
      }
      
      const channel = await Channel.findOne({ _id: channelId, userId, platform: 'tiktok' });
      if (!channel) {
        return res.status(404).json({
          success: false,
          message: 'TikTok channel tidak ditemukan'
        });
      }
      
      // Update status
      video.status = 'uploading';
      video.uploadStarted = new Date();
      await video.save();
      
      const io = req.app.get('io');
      
      // Upload to TikTok asynchronously
      (async () => {
        try {
          const result = await tiktokUploader.uploadVideo({
            videoPath: video.filePath || video.processedFilePath,
            title: video.title,
            description: video.description,
            privacyStatus,
            accessToken: channel.accessToken,
            onProgress: (progress) => {
              io.to(`user:${userId}`).emit('upload:progress', {
                videoId: video._id,
                platform: 'tiktok',
                progress
              });
            }
          });
          
          // Update video
          video.platformVideoId = result.video_id;
          video.platformUrl = `https://tiktok.com/@${channel.name}/video/${result.video_id}`;
          video.status = 'published';
          video.publishedAt = new Date();
          video.uploadCompleted = new Date();
          await video.save();
          
          // Create report
          const report = new UploadReport({
            userId,
            videoId: video._id,
            channelId,
            platform: 'tiktok',
            status: 'success',
            platformVideoId: result.video_id,
            platformUrl: video.platformUrl,
            message: 'Video berhasil diupload ke TikTok'
          });
          
          await report.save();
          
          io.to(`user:${userId}`).emit('upload:completed', {
            videoId: video._id,
            platform: 'tiktok',
            result
          });
        } catch (error) {
          logger.error('TikTok upload error:', error);
          video.status = 'failed';
          video.uploadError = error.message;
          await video.save();
          
          const report = new UploadReport({
            userId,
            videoId: video._id,
            channelId,
            platform: 'tiktok',
            status: 'failed',
            message: error.message
          });
          
          await report.save();
          
          io.to(`user:${userId}`).emit('upload:failed', {
            videoId: video._id,
            platform: 'tiktok',
            error: error.message
          });
        }
      })();
      
      res.json({
        success: true,
        message: 'Upload ke TikTok dimulai',
        data: {
          videoId: video._id,
          status: 'uploading'
        }
      });
    } catch (error) {
      logger.error('Start TikTok upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memulai upload ke TikTok'
      });
    }
  }
);

// @route   GET /api/upload/reports
// @desc    Get upload reports
// @access  Private
router.get('/reports', authService.authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20, status, platform } = req.query;
    
    const query = { userId };
    if (status) query.status = status;
    if (platform) query.platform = platform;
    
    const reports = await UploadReport.find(query)
      .populate('videoId', 'title thumbnail')
      .populate('channelId', 'name platform')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await UploadReport.countDocuments(query);
    
    res.json({
      success: true,
      data: reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get upload reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil laporan upload'
    });
  }
});

module.exports = router;
