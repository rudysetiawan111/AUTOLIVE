// app/api/queue/route.ts
// GET /api/queue - Get queue status

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get queue statistics
    const { data: jobs, error } = await supabase
      .from('queue_jobs')
      .select('status, priority, job_type')
      .eq('user_id', user.id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    const stats = {
      pending: jobs?.filter(j => j.status === 'pending').length || 0,
      processing: jobs?.filter(j => j.status === 'processing').length || 0,
      completed: jobs?.filter(j => j.status === 'completed').length || 0,
      failed: jobs?.filter(j => j.status === 'failed').length || 0,
      total: jobs?.length || 0
    }
    
    // Get pending jobs (for display)
    const { data: pendingJobs } = await supabase
      .from('queue_jobs')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['pending', 'processing'])
      .order('priority', { ascending: false })
      .order('available_at', { ascending: true })
      .limit(20)
    
    return NextResponse.json({
      success: true,
      data: {
        stats,
        pending_jobs: pendingJobs || []
      }
    })
    
  } catch (error) {
    console.error('Error in GET /api/queue:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
