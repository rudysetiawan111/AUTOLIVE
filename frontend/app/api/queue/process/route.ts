// app/api/queue/process/route.ts
// POST /api/queue/process - Process queue (webhook/worker)

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// This endpoint is for internal use (webhook/cron job)
// Should be protected with API key
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const apiKey = authHeader?.replace('Bearer ', '')
    
    // Verify API key (set in environment)
    if (apiKey !== process.env.QUEUE_PROCESSOR_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const supabase = createAdminClient()
    
    // Get next pending job
    const { data: job, error } = await supabase
      .from('queue_jobs')
      .select('*')
      .eq('status', 'pending')
      .lte('available_at', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .single()
    
    if (error || !job) {
      return NextResponse.json({ success: true, message: 'No pending jobs' })
    }
    
    // Lock the job
    await supabase
      .from('queue_jobs')
      .update({
        status: 'processing',
        locked_at: new Date().toISOString(),
        locked_by: 'worker-1'
      })
      .eq('id', job.id)
    
    // Process based on job type
    let result = null
    let processingError = null
    
    try {
      switch (job.job_type) {
        case 'workflow_execution':
          result = await processWorkflowExecution(job.payload, supabase)
          break
        case 'video_analysis':
          result = await processVideoAnalysis(job.payload, supabase)
          break
        case 'video_upload':
          result = await processVideoUpload(job.payload, supabase)
          break
        case 'video_download':
          result = await processVideoDownload(job.payload, supabase)
          break
        default:
          processingError = new Error(`Unknown job type: ${job.job_type}`)
      }
    } catch (err: any) {
      processingError = err
    }
    
    // Update job status
    if (processingError) {
      const newRetryCount = (job.retry_count || 0) + 1
      const shouldRetry = newRetryCount < (job.max_retries || 3)
      
      await supabase
        .from('queue_jobs')
        .update({
          status: shouldRetry ? 'retry' : 'failed',
          retry_count: newRetryCount,
          error_message: processingError.message,
          available_at: shouldRetry ? new Date(Date.now() + 60000 * newRetryCount).toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id)
    } else {
      await supabase
        .from('queue_jobs')
        .update({
          status: 'completed',
          result,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id)
    }
    
    return NextResponse.json({
      success: true,
      data: { job_id: job.id, status: processingError ? 'failed' : 'completed' }
    })
    
  } catch (error) {
    console.error('Error in POST /api/queue/process:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function processWorkflowExecution(payload: any, supabase: any) {
  const { execution_id, workflow_id, user_id, steps } = payload
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    
    // Update current step
    await supabase
      .from('workflow_executions')
      .update({ current_step: i })
      .eq('id', execution_id)
    
    // Create step log
    await supabase.from('workflow_step_logs').insert({
      execution_id,
      step_name: step.action,
      step_order: i,
      status: 'running',
      started_at: new Date().toISOString()
    })
    
    // Process step based on action
    try {
      switch (step.action) {
        case 'viral_filter':
          // Implement viral filter logic
          break
        case 'download':
          // Implement download logic
          break
        case 'edit':
          // Implement edit logic
          break
        case 'upload':
          // Implement upload logic
          break
      }
      
      // Update step as completed
      await supabase
        .from('workflow_step_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('execution_id', execution_id)
        .eq('step_order', i)
      
    } catch (err: any) {
      // Update step as failed
      await supabase
        .from('workflow_step_logs')
        .update({
          status: 'failed',
          error_message: err.message,
          completed_at: new Date().toISOString()
        })
        .eq('execution_id', execution_id)
        .eq('step_order', i)
      
      throw err
    }
  }
  
  // Update execution as completed
  await supabase
    .from('workflow_executions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', execution_id)
  
  return { success: true }
}

async function processVideoAnalysis(payload: any, supabase: any) {
  const { video_id } = payload
  
  // Simulate analysis
  const viralScore = Math.random() * 100
  
  await supabase
    .from('videos')
    .update({
      viral_score: viralScore,
      status: 'ready'
    })
    .eq('id', video_id)
  
  return { viral_score: viralScore }
}

async function processVideoUpload(payload: any, supabase: any) {
  // Implement video upload to platform
  return { success: true }
}

async function processVideoDownload(payload: any, supabase: any) {
  // Implement video download
  return { success: true }
}
