// app/api/workflows/[id]/route.ts
// GET /api/workflows/[id] - Get single workflow
// PUT /api/workflows/[id] - Update workflow
// DELETE /api/workflows/[id] - Delete workflow

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: workflow, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Get recent executions
    const { data: executions } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('workflow_id', params.id)
      .order('created_at', { ascending: false })
      .limit(10)
    
    return NextResponse.json({
      success: true,
      data: {
        ...workflow,
        recent_executions: executions
      }
    })
    
  } catch (error) {
    console.error('Error in GET /api/workflows/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { name, description, steps, triggers, settings, status } = body
    
    // Check if workflow exists and belongs to user
    const { data: existing, error: checkError } = await supabase
      .from('workflows')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()
    
    if (checkError || !existing) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }
    
    // Update workflow
    const { data: workflow, error } = await supabase
      .from('workflows')
      .update({
        name,
        description,
        steps,
        triggers,
        settings,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: workflow
    })
    
  } catch (error) {
    console.error('Error in PUT /api/workflows/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if workflow exists
    const { data: existing, error: checkError } = await supabase
      .from('workflows')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()
    
    if (checkError || !existing) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }
    
    // Delete workflow (cascade will delete executions)
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', params.id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Workflow deleted successfully'
    })
    
  } catch (error) {
    console.error('Error in DELETE /api/workflows/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
