const { google } = require('googleapis');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

class YouTubeUploader {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_SHEET_CLIENT_KE,
      process.env.GOOGLE_SHEET_CLIENT_SECRET,
      'https://autolive.com/oauth/youtube/callback'
    );
    
    this.uploadPath = path.join(__dirname, '../../storage/uploads/youtube');
    this.ensureDirectories();
  }

  ensureDirectories() {
    fs.ensureDirSync(this.uploadPath);
  }

  async uploadVideo(videoPath, metadata, accessToken) {
    try {
      console.log(`Starting YouTube upload: ${metadata.title}`);

      // Set credentials
      this.oauth2Client.setCredentials({
        access_token: accessToken
      });

      const youtube = google.youtube({
        version: 'v3',
        auth: this.oauth2Client
      });

      // Prepare video metadata
      const requestBody = {
        snippet: {
          title: metadata.title,
          description: metadata.description || '',
          tags: metadata.tags || [],
          categoryId: metadata.categoryId || '22', // Default to Entertainment
          defaultLanguage: metadata.language || 'en'
        },
        status: {
          privacyStatus: metadata.privacyStatus || 'public',
          selfDeclaredMadeForKids: metadata.madeForKids || false,
          publishAt: metadata.scheduledTime ? new Date(metadata.scheduledTime).toISOString() : null
        }
      };

      // Handle playlist addition
      if (metadata.playlistId) {
        requestBody.snippet.playlistId = metadata.playlistId;
      }

      // Create readable stream from video file
      const videoStream = fs.createReadStream(videoPath);

      // Upload video
      const response = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody,
        media: {
          body: videoStream,
          mimeType: 'video/*'
        }
      });

      // Add to playlist if specified
      if (metadata.playlistId && response.data.id) {
        await this.addToPlaylist(response.data.id, metadata.playlistId, accessToken);
      }

      // Set thumbnail if provided
      if (metadata.thumbnailPath) {
        await this.setThumbnail(response.data.id, metadata.thumbnailPath, accessToken);
      }

      // Move video file to uploads directory
      const uploadedPath = path.join(
        this.uploadPath,
        `${response.data.id}_${path.basename(videoPath)}`
      );
      await fs.move(videoPath, uploadedPath);

      return {
        success: true,
        videoId: response.data.id,
        url: `https://www.youtube.com/watch?v=${response.data.id}`,
        title: metadata.title,
        uploadedAt: new Date(),
        status: metadata.privacyStatus,
        scheduledTime: metadata.scheduledTime || null
      };
    } catch (error) {
      console.error('Error uploading to YouTube:', error);
      throw error;
    }
  }

  async uploadBatch(videos, accessToken, options = {}) {
    try {
      const {
        concurrency = 3,
        onProgress = null
      } = options;

      const results = [];
      const total = videos.length;

      // Upload videos with concurrency limit
      for (let i = 0; i < videos.length; i += concurrency) {
        const batch = videos.slice(i, i + concurrency);
        const batchPromises = batch.map(async (video, index) => {
          try {
            const result = await this.uploadVideo(
              video.path,
              video.metadata,
              accessToken
            );
            
            if (onProgress) {
              onProgress({
                current: i + index + 1,
                total,
                video: result
              });
            }
            
            return result;
          } catch (error) {
            return {
              success: false,
              video: video.metadata.title,
              error: error.message
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      return {
        success: true,
        totalUploaded: results.filter(r => r.success).length,
        totalFailed: results.filter(r => !r.success).length,
        results
      };
    } catch (error) {
      console.error('Error uploading batch to YouTube:', error);
      throw error;
    }
  }

  async addToPlaylist(videoId, playlistId, accessToken) {
    try {
      this.oauth2Client.setCredentials({
        access_token: accessToken
      });

      const youtube = google.youtube({
        version: 'v3',
        auth: this.oauth2Client
      });

      await youtube.playlistItems.insert({
        part: ['snippet'],
        requestBody: {
          snippet: {
            playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId
            }
          }
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error adding to playlist:', error);
      throw error;
    }
  }

  async setThumbnail(videoId, thumbnailPath, accessToken) {
    try {
      this.oauth2Client.setCredentials({
        access_token: accessToken
      });

      const youtube = google.youtube({
        version: 'v3',
        auth: this.oauth2Client
      });

      await youtube.thumbnails.set({
        videoId,
        media: {
          body: fs.createReadStream(thumbnailPath)
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error setting thumbnail:', error);
      throw error;
    }
  }

  async scheduleVideo(videoPath, metadata, scheduledTime, accessToken) {
    return this.uploadVideo(videoPath, {
      ...metadata,
      privacyStatus: 'private',
      scheduledTime
    }, accessToken);
  }

  async updateVideo(videoId, updates, accessToken) {
    try {
      this.oauth2Client.setCredentials({
        access_token: accessToken
      });

      const youtube = google.youtube({
        version: 'v3',
        auth: this.oauth2Client
      });

      // Get current video metadata
      const videoResponse = await youtube.videos.list({
        part: ['snippet', 'status'],
        id: videoId
      });

      if (!videoResponse.data.items.length) {
        throw new Error('Video not found');
      }

      const currentVideo = videoResponse.data.items[0];

      // Update metadata
      const response = await youtube.videos.update({
        part: ['snippet', 'status'],
        requestBody: {
          id: videoId,
          snippet: {
            ...currentVideo.snippet,
            ...updates.snippet
          },
          status: {
            ...currentVideo.status,
            ...updates.status
          }
        }
      });

      return {
        success: true,
        videoId,
        updated: Object.keys(updates)
      };
    } catch (error) {
      console.error('Error updating video:', error);
      throw error;
    }
  }

  async deleteVideo(videoId, accessToken) {
    try {
      this.oauth2Client.setCredentials({
        access_token: accessToken
      });

      const youtube = google.youtube({
        version: 'v3',
        auth: this.oauth2Client
      });

      await youtube.videos.delete({
        id: videoId
      });

      return {
        success: true,
        videoId
      };
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  }

  async getUploadStatus(videoId, accessToken) {
    try {
      this.oauth2Client.setCredentials({
        access_token: accessToken
      });

      const youtube = google.youtube({
        version: 'v3',
        auth: this.oauth2Client
      });

      const response = await youtube.videos.list({
        part: ['snippet', 'status', 'statistics'],
        id: videoId
      });

      if (!response.data.items.length) {
        throw new Error('Video not found');
      }

      const video = response.data.items[0];

      return {
        videoId,
        title: video.snippet.title,
        status: video.status.uploadStatus,
        privacyStatus: video.status.privacyStatus,
        publishedAt: video.snippet.publishedAt,
        views: video.statistics?.viewCount || 0,
        likes: video.statistics?.likeCount || 0,
        comments: video.statistics?.commentCount || 0,
        url: `https://www.youtube.com/watch?v=${videoId}`
      };
    } catch (error) {
      console.error('Error getting upload status:', error);
      throw error;
    }
  }

  async getPlaylists(accessToken) {
    try {
      this.oauth2Client.setCredentials({
        access_token: accessToken
      });

      const youtube = google.youtube({
        version: 'v3',
        auth: this.oauth2Client
      });

      const response = await youtube.playlists.list({
        part: ['snippet', 'contentDetails'],
        mine: true,
        maxResults: 50
      });

      return response.data.items.map(playlist => ({
        id: playlist.id,
        title: playlist.snippet.title,
        description: playlist.snippet.description,
        itemCount: playlist.contentDetails.itemCount,
        thumbnail: playlist.snippet.thumbnails?.default?.url
      }));
    } catch (error) {
      console.error('Error getting playlists:', error);
      throw error;
    }
  }

  async createPlaylist(title, description, privacy, accessToken) {
    try {
      this.oauth2Client.setCredentials({
        access_token: accessToken
      });

      const youtube = google.youtube({
        version: 'v3',
        auth: this.oauth2Client
      });

      const response = await youtube.playlists.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title,
            description
          },
          status: {
            privacyStatus: privacy
          }
        }
      });

      return {
        success: true,
        playlistId: response.data.id,
        title: response.data.snippet.title
      };
    } catch (error) {
      console.error('Error creating playlist:', error);
      throw error;
    }
  }

  async getCategories() {
    try {
      const youtube = google.youtube({
        version: 'v3',
        auth: process.env.YOUTUBE_API_KEY
      });

      const response = await youtube.videoCategories.list({
        part: ['snippet'],
        regionCode: 'US'
      });

      return response.data.items.map(category => ({
        id: category.id,
        name: category.snippet.title,
        assignable: category.snippet.assignable
      }));
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }

  async validateVideo(videoPath) {
    try {
      const stats = await fs.stat(videoPath);
      
      // Check file size (YouTube limit is 256GB)
      if (stats.size > 256 * 1024 * 1024 * 1024) {
        return {
          valid: false,
          error: 'File size exceeds YouTube limit (256GB)'
        };
      }

      // Check file format
      const ext = path.extname(videoPath).toLowerCase();
      const validFormats = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.mkv'];
      
      if (!validFormats.includes(ext)) {
        return {
          valid: false,
          error: `Invalid format. Supported: ${validFormats.join(', ')}`
        };
      }

      return {
        valid: true,
        size: stats.size,
        format: ext.substring(1)
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
}

module.exports = new YouTubeUploader();
