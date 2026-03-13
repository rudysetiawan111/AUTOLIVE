// backend/services/tiktokService.js
const config = require('../../config/integrations/tiktok.json');
const CLIENT_KEY = config.client_key;
const CLIENT_SECRET = config.client_secret;

// Dummy TikTok fetch user profile
async function getUserProfile() {
  return {
    username: 'demo_user',
    followers: 12345,
    videos: 23
  };
}

// Dummy TikTok fetch videos
async function getVideos() {
  return [
    { title: 'Funny Cat Video', views: 12345, likes: 1200 },
    { title: 'Trending Dance', views: 45678, likes: 3450 },
    { title: 'Tech Review', views: 10234, likes: 980 }
  ];
}

module.exports = { getUserProfile, getVideos };
