const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Workflow = require('../models/Workflow');
const Execution = require('../models/Execution');
const authService = require('../services/authService');
const workflowAutomation = require('../automation/workflowAutomation');
const logger = require('../utils/logger');

// @route   GET /api/workflows
// @desc    Get all workflows
// @access  Private
router.get('/', authService.authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10, status, type } = req.query;
    
    const query = { userId };
    if (status) query.status = status;
    if (type) query.type = type;
    
    const workflows = await Workflow.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Workflow.countDocuments(query);
    
    // Get execution stats for each workflow
    const workflowsWithStats = await Promise.all(
      workflows.map(async (workflow) => {
        const stats = await Execution.aggregate([
          { $match: { workflowId: workflow._id } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              success: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
              failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
              avgDuration: { $avg: '$duration' }
            }
          }
        ]);
        
        return {
          ...workflow.toObject(),
          stats: stats[0] || { total: 0, success: 0, failed: 0, avgDuration: 0 }
        };
      })
    );
    
    res.json({
      success: true,
      data: workflowsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get workflows error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data workflows'
    });
  }
});

// @route   POST /api/workflows
// @desc    Create new workflow
// @access  Private
router.post('/',
  authService.authenticate,
  [
    body('name').notEmpty().withMessage('Nama workflow harus diisi'),
    body('type').isIn(['upload', 'process', 'viral', 'custom']).withMessage('Tipe workflow tidak valid'),
    body('steps').isArray().withMessage('Steps harus berupa array'),
    body('triggers').optional().isArray()
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
      const { name, description, type, steps, triggers, schedule, settings } = req.body;
      
      // Validate workflow steps
      const validation = await workflowAutomation.validateWorkflow(steps);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Workflow steps tidak valid',
          errors: validation.errors
        });
      }
      
      const workflow = new Workflow({
        userId,
        name,
        description,
        type,
        steps,
        triggers: triggers || [],
        schedule,
        settings: settings || {},
        status: 'draft'
      });
      
      await workflow.save();
      
      res.status(201).json({
        success: true,
        message: 'Workflow berhasil dibuat',
        data: workflow
      });
    } catch (error) {
      logger.error('Create workflow error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal membuat workflow'
      });
    }
  }
);

// @route   GET /api/workflows/:id
// @desc    Get single workflow
// @access  Private
router.get('/:id', authService.authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const workflowId = req.params.id;
    
    const workflow = await Workflow.findOne({ _id: workflowId, userId });
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow tidak ditemukan'
      });
    }
    
    // Get recent executions
    const executions = await Execution.find({ workflowId })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({
      success: true,
      data: {
        ...workflow.toObject(),
        executions
      }
    });
  } catch (error) {
    logger.error('Get workflow error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data workflow'
    });
  }
});

// @route   PUT /api/workflows/:id
// @desc    Update workflow
// @access  Private
router.put('/:id',
  authService.authenticate,
  [
    body('name').optional().notEmpty(),
    body('steps').optional().isArray()
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
      const workflowId = req.params.id;
      const updates = req.body;
      
      const workflow = await Workflow.findOne({ _id: workflowId, userId });
      if (!workflow) {
        return res.status(404).json({
          success: false,
          message: 'Workflow tidak ditemukan'
        });
      }
      
      // Validate steps if updated
      if (updates.steps) {
        const validation = await workflowAutomation.validateWorkflow(updates.steps);
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            message: 'Workflow steps tidak valid',
            errors: validation.errors
          });
        }
      }
      
      // Update allowed fields
      const allowedUpdates = ['name', 'description', 'steps', 'triggers', 'schedule', 'settings', 'status'];
      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          workflow[field] = updates[field];
        }
      });
      
      workflow.updatedAt = new Date();
      await workflow.save();
      
      res.json({
        success: true,
        message: 'Workflow berhasil diupdate',
        data: workflow
      });
    } catch (error) {
      logger.error('Update workflow error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengupdate workflow'
      });
    }
  }
);

// @route   POST /api/workflows/:id/execute
// @desc    Execute workflow
// @access  Private
router.post('/:id/execute',
  authService.authenticate,
  async (req, res) => {
    try {
      const userId = req.userId;
      const workflowId = req.params.id;
      const { context = {} } = req.body;
      
      const workflow = await Workflow.findOne({ _id: workflowId, userId });
      if (!workflow) {
        return res.status(404).json({
          success: false,
          message: 'Workflow tidak ditemukan'
        });
      }
      
      if (workflow.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Workflow tidak aktif'
        });
      }
      
      // Create execution record
      const execution = new Execution({
        workflowId,
        userId,
        trigger: 'manual',
        context,
        status: 'pending',
        startedAt: new Date()
      });
      
      await execution.save();
      
      // Execute workflow asynchronously
      (async () => {
        try {
          const result = await workflowAutomation.executeWorkflow(workflow, {
            ...context,
            executionId: execution._id,
            userId
          });
          
          execution.status = 'completed';
          execution.completedAt = new Date();
          execution.duration = (execution.completedAt - execution.startedAt) / 1000;
          execution.result = result;
          await execution.save();
          
          const io = req.app.get('io');
          io.to(`user:${userId}`).emit('workflow:completed', {
            workflowId,
            executionId: execution._id,
            result
          });
        } catch (error) {
          logger.error('Workflow execution error:', error);
          execution.status = 'failed';
          execution.completedAt = new Date();
          execution.error = error.message;
          await execution.save();
          
          const io = req.app.get('io');
          io.to(`user:${userId}`).emit('workflow:failed', {
            workflowId,
            executionId: execution._id,
            error: error.message
          });
        }
      })();
      
      res.json({
        success: true,
        message: 'Workflow execution dimulai',
        data: {
          workflowId,
          executionId: execution._id,
          status: 'pending'
        }
      });
    } catch (error) {
      logger.error('Start workflow execution error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memulai workflow execution'
      });
    }
  }
);

// @route   GET /api/workflows/:id/executions
// @desc    Get workflow executions
// @access  Private
router.get('/:id/executions', authService.authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const workflowId = req.params.id;
    const { page = 1, limit = 20 } = req.query;
    
    const executions = await Execution.find({ workflowId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Execution.countDocuments({ workflowId });
    
    res.json({
      success: true,
      data: executions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get executions error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data executions'
    });
  }
});

// @route   DELETE /api/workflows/:id
// @desc    Delete workflow
// @access  Private
router.delete('/:id', authService.authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const workflowId = req.params.id;
    
    const workflow = await Workflow.findOneAndDelete({ _id: workflowId, userId });
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow tidak ditemukan'
      });
    }
    
    // Delete associated executions
    await Execution.deleteMany({ workflowId });
    
    res.json({
      success: true,
      message: 'Workflow berhasil dihapus'
    });
  } catch (error) {
    logger.error('Delete workflow error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus workflow'
    });
  }
});

module.exports = router;
