/**
 * Processed Files Manager
 * Manages all processed/edited files
 */

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const Logger = require('../utils/logger');
const EventEmitter = require('events');
const { spawn } = require('child_process');

class ProcessedManager extends EventEmitter {
    constructor() {
        super();
        this.basePath = path.join(__dirname);
        this.activeProcesses = new Map();
        this.processHistory = [];
        
        // Initialize directories
        this.dirs = {
            videos: path.join(this.basePath, 'videos'),
            audios: path.join(this.basePath, 'audios'),
            images: path.join(this.basePath, 'images'),
            thumbnails: path.join(this.basePath, 'thumbnails'),
            subtitles: path.join(this.basePath, 'subtitles'),
            compressed: path.join(this.basePath, 'compressed'),
            watermarked: path.join(this.basePath, 'watermarked'),
            clips: path.join(this.basePath, 'clips'),
            merged: path.join(this.basePath, 'merged'),
            converted: path.join(this.basePath, 'converted')
        };
    }

    /**
     * Compress video file
     */
    async compressVideo(inputPath, options = {}) {
        const {
            quality = 'medium',
            resolution = null,
            bitrate = null,
            onProgress = null
        } = options;

        const processId = this.generateId();
        const inputFile = path.basename(inputPath);
        const outputFile = `compressed_${Date.now()}_${processId}.mp4`;
        const outputPath = path.join(this.dirs.compressed, outputFile);

        try {
            this.activeProcesses.set(processId, {
                id: processId,
                type: 'compress',
                input: inputPath,
                output: outputPath,
                status: 'processing',
                progress: 0
            });

            Logger.info(`Starting compression: ${inputFile}`, { processId });

            // Simulate processing
            await this.simulateProcessing(processId, onProgress);

            // Copy file for simulation
            await fs.copy(inputPath, outputPath);

            const result = {
                success: true,
                processId,
                inputFile,
                outputFile,
                outputPath,
                originalSize: fs.statSync(inputPath).size,
                compressedSize: fs.statSync(outputPath).size,
                compressionRatio: (1 - fs.statSync(outputPath).size / fs.statSync(inputPath).size) * 100,
                quality,
                timestamp: new Date().toISOString()
            };

            this.processHistory.push(result);
            this.activeProcesses.delete(processId);
            
            this.emit('completed', result);
            
            return result;

        } catch (error) {
            this.activeProcesses.delete(processId);
            await fs.remove(outputPath).catch(() => {});
            
            Logger.error(`Compression failed: ${error.message}`, { processId });
            
            return {
                success: false,
                error: error.message,
                processId
            };
        }
    }

    /**
     * Add watermark to video
     */
    async addWatermark(inputPath, watermarkPath, options = {}) {
        const {
            position = 'bottom-right',
            opacity = 0.7,
            scale = 0.2,
            onProgress = null
        } = options;

        const processId = this.generateId();
        const inputFile = path.basename(inputPath);
        const outputFile = `watermarked_${Date.now()}_${processId}.mp4`;
        const outputPath = path.join(this.dirs.watermarked, outputFile);

        try {
            this.activeProcesses.set(processId, {
                id: processId,
                type: 'watermark',
                input: inputPath,
                output: outputPath,
                status: 'processing',
                progress: 0
            });

            await this.simulateProcessing(processId, onProgress);
            await fs.copy(inputPath, outputPath);

            const result = {
                success: true,
                processId,
                inputFile,
                outputFile,
                outputPath,
                position,
                opacity,
                scale,
                size: fs.statSync(outputPath).size
            };

            this.processHistory.push(result);
            this.activeProcesses.delete(processId);
            
            return result;

        } catch (error) {
            this.activeProcesses.delete(processId);
            return { success: false, error: error.message };
        }
    }

    /**
     * Clip video (cut segment)
     */
    async clipVideo(inputPath, startTime, endTime, options = {}) {
        const processId = this.generateId();
        const inputFile = path.basename(inputPath);
        const outputFile = `clip_${startTime}s-${endTime}s_${Date.now()}.mp4`;
        const outputPath = path.join(this.dirs.clips, outputFile);

        try {
            const result = {
                success: true,
                processId,
                inputFile,
                outputFile,
                outputPath,
                startTime,
                endTime,
                duration: endTime - startTime,
                timestamp: new Date().toISOString()
            };

            await fs.copy(inputPath, outputPath);
            this.processHistory.push(result);
            
            return result;

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Merge multiple videos
     */
    async mergeVideos(videoPaths, options = {}) {
        const processId = this.generateId();
        const outputFile = `merged_${Date.now()}_${processId}.mp4`;
        const outputPath = path.join(this.dirs.merged, outputFile);

        try {
            // Simulate merge
            await this.simulateProcessing(processId);

            // Create dummy merged file
            await fs.writeFile(outputPath, `Merged ${videoPaths.length} videos`);

            const result = {
                success: true,
                processId,
                inputCount: videoPaths.length,
                outputFile,
                outputPath,
                size: fs.statSync(outputPath).size
            };

            this.processHistory.push(result);
            return result;

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Convert video format
     */
    async convertVideo(inputPath, targetFormat, options = {}) {
        const processId = this.generateId();
        const inputFile = path.basename(inputPath);
        const outputFile = `converted_${Date.now()}_${processId}.${targetFormat}`;
        const outputPath = path.join(this.dirs.converted, outputFile);

        try {
            await this.simulateProcessing(processId);
            await fs.copy(inputPath, outputPath);

            const result = {
                success: true,
                processId,
                inputFile,
                outputFile,
                outputPath,
                fromFormat: path.extname(inputPath).substring(1),
                toFormat: targetFormat,
                size: fs.statSync(outputPath).size
            };

            this.processHistory.push(result);
            return result;

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Extract audio from video
     */
    async extractAudio(inputPath, options = {}) {
        const {
            format = 'mp3',
            bitrate = '128k'
        } = options;

        const processId = this.generateId();
        const inputFile = path.basename(inputPath);
        const outputFile = `audio_${Date.now()}_${processId}.${format}`;
        const outputPath = path.join(this.dirs.audios, outputFile);

        try {
            await this.simulateProcessing(processId);
            await fs.writeFile(outputPath, `Extracted audio from ${inputFile}`);

            const result = {
                success: true,
                processId,
                inputFile,
                outputFile,
                outputPath,
                format,
                bitrate,
                size: fs.statSync(outputPath).size
            };

            this.processHistory.push(result);
            return result;

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate thumbnail from video
     */
    async generateThumbnail(inputPath, options = {}) {
        const {
            time = '00:00:05',
            width = 1280,
            height = 720
        } = options;

        const processId = this.generateId();
        const inputFile = path.basename(inputPath);
        const outputFile = `thumb_${Date.now()}_${processId}.jpg`;
        const outputPath = path.join(this.dirs.thumbnails, outputFile);

        try {
            await fs.writeFile(outputPath, `Thumbnail from ${inputFile} at ${time}`);

            const result = {
                success: true,
                processId,
                inputFile,
                outputFile,
                outputPath,
                timestamp: time,
                resolution: `${width}x${height}`,
                size: fs.statSync(outputPath).size
            };

            this.processHistory.push(result);
            return result;

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate subtitles (speech to text simulation)
     */
    async generateSubtitles(inputPath, options = {}) {
        const {
            language = 'id',
            format = 'vtt'
        } = options;

        const processId = this.generateId();
        const inputFile = path.basename(inputPath);
        const outputFile = `sub_${Date.now()}_${processId}.${format}`;
        const outputPath = path.join(this.dirs.subtitles, outputFile);

        try {
            // Generate dummy subtitle
            const subtitleContent = this.createDummySubtitle();
            await fs.writeFile(outputPath, subtitleContent);

            const result = {
                success: true,
                processId,
                inputFile,
                outputFile,
                outputPath,
                language,
                format,
                lines: subtitleContent.split('\n').length,
                size: fs.statSync(outputPath).size
            };

            this.processHistory.push(result);
            return result;

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Create dummy subtitle
     */
    createDummySubtitle() {
        const lines = [];
        for (let i = 0; i < 10; i++) {
            const start = this.formatTime(i * 5);
            const end = this.formatTime((i + 1) * 5);
            lines.push(`${i + 1}`);
            lines.push(`${start} --> ${end}`);
            lines.push(`Subtitle line ${i + 1}`);
            lines.push('');
        }
        return lines.join('\n');
    }

    /**
     * Format time for subtitle
     */
    formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const ms = 0;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
    }

    /**
     * Get process status
     */
    getStatus(processId) {
        if (this.activeProcesses.has(processId)) {
            return this.activeProcesses.get(processId);
        }
        
        const history = this.processHistory.find(p => p.processId === processId);
        if (history) {
            return { ...history, status: 'completed' };
        }
        
        return null;
    }

    /**
     * List all processed files
     */
    list(filter = {}) {
        let files = [];

        Object.entries(this.dirs).forEach(([type, dir]) => {
            if (fs.existsSync(dir)) {
                const items = fs.readdirSync(dir);
                items.forEach(item => {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);
                    
                    if (!stat.isDirectory()) {
                        files.push({
                            name: item,
                            path: fullPath,
                            size: stat.size,
                            type,
                            modified: stat.mtime,
                            created: stat.birthtime
                        });
                    }
                });
            }
        });

        if (filter.type) {
            files = files.filter(f => f.type === filter.type);
        }

        return files.sort((a, b) => b.created - a.created);
    }

    /**
     * Get storage statistics
     */
    getStats() {
        let totalSize = 0;
        let fileCount = 0;
        const typeStats = {};

        Object.entries(this.dirs).forEach(([type, dir]) => {
            if (fs.existsSync(dir)) {
                const items = fs.readdirSync(dir);
                typeStats[type] = items.length;
                
                items.forEach(item => {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);
                    if (!stat.isDirectory()) {
                        totalSize += stat.size;
                        fileCount++;
                    }
                });
            }
        });

        return {
            totalSize: this.formatBytes(totalSize),
            totalSizeBytes: totalSize,
            fileCount,
            typeStats,
            activeProcesses: this.activeProcesses.size
        };
    }

    /**
     * Clean up old files
     */
    async cleanup(days = 7) {
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        let deletedCount = 0;
        let freedSpace = 0;

        Object.values(this.dirs).forEach(dir => {
            if (fs.existsSync(dir)) {
                const items = fs.readdirSync(dir);
                items.forEach(item => {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);
                    
                    if (!stat.isDirectory() && stat.mtimeMs < cutoff) {
                        freedSpace += stat.size;
                        fs.unlinkSync(fullPath);
                        deletedCount++;
                    }
                });
            }
        });

        return {
            deletedCount,
            freedSpace: this.formatBytes(freedSpace),
            freedSpaceBytes: freedSpace
        };
    }

    /**
     * Simulate processing for development
     */
    async simulateProcessing(processId, onProgress = null, duration = 5000) {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                
                if (onProgress) {
                    onProgress(progress);
                }

                if (this.activeProcesses.has(processId)) {
                    this.activeProcesses.get(processId).progress = progress;
                }

                if (progress >= 100) {
                    clearInterval(interval);
                    resolve();
                }
            }, duration / 10);
        });
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return crypto.randomBytes(8).toString('hex');
    }

    /**
     * Format bytes
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

module.exports = new ProcessedManager();
