const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      'collect',
      'analyze',
      'download',
      'process',
      'upload',
      'ai-title',
      'ai-hashtag',
      'ai-virality',
      'notification',
      'condition',
      'loop',
      'delay'
    ],
    required: true
  },
  platform: {
    type: String,
    enum: ['youtube', 'tiktok', 'both']
  },
  config: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  input: [String], // IDs of previous steps that provide input
  output: String, // Output variable name
  condition: String, // Condition expression
  retryOnFailure: {
    type: Boolean,
    default: false
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  timeout: Number, // in seconds
  position: {
    x: Number,
    y: Number
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
});

const connectionSchema = new mongoose.Schema({
  from: String,
  to: String,
  condition: String,
  label: String
});

const scheduleSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: false
  },
  frequency: {
    type: String,
    enum: ['once', 'hourly', 'daily', 'weekly', 'monthly', 'custom']
  },
  cronExpression: String,
  timezone: {
    type: String,
    default: 'UTC'
  },
  hour: Number,
  minute: Number,
  dayOfWeek: Number,
  dayOfMonth: Number,
  startDate: Date,
  endDate: Date,
  lastRun: Date,
  nextRun: Date
});

const workflowSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  
  // Workflow steps
  steps: [stepSchema],
  connections: [connectionSchema],
  
  // Schedule
  schedule: scheduleSchema,
  
  // Settings
  settings: {
    maxConcurrent: {
      type: Number,
      default: 1
    },
    timeout: {
      type: Number,
      default: 3600 // 1 hour
    },
    emailReport: {
      type: Boolean,
      default: true
    },
    saveLogs: {
      type: Boolean,
      default: true
    },
    stopOnError: {
      type: Boolean,
      default: false
    },
    retryFailed: {
      type: Boolean,
      default: true
    },
    maxRetries: {
      type: Number,
      default: 3
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'critical'],
      default: 'normal'
    },
    tags: [String]
  },
  
  // Variables
  variables: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Statistics
  stats: {
    totalRuns: { type: Number, default: 0 },
    successfulRuns: { type: Number, default: 0 },
    failedRuns: { type: Number, default: 0 },
    totalVideosProcessed: { type: Number, default: 0 },
    totalVideosUploaded: { type: Number, default: 0 },
    averageDuration: { type: Number, default: 0 },
    lastRunDuration: Number,
    lastRunAt: Date,
    lastSuccessAt: Date,
    lastFailedAt: Date
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'archived', 'failed'],
    default: 'draft'
  },
  
  // Error handling
  lastError: String,
  errorCount: {
    type: Number,
    default: 0
  },
  
  // Versioning
  version: {
    type: Number,
    default: 1
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow'
  },
  
  // Sharing
  isPublic: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Metadata
  category: String,
  tags: [String],
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
workflowSchema.index({ userId: 1, status: 1 });
workflowSchema.index({ userId: 1, 'schedule.enabled': 1 });
workflowSchema.index({ 'schedule.nextRun': 1 });
workflowSchema.index({ isActive: 1, status: 1 });
workflowSchema.index({ tags: 1 });

// Update timestamps
workflowSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Update next run time
  if (this.schedule && this.schedule.enabled) {
    this.schedule.nextRun = this.calculateNextRun();
  }
  
  next();
});

// Calculate next run time
workflowSchema.methods.calculateNextRun = function() {
  const now = new Date();
  const schedule = this.schedule;
  
  if (!schedule || !schedule.enabled) return null;
  
  // Simple calculation - in production use cron parser
  switch (schedule.frequency) {
    case 'hourly':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case 'daily':
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(schedule.hour || 0, schedule.minute || 0, 0, 0);
      return tomorrow;
    case 'weekly':
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + ((7 - now.getDay() + (schedule.dayOfWeek || 1)) % 7));
      nextWeek.setHours(schedule.hour || 0, schedule.minute || 0, 0, 0);
      return nextWeek;
    default:
      return null;
  }
};

// Add step
workflowSchema.methods.addStep = function(step) {
  step.id = step.id || `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  this.steps.push(step);
  return step;
};

// Remove step
workflowSchema.methods.removeStep = function(stepId) {
  this.steps = this.steps.filter(s => s.id !== stepId);
  this.connections = this.connections.filter(c => c.from !== stepId && c.to !== stepId);
};

// Add connection
workflowSchema.methods.addConnection = function(fromId, toId, condition = null) {
  this.connections.push({
    from: fromId,
    to: toId,
    condition
  });
};

// Validate workflow
workflowSchema.methods.validate = function() {
  const errors = [];
  
  // Check if workflow has steps
  if (this.steps.length === 0) {
    errors.push('Workflow must have at least one step');
  }
  
  // Check for circular dependencies
  const visited = new Set();
  const recursionStack = new Set();
  
  const hasCycle = (stepId) => {
    if (recursionStack.has(stepId)) return true;
    if (visited.has(stepId)) return false;
    
    visited.add(stepId);
    recursionStack.add(stepId);
    
    const outgoing = this.connections.filter(c => c.from === stepId);
    for (const conn of outgoing) {
      if (hasCycle(conn.to)) return true;
    }
    
    recursionStack.delete(stepId);
    return false;
  };
  
  for (const step of this.steps) {
    if (hasCycle(step.id)) {
      errors.push('Workflow contains circular dependencies');
      break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Get next steps
workflowSchema.methods.getNextSteps = function(stepId, context = {}) {
  const connections = this.connections.filter(c => c.from === stepId);
  const nextSteps = [];
  
  for (const conn of connections) {
    // Evaluate condition if exists
    if (conn.condition) {
      try {
        const conditionFn = new Function('context', `return ${conn.condition}`);
        if (conditionFn(context)) {
          const step = this.steps.find(s => s.id === conn.to);
          if (step) nextSteps.push(step);
        }
      } catch (error) {
        console.error('Error evaluating condition:', error);
      }
    } else {
      const step = this.steps.find(s => s.id === conn.to);
      if (step) nextSteps.push(step);
    }
  }
  
  return nextSteps;
};

// Clone workflow
workflowSchema.methods.clone = async function(name = null) {
  const clone = new this.constructor({
    ...this.toObject(),
    _id: undefined,
    name: name || `${this.name} (Copy)`,
    version: 1,
    parentId: this._id,
    status: 'draft',
    stats: {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      totalVideosProcessed: 0,
      totalVideosUploaded: 0
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  return await clone.save();
};

// Update statistics
workflowSchema.methods.updateStats = async function(runResult) {
  this.stats.totalRuns++;
  this.stats.lastRunAt = new Date();
  this.stats.lastRunDuration = runResult.duration;
  
  if (runResult.success) {
    this.stats.successfulRuns++;
    this.stats.lastSuccessAt = new Date();
  } else {
    this.stats.failedRuns++;
    this.stats.lastFailedAt = new Date();
  }
  
  if (runResult.videosProcessed) {
    this.stats.totalVideosProcessed += runResult.videosProcessed;
  }
  
  if (runResult.videosUploaded) {
    this.stats.totalVideosUploaded += runResult.videosUploaded;
  }
  
  // Calculate average duration
  const totalDuration = this.stats.averageDuration * (this.stats.totalRuns - 1) + runResult.duration;
  this.stats.averageDuration = totalDuration / this.stats.totalRuns;
  
  await this.save();
};

const Workflow = mongoose.model('Workflow', workflowSchema);

module.exports = Workflow;
