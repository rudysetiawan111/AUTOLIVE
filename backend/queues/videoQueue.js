const Queue = require('bull');

// Membuat queue video
const videoQueue = new Queue('video processing', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Proses job video
videoQueue.process('video transcoding', async (job) => {
  const { videoId, inputPath, outputPath, options } = job.data;
  
  console.log(`Memproses video ${videoId} pada job ${job.id}`);
  
  try {
    // Simulasi proses transcoding video
    await processVideoTranscoding(inputPath, outputPath, options);
    
    // Update progress
    await job.progress(100);
    
    return { 
      success: true, 
      videoId, 
      outputPath,
      processedAt: new Date().toISOString() 
    };
  } catch (error) {
    console.error(`Error memproses video ${videoId}:`, error);
    throw error;
  }
});

// backend/queues/videoQueue.js
const Queue = require('bull');
const tiktokDownloader = require('../utils/tiktok-downloader');

const videoQueue = new Queue('video processing', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379
  }
});

videoQueue.process('tiktok download', async (job) => {
  const { url, videoId } = job.data;
  
  console.log(`Downloading TikTok: ${url}`);
  
  try {
    const result = await tiktokDownloader.downloadVideo(url);
    return {
      success: true,
      videoId,
      ...result
    };
  } catch (error) {
    console.error('TikTok download failed:', error);
    throw error;
  }
});

videoQueue.process('video transcoding', async (job) => {
  console.log('Processing video:', job.data);
  return { success: true };
});


// Event handlers
videoQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} untuk video ${result.videoId} selesai`);
});

videoQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} gagal:`, error);
});

videoQueue.on('progress', (job, progress) => {
  console.log(`Job ${job.id} progress: ${progress}%`);
});

// Fungsi untuk menambahkan job video
const addVideoJob = async (videoData) => {
  try {
    const job = await videoQueue.add('video transcoding', videoData, {
      priority: videoData.priority || 1,
      delay: videoData.delay || 0,
      attempts: videoData.attempts || 3,
    });
    
    console.log(`Job ${job.id} ditambahkan ke queue`);
    return job;
  } catch (error) {
    console.error('Gagal menambahkan job:', error);
    throw error;
  }
};

// Fungsi untuk mendapatkan status queue
const getQueueStatus = async () => {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    videoQueue.getWaitingCount(),
    videoQueue.getActiveCount(),
    videoQueue.getCompletedCount(),
    videoQueue.getFailedCount(),
    videoQueue.getDelayedCount(),
  ]);
  
  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
};

// Fungsi simulasi proses transcoding
async function processVideoTranscoding(inputPath, outputPath, options = {}) {
  // Implementasi proses transcoding sebenarnya di sini
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Video selesai diproses: ${inputPath} -> ${outputPath}`);
      resolve();
    }, 5000); // Simulasi proses 5 detik
  });
}

module.exports = {
  videoQueue,
  addVideoJob,
  getQueueStatus,
};
