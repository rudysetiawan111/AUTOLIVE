/**
 * Download Manager
 * Mengelola file yang di-download dari berbagai platform
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');
const stream = require('stream');
const axios = require('axios');

const pipeline = promisify(stream.pipeline);

class DownloadManager {
    constructor() {
        this.basePath = path.join(__dirname, '../downloads');
        this.tempPath = path.join(__dirname, '../temp');
        this.maxConcurrent = 5;
        this.activeDownloads = new Map();
        this.downloadQueue = [];
        this.completedDownloads = [];
        
        // Pastikan folder exists
        this.ensureDirectories();
    }

    /**
     * Memastikan semua direktori yang diperlukan ada
     */
    ensureDirectories() {
        const dirs = [
            this.basePath,
            this.tempPath,
            path.join(this.basePath, 'videos'),
            path.join(this.basePath, 'audios'),
            path.join(this.basePath, 'images'),
            path.join(this.basePath, 'thumbnails'),
            path.join(this.basePath, 'subtitles'),
            path.join(this.basePath, 'metadata')
        ];

        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`[Storage] Created directory: ${dir}`);
            }
        });
    }

    /**
     * Download file dari URL
     */
    async downloadFile(url, options = {}) {
        const {
            type = 'video',
            filename = null,
            platform = 'youtube',
            quality = 'highest',
            metadata = {},
            onProgress = null
        } = options;

        try {
            // Generate ID untuk download
            const downloadId = this.generateDownloadId(url);
            
            // Cek apakah sudah pernah di-download
            const existingFile = this.findExistingFile(url, type);
            if (existingFile) {
                console.log(`[Storage] File already exists: ${existingFile}`);
                return {
                    success: true,
                    downloadId,
                    filePath: existingFile,
                    fromCache: true
                };
            }

            // Tentukan path penyimpanan
            const ext = this.getFileExtension(url, type);
            const finalFilename = filename || this.generateFilename(url, type, ext);
            const subDir = this.getSubDirectory(type);
            const tempPath = path.join(this.tempPath, `temp_${downloadId}${ext}`);
            const finalPath = path.join(this.basePath, subDir, finalFilename);

            // Simpan ke active downloads
            const downloadPromise = this.performDownload(url, tempPath, finalPath, {
                downloadId,
                type,
                platform,
                quality,
                metadata,
                onProgress
            });

            this.activeDownloads.set(downloadId, {
                id: downloadId,
                url,
                status: 'downloading',
                progress: 0,
                promise: downloadPromise
            });

            // Tunggu download selesai
            const result = await downloadPromise;

            // Pindahkan ke completed
            this.completedDownloads.push({
                id: downloadId,
                url,
                filePath: finalPath,
                timestamp: new Date().toISOString(),
                type,
                platform,
                size: this.getFileSize(finalPath),
                metadata
            });

            this.activeDownloads.delete(downloadId);

            return {
                success: true,
                downloadId,
                filePath: finalPath,
                size: result.size,
                duration: result.duration,
                metadata: result.metadata,
                fromCache: false
            };

        } catch (error) {
            console.error(`[Storage] Download failed: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Melakukan proses download
     */
    async performDownload(url, tempPath, finalPath, options) {
        const {
            downloadId,
            type,
            platform,
            quality,
            metadata,
            onProgress
        } = options;

        // Simulasi download (implementasi sesuai platform)
        console.log(`[Storage] Downloading ${url} to ${tempPath}`);

        // Untuk simulasi, kita buat file dummy
        return new Promise((resolve, reject) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                if (onProgress) onProgress(progress);
                
                if (progress >= 100) {
                    clearInterval(interval);
                    
                    // Buat file dummy
                    fs.writeFileSync(tempPath, `Dummy content for ${url}`);
                    
                    // Pindahkan ke final path
                    fs.renameSync(tempPath, finalPath);
                    
                    resolve({
                        size: fs.statSync(finalPath).size,
                        duration: Math.floor(Math.random() * 300) + 60, // 1-5 menit
                        metadata: {
                            ...metadata,
                            downloadedAt: new Date().toISOString(),
                            quality,
                            platform
                        }
                    });
                }
            }, 500);
        });
    }

    /**
     * Download batch (multiple files)
     */
    async downloadBatch(urls, options = {}) {
        const results = [];
        const batchSize = options.concurrent || this.maxConcurrent;

        for (let i = 0; i < urls.length; i += batchSize) {
            const batch = urls.slice(i, i + batchSize);
            const promises = batch.map(url => this.downloadFile(url, options));
            const batchResults = await Promise.allSettled(promises);
            
            batchResults.forEach((result, index) => {
                results.push({
                    url: batch[index],
                    ...result
                });
            });
        }

        return {
            total: urls.length,
            successful: results.filter(r => r.status === 'fulfilled').length,
            failed: results.filter(r => r.status === 'rejected').length,
            results
        };
    }

    /**
     * Mendapatkan status download
     */
    getDownloadStatus(downloadId) {
        if (this.activeDownloads.has(downloadId)) {
            return this.activeDownloads.get(downloadId);
        }

        const completed = this.completedDownloads.find(d => d.id === downloadId);
        if (completed) {
            return {
                ...completed,
                status: 'completed'
            };
        }

        return null;
    }

    /**
     * Membatalkan download
     */
    cancelDownload(downloadId) {
        if (this.activeDownloads.has(downloadId)) {
            // Implement cancel logic
            this.activeDownloads.delete(downloadId);
            return { success: true };
        }
        return { success: false, error: 'Download not found' };
    }

    /**
     * Mendapatkan daftar file yang sudah di-download
     */
    listDownloads(type = null, platform = null) {
        let files = [];

        const scanDir = (dir) => {
            const items = fs.readdirSync(dir);
            items.forEach(item => {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    scanDir(fullPath);
                } else {
                    const fileInfo = {
                        name: item,
                        path: fullPath,
                        size: stat.size,
                        modified: stat.mtime,
                        created: stat.birthtime,
                        type: this.getFileTypeFromPath(fullPath)
                    };

                    // Filter berdasarkan type
                    if (!type || fileInfo.type === type) {
                        files.push(fileInfo);
                    }
                }
            });
        };

        scanDir(this.basePath);

        // Urutkan berdasarkan modified terbaru
        files.sort((a, b) => b.modified - a.modified);

        return files;
    }

    /**
     * Mendapatkan statistik storage
     */
    getStorageStats() {
        let totalSize = 0;
        let fileCount = 0;
        let typeStats = {};

        const calculateSize = (dir) => {
            const items = fs.readdirSync(dir);
            items.forEach(item => {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    calculateSize(fullPath);
                } else {
                    totalSize += stat.size;
                    fileCount++;
                    
                    const type = this.getFileTypeFromPath(fullPath);
                    typeStats[type] = (typeStats[type] || 0) + 1;
                }
            });
        };

        calculateSize(this.basePath);

        return {
            totalSize: this.formatBytes(totalSize),
            totalSizeBytes: totalSize,
            fileCount,
            typeStats,
            freeSpace: this.getFreeSpace(),
            downloadsPath: this.basePath,
            tempPath: this.tempPath
        };
    }

    /**
     * Membersihkan file lama
     */
    cleanupOldFiles(days = 30) {
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        let deletedCount = 0;
        let freedSpace = 0;

        const cleanupDir = (dir) => {
            const items = fs.readdirSync(dir);
            items.forEach(item => {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    cleanupDir(fullPath);
                    
                    // Hapus folder jika kosong
                    if (fs.readdirSync(fullPath).length === 0) {
                        fs.rmdirSync(fullPath);
                    }
                } else if (stat.mtimeMs < cutoff) {
                    freedSpace += stat.size;
                    fs.unlinkSync(fullPath);
                    deletedCount++;
                }
            });
        };

        cleanupDir(this.basePath);

        return {
            deletedCount,
            freedSpace: this.formatBytes(freedSpace),
            freedSpaceBytes: freedSpace
        };
    }

    /**
     * Mencari file yang sudah ada
     */
    findExistingFile(url, type) {
        // Implementasi pencarian berdasarkan metadata
        return null;
    }

    /**
     * Generate unique ID untuk download
     */
    generateDownloadId(url) {
        return crypto
            .createHash('md5')
            .update(url + Date.now())
            .digest('hex')
            .substring(0, 12);
    }

    /**
     * Generate filename
     */
    generateFilename(url, type, ext) {
        const timestamp = Date.now();
        const hash = crypto
            .createHash('md5')
            .update(url)
            .digest('hex')
            .substring(0, 8);
        
        return `${type}_${timestamp}_${hash}${ext}`;
    }

    /**
     * Mendapatkan ekstensi file dari URL
     */
    getFileExtension(url, type) {
        const extMap = {
            video: '.mp4',
            audio: '.mp3',
            image: '.jpg',
            thumbnail: '.jpg',
            subtitle: '.vtt',
            metadata: '.json'
        };
        return extMap[type] || '.bin';
    }

    /**
     * Mendapatkan subdirectory berdasarkan tipe
     */
    getSubDirectory(type) {
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
     * Mendapatkan tipe file dari path
     */
    getFileTypeFromPath(filePath) {
        const dir = path.dirname(filePath).split(path.sep).pop();
        const typeMap = {
            'videos': 'video',
            'audios': 'audio',
            'images': 'image',
            'thumbnails': 'thumbnail',
            'subtitles': 'subtitle',
            'metadata': 'metadata'
        };
        return typeMap[dir] || 'unknown';
    }

    /**
     * Format bytes ke human readable
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Mendapatkan free space (simulasi)
     */
    getFreeSpace() {
        // Implementasi untuk mendapatkan free space disk
        return this.formatBytes(50 * 1024 * 1024 * 1024); // 50GB dummy
    }

    /**
     * Mendapatkan ukuran file
     */
    getFileSize(filePath) {
        try {
            const stat = fs.statSync(filePath);
            return stat.size;
        } catch {
            return 0;
        }
    }
}

module.exports = new DownloadManager();
