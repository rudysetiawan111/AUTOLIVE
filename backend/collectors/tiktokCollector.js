const { getUserProfile, getVideos } = require('../services/tiktokService');

async function fetchTikTokData() {
  const profile = await getUserProfile();
  const videos = await getVideos();
  return { profile, videos };
}

module.exports = { fetchTikTokData };
