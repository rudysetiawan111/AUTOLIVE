// ✅ BENAR: hooks/useWorkflows.ts
// Lokasi: /your-project-root/hooks/useWorkflows.ts

'use client';

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Workflow, WorkflowExecution } from '@/lib/supabase/types'
import toast from 'react-hot-toast'

export function useWorkflows(userId: string) {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadWorkflows = useCallback(async () => {
    if (!userId) return
    
    setLoading(true)
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      setError(error.message)
      toast.error('Failed to load workflows')
    } else {
      setWorkflows(data as Workflow[])
    }
    setLoading(false)
  }, [userId])

  const createWorkflow = async (workflow: Partial<Workflow>) => {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('workflows')
      .insert({
        ...workflow,
        user_id: userId,
        status: 'draft'
      })
      .select()
      .single()
    
    if (error) {
      toast.error('Failed to create workflow')
      return null
    }
    
    toast.success('Workflow created!')
    await loadWorkflows()
    return data as Workflow
  }

  const updateWorkflow = async (id: string, updates: Partial<Workflow>) => {
    const supabase = getSupabaseClient()
    
    const { error } = await supabase
      .from('workflows')
      .update(updates)
      .eq('id', id)
    
    if (error) {
      toast.error('Failed to update workflow')
      return false
    }
    
    toast.success('Workflow updated!')
    await loadWorkflows()
    return true
  }

  const deleteWorkflow = async (id: string) => {
    const supabase = getSupabaseClient()
    
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id)
    
    if (error) {
      toast.error('Failed to delete workflow')
      return false
    }
    
    toast.success('Workflow deleted!')
    await loadWorkflows()
    return true
  }

  const executeWorkflow = async (workflowId: string) => {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('workflow_executions')
      .insert({
        workflow_id: workflowId,
        user_id: userId,
        status: 'pending',
        current_step: 0
      })
      .select()
      .single()
    
    if (error) {
      toast.error('Failed to execute workflow')
      return null
    }
    
    toast.success('Workflow started!')
    return data as WorkflowExecution
  }

  // Real-time subscription
  useEffect(() => {
    if (!userId) return
    
    const supabase = getSupabaseClient()
    
    const subscription = supabase
      .channel('workflows_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'workflows', filter: `user_id=eq.${userId}` },
        () => loadWorkflows()
      )
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [userId, loadWorkflows])

  useEffect(() => {
    loadWorkflows()
  }, [loadWorkflows])

  return {
    workflows,
    loading,
    error,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    executeWorkflow,
    refresh: loadWorkflows
  }
}
