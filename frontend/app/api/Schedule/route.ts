// app/api/schedule/route.ts
// GET /api/schedule - Get user schedules
// POST /api/schedule - Create schedule
// PUT /api/schedule/[id] - Update schedule
// DELETE /api/schedule/[id] - Delete schedule

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
    
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    
    let query = supabase
      .from('scheduled_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('next_run_at', { ascending: true })
    
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    
    const { data: schedules, error } = await query
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: schedules
    })
    
  } catch (error) {
    console.error('Error in GET /api/schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { task_name, task_type, schedule_config, task_params } = body
    
    if (!task_name || !task_type || !schedule_config) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Calculate next run time based on schedule config
    const nextRunAt = calculateNextRunTime(schedule_config)
    
    // Create schedule
    const { data: schedule, error } = await supabase
      .from('scheduled_tasks')
      .insert({
        user_id: user.id,
        task_name,
        task_type,
        schedule_config,
        task_params,
        status: 'active',
        next_run_at: nextRunAt,
        total_runs: 0,
        successful_runs: 0,
        failed_runs: 0
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: schedule
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error in POST /api/schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to calculate next run time
function calculateNextRunTime(config: any): string {
  const now = new Date()
  const [hours, minutes] = (config.time || '09:00').split(':')
  
  let nextRun = new Date(now)
  nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0)
  
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1)
  }
  
  return nextRun.toISOString()
}
