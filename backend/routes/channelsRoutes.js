const express = require('express');
const router = express.Router();
const { getVideos } = require('../services/youtubeService');
const { getUserProfile } = require('../services/tiktokService');

// GET list of channels (YouTube + TikTok dummy)
router.get('/', async (req, res) => {
  try {
    const ytChannels = [{ name: 'YouTube Channel 1' }, { name: 'YouTube Channel 2' }];
    const tiktokProfile = await getUserProfile();
    res.json({ youtube: ytChannels, tiktok: tiktokProfile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
