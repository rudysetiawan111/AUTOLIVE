/**
 * Download Manager
 * Manages all downloaded files from various platforms
 */

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const Logger = require('../utils/logger');
const EventEmitter = require('events');

class DownloadManager extends EventEmitter {
    constructor() {
        super();
        this.basePath = path.join(__dirname);
        this.activeDownloads = new Map();
        this.downloadHistory = [];
        this.maxConcurrent = 5;
        
        // Initialize directories
        this.dirs = {
            videos: path.join(this.basePath, 'videos'),
            audios: path.join(this.basePath, 'audios'),
            images: path.join(this.basePath, 'images'),
            thumbnails: path.join(this.basePath, 'thumbnails'),
            subtitles: path.join(this.basePath, 'subtitles'),
            metadata: path.join(this.basePath, 'metadata')
        };
    }

    /**
     * Download a file from URL
     */
    async download(url, options = {}) {
        const {
            type = 'video',
            platform = 'youtube',
            quality = 'highest',
            filename = null,
            metadata = {},
            onProgress = null
        } = options;

        const downloadId = this.generateId();
        const ext = this.getExtension(type);
        const fileName = filename || this.generateFilename(url, type);
        const subDir = this.getSubDir(type);
        const tempPath = path.join(process.cwd(), 'temp', `download_${downloadId}${ext}`);
        const finalPath = path.join(this.dirs[subDir], fileName);

        try {
            this.activeDownloads.set(downloadId, {
                id: downloadId,
                url,
                status: 'downloading',
                progress: 0,
                type,
                platform,
                startTime: Date.now()
            });

            Logger.info(`Starting download: ${url}`, { downloadId, type });

            // Simulate download (replace with actual download logic)
            const result = await this.performDownload(url, tempPath, {
                downloadId,
                quality,
                onProgress
            });

            // Move to final destination
            await fs.move(tempPath, finalPath, { overwrite: true });

            const downloadInfo = {
                id: downloadId,
                url,
                path: finalPath,
                filename: fileName,
                type,
                platform,
                size: result.size,
                metadata: {
                    ...metadata,
                    downloadedAt: new Date().toISOString(),
                    quality
                }
            };

            this.downloadHistory.push(downloadInfo);
            this.activeDownloads.delete(downloadId);

            this.emit('completed', downloadInfo);
            Logger.info(`Download completed: ${fileName}`, { downloadId });

            return {
                success: true,
                ...downloadInfo
            };

        } catch (error) {
            this.activeDownloads.delete(downloadId);
            await fs.remove(tempPath).catch(() => {});
            
            Logger.error(`Download failed: ${error.message}`, { downloadId });
            
            this.emit('error', { downloadId, error: error.message });
            
            return {
                success: false,
                error: error.message,
                downloadId
            };
        }
    }

    /**
     * Perform actual download
     */
    async performDownload(url, outputPath, options) {
        const { downloadId, quality, onProgress } = options;

        // Simulate download progress
        return new Promise((resolve, reject) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 10;
                
                if (onProgress) {
                    onProgress(Math.min(progress, 100));
                }

                this.activeDownloads.set(downloadId, {
                    ...this.activeDownloads.get(downloadId),
                    progress: Math.min(progress, 100)
                });

                if (progress >= 100) {
                    clearInterval(interval);
                    
                    // Create dummy file
                    fs.writeFileSync(outputPath, `Dummy content for ${url}`);
                    
                    resolve({
                        size: fs.statSync(outputPath).size
                    });
                }
            }, 500);
        });
    }

    /**
     * Download multiple files
     */
    async downloadBatch(urls, options = {}) {
        const results = [];
        const chunks = this.chunkArray(urls, this.maxConcurrent);

        for (const chunk of chunks) {
            const promises = chunk.map(url => this.download(url, options));
            const chunkResults = await Promise.allSettled(promises);
            results.push(...chunkResults);
        }

        return {
            total: urls.length,
            successful: results.filter(r => r.status === 'fulfilled').length,
            failed: results.filter(r => r.status === 'rejected').length,
            results
        };
    }

    /**
     * Get download status
     */
    getStatus(downloadId) {
        if (this.activeDownloads.has(downloadId)) {
            return this.activeDownloads.get(downloadId);
        }

        const history = this.downloadHistory.find(d => d.id === downloadId);
        if (history) {
            return { ...history, status: 'completed' };
        }

        return null;
    }

    /**
     * Cancel active download
     */
    cancel(downloadId) {
        if (this.activeDownloads.has(downloadId)) {
            this.activeDownloads.delete(downloadId);
            return { success: true };
        }
        return { success: false, error: 'Download not found' };
    }

    /**
     * List all downloads
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

        // Apply filters
        if (filter.type) {
            files = files.filter(f => f.type === filter.type);
        }
        if (filter.platform) {
            files = files.filter(f => f.metadata?.platform === filter.platform);
        }
        if (filter.days) {
            const cutoff = Date.now() - (filter.days * 24 * 60 * 60 * 1000);
            files = files.filter(f => f.created.getTime() > cutoff);
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
            activeDownloads: this.activeDownloads.size
        };
    }

    /**
     * Clean up old files
     */
    async cleanup(days = 30) {
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
     * Generate unique ID
     */
    generateId() {
        return crypto.randomBytes(8).toString('hex');
    }

    /**
     * Generate filename
     */
    generateFilename(url, type) {
        const hash = crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
        const timestamp = Date.now();
        const ext = this.getExtension(type);
        return `${type}_${timestamp}_${hash}${ext}`;
    }

    /**
     * Get file extension by type
     */
    getExtension(type) {
        const extensions = {
            video: '.mp4',
            audio: '.mp3',
            image: '.jpg',
            thumbnail: '.jpg',
            subtitle: '.vtt',
            metadata: '.json'
        };
        return extensions[type] || '.bin';
    }

    /**
     * Get subdirectory name by type
     */
    getSubDir(type) {
        const dirMap = {
            video: 'videos',
            audio: 'audios',
            image: 'images',
            thumbnail: 'thumbnails',
            subtitle: 'subtitles',
            metadata: 'metadata'
        };
        return dirMap[type] || 'others';
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

    /**
     * Chunk array for batch processing
     */
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
}

module.exports = new DownloadManager();
