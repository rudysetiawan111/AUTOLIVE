const Video = require('../models/Video');
const Analytics = require('../models/Analytics');
const logger = require('../utils/logger');

class EngagementAnalyzer {
  // Analyze video engagement
  async analyzeVideoEngagement(videoId) {
    try {
      const video = await Video.findById(videoId).populate('channelId');
      if (!video) throw new Error('Video not found');
      
      const analytics = await Analytics.find({ videoId }).sort({ date: 1 });
      
      if (analytics.length === 0) {
        return this.calculateBasicEngagement(video);
      }
      
      return this.calculateDetailedEngagement(analytics, video);
    } catch (error) {
      logger.error('Engagement analysis error:', error);
      throw error;
    }
  }
  
  // Calculate basic engagement
  calculateBasicEngagement(video) {
    const views = video.stats?.views || 0;
    const likes = video.stats?.likes || 0;
    const comments = video.stats?.comments || 0;
    const shares = video.stats?.shares || 0;
    
    const likeRate = views > 0 ? (likes / views) * 100 : 0;
    const commentRate = views > 0 ? (comments / views) * 100 : 0;
    const shareRate = views > 0 ? (shares / views) * 100 : 0;
    const totalEngagement = likeRate + commentRate + shareRate;
    
    return {
      likeRate: parseFloat(likeRate.toFixed(2)),
      commentRate: parseFloat(commentRate.toFixed(2)),
      shareRate: parseFloat(shareRate.toFixed(2)),
      totalEngagement: parseFloat(totalEngagement.toFixed(2)),
      quality: this.getEngagementQuality(totalEngagement)
    };
  }
  
  // Calculate detailed engagement from analytics data
  calculateDetailedEngagement(analytics, video) {
    const total = analytics.reduce((acc, curr) => ({
      views: acc.views + (curr.views || 0),
      likes: acc.likes + (curr.likes || 0),
      comments: acc.comments + (curr.comments || 0),
      shares: acc.shares + (curr.shares || 0),
      watchTime: acc.watchTime + (curr.watchTime || 0)
    }), { views: 0, likes: 0, comments: 0, shares: 0, watchTime: 0 });
    
    const avgWatchTime = total.views > 0 ? total.watchTime / total.views : 0;
    const completionRate = video.duration > 0 ? (avgWatchTime / video.duration) * 100 : 0;
    const likeRate = total.views > 0 ? (total.likes / total.views) * 100 : 0;
    const commentRate = total.views > 0 ? (total.comments / total.views) * 100 : 0;
    const shareRate = total.views > 0 ? (total.shares / total.views) * 100 : 0;
    
    // Calculate trend (last 7 days vs previous 7 days)
    const now = new Date();
    const lastWeek = new Date(now.setDate(now.getDate() - 7));
    const prevWeek = new Date(now.setDate(now.getDate() - 14));
    
    const recent = analytics.filter(a => new Date(a.date) >= lastWeek);
    const previous = analytics.filter(a => {
      const date = new Date(a.date);
      return date >= prevWeek && date < lastWeek;
    });
    
    const recentAvg = this.calculateAverageEngagement(recent);
    const previousAvg = this.calculateAverageEngagement(previous);
    
    const trend = previousAvg.totalEngagement > 0 
      ? ((recentAvg.totalEngagement - previousAvg.totalEngagement) / previousAvg.totalEngagement) * 100
      : 0;
    
    return {
      totals: total,
      averages: {
        likeRate: parseFloat(likeRate.toFixed(2)),
        commentRate: parseFloat(commentRate.toFixed(2)),
        shareRate: parseFloat(shareRate.toFixed(2)),
        watchTime: parseFloat(avgWatchTime.toFixed(2)),
        completionRate: parseFloat(completionRate.toFixed(2))
      },
      trend: {
        value: parseFloat(trend.toFixed(2)),
        direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable'
      },
      quality: this.getEngagementQuality(likeRate + commentRate + shareRate)
    };
  }
  
  // Calculate average engagement for an array of analytics
  calculateAverageEngagement(analytics) {
    if (analytics.length === 0) {
      return { totalEngagement: 0 };
    }
    
    const total = analytics.reduce((acc, curr) => {
      const views = curr.views || 0;
      const likes = curr.likes || 0;
      const comments = curr.comments || 0;
      const shares = curr.shares || 0;
      
      const likeRate = views > 0 ? (likes / views) * 100 : 0;
      const commentRate = views > 0 ? (comments / views) * 100 : 0;
      const shareRate = views > 0 ? (shares / views) * 100 : 0;
      
      return {
        totalEngagement: acc.totalEngagement + likeRate + commentRate + shareRate
      };
    }, { totalEngagement: 0 });
    
    return {
      totalEngagement: total.totalEngagement / analytics.length
    };
  }
  
  // Get engagement quality label
  getEngagementQuality(score) {
    if (score >= 10) return 'excellent';
    if (score >= 7) return 'good';
    if (score >= 4) return 'average';
    if (score >= 2) return 'fair';
    return 'poor';
  }
  
  // Compare engagement between videos
  async compareVideos(videoIds) {
    try {
      const results = await Promise.all(
        videoIds.map(async (id) => {
          const video = await Video.findById(id);
          const engagement = await this.analyzeVideoEngagement(id);
          return {
            videoId: id,
            title: video?.title,
            engagement
          };
        })
      );
      
      // Sort by total engagement
      return results.sort((a, b) => 
        b.engagement.averages?.totalEngagement - a.engagement.averages?.totalEngagement
      );
    } catch (error) {
      logger.error('Compare videos error:', error);
      throw error;
    }
  }
}

module.exports = new EngagementAnalyzer();
