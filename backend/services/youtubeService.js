const { google } = require('googleapis');
const axios = require('axios');
const logger = require('../utils/logger');

class YouTubeService {
  constructor() {
    this.youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY
    });
  }
  
  // Exchange authorization code for tokens
  async exchangeCode(code) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );
    
    try {
      const { tokens } = await oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      logger.error('YouTube code exchange error:', error);
      throw new Error('Failed to exchange YouTube code');
    }
  }
  
  // Get channel info
  async getChannelInfo(accessToken) {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: {
          part: 'snippet,statistics,contentDetails',
          mine: true
        },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      const channel = response.data.items[0];
      return {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        thumbnails: channel.snippet.thumbnails,
        subscriberCount: parseInt(channel.statistics.subscriberCount) || 0,
        viewCount: parseInt(channel.statistics.viewCount) || 0,
        videoCount: parseInt(channel.statistics.videoCount) || 0
      };
    } catch (error) {
      logger.error('Get channel info error:', error);
      throw new Error('Failed to get channel info');
    }
  }
  
  // Get channel stats
  async getChannelStats(channelId) {
    try {
      const response = await this.youtube.channels.list({
        part: 'statistics',
        id: channelId
      });
      
      const stats = response.data.items[0].statistics;
      return {
        subscribers: parseInt(stats.subscriberCount) || 0,
        views: parseInt(stats.viewCount) || 0,
        videos: parseInt(stats.videoCount) || 0
      };
    } catch (error) {
      logger.error('Get channel stats error:', error);
      throw new Error('Failed to get channel stats');
    }
  }
  
  // Get detailed stats
  async getDetailedStats(channelId, accessToken) {
    try {
      const [channelStats, recentVideos] = await Promise.all([
        this.getChannelStats(channelId),
        this.getRecentVideos(channelId, accessToken, 10)
      ]);
      
      return {
        ...channelStats,
        recentVideos
      };
    } catch (error) {
      logger.error('Get detailed stats error:', error);
      throw new Error('Failed to get detailed stats');
    }
  }
  
  // Get recent videos
  async getRecentVideos(channelId, accessToken, maxResults = 10) {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          channelId,
          maxResults,
          order: 'date',
          type: 'video'
        },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      return response.data.items.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high.url,
        publishedAt: item.snippet.publishedAt
      }));
    } catch (error) {
      logger.error('Get recent videos error:', error);
      return [];
    }
  }
  
  // Refresh token
  async refreshToken(refreshToken) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET
    );
    
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
    
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      return credentials;
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw new Error('Failed to refresh token');
    }
  }
  
  // Search videos
  async searchVideos(query, maxResults = 20) {
    try {
      const response = await this.youtube.search.list({
        part: 'snippet',
        q: query,
        maxResults,
        type: 'video',
        order: 'viewCount'
      });
      
      return response.data.items.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt
      }));
    } catch (error) {
      logger.error('Search videos error:', error);
      throw new Error('Failed to search videos');
    }
  }
  
  // Get video details
  async getVideoDetails(videoId) {
    try {
      const response = await this.youtube.videos.list({
        part: 'snippet,statistics,contentDetails',
        id: videoId
      });
      
      const video = response.data.items[0];
      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails.high.url,
        channelId: video.snippet.channelId,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        views: parseInt(video.statistics.viewCount) || 0,
        likes: parseInt(video.statistics.likeCount) || 0,
        comments: parseInt(video.statistics.commentCount) || 0,
        duration: video.contentDetails.duration
      };
    } catch (error) {
      logger.error('Get video details error:', error);
      throw new Error('Failed to get video details');
    }
  }
}

module.exports = new YouTubeService();
