const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: String,
  platform: { type: String, enum: ['YouTube', 'TikTok'], required: true },
  apiKey: String, // bisa simpan API key / token
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
