/**
 * Temporary Files Manager
 * Manages all temporary files during processing
 */

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const Logger = require('../utils/logger');
const EventEmitter = require('events');

class TempManager extends EventEmitter {
    constructor() {
        super();
        this.basePath = path.join(__dirname);
        this.tempFiles = new Map();
        this.cleanupInterval = null;
        
        // Initialize directories
        this.dirs = {
            downloads: path.join(this.basePath, 'downloads'),
            uploads: path.join(this.basePath, 'uploads'),
            processing: path.join(this.basePath, 'processing'),
            chunks: path.join(this.basePath, 'chunks'),
            cache: path.join(this.basePath, 'cache'),
            sessions: path.join(this.basePath, 'sessions'),
            logs: path.join(this.basePath, 'logs')
        };

        this.startAutoCleanup();
    }

    /**
     * Create a new temporary file
     */
    createFile(options = {}) {
        const {
            prefix = 'tmp',
            extension = '.tmp',
            subDir = 'processing',
            content = null
        } = options;

        const id = this.generateId();
        const timestamp = Date.now();
        const filename = `${prefix}_${timestamp}_${id}${extension}`;
        const filePath = path.join(this.dirs[subDir] || this.basePath, filename);

        // Create file
        if (content) {
            fs.writeFileSync(filePath, content);
        } else {
            fs.writeFileSync(filePath, '');
        }

        const fileInfo = {
            id,
            path: filePath,
            filename,
            size: content ? Buffer.byteLength(content) : 0,
            created: new Date().toISOString(),
            lastAccessed: new Date().toISOString(),
            subDir
        };

        this.tempFiles.set(id, fileInfo);

        return fileInfo;
    }

    /**
     * Create a temporary directory
     */
    createDir(options = {}) {
        const {
            prefix = 'tmp_dir',
            subDir = 'processing'
        } = options;

        const id = this.generateId();
        const dirName = `${prefix}_${Date.now()}_${id}`;
        const dirPath = path.join(this.dirs[subDir] || this.basePath, dirName);

        fs.ensureDirSync(dirPath);

        return {
            id,
            path: dirPath,
            name: dirName,
            created: new Date().toISOString()
        };
    }

    /**
     * Write content to temporary file
     */
    writeFile(id, content, options = {}) {
        const {
            append = false,
            encoding = 'utf8'
        } = options;

        const fileInfo = this.tempFiles.get(id);
        if (!fileInfo) {
            throw new Error(`Temp file ${id} not found`);
        }

        if (append) {
            fs.appendFileSync(fileInfo.path, content, { encoding });
        } else {
            fs.writeFileSync(fileInfo.path, content, { encoding });
        }

        const stat = fs.statSync(fileInfo.path);
        fileInfo.size = stat.size;
        fileInfo.lastAccessed = new Date().toISOString();

        return {
            id,
            size: fileInfo.size,
            path: fileInfo.path
        };
    }

    /**
     * Read from temporary file
     */
    readFile(id, options = {}) {
        const {
            encoding = 'utf8',
            start = 0,
            end = null
        } = options;

        const fileInfo = this.tempFiles.get(id);
        if (!fileInfo) {
            throw new Error(`Temp file ${id} not found`);
        }

        fileInfo.lastAccessed = new Date().toISOString();

        if (start > 0 || end) {
            // Partial read
            const fd = fs.openSync(fileInfo.path, 'r');
            const buffer = Buffer.alloc((end || fileInfo.size) - start);
            fs.readSync(fd, buffer, 0, buffer.length, start);
            fs.closeSync(fd);
            return buffer.toString(encoding);
        } else {
            // Full read
            return fs.readFileSync(fileInfo.path, { encoding });
        }
    }

    /**
     * Get file info
     */
    getFile(id) {
        return this.tempFiles.get(id) || null;
    }

    /**
     * Delete temporary file
     */
    deleteFile(id) {
        const fileInfo = this.tempFiles.get(id);
        if (!fileInfo) {
            return { success: false, error: 'File not found' };
        }

        try {
            if (fs.existsSync(fileInfo.path)) {
                fs.unlinkSync(fileInfo.path);
            }
            this.tempFiles.delete(id);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Move temporary file to permanent location
     */
    moveToPermanent(id, destinationPath) {
        const fileInfo = this.tempFiles.get(id);
        if (!fileInfo) {
            throw new Error(`Temp file ${id} not found`);
        }

        // Ensure destination directory exists
        fs.ensureDirSync(path.dirname(destinationPath));

        // Move file
        fs.renameSync(fileInfo.path, destinationPath);
        
        // Remove from tracking
        this.tempFiles.delete(id);

        return {
            success: true,
            permanentPath: destinationPath,
            size: fileInfo.size
        };
    }

    /**
     * Create a chunk for large file upload
     */
    createChunk(uploadId, chunkIndex, data) {
        const chunkDir = path.join(this.dirs.chunks, uploadId);
        fs.ensureDirSync(chunkDir);

        const chunkFile = path.join(chunkDir, `chunk_${chunkIndex.toString().padStart(6, '0')}`);
        fs.writeFileSync(chunkFile, data);

        return {
            uploadId,
            chunkIndex,
            path: chunkFile,
            size: Buffer.byteLength(data)
        };
    }

    /**
     * Merge chunks into final file
     */
    mergeChunks(uploadId, totalChunks, destinationPath) {
        const chunkDir = path.join(this.dirs.chunks, uploadId);
        
        if (!fs.existsSync(chunkDir)) {
            throw new Error(`Chunk directory for ${uploadId} not found`);
        }

        // Ensure destination directory exists
        fs.ensureDirSync(path.dirname(destinationPath));

        // Merge chunks
        const writeStream = fs.createWriteStream(destinationPath);
        
        for (let i = 0; i < totalChunks; i++) {
            const chunkFile = path.join(chunkDir, `chunk_${i.toString().padStart(6, '0')}`);
            const chunkData = fs.readFileSync(chunkFile);
            writeStream.write(chunkData);
        }

        writeStream.end();

        // Clean up chunks
        fs.removeSync(chunkDir);

        return {
            success: true,
            path: destinationPath,
            size: fs.statSync(destinationPath).size
        };
    }

    /**
     * Clean up old temporary files
     */
    cleanup(maxAge = 3600000) { // Default 1 hour
        const now = Date.now();
        let deletedCount = 0;
        let freedSpace = 0;

        // Clean tracked files
        for (const [id, file] of this.tempFiles) {
            const age = now - new Date(file.lastAccessed).getTime();
            if (age > maxAge) {
                if (fs.existsSync(file.path)) {
                    const stat = fs.statSync(file.path);
                    freedSpace += stat.size;
                    fs.unlinkSync(file.path);
                    deletedCount++;
                }
                this.tempFiles.delete(id);
            }
        }

        // Clean untracked files in all directories
        Object.values(this.dirs).forEach(dir => {
            if (fs.existsSync(dir)) {
                const items = fs.readdirSync(dir);
                items.forEach(item => {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);
                    
                    if (stat.isDirectory()) {
                        // Skip chunk directories (handled separately)
                        if (item !== 'chunks') {
                            this.cleanupDirectory(fullPath, maxAge);
                        }
                    } else {
                        const age = now - stat.mtimeMs;
                        if (age > maxAge) {
                            freedSpace += stat.size;
                            fs.unlinkSync(fullPath);
                            deletedCount++;
                        }
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
     * Clean up a directory recursively
     */
    cleanupDirectory(dirPath, maxAge) {
        if (!fs.existsSync(dirPath)) return;

        const now = Date.now();
        const items = fs.readdirSync(dirPath);
        
        items.forEach(item => {
            const fullPath = path.join(dirPath, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                this.cleanupDirectory(fullPath, maxAge);
                
                // Remove empty directories
                if (fs.readdirSync(fullPath).length === 0) {
                    fs.rmdirSync(fullPath);
                }
            } else {
                const age = now - stat.mtimeMs;
                if (age > maxAge) {
                    fs.unlinkSync(fullPath);
                }
            }
        });
    }

    /**
     * Start auto cleanup interval
     */
    startAutoCleanup(interval = 3600000) { // Default 1 hour
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        this.cleanupInterval = setInterval(() => {
            const result = this.cleanup();
            Logger.debug(`Auto cleanup completed: ${result.deletedCount} files removed, ${result.freedSpace} freed`);
        }, interval);
    }

    /**
     * Stop auto cleanup
     */
    stopAutoCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
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
                const stats = this.getDirectoryStats(dir);
                typeStats[type] = stats.fileCount;
                totalSize += stats.totalSize;
                fileCount += stats.fileCount;
            }
        });

        return {
            totalSize: this.formatBytes(totalSize),
            totalSizeBytes: totalSize,
            fileCount,
            typeStats,
            trackedFiles: this.tempFiles.size
        };
    }

    /**
     * Get directory statistics
     */
    getDirectoryStats(dir) {
        let totalSize = 0;
        let fileCount = 0;

        if (!fs.existsSync(dir)) return { totalSize, fileCount };

        const items = fs.readdirSync(dir);
        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                const subStats = this.getDirectoryStats(fullPath);
                totalSize += subStats.totalSize;
                fileCount += subStats.fileCount;
            } else {
                totalSize += stat.size;
                fileCount++;
            }
        });

        return { totalSize, fileCount };
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

    /**
     * Destroy instance
     */
    destroy() {
        this.stopAutoCleanup();
        this.cleanup(0); // Remove all files
    }
}

module.exports = new TempManager();
