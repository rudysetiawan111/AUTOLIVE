const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authService = require('../services/authService');
const scheduler = require('../automation/scheduler');
const workflowAutomation = require('../automation/workflowAutomation');
const Execution = require('../models/Execution');
const logger = require('../utils/logger');

// @route   GET /api/automation/queue
// @desc    Get automation queue
// @access  Private
router.get('/queue', authService.authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const { status, limit = 50 } = req.query;
    
    const query = { userId };
    if (status) query.status = status;
    
    const queue = await Execution.find(query)
      .populate('workflowId', 'name type')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: queue
    });
  } catch (error) {
    logger.error('Get queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data queue'
    });
  }
});

// @route   GET /api/automation/active
// @desc    Get active automations
// @access  Private
router.get('/active', authService.authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    
    const active = await scheduler.getActiveJobs(userId);
    
    res.json({
      success: true,
      data: active
    });
  } catch (error) {
    logger.error('Get active automations error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data automasi aktif'
    });
  }
});

// @route   POST /api/automation/schedule
// @desc    Schedule automation
// @access  Private
router.post('/schedule',
  authService.authenticate,
  [
    body('name').notEmpty().withMessage('Nama harus diisi'),
    body('type').isIn(['viral-discovery', 'upload', 'process', 'cleanup']).withMessage('Tipe tidak valid'),
    body('schedule').notEmpty().withMessage('Schedule harus diisi'),
    body('config').optional().isObject()
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
      const { name, type, schedule, config, workflowId } = req.body;
      
      const job = await scheduler.scheduleJob({
        userId,
        name,
        type,
        schedule,
        config,
        workflowId
      });
      
      res.json({
        success: true,
        message: 'Automasi berhasil dijadwalkan',
        data: job
      });
    } catch (error) {
      logger.error('Schedule automation error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menjadwalkan automasi'
      });
    }
  }
);

// @route   POST /api/automation/stop
// @desc    Stop automation
// @access  Private
router.post('/stop',
  authService.authenticate,
  [
    body('jobId').notEmpty().withMessage('Job ID required')
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
      const { jobId } = req.body;
      
      await scheduler.stopJob(jobId, userId);
      
      res.json({
        success: true,
        message: 'Automasi berhasil dihentikan'
      });
    } catch (error) {
      logger.error('Stop automation error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghentikan automasi'
      });
    }
  }
);

// @route   GET /api/automation/stats
// @desc    Get automation statistics
// @access  Private
router.get('/stats', authService.authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const { timeframe = '24h' } = req.query;
    
    const startDate = new Date();
    if (timeframe === '24h') startDate.setHours(startDate.getHours() - 24);
    else if (timeframe === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (timeframe === '30d') startDate.setDate(startDate.getDate() - 30);
    
    const stats = await Execution.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            status: '$status',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          count: { $sum: 1 },
          avgDuration: { $avg: '$duration' }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Get automation stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil statistik automasi'
    });
  }
});

module.exports = router;
