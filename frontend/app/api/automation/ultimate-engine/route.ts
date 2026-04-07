import { NextResponse } from 'next/server';
import { workflowQueue } from '@/lib/queue';
import { getTrendingKeywords } from '@/lib/trending';

export async function POST() {
  const trends = await getTrendingKeywords();

  const jobs = [];

  for (const keyword of trends) {
    const job = await workflowQueue.add('run', { keyword });
    jobs.push(job.id);
  }

  return NextResponse.json({
    success: true,
    jobs
  });
}
