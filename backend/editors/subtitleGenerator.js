const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const logger = require('../utils/logger');

class SubtitleGenerator {
  constructor() {
    this.outputPath = './storage/processed/subtitles';
    this.tempPath = './storage/temp';
    this.supportedLanguages = ['id', 'en', 'es', 'fr', 'de', 'ja', 'ko', 'zh'];
    this.ensureDirectories();
  }

  // Ensure directories exist
  async ensureDirectories() {
    await fs.ensureDir(this.outputPath);
    await fs.ensureDir(this.tempPath);
    logger.info('Subtitle generator directories initialized');
  }

  /**
   * Generate subtitles from video/audio
   * @param {string} videoPath - Path to video file
   * @param {Object} options - Subtitle generation options
   * @returns {Promise<Object>} Generated subtitles
   */
  async generate(videoPath, options = {}) {
    try {
      const {
        language = 'id',
        format = 'vtt', // vtt, srt, ass
        maxLineWidth = 40,
        wordTimings = true
      } = options;

      // Check if video exists
      if (!await fs.pathExists(videoPath)) {
        throw new Error(`Video file not found: ${videoPath}`);
      }

      logger.info(`Generating subtitles for: ${videoPath} (${language})`);

      // Extract audio from video
      const audioPath = await this.extractAudio(videoPath);
      
      // Generate subtitles using speech-to-text
      const subtitles = await this.speechToText(audioPath, {
        language,
        wordTimings
      });

      // Format subtitles
      const formatted = await this.formatSubtitles(subtitles, format, {
        maxLineWidth
      });

      // Save subtitles to file
      const outputFile = await this.saveSubtitles(videoPath, formatted, format);

      // Cleanup audio file
      await fs.remove(audioPath).catch(() => {});

      return {
        path: outputFile,
        format,
        language,
        segments: subtitles.segments,
        duration: subtitles.duration,
        wordCount: subtitles.wordCount
      };

    } catch (error) {
      logger.error('Subtitle generation error:', error);
      throw error;
    }
  }

  /**
   * Extract audio from video
   * @param {string} videoPath - Path to video file
   * @returns {Promise<string>} Path to extracted audio
   */
  extractAudio(videoPath) {
    return new Promise((resolve, reject) => {
      const audioPath = path.join(this.tempPath, `audio-${Date.now()}.wav`);
      
      const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-vn', // No video
        '-acodec', 'pcm_s16le', // Audio codec
        '-ar', '16000', // Sample rate
        '-ac', '1', // Mono
        '-y', // Overwrite output
        audioPath
      ]);

      ffmpeg.stderr.on('data', (data) => {
        logger.debug(`FFmpeg: ${data}`);
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          logger.info(`Audio extracted: ${audioPath}`);
          resolve(audioPath);
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });

      ffmpeg.on('error', reject);
    });
  }

  /**
   * Convert speech to text (mock implementation)
   * In production, use Google Speech-to-Text, Whisper, or similar
   * @param {string} audioPath - Path to audio file
   * @param {Object} options - STT options
   * @returns {Promise<Object>} Subtitles data
   */
  async speechToText(audioPath, options) {
    const { language, wordTimings } = options;

    // This is a mock implementation
    // In production, integrate with actual STT service:
    // - Google Cloud Speech-to-Text
    // - OpenAI Whisper
    // - AssemblyAI
    // - IBM Watson Speech to Text
    
    logger.info(`Processing speech-to-text for: ${audioPath}`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock subtitle data
    const mockSegments = [
      {
        start: 0.0,
        end: 3.5,
        text: "Selamat datang di AUTOLIVE platform manajemen video otomatis.",
        words: wordTimings ? [
          { word: "Selamat", start: 0.0, end: 0.5 },
          { word: "datang", start: 0.5, end: 1.0 },
          { word: "di", start: 1.0, end: 1.2 },
          { word: "AUTOLIVE", start: 1.2, end: 2.0 },
          { word: "platform", start: 2.0, end: 2.5 },
          { word: "manajemen", start: 2.5, end: 3.0 },
          { word: "video", start: 3.0, end: 3.3 },
          { word: "otomatis.", start: 3.3, end: 3.5 }
        ] : null
      },
      {
        start: 3.5,
        end: 6.8,
        text: "Dengan AUTOLIVE Anda bisa mendownload video dari YouTube dan TikTok.",
        words: wordTimings ? [
          { word: "Dengan", start: 3.5, end: 3.8 },
          { word: "AUTOLIVE", start: 3.8, end: 4.3 },
          { word: "Anda", start: 4.3, end: 4.6 },
          { word: "bisa", start: 4.6, end: 4.9 },
          { word: "mendownload", start: 4.9, end: 5.4 },
          { word: "video", start: 5.4, end: 5.7 },
          { word: "dari", start: 5.7, end: 5.9 },
          { word: "YouTube", start: 5.9, end: 6.3 },
          { word: "dan", start: 6.3, end: 6.5 },
          { word: "TikTok.", start: 6.5, end: 6.8 }
        ] : null
      },
      {
        start: 6.8,
        end: 10.2,
        text: "Kemudian mengeditnya secara otomatis dengan AI video editor.",
        words: wordTimings ? [
          { word: "Kemudian", start: 6.8, end: 7.3 },
          { word: "mengeditnya", start: 7.3, end: 7.9 },
          { word: "secara", start: 7.9, end: 8.3 },
          { word: "otomatis", start: 8.3, end: 8.8 },
          { word: "dengan", start: 8.8, end: 9.1 },
          { word: "AI", start: 9.1, end: 9.4 },
          { word: "video", start: 9.4, end: 9.7 },
          { word: "editor.", start: 9.7, end: 10.2 }
        ] : null
      },
      {
        start: 10.2,
        end: 13.5,
        text: "Fitur AI juga bisa membuat judul dan hashtag yang menarik.",
        words: wordTimings ? [
          { word: "Fitur", start: 10.2, end: 10.5 },
          { word: "AI", start: 10.5, end: 10.8 },
          { word: "juga", start: 10.8, end: 11.1 },
          { word: "bisa", start: 11.1, end: 11.4 },
          { word: "membuat", start: 11.4, end: 11.8 },
          { word: "judul", start: 11.8, end: 12.1 },
          { word: "dan", start: 12.1, end: 12.3 },
          { word: "hashtag", start: 12.3, end: 12.8 },
          { word: "yang", start: 12.8, end: 13.1 },
          { word: "menarik.", start: 13.1, end: 13.5 }
        ] : null
      },
      {
        start: 13.5,
        end: 16.0,
        text: "Upload otomatis ke YouTube dan TikTok jadi lebih mudah.",
        words: wordTimings ? [
          { word: "Upload", start: 13.5, end: 13.9 },
          { word: "otomatis", start: 13.9, end: 14.3 },
          { word: "ke", start: 14.3, end: 14.5 },
          { word: "YouTube", start: 14.5, end: 14.9 },
          { word: "dan", start: 14.9, end: 15.1 },
          { word: "TikTok", start: 15.1, end: 15.5 },
          { word: "jadi", start: 15.5, end: 15.7 },
          { word: "lebih", start: 15.7, end: 15.9 },
          { word: "mudah.", start: 15.9, end: 16.0 }
        ] : null
      }
    ];

    return {
      segments: mockSegments,
      duration: 16.0,
      wordCount: mockSegments.reduce((acc, seg) => 
        acc + (seg.words ? seg.words.length : seg.text.split(' ').length), 0
      ),
      language
    };
  }

  /**
   * Format subtitles to specific format
   * @param {Object} subtitles - Subtitles data
   * @param {string} format - Output format (vtt, srt, ass)
   * @param {Object} options - Formatting options
   * @returns {Promise<string>} Formatted subtitles
   */
  async formatSubtitles(subtitles, format, options = {}) {
    const { maxLineWidth = 40 } = options;

    switch (format.toLowerCase()) {
      case 'vtt':
        return this.formatVTT(subtitles, maxLineWidth);
      case 'srt':
        return this.formatSRT(subtitles, maxLineWidth);
      case 'ass':
        return this.formatASS(subtitles, maxLineWidth);
      default:
        throw new Error(`Unsupported subtitle format: ${format}`);
    }
  }

  /**
   * Format to WebVTT
   * @param {Object} subtitles - Subtitles data
   * @param {number} maxLineWidth - Maximum characters per line
   * @returns {string} VTT formatted subtitles
   */
  formatVTT(subtitles, maxLineWidth) {
    let vtt = 'WEBVTT\n\n';
    
    subtitles.segments.forEach((segment, index) => {
      const start = this.formatTimeVTT(segment.start);
      const end = this.formatTimeVTT(segment.end);
      
      vtt += `${index + 1}\n`;
      vtt += `${start} --> ${end}\n`;
      
      // Split long text into multiple lines
      const lines = this.wrapText(segment.text, maxLineWidth);
      vtt += lines.join('\n');
      vtt += '\n\n';
    });

    return vtt;
  }

  /**
   * Format to SubRip (SRT)
   * @param {Object} subtitles - Subtitles data
   * @param {number} maxLineWidth - Maximum characters per line
   * @returns {string} SRT formatted subtitles
   */
  formatSRT(subtitles, maxLineWidth) {
    let srt = '';
    
    subtitles.segments.forEach((segment, index) => {
      const start = this.formatTimeSRT(segment.start);
      const end = this.formatTimeSRT(segment.end);
      
      srt += `${index + 1}\n`;
      srt += `${start} --> ${end}\n`;
      
      const lines = this.wrapText(segment.text, maxLineWidth);
      srt += lines.join('\n');
      srt += '\n\n';
    });

    return srt;
  }

  /**
   * Format to Advanced SubStation Alpha (ASS)
   * @param {Object} subtitles - Subtitles data
   * @param {number} maxLineWidth - Maximum characters per line
   * @returns {string} ASS formatted subtitles
   */
  formatASS(subtitles, maxLineWidth) {
    let ass = `[Script Info]
Title: AUTOLIVE Subtitles
ScriptType: v4.00+
Collisions: Normal
PlayDepth: 0
Timer: 100.0000

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,24,&H00FFFFFF,&H000000FF,&H00000000,&H64000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    subtitles.segments.forEach((segment) => {
      const start = this.formatTimeASS(segment.start);
      const end = this.formatTimeASS(segment.end);
      const text = segment.text.replace(/\n/g, '\\N');
      
      ass += `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}\n`;
    });

    return ass;
  }

  /**
   * Wrap text to specified width
   * @param {string} text - Text to wrap
   * @param {number} maxWidth - Maximum characters per line
   * @returns {Array} Array of lines
   */
  wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).length <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  /**
   * Format time for VTT (HH:MM:SS.mmm)
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time
   */
  formatTimeVTT(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const millis = Math.floor((secs - Math.floor(secs)) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${Math.floor(secs).toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
  }

  /**
   * Format time for SRT (HH:MM:SS,mmm)
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time
   */
  formatTimeSRT(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const millis = Math.floor((secs - Math.floor(secs)) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${Math.floor(secs).toString().padStart(2, '0')},${millis.toString().padStart(3, '0')}`;
  }

  /**
   * Format time for ASS (H:MM:SS.cc)
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time
   */
  formatTimeASS(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const centisecs = Math.floor((secs - Math.floor(secs)) * 100);
    
    return `${hours}:${minutes.toString().padStart(2, '0')}:${Math.floor(secs).toString().padStart(2, '0')}.${centisecs.toString().padStart(2, '0')}`;
  }

  /**
   * Save subtitles to file
   * @param {string} videoPath - Original video path
   * @param {string} content - Subtitle content
   * @param {string} format - Subtitle format
   * @returns {Promise<string>} Path to subtitle file
   */
  async saveSubtitles(videoPath, content, format) {
    const videoName = path.basename(videoPath, path.extname(videoPath));
    const timestamp = Date.now();
    const subtitleFile = path.join(
      this.outputPath,
      `${videoName}-${timestamp}.${format}`
    );

    await fs.writeFile(subtitleFile, content);
    logger.info(`Subtitles saved: ${subtitleFile}`);

    return subtitleFile;
  }

  /**
   * Add subtitles to video
   * @param {string} videoPath - Path to video
   * @param {string} subtitlePath - Path to subtitle file
   * @param {Object} options - Options for embedding
   * @returns {Promise<string>} Path to video with subtitles
   */
  async addSubtitlesToVideo(videoPath, subtitlePath, options = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        const {
          burn = true, // true: hardcode, false: soft subtitles
          language = 'id',
          outputPath: customOutputPath = null
        } = options;

        if (!await fs.pathExists(videoPath)) {
          throw new Error(`Video not found: ${videoPath}`);
        }

        if (!await fs.pathExists(subtitlePath)) {
          throw new Error(`Subtitles not found: ${subtitlePath}`);
        }

        const outputFile = customOutputPath || path.join(
          this.outputPath,
          `with-subs-${Date.now()}.mp4`
        );

        const ffmpegArgs = ['-i', videoPath];

        if (burn) {
          // Hardcode subtitles (burn into video)
          ffmpegArgs.push(
            '-vf', `subtitles=${subtitlePath}`,
            '-c:a', 'copy'
          );
        } else {
          // Soft subtitles (as separate stream)
          ffmpegArgs.push(
            '-i', subtitlePath,
            '-c', 'copy',
            '-c:s', 'mov_text',
            '-metadata:s:s:0', `language=${language}`
          );
        }

        ffmpegArgs.push('-y', outputFile);

        const ffmpeg = spawn('ffmpeg', ffmpegArgs);

        ffmpeg.stderr.on('data', (data) => {
          logger.debug(`FFmpeg: ${data}`);
        });

        ffmpeg.on('close', (code) => {
          if (code === 0) {
            logger.info(`Video with subtitles created: ${outputFile}`);
            resolve(outputFile);
          } else {
            reject(new Error(`FFmpeg exited with code ${code}`));
          }
        });

        ffmpeg.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Translate subtitles to another language
   * @param {Object} subtitles - Subtitles data
   * @param {string} targetLanguage - Target language code
   * @returns {Promise<Object>} Translated subtitles
   */
  async translateSubtitles(subtitles, targetLanguage) {
    // Mock translation
    // In production, use Google Translate API or similar
    logger.info(`Translating subtitles to ${targetLanguage}`);

    const translations = {
      id: {
        en: "Welcome to AUTOLIVE automated video management platform."
      }
    };

    const translatedSegments = subtitles.segments.map(segment => ({
      ...segment,
      text: `[Translated to ${targetLanguage}] ${segment.text}`
    }));

    return {
      ...subtitles,
      segments: translatedSegments,
      language: targetLanguage
    };
  }

  /**
   * Detect language of subtitles
   * @param {string} text - Subtitle text
   * @returns {Promise<string>} Detected language code
   */
  async detectLanguage(text) {
    // Mock language detection
    // In production, use language detection API
    return 'id';
  }

  /**
   * Sync subtitles with video (adjust timing)
   * @param {string} subtitlePath - Path to subtitle file
   * @param {number} offset - Time offset in seconds
   * @returns {Promise<string>} Path to synced subtitles
   */
  async syncSubtitles(subtitlePath, offset) {
    const content = await fs.readFile(subtitlePath, 'utf8');
    const lines = content.split('\n');
    const syncedLines = [];

    for (const line of lines) {
      // Check if line contains timestamp
      if (line.includes('-->')) {
        const [start, end] = line.split('-->').map(t => t.trim());
        const newStart = this.adjustTimestamp(start, offset);
        const newEnd = this.adjustTimestamp(end, offset);
        syncedLines.push(`${newStart} --> ${newEnd}`);
      } else {
        syncedLines.push(line);
      }
    }

    const syncedPath = subtitlePath.replace('.', '-synced.');
    await fs.writeFile(syncedPath, syncedLines.join('\n'));
    
    return syncedPath;
  }

  /**
   * Adjust timestamp by offset
   * @param {string} timestamp - Original timestamp
   * @param {number} offset - Offset in seconds
   * @returns {string} Adjusted timestamp
   */
  adjustTimestamp(timestamp, offset) {
    // Parse timestamp (format: HH:MM:SS.mmm)
    const parts = timestamp.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const secParts = parts[2].split('.');
    const seconds = parseInt(secParts[0]);
    const millis = parseInt(secParts[1]);

    let totalSeconds = hours * 3600 + minutes * 60 + seconds + millis / 1000;
    totalSeconds += offset;

    if (totalSeconds < 0) totalSeconds = 0;

    const newHours = Math.floor(totalSeconds / 3600);
    const newMinutes = Math.floor((totalSeconds % 3600) / 60);
    const newSeconds = Math.floor(totalSeconds % 60);
    const newMillis = Math.floor((totalSeconds - Math.floor(totalSeconds)) * 1000);

    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}:${newSeconds.toString().padStart(2, '0')}.${newMillis.toString().padStart(3, '0')}`;
  }

  /**
   * Clean up old subtitle files
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
        const age = (now - stats.mtimeMs) / (1000 * 60 * 60);

        if (age > maxAge) {
          await fs.remove(filePath);
          deleted++;
        }
      }

      logger.info(`Cleaned up ${deleted} old subtitle files`);
      return deleted;
    } catch (error) {
      logger.error('Cleanup error:', error);
      throw error;
    }
  }
}

module.exports = new SubtitleGenerator();
