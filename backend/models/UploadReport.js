const mongoose = require('mongoose');

const uploadReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow'
  },
  executionId: String,
  
  // Upload details
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  },
  videoTitle: String,
  platform: {
    type: String,
    enum: ['youtube', 'tiktok'],
    required: true
  },
  platformVideoId: String,
  url: String,
  
  // Upload metadata
  metadata: {
    title: String,
    description: String,
    tags: [String],
    category: String,
    privacy: String,
    language: String,
    scheduledTime: Date
  },
  
  // Upload status
  status: {
    type: String,
    enum: ['pending', 'uploading', 'completed', 'failed', 'scheduled', 'cancelled'],
    default: 'pending'
  },
  
  // Upload statistics
  statistics: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    watchTime: { type: Number, default: 0 },
    retentionRate: { type: Number, default: 0 },
    clickThroughRate: { type: Number, default: 0 }
  },
  
  // Performance metrics
  performance: {
    engagementRate: Number,
    viralityScore: Number,
    reach: Number,
    impressions: Number,
    uniqueViewers: Number
  },
  
  // Demographics
  demographics: {
    ageGroups: [{
      range: String,
      percentage: Number
    }],
    genders: [{
      type: String,
      percentage: Number
    }],
    countries: [{
      country: String,
      percentage: Number
    }],
    devices: [{
      device: String,
      percentage: Number
    }],
    trafficSources: [{
      source: String,
      percentage: Number
    }]
  },
  
  // Error tracking
  error: {
    message: String,
    code: String,
    stage: String,
    timestamp: Date,
    retryCount: Number
  },
  
  // Timing
  uploadStarted: Date,
  uploadCompleted: Date,
  uploadDuration: Number, // in seconds
  scheduledFor: Date,
  publishedAt: Date,
  
  // File information
  fileInfo: {
    name: String,
    size: Number,
    sizeFormatted: String,
    duration: Number,
    resolution: String,
    format: String
  },
  
  // Channel information
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  },
  channelName: String,
  
  // Additional data
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Timestamps
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
uploadReportSchema.index({ userId: 1, createdAt: -1 });
uploadReportSchema.index({ platform: 1, status: 1 });
uploadReportSchema.index({ platformVideoId: 1 });
uploadReportSchema.index({ 'statistics.views': -1 });
uploadReportSchema.index({ scheduledFor: 1 });

// Update timestamps
uploadReportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate upload duration
  if (this.uploadStarted && this.uploadCompleted && !this.uploadDuration) {
    this.uploadDuration = (this.uploadCompleted - this.uploadStarted) / 1000;
  }
  
  // Format file size
  if (this.fileInfo && this.fileInfo.size && !this.fileInfo.sizeFormatted) {
    this.fileInfo.sizeFormatted = this.formatBytes(this.fileInfo.size);
  }
  
  next();
});

// Format bytes
uploadReportSchema.methods.formatBytes = function(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Update statistics
uploadReportSchema.methods.updateStatistics = async function(stats) {
  this.statistics = {
    ...this.statistics,
    ...stats
  };
  
  // Recalculate performance metrics
  this.performance.engagementRate = this.calculateEngagementRate();
  this.performance.viralityScore = this.calculateViralityScore();
  
  await this.save();
};

// Calculate engagement rate
uploadReportSchema.methods.calculateEngagementRate = function() {
  const views = this.statistics.views || 0;
  const interactions = (this.statistics.likes || 0) + 
                      (this.statistics.comments || 0) + 
                      (this.statistics.shares || 0);
  
  if (views === 0) return 0;
  return (interactions / views) * 100;
};

// Calculate virality score
uploadReportSchema.methods.calculateViralityScore = function() {
  const views = this.statistics.views || 0;
  const engagement = this.calculateEngagementRate();
  
  // Time-based factor
  const age = this.publishedAt ? (new Date() - this.publishedAt) / (1000 * 60 * 60 * 24) : 1;
  const velocity = views / Math.max(age, 1);
  
  return Math.min(
    (engagement * 2) + (Math.log10(velocity) * 10),
    100
  );
};

// Get status badge color
uploadReportSchema.virtual('statusColor').get(function() {
  const colors = {
    pending: 'warning',
    uploading: 'info',
    completed: 'success',
    failed: 'danger',
    scheduled: 'primary',
    cancelled: 'secondary'
  };
  return colors[this.status] || 'secondary';
});

// Get platform icon
uploadReportSchema.virtual('platformIcon').get(function() {
  const icons = {
    youtube: 'fab fa-youtube',
    tiktok: 'fab fa-tiktok'
  };
  return icons[this.platform] || 'fas fa-video';
});

// Get upload time
uploadReportSchema.virtual('uploadTime').get(function() {
  if (this.uploadCompleted) {
    return this.uploadCompleted;
  }
  if (this.scheduledFor) {
    return this.scheduledFor;
  }
  return this.createdAt;
});

// Check if report is recent
uploadReportSchema.virtual('isRecent').get(function() {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  return this.createdAt > oneDayAgo;
});

const UploadReport = mongoose.model('UploadReport', uploadReportSchema);

module.exports = UploadReport;
