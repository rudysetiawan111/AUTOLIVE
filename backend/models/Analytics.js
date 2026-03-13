const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
  video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
  engagementRate: String,
  category: String,
  analyzedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Analytics', AnalyticsSchema);
