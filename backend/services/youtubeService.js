// backend/services/youtubeService.js
const axios = require('axios');
const config = require('../../config/integrations/youtube.json');
const API_KEY = config.api_key_1;

// Fungsi ambil video dari YouTube (dummy fetch)
async function getVideos() {
  // Contoh request ke YouTube Data API v3
  // Dummy data untuk demo
  return [
    { title: 'YouTube Video 1', views: 15000, likes: 800 },
    { title: 'YouTube Video 2', views: 32000, likes: 2400 }
  ];
}

module.exports = { getVideos };
