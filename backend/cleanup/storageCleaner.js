const fs = require('fs-extra');
const path = require('path');
const cron = require('node-cron');
const Video = require('../models/Video');

class StorageCleaner {
  constructor() {
    this.storagePath = path.join(__dirname, '../../storage');
    this.downloadsPath = path.join(this.storagePath, 'downloads');
    this.processedPath = path.join(this.storagePath, 'processed');
    this.uploadsPath = path.join(this.storagePath, 'uploads');
    this.tempPath = path.join(this.storagePath, 'temp');
    
    this.cleanupJobs = new Map();
    this.isRunning = false;
    this.stats = {
      lastCleanup: null,
      totalCleaned: 0,
      spaceFreed: 0
    };
  }

  async initialize() {
    console.log('Initializing storage cleaner...');
    this.ensureDirectories();
    
    // Schedule automatic cleanup every day at 3 AM
    this.scheduleCleanup('0 3 * * *', 'daily');
    
    // Schedule weekly deep cleanup on Sunday at 4 AM
    this.scheduleCleanup('0 4 * * 0', 'weekly', { deep: true });
    
    this.isRunning = true;
    console.log('Storage cleaner initialized');
  }

  ensureDirectories() {
    const dirs = [
      this.downloadsPath,
      this.processedPath,
      this.uploadsPath,
      this.tempPath
    ];
    
    dirs.forEach(dir => fs.ensureDirSync(dir));
  }

  scheduleCleanup(cronExpression, name, options = {}) {
    const job = cron.schedule(cronExpression, async () => {
      console.log(`Running scheduled ${name} cleanup...`);
      try {
        await this.cleanup(options);
      } catch (error) {
        console.error(`Error in ${name} cleanup:`, error);
      }
    });

    this.cleanupJobs.set(name, { job, cron: cronExpression, options });
    console.log(`Scheduled ${name} cleanup: ${cronExpression}`);
  }

  async cleanup(options = {}) {
    const startTime = Date.now();
    const {
      olderThan = 7, // days
      deep = false,
      dryRun = false
    } = options;

    console.log(`Starting storage cleanup (dryRun: ${dryRun})...`);

    const results = {
      downloads: await this.cleanupDirectory(this.downloadsPath, olderThan, dryRun),
      processed: await this.cleanupDirectory(this.processedPath, olderThan, dryRun),
      uploads: await this.cleanupDirectory(this.uploadsPath, olderThan, dryRun),
      temp: await this.cleanupDirectory(this.tempPath, 1, dryRun), // Temp files older than 1 day
      database: await this.cleanupDatabaseRecords(olderThan, dryRun)
    };

    // Deep cleanup - remove empty directories and old logs
    if (deep) {
      results.deep = await this.deepCleanup(dryRun);
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    // Update stats
    if (!dryRun) {
      this.stats.lastCleanup = new Date();
      this.stats.totalCleaned += results.totalFiles || 0;
      this.stats.spaceFreed += results.totalSize || 0;
    }

    const summary = {
      timestamp: new Date(),
      duration: `${duration}s`,
      dryRun,
      ...results,
      stats: this.stats
    };

    console.log('Cleanup completed:', summary);
    
    return summary;
  }

  async cleanupDirectory(directory, olderThanDays, dryRun = false) {
    try {
      const files = await fs.readdir(directory);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      let deletedCount = 0;
      let deletedSize = 0;
      const deletedFiles = [];

      for (const file of files) {
        const filePath = path.join(directory, file);
        
        try {
          const stats = await fs.stat(filePath);
          
          if (stats.isFile() && stats.mtime < cutoffDate) {
            deletedSize += stats.size;
            deletedCount++;
            deletedFiles.push({
              file,
              size: stats.size,
              modified: stats.mtime
            });

            if (!dryRun) {
              await fs.remove(filePath);
            }
          }
        } catch (error) {
          console.error(`Error processing file ${file}:`, error);
        }
      }

      return {
        path: directory,
        filesDeleted: deletedCount,
        spaceFreed: deletedSize,
        files: deletedFiles
      };
    } catch (error) {
      console.error(`Error cleaning directory ${directory}:`, error);
      return {
        path: directory,
        filesDeleted: 0,
        spaceFreed: 0,
        error: error.message
      };
    }
  }

  async deepCleanup(dryRun = false) {
    const results = {
      emptyDirectories: [],
      logFiles: []
    };

    // Remove empty directories
    const allDirs = [
      this.downloadsPath,
      this.processedPath,
      this.uploadsPath,
      this.tempPath
    ];

    for (const dir of allDirs) {
      await this.removeEmptyDirectories(dir, dryRun, results.emptyDirectories);
    }

    // Clean up old log files
    const logPath = path.join(__dirname, '../../logs');
    if (await fs.pathExists(logPath)) {
      const logFiles = await fs.readdir(logPath);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      for (const file of logFiles) {
        if (file.endsWith('.log') || file.endsWith('.txt')) {
          const filePath = path.join(logPath, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < thirtyDaysAgo) {
            results.logFiles.push(file);
            if (!dryRun) {
              await fs.remove(filePath);
            }
          }
        }
      }
    }

    return results;
  }

  async removeEmptyDirectories(directory, dryRun = false, results = []) {
    try {
      const files = await fs.readdir(directory);
      
      if (files.length === 0) {
        results.push(directory);
        if (!dryRun) {
          await fs.rmdir(directory);
        }
      } else {
        for (const file of files) {
          const filePath = path.join(directory, file);
          const stats = await fs.stat(filePath);
          
          if (stats.isDirectory()) {
            await this.removeEmptyDirectories(filePath, dryRun, results);
          }
        }
      }
    } catch (error) {
      console.error(`Error removing empty directories in ${directory}:`, error);
    }
  }

  async cleanupDatabaseRecords(olderThanDays, dryRun = false) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // Find videos older than cutoff
      const oldVideos = await Video.find({
        createdAt: { $lt: cutoffDate },
        status: { $in: ['downloaded', 'processed'] } // Only remove if not uploaded
      });

      let deletedCount = 0;

      for (const video of oldVideos) {
        // Delete associated files
        const filesToDelete = [
          video.filePath,
          video.processedPath,
          video.subtitlePath
        ].filter(Boolean);

        if (!dryRun) {
          for (const file of filesToDelete) {
            if (await fs.pathExists(file)) {
              await fs.remove(file);
            }
          }
          
          await video.deleteOne();
        }
        
        deletedCount++;
      }

      return {
        recordsDeleted: deletedCount,
        videos: oldVideos.map(v => ({
          id: v._id,
          title: v.title,
          createdAt: v.createdAt
        }))
      };
    } catch (error) {
      console.error('Error cleaning up database records:', error);
      return {
        recordsDeleted: 0,
        error: error.message
      };
    }
  }

  async getStorageStats() {
    const stats = {
      downloads: await this.getDirectoryStats(this.downloadsPath),
      processed: await this.getDirectoryStats(this.processedPath),
      uploads: await this.getDirectoryStats(this.uploadsPath),
      temp: await this.getDirectoryStats(this.tempPath),
      total: {
        files: 0,
        size: 0
      },
      lastCleanup: this.stats.lastCleanup,
      totalCleaned: this.stats.totalCleaned,
      spaceFreed: this.stats.spaceFreed
    };

    // Calculate totals
    ['downloads', 'processed', 'uploads', 'temp'].forEach(key => {
      stats.total.files += stats[key].files;
      stats.total.size += stats[key].size;
    });

    // Format sizes for readability
    stats.total.sizeFormatted = this.formatBytes(stats.total.size);
    stats.spaceFreedFormatted = this.formatBytes(stats.spaceFreed);

    return stats;
  }

  async getDirectoryStats(directory) {
    try {
      let fileCount = 0;
      let totalSize = 0;
      let oldestFile = null;
      let newestFile = null;

      const files = await fs.readdir(directory);

      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);

        if (stats.isFile()) {
          fileCount++;
          totalSize += stats.size;

          if (!oldestFile || stats.mtime < oldestFile.mtime) {
            oldestFile = {
              file,
              mtime: stats.mtime
            };
          }

          if (!newestFile || stats.mtime > newestFile.mtime) {
            newestFile = {
              file,
              mtime: stats.mtime
            };
          }
        }
      }

      return {
        files: fileCount,
        size: totalSize,
        sizeFormatted: this.formatBytes(totalSize),
        oldestFile,
        newestFile
      };
    } catch (error) {
      console.error(`Error getting stats for ${directory}:`, error);
      return {
        files: 0,
        size: 0,
        sizeFormatted: '0 B',
        error: error.message
      };
    }
  }

  async manualCleanup(options = {}) {
    console.log('Manual cleanup triggered');
    return await this.cleanup(options);
  }

  async cleanupByAge(days, dryRun = false) {
    return await this.cleanup({ olderThan: days, dryRun });
  }

  async cleanupByVideoIds(videoIds, dryRun = false) {
    const results = {
      videosDeleted: [],
      filesDeleted: [],
      totalSize: 0
    };

    for (const videoId of videoIds) {
      try {
        const video = await Video.findById(videoId);
        
        if (video) {
          // Delete files
          const filesToDelete = [
            video.filePath,
            video.processedPath,
            video.subtitlePath
          ].filter(Boolean);

          for (const file of filesToDelete) {
            if (await fs.pathExists(file)) {
              const stats = await fs.stat(file);
              results.totalSize += stats.size;
              results.filesDeleted.push(file);
              
              if (!dryRun) {
                await fs.remove(file);
              }
            }
          }

          results.videosDeleted.push({
            id: video._id,
            title: video.title
          });

          if (!dryRun) {
            await video.deleteOne();
          }
        }
      } catch (error) {
        console.error(`Error cleaning up video ${videoId}:`, error);
      }
    }

    results.totalSizeFormatted = this.formatBytes(results.totalSize);
    
    return results;
  }

  async emergencyCleanup(minFreeSpaceGB = 10) {
    console.log(`Emergency cleanup triggered (min free space: ${minFreeSpaceGB}GB)`);

    const stats = await this.getStorageStats();
    const freeSpace = await this.getFreeSpace();
    
    if (freeSpace < minFreeSpaceGB * 1024 * 1024 * 1024) {
      console.log(`Low disk space: ${this.formatBytes(freeSpace)} free`);
      
      // Aggressive cleanup - remove everything older than 1 day
      return await this.cleanup({
        olderThan: 1,
        deep: true
      });
    }

    return {
      message: 'Sufficient disk space available',
      freeSpace: this.formatBytes(freeSpace)
    };
  }

  async getFreeSpace() {
    // This would use system commands to get actual free space
    // For now, return a large number
    return 100 * 1024 * 1024 * 1024; // 100GB
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  stop() {
    for (const [name, job] of this.cleanupJobs.entries()) {
      job.job.stop();
      console.log(`Stopped ${name} cleanup job`);
    }
    this.cleanupJobs.clear();
    this.isRunning = false;
    console.log('Storage cleaner stopped');
  }
}

module.exports = new StorageCleaner();
