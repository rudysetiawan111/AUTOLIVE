const express = require('express');
const router = express.Router();
const { getVideos } = require('../services/youtubeService');
const { getVideos: getTikTokVideos } = require('../services/tiktokService');

// GET videos from YouTube & TikTok
router.get('/', async (req, res) => {
  try {
    const ytVideos = await getVideos();      // YouTube API key dipakai di service
    const tiktokVideos = await getTikTokVideos(); // TikTok Client Key & Secret dipakai di service
    res.json({ youtube: ytVideos, tiktok: tiktokVideos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
