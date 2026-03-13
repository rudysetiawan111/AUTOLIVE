const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  platform: { type: String, enum: ['YouTube', 'TikTok'], required: true },
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' },
  views: Number,
  likes: Number,
  uploadDate: Date,
  url: String
});

module.exports = mongoose.model('Video', VideoSchema);
