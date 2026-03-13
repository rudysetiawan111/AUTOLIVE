const express = require('express');
const router = express.Router();

// Dummy viral videos endpoint
router.get('/', (req, res) => {
  res.json({
    viral: [
      { title: 'Trending TikTok Dance', platform: 'TikTok', views: 45678 },
      { title: 'Popular YouTube Video', platform: 'YouTube', views: 32000 }
    ]
  });
});

module.exports = router;
