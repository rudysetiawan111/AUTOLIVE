const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true
  },
  
  // Video metrics
  videos: {
    total: { type: Number, default: 0 },
    uploaded: { type: Number, default: 0 },
    processed: { type: Number, default: 0 },
    downloaded: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    byPlatform: {
      youtube: { type: Number, default: 0 },
      tiktok: { type: Number, default: 0 }
    },
    byStatus: {
      pending: { type: Number, default: 0 },
      processing: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      failed: { type: Number, default: 0 }
    }
  },
  
  // Performance metrics
  performance: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    watchTime: { type: Number, default: 0 }, // in minutes
    averageViewDuration: { type: Number, default: 0 }, // in seconds
    engagementRate: { type: Number, default: 0 }, // percentage
    viralityScore: { type: Number, default: 0 },
    retentionRate: { type: Number, default: 0 }, // percentage
    clickThroughRate: { type: Number, default: 0 } // percentage
  },
  
  // Workflow metrics
  workflows: {
    total: { type: Number, default: 0 },
    active: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    averageDuration: { type: Number, default: 0 }, // in seconds
    totalExecutions: { type: Number, default: 0 },
    byStatus: {
      running: { type: Number, default: 0 },
      paused: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      failed: { type: Number, default: 0 }
    }
  },
  
  // Channel metrics
  channels: {
    total: { type: Number, default: 0 },
    active: { type: Number, default: 0 },
    byPlatform: {
      youtube: { type: Number, default: 0 },
      tiktok: { type: Number, default: 0 }
    },
    totalSubscribers: { type: Number, default: 0 },
    totalFollowers: { type: Number, default: 0 },
    growth: {
      subscribers: { type: Number, default: 0 }, // percentage
      followers: { type: Number, default: 0 }, // percentage
      views: { type: Number, default: 0 } // percentage
    }
  },
  
  // Storage metrics
  storage: {
    used: { type: Number, default: 0 }, // in bytes
    usedFormatted: String,
    byType: {
      downloads: { type: Number, default: 0 },
      processed: { type: Number, default: 0 },
      uploads: { type: Number, default: 0 },
      temp: { type: Number, default: 0 }
    },
    files: {
      total: { type: Number, default: 0 },
      byStatus: {
        active: { type: Number, default: 0 },
        expired: { type: Number, default: 0 },
        deleted: { type: Number, default: 0 }
      }
    },
    cleanup: {
      lastRun: Date,
      filesRemoved: { type: Number, default: 0 },
      spaceFreed: { type: Number, default: 0 }
    }
  },
  
  // Cost metrics
  costs: {
    api: {
      youtube: { type: Number, default: 0 },
      tiktok: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    storage: {
      cost: { type: Number, default: 0 },
      perGB: { type: Number, default: 0 }
    },
    processing: {
      cpu: { type: Number, default: 0 },
      memory: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    total: { type: Number, default: 0 }
  },
  
  // User activity
  activity: {
    logins: { type: Number, default: 0 },
    actions: { type: Number, default: 0 },
    apiCalls: { type: Number, default: 0 },
    activeTime: { type: Number, default: 0 }, // in minutes
    peakHours: [{
      hour: Number,
      count: Number
    }],
    topActions: [{
      action: String,
      count: Number
    }]
  },
  
  // Top performing content
  topVideos: [{
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video'
    },
    title: String,
    platform: String,
    views: Number,
    likes: Number,
    comments: Number,
    shares: Number,
    engagementRate: Number
  }],
  
  // Demographics
  demographics: {
    ageGroups: [{
      range: String,
      percentage: Number,
      views: Number
    }],
    genders: [{
      type: String,
      percentage: Number,
      views: Number
    }],
    countries: [{
      country: String,
      code: String,
      percentage: Number,
      views: Number
    }],
    devices: [{
      device: String,
      percentage: Number,
      views: Number
    }],
    trafficSources: [{
      source: String,
      percentage: Number,
      views: Number
    }]
  },
  
  // Trends
  trends: {
    hourly: [{
      hour: Number,
      value: Number
    }],
    daily: [{
      day: String, // Monday, Tuesday, etc.
      value: Number
    }],
    weekly: [{
      week: Number,
      year: Number,
      value: Number
    }],
    monthly: [{
      month: Number,
      year: Number,
      value: Number
    }]
  },
  
  // Forecast
  forecast: {
    nextDay: {
      views: Number,
      uploads: Number,
      engagement: Number
    },
    nextWeek: {
      views: Number,
      uploads: Number,
      engagement: Number
    },
    nextMonth: {
      views: Number,
      uploads: Number,
      engagement: Number
    },
    confidence: Number // percentage
  },
  
  // Insights
  insights: [{
    type: {
      type: String,
      enum: ['success', 'warning', 'danger', 'info']
    },
    title: String,
    description: String,
    metric: String,
    value: Number,
    change: Number, // percentage
    recommendation: String,
    timestamp: Date
  }],
  
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

// Compound index for unique user/date/period
analyticsSchema.index({ userId: 1, date: 1, period: 1 }, { unique: true });

// Indexes for queries
analyticsSchema.index({ date: -1 });
analyticsSchema.index({ 'performance.views': -1 });
analyticsSchema.index({ 'performance.engagementRate': -1 });
analyticsSchema.index({ 'trends.weekly.year': 1, 'trends.weekly.week': 1 });

// Update timestamps and format storage
analyticsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Format storage used
  if (this.storage.used) {
    this.storage.usedFormatted = this.formatBytes(this.storage.used);
  }
  
  // Calculate totals
  this.costs.api.total = (this.costs.api.youtube || 0) + (this.costs.api.tiktok || 0);
  this.costs.total = this.costs.api.total + (this.costs.storage.cost || 0) + (this.costs.processing.total || 0);
  
  next();
});

// Format bytes
analyticsSchema.methods.formatBytes = function(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Calculate engagement rate
analyticsSchema.methods.calculateEngagementRate = function() {
  const views = this.performance.views || 0;
  const interactions = (this.performance.likes || 0) + 
                      (this.performance.comments || 0) + 
                      (this.performance.shares || 0);
  
  if (views === 0) return 0;
  return (interactions / views) * 100;
};

// Calculate virality score
analyticsSchema.methods.calculateViralityScore = function() {
  const views = this.performance.views || 0;
  const engagement = this.calculateEngagementRate();
  
  // Time-based factor (if we have daily data)
  const daysInPeriod = this.period === 'daily' ? 1 : 
                      this.period === 'weekly' ? 7 :
                      this.period === 'monthly' ? 30 : 365;
  
  const velocity = views / daysInPeriod;
  
  return Math.min(
    (engagement * 2) + (Math.log10(velocity) * 10),
    100
  );
};

// Add insight
analyticsSchema.methods.addInsight = function(type, title, description, metric, value, change, recommendation) {
  this.insights.push({
    type,
    title,
    description,
    metric,
    value,
    change,
    recommendation,
    timestamp: new Date()
  });
};

// Generate insights from data
analyticsSchema.methods.generateInsights = function() {
  // Clear existing insights
  this.insights = [];
  
  // Check for significant changes
  if (this.performance.views > 0) {
    // Compare with previous period (would need previous analytics)
    // This is simplified - in production you'd compare with actual previous data
    
    const engagementRate = this.calculateEngagementRate();
    
    if (engagementRate > 10) {
      this.addInsight(
        'success',
        'High Engagement Rate',
        `Your content is performing well with ${engagementRate.toFixed(1)}% engagement rate`,
        'engagementRate',
        engagementRate,
        0,
        'Continue creating similar content to maintain engagement'
      );
    } else if (engagementRate < 2) {
      this.addInsight(
        'warning',
        'Low Engagement Rate',
        `Engagement rate is only ${engagementRate.toFixed(1)}%, below average`,
        'engagementRate',
        engagementRate,
        0,
        'Try improving video quality or adding calls-to-action'
      );
    }
  }
  
  // Check storage usage
  if (this.storage.used > 10 * 1024 * 1024 * 1024) { // More than 10GB
    this.addInsight(
      'warning',
      'High Storage Usage',
      `You're using ${this.storage.usedFormatted} of storage`,
      'storage',
      this.storage.used,
      0,
      'Run storage cleanup to free up space'
    );
  }
  
  // Check workflow success rate
  if (this.workflows.totalExecutions > 0) {
    const successRate = (this.workflows.completed / this.workflows.totalExecutions) * 100;
    
    if (successRate < 80) {
      this.addInsight(
        'danger',
        'Low Workflow Success Rate',
        `Only ${successRate.toFixed(1)}% of workflows complete successfully`,
        'successRate',
        successRate,
        0,
        'Check failed workflows and fix common errors'
      );
    }
  }
};

// Get summary for period
analyticsSchema.virtual('summary').get(function() {
  return {
    date: this.date,
    period: this.period,
    videos: {
      total: this.videos.total,
      uploaded: this.videos.uploaded
    },
    performance: {
      views: this.performance.views,
      engagementRate: this.performance.engagementRate
    },
    topVideo: this.topVideos[0] || null,
    insights: this.insights.length
  };
});

// Compare with another analytics period
analyticsSchema.methods.compareWith = function(other) {
  if (!other) return null;
  
  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };
  
  return {
    videos: {
      total: calculateChange(this.videos.total, other.videos.total),
      uploaded: calculateChange(this.videos.uploaded, other.videos.uploaded)
    },
    performance: {
      views: calculateChange(this.performance.views, other.performance.views),
      likes: calculateChange(this.performance.likes, other.performance.likes),
      comments: calculateChange(this.performance.comments, other.performance.comments),
      shares: calculateChange(this.performance.shares, other.performance.shares),
      engagementRate: this.performance.engagementRate - other.performance.engagementRate
    },
    workflows: {
      executions: calculateChange(this.workflows.totalExecutions, other.workflows.totalExecutions),
      successRate: this.workflows.completed / Math.max(this.workflows.totalExecutions, 1) * 100 -
                   other.workflows.completed / Math.max(other.workflows.totalExecutions, 1) * 100
    },
    storage: {
      used: calculateChange(this.storage.used, other.storage.used)
    }
  };
};

const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics;
