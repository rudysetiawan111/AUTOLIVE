const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  platform: {
    type: String,
    enum: ['youtube', 'tiktok', 'local'],
    required: true
  },
  platformId: String, // ID from YouTube/TikTok
  
  // File information
  filePath: String,
  fileName: String,
  fileSize: Number,
  mimeType: String,
  duration: Number, // in seconds
  thumbnail: String,
  processedPath: String,
  subtitlePath: String,
  
  // Video metadata
  metadata: {
    width: Number,
    height: Number,
    aspectRatio: String,
    fps: Number,
    bitrate: Number,
    codec: String,
    audioCodec: String,
    hasAudio: Boolean
  },
  
  // Content analysis
  analysis: {
    keywords: [String],
    topics: [{
      name: String,
      confidence: Number
    }],
    sentiment: {
      score: Number,
      label: String
    },
    readability: {
      score: Number,
      level: String
    },
    quality: {
      score: Number,
      level: String
    }
  },
  
  // AI generated content
  aiGenerated: {
    titles: [{
      title: String,
      score: Number
    }],
    descriptions: [{
      description: String,
      score: Number
    }],
    hashtags: [{
      tag: String,
      score: Number
    }],
    thumbnail: String,
    music: String
  },
  
  // Statistics
  statistics: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    watchTime: { type: Number, default: 0 },
    averageViewDuration: { type: Number, default: 0 },
    retentionRate: { type: Number, default: 0 },
    clickThroughRate: { type: Number, default: 0 }
  },
  
  // Virality metrics
  virality: {
    score: { type: Number, default: 0 },
    level: {
      type: String,
      enum: ['low', 'medium', 'high', 'viral'],
      default: 'low'
    },
    predictedScore: Number,
    predictedLevel: String,
    factors: {
      engagement: Number,
      velocity: Number,
      reach: Number,
      timing: Number
    }
  },
  
  // Tags and categories
  tags: [String],
  category: String,
  language: {
    type: String,
    default: 'en'
  },
  
  // Status tracking
  status: {
    type: String,
    enum: [
      'pending',
      'downloading',
      'downloaded',
      'processing',
      'processed',
      'uploading',
      'uploaded',
      'failed',
      'deleted'
    ],
    default: 'pending'
  },
  
  // Timestamps
  downloadedAt: Date,
  processedAt: Date,
  uploadedAt: Date,
  
  // Upload results
  uploadResults: [{
    platform: String,
    videoId: String,
    url: String,
    status: String,
    uploadedAt: Date,
    error: String
  }],
  
  // Error tracking
  errors: [{
    stage: String,
    message: String,
    timestamp: Date,
    retryCount: Number
  }],
  
  // Source information
  source: {
    type: {
      type: String,
      enum: ['upload', 'download', 'collection', 'api']
    },
    url: String,
    platform: String,
    channelId: String,
    channelName: String,
    collectedAt: Date
  },
  
  // Retention
  retentionDays: {
    type: Number,
    default: 30
  },
  expiresAt: Date,
  
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

// Indexes for efficient querying
videoSchema.index({ userId: 1, status: 1 });
videoSchema.index({ userId: 1, createdAt: -1 });
videoSchema.index({ platform: 1, platformId: 1 });
videoSchema.index({ 'virality.score': -1 });
videoSchema.index({ 'statistics.views': -1 });
videoSchema.index({ tags: 1 });
videoSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Update timestamps
videoSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Set expiration date
  if (this.retentionDays && !this.expiresAt) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.retentionDays);
    this.expiresAt = expiresAt;
  }
  
  next();
});

// Update virality level based on score
videoSchema.pre('save', function(next) {
  if (this.virality.score !== undefined) {
    if (this.virality.score >= 80) {
      this.virality.level = 'viral';
    } else if (this.virality.score >= 60) {
      this.virality.level = 'high';
    } else if (this.virality.score >= 40) {
      this.virality.level = 'medium';
    } else {
      this.virality.level = 'low';
    }
  }
  next();
});

// Get video URL
videoSchema.virtual('url').get(function() {
  if (this.uploadResults && this.uploadResults.length > 0) {
    return this.uploadResults[0].url;
  }
  return null;
});

// Get platform display name
videoSchema.virtual('platformDisplay').get(function() {
  const platforms = {
    youtube: 'YouTube',
    tiktok: 'TikTok',
    local: 'Local'
  };
  return platforms[this.platform] || this.platform;
});

// Get formatted duration
videoSchema.virtual('durationFormatted').get(function() {
  if (!this.duration) return '00:00';
  
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = Math.floor(this.duration % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Get file size formatted
videoSchema.virtual('sizeFormatted').get(function() {
  if (!this.fileSize) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = this.fileSize;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
});

// Check if video is expired
videoSchema.methods.isExpired = function() {
  return this.expiresAt && this.expiresAt < new Date();
};

// Add error
videoSchema.methods.addError = async function(stage, message) {
  this.errors.push({
    stage,
    message,
    timestamp: new Date(),
    retryCount: this.errors.filter(e => e.stage === stage).length
  });
  
  this.status = 'failed';
  await this.save();
};

// Update statistics
videoSchema.methods.updateStatistics = async function(stats) {
  this.statistics = {
    ...this.statistics,
    ...stats
  };
  await this.save();
};

// Calculate virality score
videoSchema.methods.calculateVirality = function() {
  const views = this.statistics.views || 0;
  const likes = this.statistics.likes || 0;
  const comments = this.statistics.comments || 0;
  const shares = this.statistics.shares || 0;
  
  // Engagement rate
  const engagement = views > 0 ? (likes + comments + shares) / views : 0;
  
  // Velocity (if we have time-based data)
  const age = this.uploadedAt ? (new Date() - this.uploadedAt) / (1000 * 60 * 60 * 24) : 1;
  const velocity = views / Math.max(age, 1);
  
  // Composite score
  const score = Math.min(
    (engagement * 100) + (Math.log10(velocity) * 10),
    100
  );
  
  this.virality.score = Math.round(score * 100) / 100;
  this.virality.factors = {
    engagement,
    velocity,
    reach: shares,
    timing: age
  };
  
  return this.virality;
};

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
