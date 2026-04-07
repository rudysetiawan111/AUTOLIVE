// lib/supabase/queries/workflows.ts
// Digunakan untuk semua operasi CRUD ke tabel workflows
// Gunanya: Agar kode lebih rapi dan reusable

import { getSupabaseClient } from '../client'
import { Workflow, WorkflowExecution } from '../types'

// GET: Ambil semua workflow milik user
export async function getUserWorkflows(userId: string) {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw new Error(error.message)
  return { workflows: data as Workflow[], error: null }
}

// GET: Ambil satu workflow berdasarkan ID
export async function getWorkflowById(workflowId: string) {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', workflowId)
    .single()
  
  if (error) throw new Error(error.message)
  return { workflow: data as Workflow, error: null }
}

// POST: Buat workflow baru
export async function createWorkflow(workflow: Partial<Workflow>) {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('workflows')
    .insert({
      ...workflow,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return { workflow: data as Workflow, error: null }
}

// PUT: Update workflow
export async function updateWorkflow(workflowId: string, updates: Partial<Workflow>) {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('workflows')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', workflowId)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return { workflow: data as Workflow, error: null }
}

// DELETE: Hapus workflow
export async function deleteWorkflow(workflowId: string) {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('workflows')
    .delete()
    .eq('id', workflowId)
  
  if (error) throw new Error(error.message)
  return { error: null }
}

// POST: Jalankan workflow (create execution)
export async function executeWorkflow(workflowId: string, userId: string) {
  const supabase = getSupabaseClient()
  
  // Dapatkan workflow details
  const { workflow } = await getWorkflowById(workflowId)
  if (!workflow) throw new Error('Workflow not found')
  
  // Buat execution record
  const { data: execution, error } = await supabase
    .from('workflow_executions')
    .insert({
      workflow_id: workflowId,
      user_id: userId,
      status: 'pending',
      current_step: 0,
      total_steps: (workflow.steps as any[]).length,
      started_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  
  // Trigger queue job untuk proses workflow
  await addToQueue({
    type: 'workflow_execution',
    payload: { executionId: execution.id, workflowId, userId }
  })
  
  return { execution: execution as WorkflowExecution, error: null }
}

// GET: Ambil semua executions untuk workflow
export async function getWorkflowExecutions(workflowId: string) {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('workflow_executions')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('created_at', { ascending: false })
  
  if (error) throw new Error(error.message)
  return { executions: data as WorkflowExecution[], error: null }
}

// Helper: Add job ke queue
async function addToQueue(job: any) {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('queue_jobs')
    .insert({
      job_type: job.type,
      payload: job.payload,
      status: 'pending',
      priority: 2,
      available_at: new Date().toISOString()
    })
  
  if (error) throw new Error(error.message)
}
