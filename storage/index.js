/**
 * Storage Module Index
 * Export semua manager storage
 */

const DownloadManager = require('./downloads');
const ProcessedManager = require('./processed');
const UploadManager = require('./uploads');
const TempManager = require('./temp');

class StorageManager {
    constructor() {
        this.downloads = DownloadManager;
        this.processed = ProcessedManager;
        this.uploads = UploadManager;
        this.temp = TempManager;
    }

    /**
     * Mendapatkan statistik semua storage
     */
    getAllStats() {
        return {
            downloads: this.downloads.getStorageStats(),
            processed: this.processed.getStorageStats(),
            uploads: this.uploads.getUploadStats(),
            temp: this.temp.getStorageStats(),
            total: this.calculateTotal()
        };
    }

    /**
     * Membersihkan semua storage
     */
    cleanupAll(days = 30) {
        return {
            downloads: this.downloads.cleanupOldFiles(days),
            processed: this.processed.cleanupOldFiles(days),
            uploads: this.uploads.cleanupOldFiles(days),
            temp: this.temp.cleanup(days * 24 * 60 * 60 * 1000)
        };
    }

    /**
     * Menghitung total storage
     */
    calculateTotal() {
        const downloads = this.downloads.getStorageStats();
        const processed = this.processed.getStorageStats();
        const uploads = this.uploads.getUploadStats();
        const temp = this.temp.getStorageStats();

        const totalBytes = 
            downloads.totalSizeBytes + 
            processed.totalSizeBytes + 
            uploads.totalSize + 
            temp.totalSizeBytes;

        return {
            totalSize: this.formatBytes(totalBytes),
            totalSizeBytes: totalBytes,
            fileCount: 
                downloads.fileCount + 
                processed.fileCount + 
                uploads.total + 
                temp.fileCount
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

module.exports = new StorageManager();
