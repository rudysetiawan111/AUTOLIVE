// /app/backend/test-queue.js
const { addVideoJob, getQueueStatus, getJobDetails } = require('./queues/videoQueue');

async function testQueue() {
  console.log('Memulai test queue...');
  
  // Tambah beberapa job
  const jobs = await Promise.all([
    addVideoJob({
      videoId: 'video-001',
      inputPath: '/videos/input/video1.mp4',
      outputPath: '/videos/output/video1_converted.mp4',
      options: {
        format: 'mp4',
        resolution: '1080p',
        duration: 3000
      }
    }),
    addVideoJob({
      videoId: 'video-002',
      inputPath: '/videos/input/video2.mp4',
      outputPath: '/videos/output/video2_converted.mp4',
      priority: 2,
      options: {
        format: 'webm',
        resolution: '720p'
      }
    })
  ]);
  
  console.log('Jobs ditambahkan:', jobs);
  
  // Cek status setelah 5 detik
  setTimeout(async () => {
    const status = await getQueueStatus();
    console.log('Status queue:', JSON.stringify(status, null, 2));
    
    // Cek detail job pertama
    if (jobs[0].jobId) {
      const details = await getJobDetails(jobs[0].jobId);
      console.log('Detail job:', JSON.stringify(details, null, 2));
    }
  }, 5000);
  
  // Cek status setelah 15 detik
  setTimeout(async () => {
    const status = await getQueueStatus();
    console.log('Status akhir queue:', JSON.stringify(status, null, 2));
  }, 15000);
}

// Jalankan test
testQueue().catch(console.error);
