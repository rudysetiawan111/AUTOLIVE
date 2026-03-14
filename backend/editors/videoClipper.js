const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class VideoClipper {
  constructor() {
    this.outputPath = './storage/processed';
    this.tempPath = './storage/temp';
    this.ensureDirectories();
  }

  // Ensure output directories exist
  async ensureDirectories() {
    await fs.ensureDir(this.outputPath);
    await fs.ensureDir(this.tempPath);
    logger.info('Video clipper directories initialized');
  }

  /**
   * Clip video to specified duration
   * @param {string} inputPath - Path to input video
   * @param {Object} options - Clipping options
   * @returns {Promise<string>} Path to output video
   */
  async clipVideo(inputPath, options) {
    try {
      const {
        start = 0,
        end = null,
        duration = null,
        outputPath: customOutputPath = null
      } = options;

      // Validate input file
      if (!await fs.pathExists(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`);
      }

      // Generate output filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const outputFile = customOutputPath || path.join(
        this.outputPath,
        `clip-${timestamp}-${randomStr}.mp4`
      );

      logger.info(`Starting video clip: ${inputPath} -> ${outputFile}`);

      return new Promise((resolve, reject) => {
        let command = ffmpeg(inputPath);

        // Set start time if > 0
        if (start > 0) {
          command = command.setStartTime(start);
          logger.debug(`Set start time: ${start}s`);
        }

        // Set duration or end time
        if (duration) {
          command = command.duration(duration);
          logger.debug(`Set duration: ${duration}s`);
        } else if (end) {
          const clipDuration = end - start;
          command = command.duration(clipDuration);
          logger.debug(`Set duration from end time: ${clipDuration}s (${start} -> ${end})`);
        }

        // Configure output
        command
          .output(outputFile)
          .videoCodec('libx264')
          .audioCodec('aac')
          .outputOptions([
            '-preset fast',
            '-crf 23',
            '-movflags +faststart'
          ])
          .on('start', (commandLine) => {
            logger.debug(`FFmpeg command: ${commandLine}`);
          })
          .on('progress', (progress) => {
            logger.debug(`Clipping progress: ${progress.percent?.toFixed(2)}%`);
          })
          .on('end', async () => {
            // Verify output file exists
            if (await fs.pathExists(outputFile)) {
              const stats = await fs.stat(outputFile);
              logger.info(`Video clip completed: ${outputFile} (${stats.size} bytes)`);
              resolve(outputFile);
            } else {
              reject(new Error('Output file not created'));
            }
          })
          .on('error', (err) => {
            logger.error('FFmpeg error:', err);
            reject(new Error(`FFmpeg error: ${err.message}`));
          })
          .run();
      });

    } catch (error) {
      logger.error('Video clipping error:', error);
      throw error;
    }
  }

  /**
   * Create multiple clips from a video
   * @param {string} inputPath - Path to input video
   * @param {Array} clips - Array of clip configurations
   * @returns {Promise<Array>} Array of output paths
   */
  async createClips(inputPath, clips) {
    try {
      const results = [];
      
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        logger.info(`Creating clip ${i + 1}/${clips.length}`);
        
        const outputPath = await this.clipVideo(inputPath, clip);
        results.push({
          index: i,
          ...clip,
          outputPath
        });
      }
      
      logger.info(`Successfully created ${results.length} clips`);
      return results;
    } catch (error) {
      logger.error('Create multiple clips error:', error);
      throw error;
    }
  }

  /**
   * Trim video (alias for clipVideo)
   * @param {string} inputPath - Path to input video
   * @param {number} start - Start time in seconds
   * @param {number} end - End time in seconds
   * @returns {Promise<string>} Path to trimmed video
   */
  async trimVideo(inputPath, start, end) {
    return this.clipVideo(inputPath, { start, end });
  }

  /**
   * Cut video at specific timestamps
   * @param {string} inputPath - Path to input video
   * @param {Array} cutPoints - Array of cut points in seconds
   * @returns {Promise<Array>} Array of output paths
   */
  async cutVideo(inputPath, cutPoints) {
    try {
      const clips = [];
      let lastPoint = 0;
      
      // Sort cut points
      const sortedPoints = [...cutPoints].sort((a, b) => a - b);
      
      // Create clips between cut points
      for (let i = 0; i < sortedPoints.length; i++) {
        const point = sortedPoints[i];
        if (point > lastPoint) {
          clips.push({
            start: lastPoint,
            end: point
          });
        }
        lastPoint = point;
      }
      
      // Add final clip if needed
      const videoInfo = await this.getVideoInfo(inputPath);
      if (lastPoint < videoInfo.duration) {
        clips.push({
          start: lastPoint,
          end: videoInfo.duration
        });
      }
      
      return this.createClips(inputPath, clips);
    } catch (error) {
      logger.error('Cut video error:', error);
      throw error;
    }
  }

  /**
   * Extract segment from video
   * @param {string} inputPath - Path to input video
   * @param {number} start - Start time in seconds
   * @param {number} duration - Duration in seconds
   * @returns {Promise<string>} Path to extracted segment
   */
  async extractSegment(inputPath, start, duration) {
    return this.clipVideo(inputPath, { start, duration });
  }

  /**
   * Remove segment from video
   * @param {string} inputPath - Path to input video
   * @param {number} start - Start time of segment to remove
   * @param {number} end - End time of segment to remove
   * @returns {Promise<string>} Path to processed video
   */
  async removeSegment(inputPath, start, end) {
    try {
      const videoInfo = await this.getVideoInfo(inputPath);
      const tempFile1 = path.join(this.tempPath, `part1-${Date.now()}.mp4`);
      const tempFile2 = path.join(this.tempPath, `part2-${Date.now()}.mp4`);
      const outputFile = path.join(this.outputPath, `removed-${Date.now()}.mp4`);
      
      // Extract first part (0 to start)
      if (start > 0) {
        await this.clipVideo(inputPath, { 
          start: 0, 
          end: start,
          outputPath: tempFile1 
        });
      }
      
      // Extract second part (end to end)
      if (end < videoInfo.duration) {
        await this.clipVideo(inputPath, { 
          start: end, 
          end: videoInfo.duration,
          outputPath: tempFile2 
        });
      }
      
      // Concatenate parts
      await this.concatenateVideos([tempFile1, tempFile2], outputFile);
      
      // Cleanup temp files
      await fs.remove(tempFile1).catch(() => {});
      await fs.remove(tempFile2).catch(() => {});
      
      return outputFile;
    } catch (error) {
      logger.error('Remove segment error:', error);
      throw error;
    }
  }

  /**
   * Concatenate multiple videos
   * @param {Array} videoPaths - Array of video paths
   * @param {string} outputPath - Output path
   * @returns {Promise<string>} Output path
   */
  async concatenateVideos(videoPaths, outputPath) {
    try {
      // Create concat file
      const concatFile = path.join(this.tempPath, `concat-${Date.now()}.txt`);
      const concatContent = videoPaths
        .filter(p => p && fs.existsSync(p))
        .map(p => `file '${p}'`)
        .join('\n');
      
      await fs.writeFile(concatFile, concatContent);
      
      return new Promise((resolve, reject) => {
        ffmpeg()
          .input(concatFile)
          .inputOptions(['-f concat', '-safe 0'])
          .output(outputPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .on('end', async () => {
            await fs.remove(concatFile).catch(() => {});
            resolve(outputPath);
          })
          .on('error', reject)
          .run();
      });
    } catch (error) {
      logger.error('Concatenate videos error:', error);
      throw error;
    }
  }

  /**
   * Get video information
   * @param {string} inputPath - Path to input video
   * @returns {Promise<Object>} Video metadata
   */
  getVideoInfo(inputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          const videoStream = metadata.streams.find(s => s.codec_type === 'video');
          const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
          
          resolve({
            duration: metadata.format.duration,
            size: metadata.format.size,
            bitrate: metadata.format.bit_rate,
            format: metadata.format.format_name,
            videoCodec: videoStream?.codec_name,
            audioCodec: audioStream?.codec_name,
            width: videoStream?.width,
            height: videoStream?.height,
            fps: eval(videoStream?.avg_frame_rate) || 0,
            streams: metadata.streams.length
          });
        }
      });
    });
  }

  /**
   * Create short/clip for TikTok/Reels/Shorts
   * @param {string} inputPath - Path to input video
   * @param {Object} options - Options for short creation
   * @returns {Promise<string>} Path to short video
   */
  async createShort(inputPath, options = {}) {
    try {
      const {
        start = 0,
        duration = 60, // Default 60 seconds for shorts
        aspectRatio = '9:16', // Portrait for shorts
        outputPath: customOutputPath = null
      } = options;

      const videoInfo = await this.getVideoInfo(inputPath);
      const clipDuration = Math.min(duration, videoInfo.duration - start);
      
      // First clip the segment
      const clippedPath = await this.clipVideo(inputPath, {
        start,
        duration: clipDuration
      });

      // Then resize to shorts aspect ratio
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const outputFile = customOutputPath || path.join(
        this.outputPath,
        `short-${timestamp}-${randomStr}.mp4`
      );

      return new Promise((resolve, reject) => {
        ffmpeg(clippedPath)
          .outputOptions([
            '-vf scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2',
            '-preset fast',
            '-crf 23'
          ])
          .output(outputFile)
          .on('end', async () => {
            // Cleanup clipped file
            await fs.remove(clippedPath).catch(() => {});
            resolve(outputFile);
          })
          .on('error', reject)
          .run();
      });

    } catch (error) {
      logger.error('Create short error:', error);
      throw error;
    }
  }

  /**
   * Create highlight reel from multiple clips
   * @param {string} inputPath - Path to input video
   * @param {Array} highlights - Array of highlight segments [{start, duration}]
   * @returns {Promise<string>} Path to highlight reel
   */
  async createHighlightReel(inputPath, highlights) {
    try {
      const clipPaths = [];
      
      // Create each highlight clip
      for (let i = 0; i < highlights.length; i++) {
        const highlight = highlights[i];
        const clipPath = await this.extractSegment(
          inputPath,
          highlight.start,
          highlight.duration || 30
        );
        clipPaths.push(clipPath);
      }
      
      // Concatenate all clips
      const outputPath = path.join(this.outputPath, `highlight-${Date.now()}.mp4`);
      await this.concatenateVideos(clipPaths, outputPath);
      
      // Cleanup individual clips
      for (const clip of clipPaths) {
        await fs.remove(clip).catch(() => {});
      }
      
      return outputPath;
    } catch (error) {
      logger.error('Create highlight reel error:', error);
      throw error;
    }
  }

  /**
   * Split video into segments
   * @param {string} inputPath - Path to input video
   * @param {number} segmentDuration - Duration of each segment in seconds
   * @returns {Promise<Array>} Array of segment paths
   */
  async splitVideo(inputPath, segmentDuration = 60) {
    try {
      const videoInfo = await this.getVideoInfo(inputPath);
      const totalDuration = videoInfo.duration;
      const segments = [];
      
      for (let start = 0; start < totalDuration; start += segmentDuration) {
        const duration = Math.min(segmentDuration, totalDuration - start);
        const segmentPath = await this.extractSegment(inputPath, start, duration);
        segments.push({
          start,
          duration,
          path: segmentPath
        });
      }
      
      logger.info(`Video split into ${segments.length} segments`);
      return segments;
    } catch (error) {
      logger.error('Split video error:', error);
      throw error;
    }
  }

  /**
   * Clean up old processed files
   * @param {number} maxAge - Maximum age in hours
   */
  async cleanup(maxAge = 24) {
    try {
      const files = await fs.readdir(this.outputPath);
      const now = Date.now();
      let deleted = 0;
      
      for (const file of files) {
        const filePath = path.join(this.outputPath, file);
        const stats = await fs.stat(filePath);
        const age = (now - stats.mtimeMs) / (1000 * 60 * 60); // age in hours
        
        if (age > maxAge) {
          await fs.remove(filePath);
          deleted++;
          logger.debug(`Cleaned up old file: ${file}`);
        }
      }
      
      logger.info(`Cleaned up ${deleted} old files from ${this.outputPath}`);
      return deleted;
    } catch (error) {
      logger.error('Cleanup error:', error);
      throw error;
    }
  }
}

module.exports = new VideoClipper();
