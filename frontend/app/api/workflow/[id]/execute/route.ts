// app/api/workflows/[id]/execute/route.ts
// POST /api/workflows/[id]/execute - Execute a workflow

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
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
    const { input_data } = body
    
    // Get workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()
    
    if (workflowError || !workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }
    
    // Check if workflow is active
    if (workflow.status !== 'active') {
      return NextResponse.json({ error: 'Workflow is not active' }, { status: 400 })
    }
    
    // Create execution record
    const { data: execution, error: execError } = await supabase
      .from('workflow_executions')
      .insert({
        workflow_id: params.id,
        user_id: user.id,
        status: 'pending',
        current_step: 0,
        total_steps: (workflow.steps as any[]).length,
        input_data,
        started_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (execError) {
      return NextResponse.json({ error: execError.message }, { status: 500 })
    }
    
    // Add to queue for processing
    const { error: queueError } = await supabase
      .from('queue_jobs')
      .insert({
        user_id: user.id,
        job_type: 'workflow_execution',
        priority: 2,
        payload: {
          execution_id: execution.id,
          workflow_id: params.id,
          user_id: user.id,
          steps: workflow.steps
        },
        status: 'pending',
        available_at: new Date().toISOString()
      })
    
    if (queueError) {
      // Update execution to failed if queue fails
      await supabase
        .from('workflow_executions')
        .update({ status: 'failed', error_message: queueError.message })
        .eq('id', execution.id)
      
      return NextResponse.json({ error: queueError.message }, { status: 500 })
    }
    
    // Update workflow last run
    await supabase
      .from('workflows')
      .update({ last_run_at: new Date().toISOString() })
      .eq('id', params.id)
    
    return NextResponse.json({
      success: true,
      data: {
        execution_id: execution.id,
        status: 'pending',
        message: 'Workflow execution started'
      }
    })
    
  } catch (error) {
    console.error('Error in POST /api/workflows/[id]/execute:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
