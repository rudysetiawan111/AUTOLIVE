const mongoose = require('mongoose');

const executionSchema = new mongoose.Schema({
  executionId: {
    type: String,
    required: true,
    unique: true
  },
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true
  },
  workflowName: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Execution status
  status: {
    type: String,
    enum: [
      'pending',
      'running',
      'completed',
      'failed',
      'cancelled',
      'timeout'
    ],
    default: 'pending'
  },
  
  // Timing
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  duration: Number, // in seconds
  
  // Steps execution
  steps: [{
    stepId: String,
    stepName: String,
    stepType: String,
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'skipped']
    },
    startTime: Date,
    endTime: Date,
    duration: Number,
    input: mongoose.Schema.Types.Mixed,
    output: mongoose.Schema.Types.Mixed,
    error: {
      message: String,
      code: String,
      stack: String
    },
    retries: {
      count: Number,
      maxRetries: Number
    }
  }],
  
  // Results
  result: {
    videosDiscovered: { type: Number, default: 0 },
    videosDownloaded: { type: Number, default: 0 },
    videosProcessed: { type: Number, default: 0 },
    videosUploaded: { type: Number, default: 0 },
    videosSkipped: { type: Number, default: 0 },
    totalSize: Number,
    totalSizeFormatted: String,
    summary: String,
    output: mongoose.Schema.Types.Mixed
  },
  
  // Errors
  errors: [{
    step: Number,
    stepId: String,
    message: String,
    code: String,
    timestamp: Date,
    stack: String
  }],
  
  // Warnings
  warnings: [{
    step: Number,
    message: String,
    timestamp: Date
  }],
  
  // Logs
  logs: [{
    level: {
      type: String,
      enum: ['info', 'warn', 'error', 'debug']
    },
    message: String,
    step: String,
    timestamp: Date,
    data: mongoose.Schema.Types.Mixed
  }],
  
  // Configuration used
  config: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Trigger information
  trigger: {
    type: {
      type: String,
      enum: ['manual', 'schedule', 'webhook', 'api'],
      default: 'manual'
    },
    source: String,
    timestamp: Date,
    data: mongoose.Schema.Types.Mixed
  },
  
  // Performance metrics
  performance: {
    cpuUsage: Number,
    memoryUsage: Number,
    networkUsage: Number,
    apiCalls: Number,
    apiLatency: Number
  },
  
  // Resource usage
  resources: {
    filesCreated: Number,
    filesDeleted: Number,
    diskSpaceUsed: Number,
    diskSpaceFreed: Number
  },
  
  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
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
executionSchema.index({ executionId: 1 });
executionSchema.index({ workflowId: 1, startTime: -1 });
executionSchema.index({ userId: 1, startTime: -1 });
executionSchema.index({ status: 1, startTime: 1 });
executionSchema.index({ 'trigger.type': 1, startTime: -1 });

// Update timestamps
executionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate duration
  if (this.startTime && this.endTime && !this.duration) {
    this.duration = (this.endTime - this.startTime) / 1000;
  }
  
  // Format total size
  if (this.result.totalSize && !this.result.totalSizeFormatted) {
    this.result.totalSizeFormatted = this.formatBytes(this.result.totalSize);
  }
  
  next();
});

// Format bytes
executionSchema.methods.formatBytes = function(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Add log entry
executionSchema.methods.addLog = function(level, message, step = null, data = null) {
  this.logs.push({
    level,
    message,
    step,
    timestamp: new Date(),
    data
  });
};

// Add error
executionSchema.methods.addError = function(step, message, code = null, stack = null) {
  this.errors.push({
    step,
    message,
    code,
    timestamp: new Date(),
    stack
  });
  this.status = 'failed';
};

// Add warning
executionSchema.methods.addWarning = function(step, message) {
  this.warnings.push({
    step,
    message,
    timestamp: new Date()
  });
};

// Update step status
executionSchema.methods.updateStep = function(stepId, update) {
  const step = this.steps.find(s => s.stepId === stepId);
  if (step) {
    Object.assign(step, update);
    
    if (update.endTime && step.startTime) {
      step.duration = (update.endTime - step.startTime) / 1000;
    }
  }
};

// Complete execution
executionSchema.methods.complete = async function(result = {}) {
  this.status = 'completed';
  this.endTime = new Date();
  this.result = {
    ...this.result,
    ...result
  };
  
  await this.save();
};

// Fail execution
executionSchema.methods.fail = async function(error) {
  this.status = 'failed';
  this.endTime = new Date();
  
  if (error) {
    this.addError('execution', error.message, error.code, error.stack);
  }
  
  await this.save();
};

// Get execution summary
executionSchema.virtual('summary').get(function() {
  return {
    executionId: this.executionId,
    workflowName: this.workflowName,
    status: this.status,
    startTime: this.startTime,
    endTime: this.endTime,
    duration: this.duration,
    videosUploaded: this.result?.videosUploaded || 0,
    errorCount: this.errors?.length || 0,
    warningCount: this.warnings?.length || 0
  };
});

// Get duration formatted
executionSchema.virtual('durationFormatted').get(function() {
  if (!this.duration) return '0s';
  
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = Math.floor(this.duration % 60);
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);
  
  return parts.join(' ') || '0s';
});

// Check if execution is long running
executionSchema.virtual('isLongRunning').get(function() {
  return this.duration > 300; // More than 5 minutes
});

const Execution = mongoose.model('Execution', executionSchema);

module.exports = Execution;
