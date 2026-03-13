const express = require('express');
const router = express.Router();
const { uploadVideo } = require('../uploaders/youtubeUploader'); // Bisa diganti tiktokUploader juga

router.post('/youtube', async (req, res) => {
  const video = req.body;
  await uploadVideo(video);
  res.json({ status: 'uploaded', platform: 'YouTube', video });
});

router.post('/tiktok', async (req, res) => {
  const video = req.body;
  const { uploadVideo: tiktokUpload } = require('../uploaders/tiktokUploader');
  await tiktokUpload(video);
  res.json({ status: 'uploaded', platform: 'TikTok', video });
});

module.exports = router;
