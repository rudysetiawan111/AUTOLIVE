/**
 * Upload Manager
 * Manages all files queued for upload to platforms
 */

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const Logger = require('../utils/logger');
const EventEmitter = require('events');

class UploadManager extends EventEmitter {
    constructor() {
        super();
        this.basePath = path.join(__dirname);
        this.uploadQueue = [];
        this.activeUploads = new Map();
        this.uploadHistory = [];
        this.maxConcurrent = 3;
        
        // Initialize directories
        this.dirs = {
            pending: path.join(this.basePath, 'pending'),
            uploading: path.join(this.basePath, 'uploading'),
            completed: path.join(this.basePath, 'completed'),
            failed: path.join(this.basePath, 'failed'),
            youtube: path.join(this.basePath, 'youtube'),
            tiktok: path.join(this.basePath, 'tiktok'),
            instagram: path.join(this.basePath, 'instagram'),
            facebook: path.join(this.basePath, 'facebook'),
            metadata: path.join(this.basePath, 'metadata')
        };
    }

    /**
     * Add file to upload queue
     */
    async queue(filePath, options = {}) {
        const {
            platform = 'youtube',
            title = '',
            description = '',
            tags = [],
            category = '',
            scheduleTime = null,
            privacy = 'public',
            metadata = {}
        } = options;

        const uploadId = this.generateId();
        const fileName = path.basename(filePath);
        const pendingPath = path.join(this.dirs.pending, `${uploadId}_${fileName}`);

        try {
            // Copy file to pending directory
            await fs.copy(filePath, pendingPath);

            const queueItem = {
                id: uploadId,
                originalPath: filePath,
                currentPath: pendingPath,
                fileName,
                fileSize: fs.statSync(filePath).size,
                platform,
                title,
                description,
                tags,
                category,
                scheduleTime,
                privacy,
                metadata,
                status: 'queued',
                createdAt: new Date().toISOString(),
                retryCount: 0
            };

            this.uploadQueue.push(queueItem);
            
            Logger.info(`File queued for upload: ${fileName}`, { uploadId, platform });

            return {
                success: true,
                uploadId,
                queueItem
            };

        } catch (error) {
            Logger.error(`Failed to queue file: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Start upload process
     */
    async start(uploadId, options = {}) {
        const queueItem = this.uploadQueue.find(item => item.id === uploadId);
        if (!queueItem) {
            return { success: false, error: 'Upload not found in queue' };
        }

        const {
            onProgress = null,
            onComplete = null,
            onError = null
        } = options;

        try {
            // Move to uploading directory
            queueItem.status = 'uploading';
            queueItem.startedAt = new Date().toISOString();

            const uploadingPath = path.join(this.dirs.uploading, path.basename(queueItem.currentPath));
            await fs.move(queueItem.currentPath, uploadingPath, { overwrite: true });
            queueItem.currentPath = uploadingPath;

            // Simulate upload
            const uploadPromise = this.performUpload(queueItem, {
                onProgress,
                onComplete,
                onError
            });

            this.activeUploads.set(uploadId, {
                ...queueItem,
                promise: uploadPromise
            });

            const result = await uploadPromise;

            // Move to appropriate directory based on result
            const destDir = result.success ? this.dirs.completed : this.dirs.failed;
            const destPath = path.join(destDir, path.basename(queueItem.currentPath));
            await fs.move(queueItem.currentPath, destPath, { overwrite: true });

            const uploadRecord = {
                ...queueItem,
                ...result,
                completedAt: new Date().toISOString(),
                finalPath: destPath
            };

            this.uploadHistory.push(uploadRecord);
            this.activeUploads.delete(uploadId);
            
            // Also save to platform-specific directory
            if (result.success) {
                const platformPath = path.join(this.dirs[queueItem.platform], path.basename(destPath));
                await fs.copy(destPath, platformPath);
            }

            this.emit('completed', uploadRecord);
            
            return {
                success: true,
                ...uploadRecord
            };

        } catch (error) {
            // Move to failed directory
            if (queueItem.currentPath && fs.existsSync(queueItem.currentPath)) {
                const failedPath = path.join(this.dirs.failed, path.basename(queueItem.currentPath));
                await fs.move(queueItem.currentPath, failedPath, { overwrite: true }).catch(() => {});
            }

            this.activeUploads.delete(uploadId);
            
            Logger.error(`Upload failed: ${error.message}`, { uploadId });
            
            this.emit('error', { uploadId, error: error.message });
            
            return {
                success: false,
                error: error.message,
                uploadId
            };
        }
    }

    /**
     * Perform actual upload simulation
     */
    async performUpload(queueItem, callbacks) {
        const { onProgress, onComplete, onError } = callbacks;

        return new Promise((resolve, reject) => {
            let progress = 0;
            const totalSize = queueItem.fileSize;
            
            const interval = setInterval(() => {
                progress += Math.random() * 10;
                
                if (onProgress) {
                    onProgress({
                        uploadId: queueItem.id,
                        progress: Math.min(progress, 100),
                        uploadedBytes: Math.floor((progress / 100) * totalSize),
                        totalBytes: totalSize
                    });
                }

                this.activeUploads.set(queueItem.id, {
                    ...this.activeUploads.get(queueItem.id),
                    progress: Math.min(progress, 100)
                });

                if (progress >= 100) {
                    clearInterval(interval);

                    const result = {
                        success: true,
                        uploadId: queueItem.id,
                        platform: queueItem.platform,
                        videoId: this.generateVideoId(queueItem.platform),
                        videoUrl: this.generateVideoUrl(queueItem.platform, this.generateVideoId()),
                        views: 0,
                        likes: 0,
                        comments: 0,
                        uploadedAt: new Date().toISOString()
                    };

                    if (onComplete) onComplete(result);
                    resolve(result);
                }
            }, 500);

            // Simulate random failure (5% chance)
            if (Math.random() < 0.05) {
                clearInterval(interval);
                const error = new Error('Upload failed due to network error');
                if (onError) onError(error);
                reject(error);
            }
        });
    }

    /**
     * Schedule upload for later
     */
    async schedule(filePath, scheduleTime, options = {}) {
        const queueResult = await this.queue(filePath, {
            ...options,
            scheduleTime
        });

        if (!queueResult.success) {
            return queueResult;
        }

        const delay = new Date(scheduleTime) - new Date();
        
        setTimeout(() => {
            this.start(queueResult.uploadId, options);
        }, delay);

        return {
            success: true,
            uploadId: queueResult.uploadId,
            scheduledTime: scheduleTime,
            delay: Math.floor(delay / 1000) + ' seconds'
        };
    }

    /**
     * Get upload status
     */
    getStatus(uploadId) {
        if (this.activeUploads.has(uploadId)) {
            return this.activeUploads.get(uploadId);
        }

        const queued = this.uploadQueue.find(u => u.id === uploadId);
        if (queued) {
            return queued;
        }

        const history = this.uploadHistory.find(u => u.uploadId === uploadId);
        if (history) {
            return history;
        }

        return null;
    }

    /**
     * Cancel upload
     */
    cancel(uploadId) {
        if (this.activeUploads.has(uploadId)) {
            this.activeUploads.delete(uploadId);
            return { success: true };
        }

        const index = this.uploadQueue.findIndex(u => u.id === uploadId);
        if (index !== -1) {
            const [removed] = this.uploadQueue.splice(index, 1);
            fs.unlink(removed.currentPath).catch(() => {});
            return { success: true };
        }

        return { success: false, error: 'Upload not found' };
    }

    /**
     * List all uploads
     */
    list(filter = {}) {
        let uploads = [];

        // Add queued uploads
        this.uploadQueue.forEach(item => {
            uploads.push({
                ...item,
                source: 'queue'
            });
        });

        // Add active uploads
        this.activeUploads.forEach(item => {
            uploads.push({
                ...item,
                source: 'active'
            });
        });

        // Add history
        this.uploadHistory.forEach(item => {
            uploads.push({
                ...item,
                source: 'history'
            });
        });

        // Apply filters
        if (filter.status) {
            uploads = uploads.filter(u => u.status === filter.status);
        }
        if (filter.platform) {
            uploads = uploads.filter(u => u.platform === filter.platform);
        }

        return uploads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    /**
     * Get storage statistics
     */
    getStats() {
        let totalSize = 0;
        let fileCount = 0;
        const statusStats = {};
        const platformStats = {};

        // Count queued files
        this.uploadQueue.forEach(item => {
            totalSize += item.fileSize;
            fileCount++;
            statusStats[item.status] = (statusStats[item.status] || 0) + 1;
            platformStats[item.platform] = (platformStats[item.platform] || 0) + 1;
        });

        // Count active uploads
        this.activeUploads.forEach(item => {
            totalSize += item.fileSize;
            fileCount++;
            statusStats.uploading = (statusStats.uploading || 0) + 1;
            platformStats[item.platform] = (platformStats[item.platform] || 0) + 1;
        });

        // Count files in directories
        Object.entries(this.dirs).forEach(([name, dir]) => {
            if (fs.existsSync(dir) && !['metadata'].includes(name)) {
                const items = fs.readdirSync(dir);
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
            statusStats,
            platformStats,
            queued: this.uploadQueue.length,
            active: this.activeUploads.size,
            completed: this.uploadHistory.length
        };
    }

    /**
     * Clean up old files
     */
    async cleanup(days = 7) {
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        let deletedCount = 0;
        let freedSpace = 0;

        const dirsToClean = ['pending', 'failed', 'temp'];

        dirsToClean.forEach(dirName => {
            const dir = this.dirs[dirName];
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
     * Generate video ID (simulated)
     */
    generateVideoId(platform) {
        const prefixes = {
            youtube: 'YT',
            tiktok: 'TK',
            instagram: 'IG',
            facebook: 'FB'
        };
        const prefix = prefixes[platform] || 'VD';
        return `${prefix}_${crypto.randomBytes(4).toString('hex')}`;
    }

    /**
     * Generate video URL (simulated)
     */
    generateVideoUrl(platform, videoId) {
        const urls = {
            youtube: `https://youtu.be/${videoId}`,
            tiktok: `https://tiktok.com/@user/video/${videoId}`,
            instagram: `https://instagram.com/p/${videoId}`,
            facebook: `https://facebook.com/watch?v=${videoId}`
        };
        return urls[platform] || `https://example.com/video/${videoId}`;
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

module.exports = new UploadManager();
