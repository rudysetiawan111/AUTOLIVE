import { NextResponse } from 'next/server';
import { Queue } from 'bullmq';
import { connection } from '@/lib/redis';

const queue = new Queue('workflow', { connection });

export async function GET() {
  const jobs = await queue.getJobs(['completed', 'failed']);

  const results = jobs.map(job => ({
    id: job.id,
    result: job.returnvalue
  }));

  return NextResponse.json(results);
}
