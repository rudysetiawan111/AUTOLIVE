/**
 * Upload Manager
 * Mengelola file yang akan di-upload ke platform
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class UploadManager {
    constructor() {
        this.basePath = path.join(__dirname, '../uploads');
        this.tempPath = path.join(__dirname, '../temp');
        
        // Subdirectories
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

        this.ensureDirectories();
        
        this.activeUploads = new Map();
        this.uploadQueue = [];
        this.completedUploads = [];
    }

    /**
     * Memastikan direktori ada
     */
    ensureDirectories() {
        Object.values(this.dirs).forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`[Uploads] Created directory: ${dir}`);
            }
        });
    }

    /**
     * Menambahkan file ke antrian upload
     */
    async queueUpload(filePath, options = {}) {
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

        const uploadId = this.generateUploadId();
        const fileName = path.basename(filePath);
        const targetPath = path.join(this.dirs.pending, `${uploadId}_${fileName}`);

        try {
            // Copy file ke pending folder
            fs.copyFileSync(filePath, targetPath);

            const queueItem = {
                id: uploadId,
                originalPath: filePath,
                currentPath: targetPath,
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
                retryCount: 0,
                maxRetries: 3
            };

            this.uploadQueue.push(queueItem);

            return {
                success: true,
                uploadId,
                queueItem
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Memulai proses upload
     */
    async startUpload(uploadId, options = {}) {
        const queueItem = this.uploadQueue.find(item => item.id === uploadId);
        if (!queueItem) {
            return {
                success: false,
                error: 'Upload not found in queue'
            };
        }

        const {
            onProgress = null,
            onComplete = null,
            onError = null
        } = options;

        try {
            // Update status
            queueItem.status = 'uploading';
            queueItem.startedAt = new Date().toISOString();

            // Pindahkan ke folder uploading
            const uploadingPath = path.join(this.dirs.uploading, path.basename(queueItem.currentPath));
            fs.renameSync(queueItem.currentPath, uploadingPath);
            queueItem.currentPath = uploadingPath;

            // Simulasi upload
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

            // Pindahkan ke completed
            const completedPath = path.join(
                this.dirs[result.success ? 'completed' : 'failed'],
                path.basename(queueItem.currentPath)
            );
            fs.renameSync(queueItem.currentPath, completedPath);

            this.completedUploads.push({
                ...queueItem,
                ...result,
                completedAt: new Date().toISOString(),
                finalPath: completedPath
            });

            this.activeUploads.delete(uploadId);

            return result;

        } catch (error) {
            // Pindahkan ke failed
            const failedPath = path.join(this.dirs.failed, path.basename(queueItem.currentPath));
            if (fs.existsSync(queueItem.currentPath)) {
                fs.renameSync(queueItem.currentPath, failedPath);
            }

            this.activeUploads.delete(uploadId);

            return {
                success: false,
                error: error.message,
                uploadId
            };
        }
    }

    /**
     * Simulasi proses upload ke platform
     */
    async performUpload(queueItem, callbacks) {
        const {
            onProgress,
            onComplete,
            onError
        } = callbacks;

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
                        uploadedAt: new Date().toISOString(),
                        processingTime: Math.floor(Math.random() * 30) + 10 // 10-40 detik
                    };

                    if (onComplete) onComplete(result);
                    resolve(result);
                }
            }, 500);

            // Simulasi error (5% chance)
            if (Math.random() < 0.05) {
                clearInterval(interval);
                const error = new Error('Upload failed due to network error');
                if (onError) onError(error);
                reject(error);
            }
        });
    }

    /**
     * Upload batch (multiple files)
     */
    async uploadBatch(filePaths, options = {}) {
        const {
            concurrent = 3,
            ...uploadOptions
        } = options;

        const results = [];
        
        // Queue semua file
        for (const filePath of filePaths) {
            const queueResult = await this.queueUpload(filePath, uploadOptions);
            results.push(queueResult);
        }

        // Upload concurrent
        const uploadPromises = [];
        for (let i = 0; i < Math.min(concurrent, results.length); i++) {
            if (results[i].success) {
                uploadPromises.push(this.startUpload(results[i].uploadId, uploadOptions));
            }
        }

        const uploadResults = await Promise.allSettled(uploadPromises);

        return {
            total: filePaths.length,
            queued: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            uploads: uploadResults.map((r, i) => ({
                file: filePaths[i],
                ...r
            }))
        };
    }

    /**
     * Menjadwalkan upload
     */
    async scheduleUpload(filePath, scheduleTime, options = {}) {
        const queueResult = await this.queueUpload(filePath, {
            ...options,
            scheduleTime
        });

        if (!queueResult.success) {
            return queueResult;
        }

        const delay = new Date(scheduleTime) - new Date();
        
        setTimeout(() => {
            this.startUpload(queueResult.uploadId, options);
        }, delay);

        return {
            success: true,
            uploadId: queueResult.uploadId,
            scheduledTime: scheduleTime,
            delay: Math.floor(delay / 1000) + ' detik'
        };
    }

    /**
     * Mendapatkan status upload
     */
    getUploadStatus(uploadId) {
        // Cek di active uploads
        if (this.activeUploads.has(uploadId)) {
            return this.activeUploads.get(uploadId);
        }

        // Cek di queue
        const queued = this.uploadQueue.find(u => u.id === uploadId);
        if (queued) {
            return queued;
        }

        // Cek di completed
        const completed = this.completedUploads.find(u => u.uploadId === uploadId);
        if (completed) {
            return completed;
        }

        return null;
    }

    /**
     * Membatalkan upload
     */
    cancelUpload(uploadId) {
        if (this.activeUploads.has(uploadId)) {
            this.activeUploads.delete(uploadId);
            
            // Hapus file
            const queueItem = this.uploadQueue.find(u => u.id === uploadId);
            if (queueItem && fs.existsSync(queueItem.currentPath)) {
                fs.unlinkSync(queueItem.currentPath);
            }

            return { success: true };
        }

        return { success: false, error: 'Upload not found or already completed' };
    }

    /**
     * Mendapatkan daftar upload
     */
    listUploads(status = null, platform = null) {
        let uploads = [];

        // Dari queue
        this.uploadQueue.forEach(item => {
            if (!status || item.status === status) {
                if (!platform || item.platform === platform) {
                    uploads.push({ ...item, source: 'queue' });
                }
            }
        });

        // Dari completed
        this.completedUploads.forEach(item => {
            if (!status || item.status === status) {
                if (!platform || item.platform === platform) {
                    uploads.push({ ...item, source: 'completed' });
                }
            }
        });

        // Urutkan berdasarkan createdAt
        uploads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return uploads;
    }

    /**
     * Mendapatkan statistik upload
     */
    getUploadStats() {
        const stats = {
            total: 0,
            byPlatform: {},
            byStatus: {},
            totalSize: 0,
            averageSpeed: 0
        };

        // Hitung dari queue
        this.uploadQueue.forEach(item => {
            stats.total++;
            stats.byPlatform[item.platform] = (stats.byPlatform[item.platform] || 0) + 1;
            stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;
            stats.totalSize += item.fileSize;
        });

        // Hitung dari completed
        this.completedUploads.forEach(item => {
            stats.total++;
            stats.byPlatform[item.platform] = (stats.byPlatform[item.platform] || 0) + 1;
            stats.byStatus.completed = (stats.byStatus.completed || 0) + 1;
            stats.totalSize += item.fileSize;
        });

        return stats;
    }

    /**
     * Generate unique ID
     */
    generateUploadId() {
        return crypto
            .createHash('md5')
            .update(Date.now().toString() + Math.random())
            .digest('hex')
            .substring(0, 12);
    }

    /**
     * Generate video ID (simulasi)
     */
    generateVideoId(platform) {
        const prefixes = {
            youtube: 'YT',
            tiktok: 'TK',
            instagram: 'IG',
            facebook: 'FB'
        };
        
        const prefix = prefixes[platform] || 'VD';
        const random = crypto.randomBytes(4).toString('hex');
        
        return `${prefix}_${random}_${Date.now().toString(36)}`;
    }

    /**
     * Generate video URL
     */
    generateVideoUrl(platform, videoId) {
        const urls = {
            youtube: `https://youtu.be/${videoId}`,
            tiktok: `https://tiktok.com/@user/video/${videoId}`,
            instagram: `https://instagram.com/p/${videoId}`,
            facebook: `https://facebook.com/watch/?v=${videoId}`
        };
        
        return urls[platform] || `https://example.com/video/${videoId}`;
    }

    /**
     * Membersihkan file lama
     */
    cleanupOldFiles(days = 7) {
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        let deletedCount = 0;
        let freedSpace = 0;

        const cleanupDir = (dir) => {
            if (!fs.existsSync(dir)) return;
            
            const items = fs.readdirSync(dir);
            items.forEach(item => {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    cleanupDir(fullPath);
                } else if (stat.mtimeMs < cutoff) {
                    freedSpace += stat.size;
                    fs.unlinkSync(fullPath);
                    deletedCount++;
                }
            });
        };

        // Bersihkan folder pending dan failed saja
        cleanupDir(this.dirs.pending);
        cleanupDir(this.dirs.failed);

        return {
            deletedCount,
            freedSpace: this.formatBytes(freedSpace),
            freedSpaceBytes: freedSpace
        };
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
