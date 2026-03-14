const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'info',
      'success',
      'warning',
      'error',
      'upload_complete',
      'upload_failed',
      'workflow_complete',
      'workflow_failed',
      'channel_connected',
      'channel_disconnected',
      'subscription_expiring',
      'storage_warning',
      'api_limit',
      'system_update',
      'security_alert'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  
  // Related entities
  relatedTo: {
    model: {
      type: String,
      enum: ['Video', 'Workflow', 'Channel', 'UploadReport', 'Execution', 'User']
    },
    id: mongoose.Schema.Types.ObjectId
  },
  
  // Action data
  action: {
    type: {
      type: String,
      enum: ['view', 'retry', 'dismiss', 'settings', 'upgrade']
    },
    url: String,
    label: String
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Status
  isRead: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  
  // Delivery methods
  delivery: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    push: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    
    emailSent: { type: Boolean, default: false },
    pushSent: { type: Boolean, default: false },
    smsSent: { type: Boolean, default: false },
    
    emailSentAt: Date,
    pushSentAt: Date,
    smsSentAt: Date
  },
  
  // Expiration
  expiresAt: Date,
  
  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Timestamps
  readAt: Date,
  archivedAt: Date,
  
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
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ 'delivery.emailSent': 1, createdAt: 1 });

// Update timestamps
notificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Set expiration if not set (default 30 days)
  if (!this.expiresAt) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    this.expiresAt = expiresAt;
  }
  
  next();
});

// Mark as read
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  await this.save();
};

// Mark as unread
notificationSchema.methods.markAsUnread = async function() {
  this.isRead = false;
  this.readAt = null;
  await this.save();
};

// Archive notification
notificationSchema.methods.archive = async function() {
  this.isArchived = true;
  this.archivedAt = new Date();
  await this.save();
};

// Mark email as sent
notificationSchema.methods.markEmailSent = async function() {
  this.delivery.emailSent = true;
  this.delivery.emailSentAt = new Date();
  await this.save();
};

// Mark push as sent
notificationSchema.methods.markPushSent = async function() {
  this.delivery.pushSent = true;
  this.delivery.pushSentAt = new Date();
  await this.save();
};

// Get icon based on type
notificationSchema.virtual('icon').get(function() {
  const icons = {
    info: 'info-circle',
    success: 'check-circle',
    warning: 'exclamation-triangle',
    error: 'times-circle',
    upload_complete: 'cloud-upload-alt',
    upload_failed: 'cloud-upload-alt',
    workflow_complete: 'project-diagram',
    workflow_failed: 'project-diagram',
    channel_connected: 'link',
    channel_disconnected: 'unlink',
    subscription_expiring: 'credit-card',
    storage_warning: 'hdd',
    api_limit: 'code',
    system_update: 'sync',
    security_alert: 'shield-alt'
  };
  return icons[this.type] || 'bell';
});

// Get color based on type
notificationSchema.virtual('color').get(function() {
  const colors = {
    info: 'info',
    success: 'success',
    warning: 'warning',
    error: 'danger',
    upload_complete: 'success',
    upload_failed: 'danger',
    workflow_complete: 'success',
    workflow_failed: 'danger',
    channel_connected: 'success',
    channel_disconnected: 'warning',
    subscription_expiring: 'warning',
    storage_warning: 'warning',
    api_limit: 'warning',
    system_update: 'info',
    security_alert: 'danger'
  };
  return colors[this.type] || 'secondary';
});

// Get formatted time
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'just now';
});

// Create notification
notificationSchema.statics.create = async function(data) {
  const notification = new this(data);
  await notification.save();
  return notification;
};

// Create system notification
notificationSchema.statics.system = async function(title, message, type = 'info', userIds = []) {
  const notifications = [];
  
  for (const userId of userIds) {
    const notification = new this({
      userId,
      type,
      title,
      message,
      priority: 'normal',
      delivery: {
        inApp: true
      }
    });
    await notification.save();
    notifications.push(notification);
  }
  
  return notifications;
};

// Create upload notification
notificationSchema.statics.uploadComplete = async function(userId, videoTitle, videoId) {
  return this.create({
    userId,
    type: 'upload_complete',
    title: 'Upload Complete',
    message: `Your video "${videoTitle}" has been successfully uploaded`,
    relatedTo: {
      model: 'Video',
      id: videoId
    },
    action: {
      type: 'view',
      label: 'View Video'
    },
    priority: 'normal'
  });
};

notificationSchema.statics.uploadFailed = async function(userId, videoTitle, error, videoId) {
  return this.create({
    userId,
    type: 'upload_failed',
    title: 'Upload Failed',
    message: `Failed to upload "${videoTitle}": ${error}`,
    relatedTo: {
      model: 'Video',
      id: videoId
    },
    action: {
      type: 'retry',
      label: 'Retry Upload'
    },
    priority: 'high'
  });
};

// Create workflow notification
notificationSchema.statics.workflowComplete = async function(userId, workflowName, executionId, stats) {
  return this.create({
    userId,
    type: 'workflow_complete',
    title: 'Workflow Complete',
    message: `Workflow "${workflowName}" completed. Uploaded ${stats.uploaded} videos.`,
    relatedTo: {
      model: 'Execution',
      id: executionId
    },
    action: {
      type: 'view',
      label: 'View Results'
    },
    priority: 'normal'
  });
};

notificationSchema.statics.workflowFailed = async function(userId, workflowName, executionId, error) {
  return this.create({
    userId,
    type: 'workflow_failed',
    title: 'Workflow Failed',
    message: `Workflow "${workflowName}" failed: ${error}`,
    relatedTo: {
      model: 'Execution',
      id: executionId
    },
    action: {
      type: 'view',
      label: 'View Error'
    },
    priority: 'high'
  });
};

// Create storage warning
notificationSchema.statics.storageWarning = async function(userId, used, total, percentage) {
  return this.create({
    userId,
    type: 'storage_warning',
    title: 'Storage Almost Full',
    message: `You've used ${percentage}% (${used}) of your ${total} storage limit`,
    action: {
      type: 'settings',
      label: 'Manage Storage'
    },
    priority: 'high',
    delivery: {
      inApp: true,
      email: true
    }
  });
};

// Create subscription notification
notificationSchema.statics.subscriptionExpiring = async function(userId, daysLeft, plan) {
  return this.create({
    userId,
    type: 'subscription_expiring',
    title: 'Subscription Expiring Soon',
    message: `Your ${plan} subscription will expire in ${daysLeft} days`,
    action: {
      type: 'upgrade',
      label: 'Renew Now'
    },
    priority: 'urgent',
    delivery: {
      inApp: true,
      email: true
    }
  });
};

// Create security alert
notificationSchema.statics.securityAlert = async function(userId, alert, ip, location) {
  return this.create({
    userId,
    type: 'security_alert',
    title: 'Security Alert',
    message: `${alert} from ${location} (${ip})`,
    action: {
      type: 'view',
      label: 'Review Activity'
    },
    priority: 'urgent',
    delivery: {
      inApp: true,
      email: true,
      push: true
    }
  });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
