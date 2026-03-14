const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['youtube', 'tiktok'],
    required: true
  },
  platformId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  thumbnail: String,
  banner: String,
  url: String,
  
  // Channel statistics
  statistics: {
    subscribers: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    videos: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    followers: { type: Number, default: 0 }, // TikTok
    following: { type: Number, default: 0 } // TikTok
  },
  
  // Growth metrics
  growth: {
    daily: { type: Number, default: 0 },
    weekly: { type: Number, default: 0 },
    monthly: { type: Number, default: 0 },
    yearly: { type: Number, default: 0 }
  },
  
  // Authentication tokens
  accessToken: {
    type: String,
    select: false
  },
  refreshToken: {
    type: String,
    select: false
  },
  tokenExpiresAt: Date,
  
  // Settings
  settings: {
    autoUpload: { type: Boolean, default: false },
    defaultPrivacy: {
      type: String,
      enum: ['public', 'unlisted', 'private'],
      default: 'public'
    },
    defaultCategory: String,
    defaultLanguage: { type: String, default: 'en' },
    watermark: {
      enabled: { type: Boolean, default: false },
      image: String,
      position: {
        type: String,
        enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'],
        default: 'bottom-right'
      }
    },
    schedule: {
      enabled: { type: Boolean, default: false },
      days: [String],
      timeFrom: String,
      timeTo: String,
      timezone: { type: String, default: 'UTC' }
    }
  },
  
  // Verification status
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  
  // Channel status
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'expired'],
    default: 'active'
  },
  
  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Timestamps
  addedAt: {
    type: Date,
    default: Date.now
  },
  lastRefreshed: Date,
  lastUploadAt: Date,
  lastError: String,
  errorCount: {
    type: Number,
    default: 0
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

// Compound index for user's channels
channelSchema.index({ userId: 1, platform: 1 });
channelSchema.index({ platformId: 1, platform: 1 }, { unique: true });
channelSchema.index({ userId: 1, isActive: 1 });
channelSchema.index({ 'statistics.subscribers': -1 });
channelSchema.index({ lastRefreshed: 1 });

// Update timestamps
channelSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Update statistics
channelSchema.methods.updateStatistics = async function(newStats) {
  this.statistics = {
    ...this.statistics,
    ...newStats
  };
  this.lastRefreshed = new Date();
  await this.save();
};

// Check if token is expired
channelSchema.methods.isTokenExpired = function() {
  return this.tokenExpiresAt && this.tokenExpiresAt < new Date();
};

// Increment error count
channelSchema.methods.incrementError = async function(error) {
  this.errorCount += 1;
  this.lastError = error;
  await this.save();
};

// Reset error count
channelSchema.methods.resetErrors = async function() {
  this.errorCount = 0;
  this.lastError = null;
  await this.save();
};

// Get channel type display name
channelSchema.virtual('typeDisplay').get(function() {
  const types = {
    youtube: 'YouTube',
    tiktok: 'TikTok'
  };
  return types[this.platform] || this.platform;
});

// Get formatted statistics
channelSchema.virtual('formattedStats').get(function() {
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (this.platform === 'youtube') {
    return {
      subscribers: formatNumber(this.statistics.subscribers),
      views: formatNumber(this.statistics.views),
      videos: this.statistics.videos
    };
  } else {
    return {
      followers: formatNumber(this.statistics.followers),
      likes: formatNumber(this.statistics.likes),
      videos: this.statistics.videos
    };
  }
});

const Channel = mongoose.model('Channel', channelSchema);

module.exports = Channel;
