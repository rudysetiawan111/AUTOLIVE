const { fetchYouTubeVideos } = require('../collectors/youtubeCollector');
const { fetchTikTokData } = require('../collectors/tiktokCollector');
const { calculateEngagement } = require('../analyzers/engagementAnalyzer');

async function runWorkflow() {
  console.log('--- Running Workflow ---');

  const ytVideos = await fetchYouTubeVideos();
  const ttData = await fetchTikTokData();

  ytVideos.forEach(v => {
    console.log(`[YouTube] ${v.title} Engagement: ${calculateEngagement(v)}`);
  });

  ttData.videos.forEach(v => {
    console.log(`[TikTok] ${v.title} Engagement: ${calculateEngagement(v)}`);
  });

  console.log('--- Workflow Finished ---');
}

module.exports = { runWorkflow };
