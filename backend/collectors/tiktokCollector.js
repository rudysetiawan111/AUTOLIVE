const tiktokService = require('../services/tiktokService');
const ViralVideo = require('../models/ViralVideo');
const logger = require('../utils/logger');

class TikTokCollector {
  // Discover viral videos from TikTok
  async discoverViral(options = {}) {
    try {
      const {
        keywords = [],
        maxResults = 20,
        minViews = 500000,
        minLikes = 50000
      } = options;
      
      let allVideos = [];
      
      // Search by keywords
      if (keywords.length > 0) {
        for (const keyword of keywords) {
          const videos = await tiktokService.searchVideos(keyword, Math.floor(maxResults / keywords.length));
          allVideos = [...allVideos, ...videos];
        }
      }
      
      // Get trending videos
      const trending = await this.getTrendingVideos(maxResults);
      allVideos = [...allVideos, ...trending];
      
      // Remove duplicates
      const uniqueVideos = Array.from(new Map(allVideos.map(v => [v.id, v])).values());
      
      // Get details and calculate viral score
      const detailedVideos = await Promise.all(
        uniqueVideos.slice(0, maxResults).map(async (video) => {
          try {
            return {
              originalId: video.id,
              platform: 'tiktok',
              title: video.title || 'Untitled',
              description: video.description || '',
              thumbnail: video.cover || video.thumbnail,
              url: `https://tiktok.com/@${video.author}/video/${video.id}`,
              author: {
                name: video.authorName || 'Unknown',
                username: video.author
              },
              stats: {
                views: video.views || 0,
                likes: video.likes || 0,
                comments: video.comments || 0,
                shares: video.shares || 0
              },
              publishedAt: video.createTime,
              viralScore: this.calculateViralScore(video)
            };
          } catch (error) {
            logger.error(`Error processing TikTok video ${video.id}:`, error);
            return null;
          }
        })
      );
      
      // Filter out null values and low viral score
      const validVideos = detailedVideos
        .filter(v => v && v.stats.views >= minViews && v.viralScore > 50);
      
      return validVideos;
    } catch (error) {
      logger.error('TikTok viral discovery error:', error);
      throw error;
    }
  }
  
  // Get trending videos
  async getTrendingVideos(limit = 20) {
    try {
      // TikTok doesn't provide trending API directly
      // This would need to be implemented via scraping or third-party service
      // Placeholder implementation
      return [];
    } catch (error) {
      logger.error('Get TikTok trending error:', error);
      return [];
    }
  }
  
  // Get trending topics
  async getTrendingTopics() {
    try {
      // Placeholder implementation
      return [
        { topic: 'dance', volume: 2000000, growth: 25 },
        { topic: 'comedy', volume: 1800000, growth: 20 },
        { topic: 'music', volume: 1500000, growth: 18 },
        { topic: 'food', volume: 1200000, growth: 15 },
        { topic: 'fashion', volume: 1000000, growth: 12 }
      ];
    } catch (error) {
      logger.error('Get TikTok trending error:', error);
      return [];
    }
  }
  
  // Calculate viral score for TikTok
  calculateViralScore(video) {
    const views = video.views || 0;
    const likes = video.likes || 0;
    const shares = video.shares || 0;
    const comments = video.comments || 0;
    
    // TikTok viral score calculation (engagement rate is key)
    const engagement = (likes + comments + shares) / Math.max(views, 1) * 100;
    const viewScore = Math.min(views / 500000, 100);
    const engagementScore = Math.min(engagement * 20, 100);
    
    return (viewScore * 0.4 + engagementScore * 0.6);
  }
}

module.exports = new TikTokCollector();
