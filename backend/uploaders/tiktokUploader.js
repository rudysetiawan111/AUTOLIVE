const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const FormData = require('form-data');
const crypto = require('crypto');

class TikTokUploader {
  constructor() {
    this.clientKey = process.env.TIKTOK_CLIENT_KEY;
    this.clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    this.apiBaseUrl = 'https://open-api.tiktok.com';
    this.uploadPath = path.join(__dirname, '../../storage/uploads/tiktok');
    this.ensureDirectories();
  }

  ensureDirectories() {
    fs.ensureDirSync(this.uploadPath);
  }

  async uploadVideo(videoPath, metadata, accessToken, openId) {
    try {
      console.log(`Starting TikTok upload: ${metadata.title}`);

      // Validate video
      const validation = await this.validateVideo(videoPath);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Step 1: Initialize upload
      const initResponse = await this.initializeUpload(videoPath, accessToken, openId);
      
      // Step 2: Upload video
      const uploadResponse = await this.uploadVideoChunks(
        videoPath,
        initResponse.upload_url,
        initResponse.upload_id
      );

      // Step 3: Publish video
      const publishResponse = await this.publishVideo(
        initResponse.upload_id,
        metadata,
        accessToken,
        openId
      );

      // Move video file to uploads directory
      const uploadedPath = path.join(
        this.uploadPath,
        `${publishResponse.video_id}_${path.basename(videoPath)}`
      );
      await fs.move(videoPath, uploadedPath);

      return {
        success: true,
        videoId: publishResponse.video_id,
        url: `https://www.tiktok.com/@${metadata.authorName}/video/${publishResponse.video_id}`,
        title: metadata.title,
        uploadedAt: new Date(),
        status: 'published'
      };
    } catch (error) {
      console.error('Error uploading to TikTok:', error);
      throw error;
    }
  }

  async initializeUpload(videoPath, accessToken, openId) {
    try {
      const stats = await fs.stat(videoPath);
      const fileSize = stats.size;
      const chunkSize = 5 * 1024 * 1024; // 5MB chunks

      const response = await axios.post(
        `${this.apiBaseUrl}/video/upload/init/`,
        {
          access_token: accessToken,
          open_id: openId,
          source_info: {
            source: 'FILE_UPLOAD',
            video_size: fileSize,
            chunk_size: chunkSize,
            total_chunk_count: Math.ceil(fileSize / chunkSize)
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.data) {
        throw new Error('Failed to initialize upload');
      }

      return {
        upload_url: response.data.data.upload_url,
        upload_id: response.data.data.upload_id
      };
    } catch (error) {
      console.error('Error initializing TikTok upload:', error);
      throw error;
    }
  }

  async uploadVideoChunks(videoPath, uploadUrl, uploadId) {
    try {
      const fileSize = (await fs.stat(videoPath)).size;
      const chunkSize = 5 * 1024 * 1024; // 5MB
      const totalChunks = Math.ceil(fileSize / chunkSize);

      const fileStream = fs.createReadStream(videoPath, {
        highWaterMark: chunkSize
      });

      let chunkIndex = 0;
      
      for await (const chunk of fileStream) {
        const formData = new FormData();
        formData.append('upload_id', uploadId);
        formData.append('chunk_number', chunkIndex);
        formData.append('total_chunk_count', totalChunks);
        formData.append('video', chunk, {
          filename: 'video.mp4',
          contentType: 'video/mp4'
        });

        await axios.post(uploadUrl, formData, {
          headers: formData.getHeaders()
        });

        chunkIndex++;
        console.log(`Uploaded chunk ${chunkIndex}/${totalChunks}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error uploading video chunks:', error);
      throw error;
    }
  }

  async publishVideo(uploadId, metadata, accessToken, openId) {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/video/publish/`,
        {
          access_token: accessToken,
          open_id: openId,
          upload_id: uploadId,
          video_info: {
            title: metadata.title,
            description: metadata.description || '',
            hashtags: metadata.hashtags || [],
            privacy_level: metadata.privacyLevel || 'PUBLIC',
            allow_comment: metadata.allowComment !== false,
            allow_duet: metadata.allowDuet !== false,
            allow_stitch: metadata.allowStitch !== false,
            brand_content_toggle: metadata.brandContent || false,
            brand_organic_toggle: metadata.brandOrganic || false
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.data) {
        throw new Error('Failed to publish video');
      }

      return {
        video_id: response.data.data.video_id
      };
    } catch (error) {
      console.error('Error publishing TikTok video:', error);
      throw error;
    }
  }

  async uploadBatch(videos, accessToken, openId, options = {}) {
    try {
      const {
        concurrency = 2,
        onProgress = null
      } = options;

      const results = [];
      const total = videos.length;

      for (let i = 0; i < videos.length; i += concurrency) {
        const batch = videos.slice(i, i + concurrency);
        const batchPromises = batch.map(async (video, index) => {
          try {
            const result = await this.uploadVideo(
              video.path,
              video.metadata,
              accessToken,
              openId
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
      console.error('Error uploading batch to TikTok:', error);
      throw error;
    }
  }

  async scheduleVideo(videoPath, metadata, scheduledTime, accessToken, openId) {
    try {
      // TikTok doesn't support scheduling via API yet
      // This would need to be implemented with a queue system
      console.log('Scheduling not directly supported by TikTok API');
      
      // For now, just upload immediately
      return this.uploadVideo(videoPath, metadata, accessToken, openId);
    } catch (error) {
      console.error('Error scheduling TikTok video:', error);
      throw error;
    }
  }

  async deleteVideo(videoId, accessToken, openId) {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/video/delete/`,
        {
          access_token: accessToken,
          open_id: openId,
          video_id: videoId
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        videoId
      };
    } catch (error) {
      console.error('Error deleting TikTok video:', error);
      throw error;
    }
  }

  async getUploadStatus(videoId, accessToken, openId) {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/video/info/`,
        {
          access_token: accessToken,
          open_id: openId,
          video_ids: [videoId]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.data || !response.data.data.videos.length) {
        throw new Error('Video not found');
      }

      const video = response.data.data.videos[0];

      return {
        videoId: video.video_id,
        title: video.title,
        cover: video.cover,
        shareUrl: video.share_url,
        status: 'published',
        stats: {
          views: video.view_count,
          likes: video.like_count,
          comments: video.comment_count,
          shares: video.share_count
        },
        publishedAt: video.create_time
      };
    } catch (error) {
      console.error('Error getting upload status:', error);
      throw error;
    }
  }

  async getTrendingHashtags(accessToken, openId) {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/video/trending/hashtags/`,
        {
          access_token: accessToken,
          open_id: openId,
          count: 30
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.data) {
        return response.data.data.hashtags.map(tag => ({
          name: tag.hashtag_name,
          views: tag.views_count,
          videos: tag.videos_count
        }));
      }

      return [];
    } catch (error) {
      console.error('Error getting trending hashtags:', error);
      return [];
    }
  }

  async validateVideo(videoPath) {
    try {
      const stats = await fs.stat(videoPath);
      
      // Check file size (TikTok limit is 287.6MB for videos)
      const maxSize = 287.6 * 1024 * 1024;
      if (stats.size > maxSize) {
        return {
          valid: false,
          error: 'File size exceeds TikTok limit (287.6MB)'
        };
      }

      // Check file format
      const ext = path.extname(videoPath).toLowerCase();
      const validFormats = ['.mp4', '.mov', '.avi', '.gif'];
      
      if (!validFormats.includes(ext)) {
        return {
          valid: false,
          error: `Invalid format. Supported: ${validFormats.join(', ')}`
        };
      }

      // Check minimum duration (5 seconds)
      const duration = await this.getVideoDuration(videoPath);
      if (duration < 5) {
        return {
          valid: false,
          error: 'Video too short. Minimum duration: 5 seconds'
        };
      }

      // Check maximum duration (10 minutes)
      if (duration > 600) {
        return {
          valid: false,
          error: 'Video too long. Maximum duration: 10 minutes'
        };
      }

      return {
        valid: true,
        size: stats.size,
        duration,
        format: ext.substring(1)
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  async getVideoDuration(videoPath) {
    return new Promise((resolve, reject) => {
      const ffmpeg = require('fluent-ffmpeg');
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata.format.duration);
      });
    });
  }
}

module.exports = new TikTokUploader();
