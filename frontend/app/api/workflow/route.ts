// app/api/workflows/route.ts
// GET /api/workflows - Get all workflows for current user
// POST /api/workflows - Create new workflow

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
    
    // Get query params
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const workflowType = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Build query
    let query = supabase
      .from('workflows')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    
    if (workflowType) {
      query = query.eq('workflow_type', workflowType)
    }
    
    const { data: workflows, error, count } = await query
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: workflows,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + limit < (count || 0)
      }
    })
    
  } catch (error) {
    console.error('Error in GET /api/workflows:', error)
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
    const { name, description, workflow_type, steps, triggers, settings } = body
    
    // Validate required fields
    if (!name || !steps) {
      return NextResponse.json({ error: 'Name and steps are required' }, { status: 400 })
    }
    
    // Create workflow
    const { data: workflow, error } = await supabase
      .from('workflows')
      .insert({
        user_id: user.id,
        name,
        description,
        workflow_type,
        steps,
        triggers,
        settings,
        status: 'draft'
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Log activity
    await supabase.from('system_logs').insert({
      user_id: user.id,
      log_level: 'info',
      category: 'workflow',
      message: `Created workflow: ${name}`,
      metadata: { workflow_id: workflow.id }
    })
    
    return NextResponse.json({
      success: true,
      data: workflow
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error in POST /api/workflows:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
