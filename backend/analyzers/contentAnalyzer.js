const Video = require('../models/Video');
const Channel = require('../models/Channel');
const logger = require('../utils/logger');

class ContentAnalyzer {
  // Analyze video content
  async analyzeVideoContent(videoId) {
    try {
      const video = await Video.findById(videoId);
      if (!video) throw new Error('Video not found');
      
      const analysis = {
        title: this.analyzeTitle(video.title),
        description: this.analyzeDescription(video.description),
        tags: this.analyzeTags(video.tags),
        metadata: video.metadata || {},
        suggestions: []
      };
      
      // Generate improvement suggestions
      analysis.suggestions = this.generateSuggestions(analysis);
      
      return analysis;
    } catch (error) {
      logger.error('Content analysis error:', error);
      throw error;
    }
  }
  
  // Analyze title
  analyzeTitle(title) {
    if (!title) return { score: 0, issues: ['Title is empty'] };
    
    const issues = [];
    let score = 100;
    
    // Check length
    const length = title.length;
    if (length < 30) {
      issues.push('Title is too short (under 30 characters)');
      score -= 20;
    } else if (length > 100) {
      issues.push('Title is too long (over 100 characters)');
      score -= 15;
    }
    
    // Check for clickbait patterns
    const clickbaitWords = ['shocking', 'unbelievable', 'you won\'t believe', 'mind blowing'];
    const hasClickbait = clickbaitWords.some(word => 
      title.toLowerCase().includes(word.toLowerCase())
    );
    if (hasClickbait) {
      issues.push('Title contains clickbait words (may reduce trust)');
      score -= 10;
    }
    
    // Check for keywords
    const hasKeywords = title.includes(' ') && title.split(' ').length >= 3;
    if (!hasKeywords) {
      issues.push('Title lacks descriptive keywords');
      score -= 15;
    }
    
    // Check capitalization
    const isAllCaps = title === title.toUpperCase() && title.length > 5;
    if (isAllCaps) {
      issues.push('Title is in ALL CAPS (may appear spammy)');
      score -= 10;
    }
    
    return {
      score: Math.max(0, score),
      issues,
      suggestions: this.getTitleSuggestions(title)
    };
  }
  
  // Analyze description
  analyzeDescription(description) {
    if (!description) return { score: 0, issues: ['Description is empty'] };
    
    const issues = [];
    let score = 100;
    
    // Check length
    const length = description.length;
    if (length < 200) {
      issues.push('Description is too short (under 200 characters)');
      score -= 25;
    }
    
    // Check for links
    const hasLinks = description.includes('http') || description.includes('www.');
    if (!hasLinks) {
      issues.push('No links in description (missed opportunity for traffic)');
      score -= 15;
    }
    
    // Check for timestamps
    const hasTimestamps = description.match(/\d+:\d+/);
    if (!hasTimestamps) {
      issues.push('No timestamps for longer videos');
      score -= 10;
    }
    
    // Check for call to action
    const ctaPhrases = ['subscribe', 'like', 'comment', 'share', 'follow'];
    const hasCTA = ctaPhrases.some(phrase => 
      description.toLowerCase().includes(phrase)
    );
    if (!hasCTA) {
      issues.push('No call to action (ask viewers to engage)');
      score -= 15;
    }
    
    return {
      score: Math.max(0, score),
      issues,
      wordCount: description.split(' ').length
    };
  }
  
  // Analyze tags
  analyzeTags(tags) {
    if (!tags || tags.length === 0) {
      return { score: 0, issues: ['No tags provided'] };
    }
    
    const issues = [];
    let score = 100;
    
    // Check number of tags
    if (tags.length < 5) {
      issues.push('Too few tags (minimum 5 recommended)');
      score -= 20;
    } else if (tags.length > 15) {
      issues.push('Too many tags (maximum 15 recommended)');
      score -= 10;
    }
    
    // Check tag length
    const longTags = tags.filter(t => t.length > 30);
    if (longTags.length > 0) {
      issues.push('Some tags are too long (over 30 characters)');
      score -= 15;
    }
    
    // Check for duplicates
    const uniqueTags = new Set(tags);
    if (uniqueTags.size !== tags.length) {
      issues.push('Duplicate tags found');
      score -= 20;
    }
    
    return {
      score: Math.max(0, score),
      issues,
      count: tags.length,
      uniqueCount: uniqueTags.size
    };
  }
  
  // Generate title suggestions
  getTitleSuggestions(currentTitle) {
    const suggestions = [];
    
    if (currentTitle.length < 30) {
      suggestions.push('Add more descriptive words to explain the content');
    }
    if (currentTitle.length > 100) {
      suggestions.push('Shorten the title to focus on key message');
    }
    if (!currentTitle.includes('|')) {
      suggestions.push('Consider using a pipe (|) to separate topics');
    }
    if (!currentTitle.match(/\d+/)) {
      suggestions.push('Add numbers to make the title more specific');
    }
    
    return suggestions;
  }
  
  // Generate improvement suggestions
  generateSuggestions(analysis) {
    const suggestions = [];
    
    // Title suggestions
    if (analysis.title.score < 70) {
      suggestions.push({
        area: 'title',
        priority: 'high',
        message: 'Improve your title for better click-through rate',
        details: analysis.title.suggestions
      });
    }
    
    // Description suggestions
    if (analysis.description.score < 70) {
      suggestions.push({
        area: 'description',
        priority: 'high',
        message: 'Enhance your description for better SEO',
        details: analysis.description.issues
      });
    }
    
    // Tags suggestions
    if (analysis.tags.score < 70) {
      suggestions.push({
        area: 'tags',
        priority: 'medium',
        message: 'Optimize your tags for better discoverability',
        details: analysis.tags.issues
      });
    }
    
    return suggestions;
  }
  
  // Analyze channel content strategy
  async analyzeChannelStrategy(channelId) {
    try {
      const channel = await Channel.findById(channelId);
      const videos = await Video.find({ channelId }).sort({ createdAt: -1 });
      
      if (videos.length === 0) {
        return {
          channel: channel.name,
          totalVideos: 0,
          analysis: 'No videos found for this channel'
        };
      }
      
      // Analyze posting frequency
      const dates = videos.map(v => new Date(v.createdAt));
      const intervals = [];
      for (let i = 1; i < dates.length; i++) {
        const days = (dates[i-1] - dates[i]) / (1000 * 60 * 60 * 24);
        intervals.push(days);
      }
      
      const avgInterval = intervals.length > 0 
        ? intervals.reduce((a, b) => a + b, 0) / intervals.length 
        : 0;
      
      // Analyze content types
      const contentTypes = {
        tutorial: videos.filter(v => v.title.toLowerCase().includes('tutorial')).length,
        review: videos.filter(v => v.title.toLowerCase().includes('review')).length,
        vlog: videos.filter(v => v.title.toLowerCase().includes('vlog')).length,
        other: 0
      };
      
      // Calculate performance metrics
      const avgViews = videos.reduce((acc, v) => acc + (v.stats?.views || 0), 0) / videos.length;
      const avgEngagement = videos.reduce((acc, v) => {
        const views = v.stats?.views || 0;
        const likes = v.stats?.likes || 0;
        return acc + (views > 0 ? likes / views : 0);
      }, 0) / videos.length * 100;
      
      return {
        channel: channel.name,
        totalVideos: videos.length,
        postingFrequency: {
          averageDaysBetweenPosts: avgInterval.toFixed(1),
          postsPerWeek: (7 / avgInterval).toFixed(1)
        },
        contentMix: contentTypes,
        performance: {
          averageViews: Math.round(avgViews),
          averageEngagementRate: avgEngagement.toFixed(2) + '%'
        },
        recommendations: this.generateStrategyRecommendations({
          avgInterval,
          contentTypes,
          avgEngagement
        })
      };
    } catch (error) {
      logger.error('Channel strategy analysis error:', error);
      throw error;
    }
  }
  
  // Generate strategy recommendations
  generateStrategyRecommendations(stats) {
    const recommendations = [];
    
    if (stats.avgInterval > 14) {
      recommendations.push('Post more frequently (current average: once every ' + 
        stats.avgInterval.toFixed(1) + ' days)');
    }
    
    if (stats.avgEngagement < 3) {
      recommendations.push('Work on increasing engagement - try asking questions in videos');
    }
    
    const dominantType = Object.entries(stats.contentTypes)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (dominantType && dominantType[1] > 0) {
      recommendations.push(`Your strongest content type is ${dominantType[0]}. Consider creating more of this type.`);
    }
    
    return recommendations;
  }
}

module.exports = new ContentAnalyzer();
