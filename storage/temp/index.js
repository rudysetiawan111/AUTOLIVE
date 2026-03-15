/**
 * Temporary Files Manager
 * Mengelola file temporary selama proses download/upload/processing
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

class TempManager {
    constructor() {
        this.basePath = path.join(__dirname, '../temp');
        this.systemTemp = os.tmpdir();
        
        // Subdirectories
        this.dirs = {
            downloads: path.join(this.basePath, 'downloads'),
            uploads: path.join(this.basePath, 'uploads'),
            processing: path.join(this.basePath, 'processing'),
            chunks: path.join(this.basePath, 'chunks'),
            cache: path.join(this.basePath, 'cache'),
            sessions: path.join(this.basePath, 'sessions'),
            logs: path.join(this.basePath, 'logs')
        };

        this.ensureDirectories();
        
        // Track temporary files
        this.tempFiles = new Map();
        this.cleanupInterval = null;
        
        // Start auto cleanup
        this.startAutoCleanup();
    }

    /**
     * Memastikan direktori ada
     */
    ensureDirectories() {
        Object.values(this.dirs).forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`[Temp] Created directory: ${dir}`);
            }
        });
    }

    /**
     * Membuat file temporary baru
     */
    createTempFile(options = {}) {
        const {
            prefix = 'tmp',
            suffix = '',
            extension = '.tmp',
            subDir = 'processing',
            content = null
        } = options;

        const tempId = this.generateTempId();
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex');
        
        const filename = `${prefix}_${timestamp}_${random}_${tempId}${extension}`;
        const filePath = path.join(this.dirs[subDir] || this.basePath, filename);

        // Buat file kosong atau dengan content
        if (content) {
            fs.writeFileSync(filePath, content);
        } else {
            fs.writeFileSync(filePath, '');
        }

        // Track file
        this.tempFiles.set(tempId, {
            id: tempId,
            path: filePath,
            filename,
            size: content ? Buffer.byteLength(content) : 0,
            created: new Date().toISOString(),
            lastAccessed: new Date().toISOString(),
            subDir
        });

        return {
            id: tempId,
            path: filePath,
            filename,
            size: content ? Buffer.byteLength(content) : 0
        };
    }

    /**
     * Membuat direktori temporary
     */
    createTempDir(options = {}) {
        const {
            prefix = 'tmp_dir',
            subDir = 'processing'
        } = options;

        const dirId = this.generateTempId();
        const timestamp = Date.now();
        const dirName = `${prefix}_${timestamp}_${dirId}`;
        const dirPath = path.join(this.dirs[subDir] || this.basePath, dirName);

        fs.mkdirSync(dirPath, { recursive: true });

        return {
            id: dirId,
            path: dirPath,
            name: dirName,
            created: new Date().toISOString()
        };
    }

    /**
     * Menulis konten ke file temporary
     */
    writeTempFile(tempId, content, options = {}) {
        const {
            append = false,
            encoding = 'utf8'
        } = options;

        const tempFile = this.tempFiles.get(tempId);
        if (!tempFile) {
            throw new Error(`Temp file ${tempId} not found`);
        }

        if (append) {
            fs.appendFileSync(tempFile.path, content, { encoding });
        } else {
            fs.writeFileSync(tempFile.path, content, { encoding });
        }

        // Update size dan last accessed
        const stat = fs.statSync(tempFile.path);
        tempFile.size = stat.size;
        tempFile.lastAccessed = new Date().toISOString();

        return {
            id: tempId,
            size: tempFile.size,
            path: tempFile.path
        };
    }

    /**
     * Membaca file temporary
     */
    readTempFile(tempId, options = {}) {
        const {
            encoding = 'utf8',
            start = 0,
            end = null
        } = options;

        const tempFile = this.tempFiles.get(tempId);
        if (!tempFile) {
            throw new Error(`Temp file ${tempId} not found`);
        }

        tempFile.lastAccessed = new Date().toISOString();

        if (start > 0 || end) {
            // Baca sebagian file
            const fd = fs.openSync(tempFile.path, 'r');
            const buffer = Buffer.alloc((end || tempFile.size) - start);
            fs.readSync(fd, buffer, 0, buffer.length, start);
            fs.closeSync(fd);
            return buffer.toString(encoding);
        } else {
            // Baca seluruh file
            return fs.readFileSync(tempFile.path, { encoding });
        }
    }

    /**
     * Mendapatkan informasi file temporary
     */
    getTempFileInfo(tempId) {
        return this.tempFiles.get(tempId) || null;
    }

    /**
     * Menghapus file temporary
     */
    deleteTempFile(tempId) {
        const tempFile = this.tempFiles.get(tempId);
        if (!tempFile) {
            return { success: false, error: 'File not found' };
        }

        try {
            if (fs.existsSync(tempFile.path)) {
                fs.unlinkSync(tempFile.path);
            }
            this.tempFiles.delete(tempId);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Menghapus direktori temporary
     */
    deleteTempDir(dirPath) {
        try {
            if (fs.existsSync(dirPath)) {
                fs.rmdirSync(dirPath, { recursive: true });
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Memindahkan file temporary ke lokasi permanen
     */
    moveToPermanent(tempId, destinationPath) {
        const tempFile = this.tempFiles.get(tempId);
        if (!tempFile) {
            throw new Error(`Temp file ${tempId} not found`);
        }

        // Pastikan direktori tujuan ada
        const destDir = path.dirname(destinationPath);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        // Pindahkan file
        fs.renameSync(tempFile.path, destinationPath);
        
        // Hapus dari tracking
        this.tempFiles.delete(tempId);

        return {
            success: true,
            permanentPath: destinationPath,
            size: tempFile.size
        };
    }

    /**
     * Menyalin file ke temporary
     */
    copyToTemp(sourcePath, options = {}) {
        const {
            prefix = 'copy',
            subDir = 'processing'
        } = options;

        const tempFile = this.createTempFile({
            prefix,
            extension: path.extname(sourcePath),
            subDir
        });

        fs.copyFileSync(sourcePath, tempFile.path);

        return tempFile;
    }

    /**
     * Membuat file chunk untuk upload besar
     */
    createChunk(uploadId, chunkIndex, data, options = {}) {
        const chunkDir = path.join(this.dirs.chunks, uploadId);
        
        if (!fs.existsSync(chunkDir)) {
            fs.mkdirSync(chunkDir, { recursive: true });
        }

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
     * Menggabungkan chunks
     */
    mergeChunks(uploadId, totalChunks, destinationPath) {
        const chunkDir = path.join(this.dirs.chunks, uploadId);
        
        if (!fs.existsSync(chunkDir)) {
            throw new Error(`Chunk directory for ${uploadId} not found`);
        }

        // Pastikan direktori tujuan ada
        const destDir = path.dirname(destinationPath);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        // Gabungkan chunks
        const writeStream = fs.createWriteStream(destinationPath);
        
        for (let i = 0; i < totalChunks; i++) {
            const chunkFile = path.join(chunkDir, `chunk_${i.toString().padStart(6, '0')}`);
            const chunkData = fs.readFileSync(chunkFile);
            writeStream.write(chunkData);
        }

        writeStream.end();

        // Bersihkan chunk directory
        fs.rmdirSync(chunkDir, { recursive: true });

        return {
            success: true,
            path: destinationPath,
            size: fs.statSync(destinationPath).size
        };
    }

    /**
     * Membersihkan file lama secara manual
     */
    cleanup(maxAge = 3600000) { // default 1 jam
        const now = Date.now();
        let deletedCount = 0;
        let freedSpace = 0;

        // Bersihkan tracked files
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

        // Bersihkan untracked files di semua subdir
        Object.values(this.dirs).forEach(dir => {
            if (!fs.existsSync(dir)) return;
            
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
        });

        return {
            deletedCount,
            freedSpace: this.formatBytes(freedSpace),
            freedSpaceBytes: freedSpace
        };
    }

    /**
     * Membersihkan direktori
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
                
                // Hapus folder jika kosong
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
     * Memulai auto cleanup interval
     */
    startAutoCleanup(interval = 3600000) { // default 1 jam
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        this.cleanupInterval = setInterval(() => {
            console.log('[Temp] Running auto cleanup...');
            const result = this.cleanup();
            console.log(`[Temp] Cleaned ${result.deletedCount} files (${result.freedSpace})`);
        }, interval);
    }

    /**
     * Menghentikan auto cleanup
     */
    stopAutoCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    /**
     * Mendapatkan statistik temporary storage
     */
    getStorageStats() {
        let totalSize = 0;
        let fileCount = 0;
        let trackedCount = this.tempFiles.size;

        const scanDir = (dir) => {
            if (!fs.existsSync(dir)) return;
            
            const items = fs.readdirSync(dir);
            items.forEach(item => {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    scanDir(fullPath);
                } else {
                    totalSize += stat.size;
                    fileCount++;
                }
            });
        };

        Object.values(this.dirs).forEach(scanDir);

        return {
            totalSize: this.formatBytes(totalSize),
            totalSizeBytes: totalSize,
            fileCount,
            trackedFiles: trackedCount,
            tempPath: this.basePath,
            systemTemp: this.systemTemp,
            freeSpace: this.formatBytes(50 * 1024 * 1024 * 1024) // 50GB dummy
        };
    }

    /**
     * Generate unique ID
     */
    generateTempId() {
        return crypto
            .createHash('md5')
            .update(Date.now().toString() + Math.random())
            .digest('hex')
            .substring(0, 8);
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
        this.cleanup(0); // Hapus semua
    }
}

module.exports = new TempManager();
