const axios = require('axios');
const logger = require('../utils/logger');

class TikTokService {
  constructor() {
    this.baseURL = 'https://open-api.tiktok.com';
  }
  
  // Exchange authorization code for tokens
  async exchangeCode(code) {
    try {
      const response = await axios.post(`${this.baseURL}/oauth/access_token/`, {
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code'
      });
      
      return response.data.data;
    } catch (error) {
      logger.error('TikTok code exchange error:', error);
      throw new Error('Failed to exchange TikTok code');
    }
  }
  
  // Get user info
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/user/info/`, {
        params: {
          access_token: accessToken
        }
      });
      
      const user = response.data.data;
      return {
        open_id: user.open_id,
        union_id: user.union_id,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        follower_count: user.follower_count,
        following_count: user.following_count,
        like_count: user.like_count,
        video_count: user.video_count
      };
    } catch (error) {
      logger.error('Get user info error:', error);
      throw new Error('Failed to get user info');
    }
  }
  
  // Get user stats
  async getUserStats(openId) {
    try {
      // This would require a valid access token
      // Placeholder implementation
      return {
        followers: 0,
        following: 0,
        likes: 0,
        videos: 0
      };
    } catch (error) {
      logger.error('Get user stats error:', error);
      throw new Error('Failed to get user stats');
    }
  }
  
  // Get detailed stats
  async getDetailedStats(openId, accessToken) {
    try {
      const [userInfo, recentVideos] = await Promise.all([
        this.getUserInfo(accessToken),
        this.getRecentVideos(openId, accessToken, 10)
      ]);
      
      return {
        ...userInfo,
        recentVideos
      };
    } catch (error) {
      logger.error('Get detailed stats error:', error);
      throw new Error('Failed to get detailed stats');
    }
  }
  
  // Get recent videos
  async getRecentVideos(openId, accessToken, maxResults = 10) {
    try {
      const response = await axios.post(`${this.baseURL}/video/list/`, {
        access_token: accessToken,
        open_id: openId,
        max_count: maxResults
      });
      
      return response.data.data.videos.map(video => ({
        id: video.video_id,
        title: video.title,
        cover: video.cover_url,
                createTime: video.create_time,
        views: video.view_count,
        likes: video.like_count,
        comments: video.comment_count,
        shares: video.share_count
      }));
    } catch (error) {
      logger.error('Get recent videos error:', error);
      return [];
    }
  }
  
  // Refresh token
  async refreshToken(refreshToken) {
    try {
      const response = await axios.post(`${this.baseURL}/oauth/refresh_token/`, {
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      });
      
      return response.data.data;
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw new Error('Failed to refresh token');
    }
  }
  
  // Search videos
  async searchVideos(keyword, maxResults = 20) {
    try {
      // Note: TikTok API search requires additional permissions
      // This is a placeholder implementation
      return [];
    } catch (error) {
      logger.error('Search videos error:', error);
      throw new Error('Failed to search videos');
    }
  }
  
  // Get video details
  async getVideoDetails(videoId, accessToken) {
    try {
      const response = await axios.post(`${this.baseURL}/video/data/`, {
        access_token: accessToken,
        video_id: videoId
      });
      
      return response.data.data;
    } catch (error) {
      logger.error('Get video details error:', error);
      throw new Error('Failed to get video details');
    }
  }
  
  // Get trending topics
  async getTrendingTopics() {
    try {
      // TikTok doesn't provide trending topics API directly
      // This would need to be implemented via scraping or third-party service
      return [
        { topic: 'dance', volume: 1000000 },
        { topic: 'comedy', volume: 950000 },
        { topic: 'music', volume: 900000 },
        { topic: 'food', volume: 850000 },
        { topic: 'fashion', volume: 800000 }
      ];
    } catch (error) {
      logger.error('Get trending topics error:', error);
      return [];
    }
  }
}

module.exports = new TikTokService();
