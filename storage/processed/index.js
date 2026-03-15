/**
 * Processed Files Manager
 * Mengelola file yang sudah diproses (diedit, di-convert, dll)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');

class ProcessedManager {
    constructor() {
        this.basePath = path.join(__dirname, '../processed');
        this.tempPath = path.join(__dirname, '../temp');
        
        // Subdirectories
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

        // Pastikan semua direktori ada
        this.ensureDirectories();
        
        // Database proses (simulasi)
        this.processedFiles = [];
        this.activeProcesses = new Map();
    }

    /**
     * Memastikan direktori ada
     */
    ensureDirectories() {
        Object.values(this.dirs).forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`[Processed] Created directory: ${dir}`);
            }
        });
    }

    /**
     * Memproses video (compress, resize, dll)
     */
    async processVideo(inputPath, options = {}) {
        const {
            outputFormat = 'mp4',
            quality = 'medium',
            resolution = null,
            removeAudio = false,
            fps = 30,
            bitrate = null,
            onProgress = null
        } = options;

        const processId = this.generateProcessId();
        const inputFile = path.basename(inputPath);
        const outputFilename = `processed_${Date.now()}_${processId}.${outputFormat}`;
        const outputPath = path.join(this.dirs.videos, outputFilename);

        try {
            this.activeProcesses.set(processId, {
                id: processId,
                input: inputPath,
                output: outputPath,
                status: 'processing',
                progress: 0,
                type: 'video'
            });

            // Simulasi proses video
            await this.simulateProcessing(processId, onProgress);

            // Copy file dummy untuk simulasi
            fs.copyFileSync(inputPath, outputPath);

            const result = {
                success: true,
                processId,
                inputFile,
                outputFile: outputFilename,
                outputPath,
                size: fs.statSync(outputPath).size,
                format: outputFormat,
                quality,
                resolution: resolution || 'original',
                duration: this.getVideoDuration(inputPath),
                processedAt: new Date().toISOString()
            };

            this.processedFiles.push(result);
            this.activeProcesses.delete(processId);

            return result;

        } catch (error) {
            this.activeProcesses.delete(processId);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Memotong video (clipping)
     */
    async clipVideo(inputPath, options = {}) {
        const {
            startTime = 0,
            endTime = 30,
            outputFormat = 'mp4'
        } = options;

        const processId = this.generateProcessId();
        const inputFile = path.basename(inputPath);
        const outputFilename = `clip_${startTime}s-${endTime}s_${Date.now()}.${outputFormat}`;
        const outputPath = path.join(this.dirs.clips, outputFilename);

        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .setStartTime(startTime)
                .setDuration(endTime - startTime)
                .output(outputPath)
                .on('start', () => {
                    console.log(`[Processed] Clipping started: ${inputFile}`);
                })
                .on('progress', (progress) => {
                    console.log(`[Processed] Clipping progress: ${progress.percent}%`);
                })
                .on('end', () => {
                    resolve({
                        success: true,
                        processId,
                        inputFile,
                        outputFile: outputFilename,
                        outputPath,
                        startTime,
                        endTime,
                        duration: endTime - startTime,
                        size: fs.statSync(outputPath).size
                    });
                })
                .on('error', (err) => {
                    reject({
                        success: false,
                        error: err.message
                    });
                })
                .run();
        });
    }

    /**
     * Menggabungkan beberapa video
     */
    async mergeVideos(videoPaths, options = {}) {
        const {
            outputFormat = 'mp4',
            transition = 'fade'
        } = options;

        const processId = this.generateProcessId();
        const outputFilename = `merged_${Date.now()}_${processId}.${outputFormat}`;
        const outputPath = path.join(this.dirs.merged, outputFilename);

        try {
            // Simulasi merge
            await this.simulateProcessing(processId);

            // Buat file dummy
            fs.writeFileSync(outputPath, `Merged video from ${videoPaths.length} files`);

            return {
                success: true,
                processId,
                inputCount: videoPaths.length,
                outputFile: outputFilename,
                outputPath,
                transition,
                size: fs.statSync(outputPath).size,
                processedAt: new Date().toISOString()
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Menambahkan watermark ke video
     */
    async addWatermark(inputPath, watermarkPath, options = {}) {
        const {
            position = 'bottom-right',
            opacity = 0.7,
            scale = 0.2
        } = options;

        const processId = this.generateProcessId();
        const inputFile = path.basename(inputPath);
        const outputFilename = `watermarked_${Date.now()}_${processId}.mp4`;
        const outputPath = path.join(this.dirs.watermarked, outputFilename);

        try {
            // Simulasi watermark
            await this.simulateProcessing(processId);

            // Copy file dummy
            fs.copyFileSync(inputPath, outputPath);

            return {
                success: true,
                processId,
                inputFile,
                outputFile: outputFilename,
                outputPath,
                position,
                opacity,
                scale,
                size: fs.statSync(outputPath).size
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Mengkonversi format video
     */
    async convertVideo(inputPath, targetFormat, options = {}) {
        const {
            quality = 'medium'
        } = options;

        const processId = this.generateProcessId();
        const inputFile = path.basename(inputPath);
        const outputFilename = `converted_${Date.now()}_${processId}.${targetFormat}`;
        const outputPath = path.join(this.dirs.converted, outputFilename);

        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .outputOptions(this.getConversionOptions(targetFormat, quality))
                .output(outputPath)
                .on('end', () => {
                    resolve({
                        success: true,
                        processId,
                        inputFile,
                        outputFile: outputFilename,
                        outputPath,
                        fromFormat: path.extname(inputPath).substring(1),
                        toFormat: targetFormat,
                        quality,
                        size: fs.statSync(outputPath).size
                    });
                })
                .on('error', (err) => {
                    reject({
                        success: false,
                        error: err.message
                    });
                })
                .run();
        });
    }

    /**
     * Membuat thumbnail dari video
     */
    async generateThumbnail(inputPath, options = {}) {
        const {
            time = '00:00:05',
            width = 1280,
            height = 720
        } = options;

        const processId = this.generateProcessId();
        const inputFile = path.basename(inputPath);
        const outputFilename = `thumb_${Date.now()}_${processId}.jpg`;
        const outputPath = path.join(this.dirs.thumbnails, outputFilename);

        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .screenshots({
                    timestamps: [time],
                    filename: outputFilename,
                    folder: this.dirs.thumbnails,
                    size: `${width}x${height}`
                })
                .on('end', () => {
                    resolve({
                        success: true,
                        processId,
                        inputFile,
                        outputFile: outputFilename,
                        outputPath,
                        timestamp: time,
                        resolution: `${width}x${height}`,
                        size: fs.statSync(outputPath).size
                    });
                })
                .on('error', (err) => {
                    reject({
                        success: false,
                        error: err.message
                    });
                });
        });
    }

    /**
     * Mengekstrak audio dari video
     */
    async extractAudio(inputPath, options = {}) {
        const {
            format = 'mp3',
            bitrate = '128k'
        } = options;

        const processId = this.generateProcessId();
        const inputFile = path.basename(inputPath);
        const outputFilename = `audio_${Date.now()}_${processId}.${format}`;
        const outputPath = path.join(this.dirs.audios, outputFilename);

        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .noVideo()
                .audioBitrate(bitrate)
                .audioCodec(this.getAudioCodec(format))
                .format(format)
                .output(outputPath)
                .on('end', () => {
                    resolve({
                        success: true,
                        processId,
                        inputFile,
                        outputFile: outputFilename,
                        outputPath,
                        format,
                        bitrate,
                        size: fs.statSync(outputPath).size,
                        duration: this.getAudioDuration(outputPath)
                    });
                })
                .on('error', (err) => {
                    reject({
                        success: false,
                        error: err.message
                    });
                })
                .run();
        });
    }

    /**
     * Membuat subtitle dari video (speech to text)
     */
    async generateSubtitles(inputPath, options = {}) {
        const {
            language = 'id',
            format = 'vtt'
        } = options;

        const processId = this.generateProcessId();
        const inputFile = path.basename(inputPath);
        const outputFilename = `sub_${Date.now()}_${processId}.${format}`;
        const outputPath = path.join(this.dirs.subtitles, outputFilename);

        try {
            // Simulasi generate subtitle
            await this.simulateProcessing(processId, null, 10);

            // Buat subtitle dummy
            const subtitleContent = this.generateDummySubtitle(inputPath, language);
            fs.writeFileSync(outputPath, subtitleContent);

            return {
                success: true,
                processId,
                inputFile,
                outputFile: outputFilename,
                outputPath,
                language,
                format,
                wordCount: subtitleContent.split('\n').length,
                size: fs.statSync(outputPath).size
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Mendapatkan daftar file yang sudah diproses
     */
    listProcessedFiles(type = null, days = null) {
        let files = [];

        const scanDir = (dir) => {
            if (!fs.existsSync(dir)) return;
            
            const items = fs.readdirSync(dir);
            items.forEach(item => {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    scanDir(fullPath);
                } else {
                    // Filter berdasarkan waktu jika days ditentukan
                    if (days) {
                        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
                        if (stat.mtimeMs < cutoff) return;
                    }

                    files.push({
                        name: item,
                        path: fullPath,
                        size: stat.size,
                        modified: stat.mtime,
                        created: stat.birthtime,
                        type: path.basename(path.dirname(fullPath))
                    });
                }
            });
        };

        // Scan semua subdirektori
        Object.keys(this.dirs).forEach(key => {
            if (!type || type === key) {
                scanDir(this.dirs[key]);
            }
        });

        // Urutkan berdasarkan modified terbaru
        files.sort((a, b) => b.modified - a.modified);

        return files;
    }

    /**
     * Mendapatkan status proses
     */
    getProcessStatus(processId) {
        if (this.activeProcesses.has(processId)) {
            return this.activeProcesses.get(processId);
        }

        const completed = this.processedFiles.find(p => p.processId === processId);
        if (completed) {
            return {
                ...completed,
                status: 'completed'
            };
        }

        return null;
    }

    /**
     * Membatalkan proses
     */
    cancelProcess(processId) {
        if (this.activeProcesses.has(processId)) {
            this.activeProcesses.delete(processId);
            return { success: true };
        }
        return { success: false, error: 'Process not found' };
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

        Object.values(this.dirs).forEach(cleanupDir);

        return {
            deletedCount,
            freedSpace: this.formatBytes(freedSpace),
            freedSpaceBytes: freedSpace
        };
    }

    /**
     * Mendapatkan statistik storage
     */
    getStorageStats() {
        let totalSize = 0;
        let fileCount = 0;
        let typeStats = {};

        Object.entries(this.dirs).forEach(([type, dir]) => {
            if (!fs.existsSync(dir)) return;
            
            const items = fs.readdirSync(dir);
            items.forEach(item => {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (!stat.isDirectory()) {
                    totalSize += stat.size;
                    fileCount++;
                    typeStats[type] = (typeStats[type] || 0) + 1;
                }
            });
        });

        return {
            totalSize: this.formatBytes(totalSize),
            totalSizeBytes: totalSize,
            fileCount,
            typeStats,
            freeSpace: this.formatBytes(100 * 1024 * 1024 * 1024), // 100GB dummy
            processedPath: this.basePath
        };
    }

    /**
     * Generate unique ID
     */
    generateProcessId() {
        return crypto
            .createHash('md5')
            .update(Date.now().toString() + Math.random())
            .digest('hex')
            .substring(0, 10);
    }

    /**
     * Simulasi proses (untuk development)
     */
    async simulateProcessing(processId, onProgress = null, steps = 5) {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += 100 / steps;
                if (onProgress) onProgress(Math.min(progress, 100));
                
                // Update active process
                if (this.activeProcesses.has(processId)) {
                    this.activeProcesses.get(processId).progress = Math.min(progress, 100);
                }
                
                if (progress >= 100) {
                    clearInterval(interval);
                    resolve();
                }
            }, 1000);
        });
    }

    /**
     * Mendapatkan durasi video
     */
    getVideoDuration(filePath) {
        // Implementasi mendapatkan durasi video
        return Math.floor(Math.random() * 300) + 60; // 1-5 menit dummy
    }

    /**
     * Mendapatkan durasi audio
     */
    getAudioDuration(filePath) {
        return Math.floor(Math.random() * 180) + 30; // 30 detik - 3 menit dummy
    }

    /**
     * Mendapatkan opsi konversi
     */
    getConversionOptions(format, quality) {
        const options = [];
        
        switch(format) {
            case 'mp4':
                options.push('-c:v libx264');
                options.push('-c:a aac');
                break;
            case 'webm':
                options.push('-c:v libvpx-vp9');
                options.push('-c:a libopus');
                break;
            case 'avi':
                options.push('-c:v mpeg4');
                options.push('-c:a mp3');
                break;
        }

        switch(quality) {
            case 'high':
                options.push('-b:v 5M');
                options.push('-b:a 192k');
                break;
            case 'medium':
                options.push('-b:v 2M');
                options.push('-b:a 128k');
                break;
            case 'low':
                options.push('-b:v 1M');
                options.push('-b:a 64k');
                break;
        }

        return options;
    }

    /**
     * Mendapatkan audio codec
     */
    getAudioCodec(format) {
        const codecs = {
            mp3: 'libmp3lame',
            aac: 'aac',
            ogg: 'libvorbis',
            wav: 'pcm_s16le'
        };
        return codecs[format] || 'copy';
    }

    /**
     * Generate dummy subtitle
     */
    generateDummySubtitle(videoPath, language) {
        const lines = [];
        const duration = this.getVideoDuration(videoPath);
        
        for (let i = 0; i < duration; i += 5) {
            const start = this.formatTime(i);
            const end = this.formatTime(i + 5);
            lines.push(`${i/5 + 1}`);
            lines.push(`${start} --> ${end}`);
            lines.push(`[${language}] Subtitle line ${i/5 + 1}`);
            lines.push('');
        }
        
        return lines.join('\n');
    }

    /**
     * Format time untuk subtitle
     */
    formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const ms = 0;
        
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
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
