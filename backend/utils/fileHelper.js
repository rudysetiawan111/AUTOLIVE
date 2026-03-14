const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const mime = require('mime-types');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);
const archiver = require('archiver');
const unzipper = require('unzipper');
const { createGzip, createGunzip } = require('zlib');

class FileHelper {
  constructor() {
    this.basePath = path.join(__dirname, '../../storage');
    this.downloadsPath = path.join(this.basePath, 'downloads');
    this.processedPath = path.join(this.basePath, 'processed');
    this.uploadsPath = path.join(this.basePath, 'uploads');
    this.tempPath = path.join(this.basePath, 'temp');
    this.reportsPath = path.join(this.basePath, 'reports');
    
    this.ensureDirectories();
  }

  // ==================== INITIALIZATION ====================

  ensureDirectories() {
    const dirs = [
      this.basePath,
      this.downloadsPath,
      this.processedPath,
      this.uploadsPath,
      this.tempPath,
      this.reportsPath
    ];
    
    dirs.forEach(dir => fs.ensureDirSync(dir));
  }

  // ==================== FILE OPERATIONS ====================

  // Generate unique filename
  generateFileName(originalName, prefix = '') {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext)
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '_');
    
    return `${prefix}${baseName}_${timestamp}_${random}${ext}`;
  }

  // Generate unique directory name
  generateDirName(prefix = 'dir') {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `${prefix}_${timestamp}_${random}`;
  }

  // Get file info
  async getFileInfo(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const mimeType = mime.lookup(filePath) || 'application/octet-stream';
      
      return {
        path: filePath,
        name: path.basename(filePath),
        extension: path.extname(filePath),
        size: stats.size,
        sizeFormatted: this.formatBytes(stats.size),
        mimeType,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        permissions: stats.mode,
        uid: stats.uid,
        gid: stats.gid
      };
    } catch (error) {
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }

  // Format bytes to human readable
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    if (!bytes || isNaN(bytes)) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // Parse formatted bytes back to number
  parseBytes(formatted) {
    if (typeof formatted === 'number') return formatted;
    
    const units = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024
    };

    const match = formatted.match(/^([\d.]+)\s*(B|KB|MB|GB|TB)$/i);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    return value * units[unit];
  }

  // Safe file write
  async safeWriteFile(filePath, data, options = {}) {
    const tempPath = filePath + '.tmp';
    
    try {
      // Ensure directory exists
      await fs.ensureDir(path.dirname(filePath));
      
      // Write to temp file first
      if (Buffer.isBuffer(data) || typeof data === 'string') {
        await fs.writeFile(tempPath, data, options);
      } else if (data instanceof stream.Readable) {
        await pipeline(data, fs.createWriteStream(tempPath));
      } else {
        await fs.writeFile(tempPath, JSON.stringify(data, null, 2), options);
      }
      
      // Rename temp to actual file (atomic operation)
      await fs.rename(tempPath, filePath);
      
      return {
        success: true,
        path: filePath,
        size: (await fs.stat(filePath)).size
      };
    } catch (error) {
      // Clean up temp file if it exists
      if (await fs.pathExists(tempPath)) {
        await fs.remove(tempPath).catch(() => {});
      }
      throw new Error(`Failed to write file: ${error.message}`);
    }
  }

  // Safe file read
  async safeReadFile(filePath, options = {}) {
    try {
      if (!await fs.pathExists(filePath)) {
        throw new Error('File not found');
      }
      
      const { encoding = null, json = false } = options;
      
      const data = await fs.readFile(filePath, { encoding });
      
      if (json) {
        return JSON.parse(data);
      }
      
      return data;
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  // Safe file delete
  async safeDelete(filePath) {
    try {
      if (await fs.pathExists(filePath)) {
        const stats = await fs.stat(filePath);
        await fs.remove(filePath);
        return {
          success: true,
          path: filePath,
          size: stats.size,
          wasFile: stats.isFile(),
          wasDirectory: stats.isDirectory()
        };
      }
      return {
        success: false,
        path: filePath,
        error: 'File not found'
      };
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  // Safe file move
  async safeMove(sourcePath, destPath, options = {}) {
    try {
      if (!await fs.pathExists(sourcePath)) {
        throw new Error('Source file not found');
      }
      
      await fs.ensureDir(path.dirname(destPath));
      await fs.move(sourcePath, destPath, { overwrite: options.overwrite || true });
      
      return {
        success: true,
        source: sourcePath,
        destination: destPath,
        size: (await fs.stat(destPath)).size
      };
    } catch (error) {
      throw new Error(`Failed to move file: ${error.message}`);
    }
  }

  // Safe file copy
  async safeCopy(sourcePath, destPath, options = {}) {
    try {
      if (!await fs.pathExists(sourcePath)) {
        throw new Error('Source file not found');
      }
      
      await fs.ensureDir(path.dirname(destPath));
      await fs.copy(sourcePath, destPath, { overwrite: options.overwrite || true });
      
      return {
        success: true,
        source: sourcePath,
        destination: destPath,
        size: (await fs.stat(destPath)).size
      };
    } catch (error) {
      throw new Error(`Failed to copy file: ${error.message}`);
    }
  }

  // ==================== DIRECTORY OPERATIONS ====================

  // Create directory recursively
  async ensureDirectory(dirPath) {
    try {
      await fs.ensureDir(dirPath);
      return {
        success: true,
        path: dirPath,
        exists: await fs.pathExists(dirPath)
      };
    } catch (error) {
      throw new Error(`Failed to create directory: ${error.message}`);
    }
  }

  // List files in directory
  async listFiles(dirPath, pattern = null, recursive = false) {
    try {
      if (!await fs.pathExists(dirPath)) {
        return [];
      }

      const files = [];
      
      const walk = async (currentPath) => {
        const items = await fs.readdir(currentPath);
        
        for (const item of items) {
          const itemPath = path.join(currentPath, item);
          const stats = await fs.stat(itemPath);
          
          if (stats.isFile()) {
            if (!pattern || pattern.test(item)) {
              files.push({
                name: item,
                path: itemPath,
                relativePath: path.relative(dirPath, itemPath),
                size: stats.size,
                sizeFormatted: this.formatBytes(stats.size),
                modified: stats.mtime,
                created: stats.birthtime,
                extension: path.extname(item)
              });
            }
          } else if (stats.isDirectory() && recursive) {
            await walk(itemPath);
          }
        }
      };
      
      await walk(dirPath);
      
      // Sort by name
      files.sort((a, b) => a.name.localeCompare(b.name));
      
      return files;
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  // List directories
  async listDirectories(dirPath, recursive = false) {
    try {
      if (!await fs.pathExists(dirPath)) {
        return [];
      }

      const directories = [];
      
      const walk = async (currentPath) => {
        const items = await fs.readdir(currentPath);
        
        for (const item of items) {
          const itemPath = path.join(currentPath, item);
          const stats = await fs.stat(itemPath);
          
          if (stats.isDirectory()) {
            directories.push({
              name: item,
              path: itemPath,
              relativePath: path.relative(dirPath, itemPath),
              modified: stats.mtime,
              created: stats.birthtime,
              itemCount: (await fs.readdir(itemPath)).length
            });
            
            if (recursive) {
              await walk(itemPath);
            }
          }
        }
      };
      
      await walk(dirPath);
      
      return directories;
    } catch (error) {
      throw new Error(`Failed to list directories: ${error.message}`);
    }
  }

  // Get directory size
  async getDirectorySize(dirPath) {
    try {
      let totalSize = 0;
      let fileCount = 0;
      let dirCount = 0;
      
      const walk = async (currentPath) => {
        const items = await fs.readdir(currentPath);
        
        for (const item of items) {
          const itemPath = path.join(currentPath, item);
          const stats = await fs.stat(itemPath);
          
          if (stats.isFile()) {
            totalSize += stats.size;
            fileCount++;
          } else if (stats.isDirectory()) {
            dirCount++;
            await walk(itemPath);
          }
        }
      };
      
      await walk(dirPath);
      
      return {
        size: totalSize,
        sizeFormatted: this.formatBytes(totalSize),
        files: fileCount,
        directories: dirCount,
        path: dirPath
      };
    } catch (error) {
      throw new Error(`Failed to get directory size: ${error.message}`);
    }
  }

  // ==================== TEMP FILE OPERATIONS ====================

  // Create temp file
  async createTempFile(data = null, extension = '.tmp', prefix = 'temp') {
    const fileName = `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${extension}`;
    const filePath = path.join(this.tempPath, fileName);
    
    if (data) {
      if (Buffer.isBuffer(data) || typeof data === 'string') {
        await fs.writeFile(filePath, data);
      } else {
        await fs.writeFile(filePath, JSON.stringify(data));
      }
    } else {
      await fs.ensureFile(filePath);
    }
    
    return {
      path: filePath,
      name: fileName,
      size: data ? Buffer.byteLength(data) : 0
    };
  }

  // Create temp directory
  async createTempDirectory(prefix = 'temp') {
    const dirName = this.generateDirName(prefix);
    const dirPath = path.join(this.tempPath, dirName);
    
    await fs.ensureDir(dirPath);
    
    return {
      path: dirPath,
      name: dirName
    };
  }

  // Clean temp files older than age
  async cleanTempFiles(olderThanHours = 24) {
    try {
      const files = await fs.readdir(this.tempPath);
      const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
      let deletedCount = 0;
      let freedSpace = 0;

      for (const file of files) {
        const filePath = path.join(this.tempPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtimeMs < cutoffTime) {
          freedSpace += stats.size;
          await fs.remove(filePath);
          deletedCount++;
        }
      }

      return {
        deletedCount,
        freedSpace,
        freedSpaceFormatted: this.formatBytes(freedSpace)
      };
    } catch (error) {
      throw new Error(`Failed to clean temp files: ${error.message}`);
    }
  }

  // ==================== FILE HASHING ====================

  // Get file hash
  async getFileHash(filePath, algorithm = 'sha256') {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash(algorithm);
      const stream = fs.createReadStream(filePath);

      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  // Get multiple file hashes
  async getFileHashes(filePaths, algorithm = 'sha256') {
    const hashes = {};
    
    for (const filePath of filePaths) {
      hashes[filePath] = await this.getFileHash(filePath, algorithm);
    }
    
    return hashes;
  }

  // Check if files are identical
  async areFilesIdentical(filePath1, filePath2) {
    const hash1 = await this.getFileHash(filePath1);
    const hash2 = await this.getFileHash(filePath2);
    
    return hash1 === hash2;
  }

  // ==================== FILE TYPE CHECKING ====================

  // Check if file is video
  async isVideoFile(filePath) {
    const mimeType = mime.lookup(filePath);
    return mimeType && mimeType.startsWith('video/');
  }

  // Check if file is image
  async isImageFile(filePath) {
    const mimeType = mime.lookup(filePath);
    return mimeType && mimeType.startsWith('image/');
  }

  // Check if file is audio
  async isAudioFile(filePath) {
    const mimeType = mime.lookup(filePath);
    return mimeType && mimeType.startsWith('audio/');
  }

  // Check if file is text
  async isTextFile(filePath) {
    const mimeType = mime.lookup(filePath);
    return mimeType && mimeType.startsWith('text/');
  }

  // Check if file is archive
  async isArchiveFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const archiveExts = ['.zip', '.tar', '.gz', '.bz2', '.7z', '.rar'];
    return archiveExts.includes(ext);
  }

  // Check if file is subtitle
  async isSubtitleFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const subtitleExts = ['.srt', '.vtt', '.ass', '.ssa', '.sub'];
    return subtitleExts.includes(ext);
  }

  // ==================== FILE SPLITTING/MERGING ====================

  // Split file into chunks
  async splitFile(filePath, chunkSizeMB = 5) {
    const chunkSize = chunkSizeMB * 1024 * 1024;
    const chunks = [];
    
    const fileInfo = await this.getFileInfo(filePath);
    const totalChunks = Math.ceil(fileInfo.size / chunkSize);

    const fileStream = fs.createReadStream(filePath, {
      highWaterMark: chunkSize
    });

    let chunkIndex = 0;
    for await (const chunk of fileStream) {
      const chunkFile = await this.createTempFile(
        chunk, 
        `.part${chunkIndex}`, 
        `split_${path.basename(filePath)}`
      );
      
      chunks.push({
        index: chunkIndex,
        path: chunkFile.path,
        size: chunk.length,
        sizeFormatted: this.formatBytes(chunk.length)
      });
      
      chunkIndex++;
    }

    return {
      chunks,
      totalChunks,
      originalFile: fileInfo,
      chunkSize,
      chunkSizeFormatted: this.formatBytes(chunkSize)
    };
  }

  // Merge file chunks
  async mergeChunks(chunks, outputFileName = null) {
    // Sort chunks by index
    const sortedChunks = chunks.sort((a, b) => a.index - b.index);
    
    // Generate output path
    if (!outputFileName) {
      outputFileName = `merged_${Date.now()}.bin`;
    }
    const outputPath = path.join(this.processedPath, outputFileName);
    
    const writeStream = fs.createWriteStream(outputPath);
    let totalSize = 0;

    for (const chunk of sortedChunks) {
      const data = await fs.readFile(chunk.path);
      writeStream.write(data);
      totalSize += data.length;
      
      // Clean up chunk file
      await fs.remove(chunk.path).catch(() => {});
    }

    return new Promise((resolve, reject) => {
      writeStream.end();
      writeStream.on('finish', async () => {
        resolve({
          success: true,
          path: outputPath,
          size: totalSize,
          sizeFormatted: this.formatBytes(totalSize),
          chunks: sortedChunks.length
        });
      });
      writeStream.on('error', reject);
    });
  }

  // ==================== COMPRESSION/ARCHIVE ====================

  // Create zip archive
  async createZip(files, outputFileName = null) {
    if (!outputFileName) {
      outputFileName = `archive_${Date.now()}.zip`;
    }
    const outputPath = path.join(this.processedPath, outputFileName);
    
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    return new Promise((resolve, reject) => {
      output.on('close', async () => {
        resolve({
          success: true,
          path: outputPath,
          size: archive.pointer(),
          sizeFormatted: this.formatBytes(archive.pointer()),
          files: files.length
        });
      });

      archive.on('error', reject);

      archive.pipe(output);

      // Add files to archive
      files.forEach(file => {
        if (typeof file === 'string') {
          // File path
          archive.file(file, { name: path.basename(file) });
        } else {
          // File object with name and path
          archive.file(file.path, { name: file.name || path.basename(file.path) });
        }
      });

      archive.finalize();
    });
  }

  // Extract zip archive
  async extractZip(zipPath, outputPath = null) {
    if (!outputPath) {
      outputPath = path.join(
        this.processedPath,
        `extracted_${path.basename(zipPath, '.zip')}_${Date.now()}`
      );
    }
    
    await fs.ensureDir(outputPath);

    return new Promise((resolve, reject) => {
      fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: outputPath }))
        .on('close', async () => {
          const files = await this.listFiles(outputPath, null, true);
          resolve({
            success: true,
            path: outputPath,
            files: files.length,
            extractedFiles: files
          });
        })
        .on('error', reject);
    });
  }

  // Compress file with gzip
  async compressGzip(inputPath, outputPath = null) {
    if (!outputPath) {
      outputPath = inputPath + '.gz';
    }

    return new Promise((resolve, reject) => {
      const gzip = createGzip();
      const source = fs.createReadStream(inputPath);
      const destination = fs.createWriteStream(outputPath);

      source
        .pipe(gzip)
        .pipe(destination)
        .on('finish', async () => {
          const originalSize = (await fs.stat(inputPath)).size;
          const compressedSize = (await fs.stat(outputPath)).size;
          
          resolve({
            success: true,
            path: outputPath,
            originalSize,
            originalSizeFormatted: this.formatBytes(originalSize),
            compressedSize,
            compressedSizeFormatted: this.formatBytes(compressedSize),
            ratio: ((compressedSize / originalSize) * 100).toFixed(2) + '%'
          });
        })
        .on('error', reject);
    });
  }

  // Decompress gzip file
  async decompressGzip(inputPath, outputPath = null) {
    if (!outputPath) {
      outputPath = inputPath.replace(/\.gz$/, '');
    }

    return new Promise((resolve, reject) => {
      const gunzip = createGunzip();
      const source = fs.createReadStream(inputPath);
      const destination = fs.createWriteStream(outputPath);

      source
        .pipe(gunzip)
        .pipe(destination)
        .on('finish', async () => {
          resolve({
            success: true,
            path: outputPath,
            size: (await fs.stat(outputPath)).size,
            sizeFormatted: this.formatBytes((await fs.stat(outputPath)).size)
          });
        })
        .on('error', reject);
    });
  }

  // ==================== FILE WATCHING ====================

  // Watch file for changes
  watchFile(filePath, callback) {
    let timeoutId = null;
    
    const watcher = fs.watch(filePath, (eventType, filename) => {
      if (eventType === 'change') {
        // Debounce multiple rapid changes
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          callback({
            type: 'change',
            file: filename,
            path: filePath,
            timestamp: new Date()
          });
        }, 500);
      }
    });

    return {
      close: () => watcher.close()
    };
  }

  // Watch directory for changes
  watchDirectory(dirPath, callback, options = {}) {
    const { recursive = true } = options;
    
    const watcher = fs.watch(dirPath, { recursive }, (eventType, filename) => {
      callback({
        type: eventType,
        file: filename,
        path: path.join(dirPath, filename),
        timestamp: new Date()
      });
    });

    return {
      close: () => watcher.close()
    };
  }

  // ==================== FILE UTILITIES ====================

  // Check if path exists
  async pathExists(filePath) {
    return await fs.pathExists(filePath);
  }

  // Get file stats
  async getStats(filePath) {
    try {
      return await fs.stat(filePath);
    } catch (error) {
      return null;
    }
  }

  // Touch file (update timestamp)
  async touch(filePath) {
    const time = new Date();
    await fs.utimes(filePath, time, time);
    return true;
  }

  // Chmod file
  async chmod(filePath, mode) {
    await fs.chmod(filePath, mode);
    return true;
  }

  // Create symbolic link
  async symlink(target, path) {
    await fs.symlink(target, path);
    return true;
  }

  // Read symbolic link
  async readlink(path) {
    return await fs.readlink(path);
  }

  // Get real path
  async realpath(path) {
    return await fs.realpath(path);
  }

  // ==================== BATCH OPERATIONS ====================

  // Batch delete files
  async batchDelete(filePaths) {
    const results = {
      success: [],
      failed: []
    };

    for (const filePath of filePaths) {
      try {
        const result = await this.safeDelete(filePath);
        results.success.push(result);
      } catch (error) {
        results.failed.push({
          path: filePath,
          error: error.message
        });
      }
    }

    return results;
  }

  // Batch copy files
  async batchCopy(fileMappings) {
    const results = {
      success: [],
      failed: []
    };

    for (const mapping of fileMappings) {
      try {
        const result = await this.safeCopy(mapping.source, mapping.destination);
        results.success.push(result);
      } catch (error) {
        results.failed.push({
          source: mapping.source,
          destination: mapping.destination,
          error: error.message
        });
      }
    }

    return results;
  }

  // Batch move files
  async batchMove(fileMappings) {
    const results = {
      success: [],
      failed: []
    };

    for (const mapping of fileMappings) {
      try {
        const result = await this.safeMove(mapping.source, mapping.destination);
        results.success.push(result);
      } catch (error) {
        results.failed.push({
          source: mapping.source,
          destination: mapping.destination,
          error: error.message
        });
      }
    }

    return results;
  }

  // ==================== FILE VALIDATION ====================

  // Validate file integrity
  async validateFileIntegrity(filePath, expectedHash = null, algorithm = 'sha256') {
    try {
      const stats = await fs.stat(filePath);
      
      const result = {
        exists: true,
        size: stats.size,
        sizeFormatted: this.formatBytes(stats.size),
        isReadable: true,
        hash: null,
        hashValid: null
      };

      // Check if file is readable
      try {
        await fs.access(filePath, fs.constants.R_OK);
      } catch {
        result.isReadable = false;
      }

      // Calculate hash if expected
      if (expectedHash) {
        result.hash = await this.getFileHash(filePath, algorithm);
        result.hashValid = result.hash === expectedHash;
      }

      return result;
    } catch (error) {
      return {
        exists: false,
        error: error.message
      };
    }
  }

  // Validate directory integrity
  async validateDirectoryIntegrity(dirPath) {
    try {
      const stats = await fs.stat(dirPath);
      
      return {
        exists: true,
        isDirectory: stats.isDirectory(),
        size: stats.size,
        sizeFormatted: this.formatBytes(stats.size),
        readable: true,
        writable: true
      };
    } catch (error) {
      return {
        exists: false,
        error: error.message
      };
    }
  }

  // ==================== FILE CONVERSION ====================

  // Convert file to base64
  async fileToBase64(filePath) {
    const data = await fs.readFile(filePath);
    return data.toString('base64');
  }

  // Convert base64 to file
  async base64ToFile(base64, outputPath) {
    const data = Buffer.from(base64, 'base64');
    await this.safeWriteFile(outputPath, data);
    return outputPath;
  }

  // Convert file to data URL
  async fileToDataURL(filePath) {
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';
    const base64 = await this.fileToBase64(filePath);
    return `data:${mimeType};base64,${base64}`;
  }

  // ==================== STORAGE MANAGEMENT ====================

  // Get storage usage
  async getStorageUsage() {
    const downloads = await this.getDirectorySize(this.downloadsPath);
    const processed = await this.getDirectorySize(this.processedPath);
    const uploads = await this.getDirectorySize(this.uploadsPath);
    const temp = await this.getDirectorySize(this.tempPath);
    const reports = await this.getDirectorySize(this.reportsPath);

    const total = {
      size: downloads.size + processed.size + uploads.size + temp.size + reports.size,
      files: downloads.files + processed.files + uploads.files + temp.files + reports.files,
      directories: downloads.directories + processed.directories + uploads.directories + 
                   temp.directories + reports.directories
    };

    return {
      downloads,
      processed,
      uploads,
      temp,
      reports,
      total: {
        ...total,
        sizeFormatted: this.formatBytes(total.size)
      }
    };
  }

  // Cleanup old files
  async cleanup(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const results = {
      deleted: [],
      errors: []
    };

    const walk = async (dirPath) => {
      const files = await fs.readdir(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile() && stats.mtime < cutoffDate) {
          try {
            await fs.remove(filePath);
            results.deleted.push({
              path: filePath,
              size: stats.size,
              sizeFormatted: this.formatBytes(stats.size),
              modified: stats.mtime
            });
          } catch (error) {
            results.errors.push({
              path: filePath,
              error: error.message
            });
          }
        } else if (stats.isDirectory()) {
          await walk(filePath);
          
          // Remove empty directory
          const remaining = await fs.readdir(filePath);
          if (remaining.length === 0) {
            await fs.rmdir(filePath);
          }
        }
      }
    };

    await walk(this.basePath);

    return results;
  }
}

module.exports = new FileHelper();
