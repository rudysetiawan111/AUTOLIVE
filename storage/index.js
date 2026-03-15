/**
 * AutoLive Storage System
 * Main entry point for all storage management
 */

const path = require('path');
const fs = require('fs-extra');
const DownloadManager = require('./downloads');
const ProcessedManager = require('./processed');
const UploadManager = require('./uploads');
const TempManager = require('./temp');
const Logger = require('./utils/logger');

class StorageSystem {
    constructor() {
        this.basePath = path.join(__dirname);
        this.downloads = DownloadManager;
        this.processed = ProcessedManager;
        this.uploads = UploadManager;
        this.temp = TempManager;
        this.logger = Logger;
        
        this.initialize();
    }

    /**
     * Initialize storage system
     */
    async initialize() {
        try {
            this.logger.info('Initializing Storage System...');
            
            // Create all directories
            await this.createAllDirectories();
            
            // Check permissions
            await this.checkPermissions();
            
            // Start monitoring
            this.startMonitoring();
            
            this.logger.info('Storage System initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Storage System:', error);
        }
    }

    /**
     * Create all required directories
     */
    async createAllDirectories() {
        const directories = [
            // Downloads
            path.join(__dirname, 'downloads/videos'),
            path.join(__dirname, 'downloads/audios'),
            path.join(__dirname, 'downloads/images'),
            path.join(__dirname, 'downloads/thumbnails'),
            path.join(__dirname, 'downloads/subtitles'),
            path.join(__dirname, 'downloads/metadata'),
            
            // Processed
            path.join(__dirname, 'processed/videos'),
            path.join(__dirname, 'processed/audios'),
            path.join(__dirname, 'processed/images'),
            path.join(__dirname, 'processed/thumbnails'),
            path.join(__dirname, 'processed/subtitles'),
            path.join(__dirname, 'processed/compressed'),
            path.join(__dirname, 'processed/watermarked'),
            path.join(__dirname, 'processed/clips'),
            path.join(__dirname, 'processed/merged'),
            path.join(__dirname, 'processed/converted'),
            
            // Uploads
            path.join(__dirname, 'uploads/pending'),
            path.join(__dirname, 'uploads/uploading'),
            path.join(__dirname, 'uploads/completed'),
            path.join(__dirname, 'uploads/failed'),
            path.join(__dirname, 'uploads/youtube'),
            path.join(__dirname, 'uploads/tiktok'),
            path.join(__dirname, 'uploads/instagram'),
            path.join(__dirname, 'uploads/facebook'),
            path.join(__dirname, 'uploads/metadata'),
            
            // Temp
            path.join(__dirname, 'temp/downloads'),
            path.join(__dirname, 'temp/uploads'),
            path.join(__dirname, 'temp/processing'),
            path.join(__dirname, 'temp/chunks'),
            path.join(__dirname, 'temp/cache'),
            path.join(__dirname, 'temp/sessions'),
            path.join(__dirname, 'temp/logs')
        ];

        for (const dir of directories) {
            await fs.ensureDir(dir);
            this.logger.debug(`Ensured directory: ${dir}`);
        }
    }

    /**
     * Check directory permissions
     */
    async checkPermissions() {
        const testFile = path.join(__dirname, 'temp', '.write_test');
        try {
            await fs.writeFile(testFile, 'test');
            await fs.unlink(testFile);
            this.logger.info('Storage permissions: OK');
        } catch (error) {
            this.logger.error('Storage permission error:', error);
            throw new Error('Insufficient storage permissions');
        }
    }

    /**
     * Start monitoring storage usage
     */
    startMonitoring() {
        setInterval(() => {
            const stats = this.getStats();
            this.logger.info('Storage Stats:', stats);
            
            // Alert if storage is running low
            if (stats.total.freeSpaceBytes < 10 * 1024 * 1024 * 1024) { // < 10GB
                this.logger.warn('Low storage space!');
            }
        }, 3600000); // Every hour
    }

    /**
     * Get comprehensive storage statistics
     */
    getStats() {
        return {
            downloads: this.downloads.getStats(),
            processed: this.processed.getStats(),
            uploads: this.uploads.getStats(),
            temp: this.temp.getStats(),
            total: this.calculateTotalStats(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Calculate total statistics
     */
    calculateTotalStats() {
        const downloads = this.downloads.getStats();
        const processed = this.processed.getStats();
        const uploads = this.uploads.getStats();
        const temp = this.temp.getStats();

        const totalBytes = 
            (downloads.totalSizeBytes || 0) + 
            (processed.totalSizeBytes || 0) + 
            (uploads.totalSizeBytes || 0) + 
            (temp.totalSizeBytes || 0);

        return {
            totalSize: this.formatBytes(totalBytes),
            totalSizeBytes: totalBytes,
            fileCount: 
                (downloads.fileCount || 0) + 
                (processed.fileCount || 0) + 
                (uploads.fileCount || 0) + 
                (temp.fileCount || 0),
            freeSpace: this.getFreeSpace(),
            freeSpaceBytes: 100 * 1024 * 1024 * 1024 // 100GB dummy
        };
    }

    /**
     * Clean up old files across all storage
     */
    async cleanupAll(days = 30) {
        this.logger.info(`Starting cleanup of files older than ${days} days...`);
        
        const results = {
            downloads: await this.downloads.cleanup(days),
            processed: await this.processed.cleanup(days),
            uploads: await this.uploads.cleanup(days),
            temp: await this.temp.cleanup(days * 24 * 60 * 60 * 1000)
        };

        this.logger.info('Cleanup completed:', results);
        return results;
    }

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get free space (simulated)
     */
    getFreeSpace() {
        return this.formatBytes(100 * 1024 * 1024 * 1024); // 100GB dummy
    }
}

module.exports = new StorageSystem();
