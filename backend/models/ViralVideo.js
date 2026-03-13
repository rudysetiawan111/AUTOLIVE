const mongoose = require('mongoose');

const ViralVideoSchema = new mongoose.Schema({
  video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
  platform: { type: String, enum: ['YouTube', 'TikTok'] },
  rank: Number,
  viralScore: Number,
  detectedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ViralVideo', ViralVideoSchema);
