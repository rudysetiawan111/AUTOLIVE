import { Worker } from 'bullmq';
import { connection } from './lib/redis';
import { generateAIContent } from './lib/ai';
import { trackRevenue } from './lib/earnings';

const worker = new Worker(
  'workflow',
  async (job) => {
    const { keyword } = job.data;

    let retry = 0;
    let success = false;

    while (!success && retry < 3) {
      try {
        // 🤖 AI
        const content = await generateAIContent(keyword);

        // 📤 SIMULASI UPLOAD
        const uploadSuccess = Math.random() > 0.3;
        if (!uploadSuccess) throw new Error('Upload gagal');

        // 💸 EARNING
        const revenue = await trackRevenue();

        success = true;

        return {
          keyword,
          content,
          revenue,
          status: 'success'
        };

      } catch (err) {
        retry++;
      }
    }

    return {
      keyword,
      status: 'failed'
    };
  },
  { connection }
);

console.log('🔥 Worker jalan...');
