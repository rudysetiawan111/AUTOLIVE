const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Plan details
  plan: {
    type: String,
    enum: ['free', 'pro', 'business', 'enterprise'],
    required: true,
    default: 'free'
  },
  planName: String,
  planPrice: Number,
  currency: {
    type: String,
    default: 'USD'
  },
  interval: {
    type: String,
    enum: ['month', 'year'],
    default: 'month'
  },
  
  // Status
  status: {
    type: String,
    enum: [
      'active',
      'inactive',
      'trialing',
      'past_due',
      'canceled',
      'expired',
      'pending'
    ],
    default: 'active'
  },
  
  // Dates
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: Date,
  trialEndDate: Date,
  canceledAt: Date,
  
  // Billing
  billing: {
    provider: {
      type: String,
      enum: ['stripe', 'paypal', 'manual'],
      default: 'stripe'
    },
    customerId: String,
    subscriptionId: String,
    paymentMethodId: String,
    lastInvoiceId: String,
    lastPaymentDate: Date,
    nextPaymentDate: Date,
    paymentMethod: {
      type: String,
      enum: ['card', 'paypal', 'bank'],
      default: 'card'
    },
    cardLast4: String,
    cardBrand: String,
    billingEmail: String,
    billingName: String,
    billingAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    }
  },
  
  // Features and limits
  features: {
    maxVideosPerDay: { type: Number, default: 10 },
    maxVideosPerMonth: { type: Number, default: 300 },
    maxWorkflows: { type: Number, default: 3 },
    maxChannels: { type: Number, default: 2 },
    maxStorage: { type: Number, default: 10 * 1024 * 1024 * 1024 }, // 10GB in bytes
    maxFileSize: { type: Number, default: 500 * 1024 * 1024 }, // 500MB
    
    // AI features
    aiTitles: { type: Boolean, default: false },
    aiHashtags: { type: Boolean, default: false },
    aiThumbnails: { type: Boolean, default: false },
    aiMusic: { type: Boolean, default: false },
    aiVoiceover: { type: Boolean, default: false },
    
    // Advanced features
    customWatermark: { type: Boolean, default: false },
    scheduledUploads: { type: Boolean, default: false },
    bulkUpload: { type: Boolean, default: false },
    analytics: { type: Boolean, default: false },
    api: { type: Boolean, default: false },
    webhooks: { type: Boolean, default: false },
    
    // Support
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'priority'],
      default: 'normal'
    },
    supportLevel: {
      type: String,
      enum: ['basic', 'email', 'priority', 'dedicated'],
      default: 'basic'
    }
  },
  
  // Usage tracking
  usage: {
    videosProcessed: { type: Number, default: 0 },
    videosUploaded: { type: Number, default: 0 },
    storageUsed: { type: Number, default: 0 },
    apiCalls: { type: Number, default: 0 },
    aiCalls: { type: Number, default: 0 },
    
    daily: [{
      date: Date,
      videos: Number,
      uploads: Number,
      storage: Number,
      apiCalls: Number
    }],
    
    lastResetDate: Date,
    nextResetDate: Date
  },
  
  // Invoices
  invoices: [{
    invoiceId: String,
    amount: Number,
    currency: String,
    status: {
      type: String,
      enum: ['draft', 'open', 'paid', 'void', 'uncollectible']
    },
    date: Date,
    paidAt: Date,
    pdfUrl: String,
    lines: [{
      description: String,
      amount: Number,
      period: {
        start: Date,
        end: Date
      }
    }]
  }],
  
  // Discounts
  discount: {
    code: String,
    type: {
      type: String,
      enum: ['percentage', 'fixed']
    },
    value: Number,
    validUntil: Date
  },
  
  // History
  history: [{
    action: {
      type: String,
      enum: [
        'created',
        'updated',
        'renewed',
        'canceled',
        'expired',
        'upgraded',
        'downgraded',
        'payment_succeeded',
        'payment_failed'
      ]
    },
    date: Date,
    details: String,
    ip: String,
    userAgent: String
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

// Indexes
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ status: 1, endDate: 1 });
subscriptionSchema.index({ 'billing.customerId': 1 });
subscriptionSchema.index({ 'billing.subscriptionId': 1 });
subscriptionSchema.index({ 'usage.nextResetDate': 1 });

// Update timestamps
subscriptionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Set plan name
  const planNames = {
    free: 'Free',
    pro: 'Pro',
    business: 'Business',
    enterprise: 'Enterprise'
  };
  this.planName = planNames[this.plan];
  
  // Set end date based on interval
  if (this.status === 'active' && !this.endDate && this.plan !== 'free') {
    const endDate = new Date();
    if (this.interval === 'month') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (this.interval === 'year') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    this.endDate = endDate;
  }
  
  next();
});

// Check if subscription is active
subscriptionSchema.methods.isActive = function() {
  return this.status === 'active' && 
         (!this.endDate || this.endDate > new Date());
};

// Check if subscription is trialing
subscriptionSchema.methods.isTrialing = function() {
  return this.status === 'trialing' && 
         this.trialEndDate && 
         this.trialEndDate > new Date();
};

// Check if subscription is expired
subscriptionSchema.methods.isExpired = function() {
  return this.endDate && this.endDate <= new Date();
};

// Get days remaining
subscriptionSchema.methods.daysRemaining = function() {
  if (!this.endDate) return Infinity;
  
  const now = new Date();
  const diff = this.endDate - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// Check feature access
subscriptionSchema.methods.hasFeature = function(featureName) {
  return this.features[featureName] === true;
};

// Check limit
subscriptionSchema.methods.checkLimit = function(limitName, currentValue) {
  const limit = this.features[limitName];
  return currentValue < limit;
};

// Increment usage
subscriptionSchema.methods.incrementUsage = async function(type, amount = 1) {
  if (this.usage[type] !== undefined) {
    this.usage[type] += amount;
    
    // Add to daily usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let dailyUsage = this.usage.daily.find(d => 
      d.date && d.date.toDateString() === today.toDateString()
    );
    
    if (!dailyUsage) {
      dailyUsage = {
        date: today,
        videos: 0,
        uploads: 0,
        storage: 0,
        apiCalls: 0
      };
      this.usage.daily.push(dailyUsage);
    }
    
    if (type === 'videosProcessed') dailyUsage.videos += amount;
    if (type === 'videosUploaded') dailyUsage.uploads += amount;
    if (type === 'apiCalls') dailyUsage.apiCalls += amount;
    
    await this.save();
  }
};

// Reset monthly usage
subscriptionSchema.methods.resetMonthlyUsage = async function() {
  this.usage.videosProcessed = 0;
  this.usage.videosUploaded = 0;
  this.usage.apiCalls = 0;
  this.usage.aiCalls = 0;
  
  // Keep storage usage
  // Keep daily logs for 30 days
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  this.usage.daily = this.usage.daily.filter(d => 
    d.date >= thirtyDaysAgo
  );
  
  this.usage.lastResetDate = new Date();
  
  const nextReset = new Date();
  nextReset.setMonth(nextReset.getMonth() + 1);
  this.usage.nextResetDate = nextReset;
  
  await this.save();
};

// Add history entry
subscriptionSchema.methods.addHistory = function(action, details, req = null) {
  this.history.push({
    action,
    date: new Date(),
    details,
    ip: req?.ip,
    userAgent: req?.get('User-Agent')
  });
};

// Upgrade plan
subscriptionSchema.methods.upgrade = async function(newPlan, interval = 'month') {
  const oldPlan = this.plan;
  
  this.plan = newPlan;
  this.interval = interval;
  
  // Update features based on plan
  const plans = {
    free: {
      maxVideosPerDay: 10,
      maxWorkflows: 3,
      maxChannels: 2,
      maxStorage: 10 * 1024 * 1024 * 1024,
      maxFileSize: 500 * 1024 * 1024,
      aiTitles: false,
      aiHashtags: false
    },
    pro: {
      maxVideosPerDay: 50,
      maxWorkflows: 10,
      maxChannels: 5,
      maxStorage: 100 * 1024 * 1024 * 1024,
      maxFileSize: 2 * 1024 * 1024 * 1024,
      aiTitles: true,
      aiHashtags: true
    },
    business: {
      maxVideosPerDay: 200,
      maxWorkflows: 30,
      maxChannels: 20,
      maxStorage: 1024 * 1024 * 1024 * 1024,
      maxFileSize: 10 * 1024 * 1024 * 1024,
      aiTitles: true,
      aiHashtags: true,
      customWatermark: true,
      scheduledUploads: true
    },
    enterprise: {
      maxVideosPerDay: -1, // unlimited
      maxWorkflows: -1,
      maxChannels: -1,
      maxStorage: -1,
      maxFileSize: -1,
      aiTitles: true,
      aiHashtags: true,
      customWatermark: true,
      scheduledUploads: true,
      analytics: true,
      api: true,
      webhooks: true
    }
  };
  
  this.features = plans[newPlan];
  
  this.addHistory('upgraded', `Upgraded from ${oldPlan} to ${newPlan}`);
  
  await this.save();
};

// Cancel subscription
subscriptionSchema.methods.cancel = async function(reason = null) {
  this.status = 'canceled';
  this.canceledAt = new Date();
  
  if (reason) {
    this.addHistory('canceled', reason);
  }
  
  await this.save();
};

// Get usage percentage
subscriptionSchema.virtual('usagePercentage').get(function() {
  const percentages = {};
  
  if (this.features.maxVideosPerDay > 0) {
    percentages.videosPerDay = (this.usage.videosProcessed / this.features.maxVideosPerDay) * 100;
  }
  
  if (this.features.maxStorage > 0) {
    percentages.storage = (this.usage.storageUsed / this.features.maxStorage) * 100;
  }
  
  return percentages;
});

// Get formatted storage
subscriptionSchema.virtual('storageFormatted').get(function() {
  const format = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return {
    used: format(this.usage.storageUsed),
    total: format(this.features.maxStorage),
    free: format(Math.max(0, this.features.maxStorage - this.usage.storageUsed))
  };
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
