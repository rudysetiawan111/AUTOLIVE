const { getVideos } = require('../services/youtubeService');

async function fetchYouTubeVideos() {
  const videos = await getVideos();
  return videos;
}

module.exports = { fetchYouTubeVideos };
