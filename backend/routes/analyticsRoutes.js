const express = require('express');
const router = express.Router();
const { calculateEngagement } = require('../analyzers/engagementAnalyzer');
const { categorizeVideo } = require('../analyzers/contentAnalyzer');
const { getVideos } = require('../services/youtubeService');
const { getVideos: getTikTokVideos } = require('../services/tiktokService');

// Analytics endpoint
router.get('/', async (req, res) => {
  const ytVideos = await getVideos();
  const tiktokVideos = await getTikTokVideos();

  const ytAnalytics = ytVideos.map(v => ({
    title: v.title,
    engagement: calculateEngagement(v),
    category: categorizeVideo(v.title)
  }));

  const tiktokAnalytics = tiktokVideos.map(v => ({
    title: v.title,
    engagement: calculateEngagement(v),
    category: categorizeVideo(v.title)
  }));

  res.json({ youtube: ytAnalytics, tiktok: tiktokAnalytics });
});

module.exports = router;
