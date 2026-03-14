const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const logger = require('../utils/logger');

class TikTokDownloader {
  constructor() {
    this.downloadPath = './storage/downloads/tiktok';
    this.ensureDirectory();
  }
  
  // Ensure download directory exists
  async ensureDirectory() {
    await fs.ensureDir(this.downloadPath);
  }
  
  // Download video from TikTok
  async download(url, videoId) {
    try {
      // Extract video ID from URL
      const videoId_match = url.match(/\/video\/(\d+)/);
      if (!videoId_match) {
        throw new Error('Invalid TikTok URL');
      }
      
      const tiktokId = videoId_match[1];
      
      // Get video info (this would use a third-party service or scraping)
      const info = await this.getVideoInfo(url);
      
      // Download video (implementation depends on TikTok's restrictions)
      // This is a placeholder - actual implementation would need to handle
      // TikTok's anti-scraping measures or use official API
      
      const outputPath = path.join(this.downloadPath, `${videoId}-${tiktokId}.mp4`);
      
      // Placeholder for actual download logic
      // In production, you would use a service like TikTokAPI or puppeteer
      
      // Mock download for development
      await this.mockDownload(outputPath);
      
      // Get video duration
      const duration = await this.getVideoDuration(outputPath);
      
      return {
        filePath: outputPath,
        fileSize: (await fs.stat(outputPath)).size,
        duration,
        thumbnail: info.thumbnail,
        title: info.title,
        description: info.description,
        author: info.author
      };
    } catch (error) {
      logger.error('TikTok download error:', error);
      throw error;
    }
  }
  
  // Get video info (placeholder)
  async getVideoInfo(url) {
    // This would fetch actual video info from TikTok
    // Placeholder implementation
    return {
      title: 'TikTok Video',
      description: 'Downloaded from TikTok',
      author: 'unknown',
      thumbnail: null
    };
  }
  
  // Mock download for development
  async mockDownload(outputPath) {
    // Create a dummy file for testing
    await fs.writeFile(outputPath, 'Mock video content');
  }
  
  // Get video duration using ffmpeg
  getVideoDuration(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          // If file doesn't exist or is invalid, return mock duration
          resolve(60); // 60 seconds mock
        } else {
          resolve(metadata.format.duration);
        }
      });
    });
  }
  
  // Download using external service (alternative method)
  async downloadViaService(url, videoId) {
    try {
      // Use a third-party service like savetik or ssstik
      const serviceUrl = `https://api.example.com/download?url=${encodeURIComponent(url)}`;
      
      const response = await axios({
        url: serviceUrl,
        method: 'GET',
        responseType: 'stream'
      });
      
      const outputPath = path.join(this.downloadPath, `${videoId}.mp4`);
      
      await new Promise((resolve, reject) => {
        response.data
          .pipe(fs.createWriteStream(outputPath))
          .on('finish', resolve)
          .on('error', reject);
      });
      
      return {
        filePath: outputPath,
        fileSize: (await fs.stat(outputPath)).size
      };
    } catch (error) {
      logger.error('TikTok service download error:', error);
      throw error;
    }
  }
}

module.exports = new TikTokDownloader();
