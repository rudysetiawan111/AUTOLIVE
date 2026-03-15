// backend/utils/tiktok-downloader.js
const axios = require('axios');

class TikTokDownloader {
  constructor() {
    this.baseURL = 'https://www.tiktok.com/oembed';
  }

  async getVideoInfo(url) {
    try {
      const response = await axios.get(`${this.baseURL}?url=${url}`);
      return response.data;
    } catch (error) {
      console.error('Error getting TikTok info:', error);
      throw error;
    }
  }

  async downloadVideo(url) {
    try {
      // Implementasi download TikTok
      // Bisa menggunakan API eksternal atau library lain
      const info = await this.getVideoInfo(url);
      return {
        success: true,
        title: info.title,
        author: info.author_name,
        thumbnail: info.thumbnail_url,
        url: url
      };
    } catch (error) {
      console.error('Error downloading TikTok:', error);
      throw error;
    }
  }
}

module.exports = new TikTokDownloader();
