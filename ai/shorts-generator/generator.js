function generateShort(video) {
  // Dummy shorts generator
  return {
    title: `Short Clip: ${video.title}`,
    duration: 15, // seconds
    videoId: video.id || 'demo-id'
  };
}

module.exports = { generateShort };
