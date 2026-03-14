const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');
const authService = require('../services/authService');
const reportGenerator = require('../reports/reportGenerator');
const emailReporter = require('../reports/emailReporter');
const logger = require('../utils/logger');

// @route   GET /api/reports/uploads
// @desc    Generate upload report
// @access  Private
router.get('/uploads',
  authService.authenticate,
  [
    query('format').isIn(['json', 'csv', 'pdf', 'excel']).withMessage('Format tidak valid')
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
      const { format, startDate, endDate, channelId, platform } = req.query;
      
      const report = await reportGenerator.generateUploadReport({
        userId,
        format,
        startDate,
        endDate,
        channelId,
        platform
      });
      
      if (format === 'json') {
        res.json({
          success: true,
          data: report
        });
      } else if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=upload-report-${Date.now()}.csv`);
        res.send(report);
      } else if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=upload-report-${Date.now()}.pdf`);
        res.send(report);
      } else if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=upload-report-${Date.now()}.xlsx`);
        res.send(report);
      }
    } catch (error) {
      logger.error('Generate upload report error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal membuat laporan'
      });
    }
  }
);

// @route   GET /api/reports/performance
// @desc    Generate performance report
// @access  Private
router.get('/performance',
  authService.authenticate,
  [
    query('format').isIn(['json', 'csv', 'pdf', 'excel']).withMessage('Format tidak valid')
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
      const { format, startDate, endDate, timeframe = '30d' } = req.query;
      
      const report = await reportGenerator.generatePerformanceReport({
        userId,
        format,
        startDate,
        endDate,
        timeframe
      });
      
      if (format === 'json') {
        res.json({
          success: true,
          data: report
        });
      } else {
        res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=performance-report-${Date.now()}.${format}`);
        res.send(report);
      }
    } catch (error) {
      logger.error('Generate performance report error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal membuat laporan'
      });
    }
  }
);

// @route   POST /api/reports/email
// @desc    Send report via email
// @access  Private
router.post('/email',
  authService.authenticate,
  [
    body('type').isIn(['daily', 'weekly', 'monthly', 'custom']).withMessage('Tipe laporan tidak valid'),
    body('email').isEmail().withMessage('Email tidak valid')
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
      const { type, email, format = 'pdf', startDate, endDate } = req.body;
      
      await emailReporter.sendReport({
        userId,
        type,
        email,
        format,
        startDate,
        endDate
      });
      
      res.json({
        success: true,
        message: 'Laporan akan dikirim ke email'
      });
    } catch (error) {
      logger.error('Send email report error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengirim laporan'
      });
    }
  }
);

module.exports = router;
