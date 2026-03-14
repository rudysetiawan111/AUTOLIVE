const ytdl = require('ytdl-core');
const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const logger = require('../utils/logger');

class YouTubeDownloader {
  constructor() {
    this.downloadPath = './storage/downloads/youtube';
    this.ensureDirectory();
  }
  
  // Ensure download directory exists
  async ensureDirectory() {
    await fs.ensureDir(this.downloadPath);
  }
  
  // Download video from YouTube
  async download(url, videoId) {
    try {
      // Validate URL
      if (!ytdl.validateURL(url)) {
        throw new Error('Invalid YouTube URL');
      }
      
      // Get video info
      const info = await ytdl.getInfo(url);
      const title = this.sanitizeFilename(info.videoDetails.title);
      const outputPath = path.join(this.downloadPath, `${videoId}-${title}.mp4`);
      
      // Download video
      const stream = ytdl(url, {
        quality: 'highest',
        filter: 'audioandvideo'
      });
      
      await new Promise((resolve, reject) => {
        stream
          .pipe(fs.createWriteStream(outputPath))
          .on('finish', resolve)
          .on('error', reject);
      });
      
      // Get video duration using ffmpeg
      const duration = await this.getVideoDuration(outputPath);
      
      // Download thumbnail
      const thumbnailPath = await this.downloadThumbnail(
        info.videoDetails.thumbnails[0].url,
        videoId
      );
      
      return {
        filePath: outputPath,
        fileSize: (await fs.stat(outputPath)).size,
        duration,
        thumbnail: thumbnailPath,
        title: info.videoDetails.title,
        description: info.videoDetails.description,
        author: info.videoDetails.author.name
      };
    } catch (error) {
      logger.error('YouTube download error:', error);
      throw error;
    }
  }
  
  // Download audio only
  async downloadAudio(url, videoId) {
    try {
      if (!ytdl.validateURL(url)) {
        throw new Error('Invalid YouTube URL');
      }
      
      const info = await ytdl.getInfo(url);
      const title = this.sanitizeFilename(info.videoDetails.title);
      const outputPath = path.join(this.downloadPath, `${videoId}-${title}.mp3`);
      
      const stream = ytdl(url, {
        quality: 'highestaudio',
        filter: 'audioonly'
      });
      
      await new Promise((resolve, reject) => {
        ffmpeg(stream)
          .audioBitrate(128)
          .save(outputPath)
          .on('end', resolve)
          .on('error', reject);
      });
      
      return {
        filePath: outputPath,
        fileSize: (await fs.stat(outputPath)).size,
        duration: parseInt(info.videoDetails.lengthSeconds),
        title: info.videoDetails.title
      };
    } catch (error) {
      logger.error('YouTube audio download error:', error);
      throw error;
    }
  }
  
  // Download thumbnail
  async downloadThumbnail(url, videoId) {
    try {
      const axios = require('axios');
      const thumbnailPath = path.join(this.downloadPath, `thumbnails`, `${videoId}.jpg`);
      
      await fs.ensureDir(path.join(this.downloadPath, 'thumbnails'));
      
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
      });
      
      await new Promise((resolve, reject) => {
        response.data
          .pipe(fs.createWriteStream(thumbnailPath))
          .on('finish', resolve)
          .on('error', reject);
      });
      
      return thumbnailPath;
    } catch (error) {
      logger.error('Thumbnail download error:', error);
      return null;
    }
  }
  
  // Get video duration using ffmpeg
  getVideoDuration(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata.format.duration);
        }
      });
    });
  }
  
  // Sanitize filename
  sanitizeFilename(filename) {
    return filename
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '_')
      .substring(0, 100);
  }
  
  // Get video info without downloading
  async getInfo(url) {
    try {
      const info = await ytdl.getInfo(url);
      return {
        title: info.videoDetails.title,
        description: info.videoDetails.description,
        duration: parseInt(info.videoDetails.lengthSeconds),
        author: info.videoDetails.author.name,
        views: parseInt(info.videoDetails.viewCount),
        likes: parseInt(info.videoDetails.likes),
        thumbnail: info.videoDetails.thumbnails[0].url
      };
    } catch (error) {
      logger.error('Get YouTube info error:', error);
      throw error;
    }
  }
}

module.exports = new YouTubeDownloader();
