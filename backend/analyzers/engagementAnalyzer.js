function calculateEngagement(video) {
  // Engagement rate = likes / views * 100
  if (!video.views || video.views === 0) return '0%';
  return ((video.likes / video.views) * 100).toFixed(2) + '%';
}

module.exports = { calculateEngagement };
