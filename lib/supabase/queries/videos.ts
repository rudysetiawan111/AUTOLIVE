// lib/supabase/queries/videos.ts
// Digunakan untuk semua operasi ke tabel videos
// Gunanya: Mengelola data video (CRUD, filter, search)

import { getSupabaseClient } from '../client'
import { Video } from '../types'

// GET: Ambil semua video user dengan filter
export async function getUserVideos(
  userId: string, 
  options?: {
    status?: string
    limit?: number
    offset?: number
    sortBy?: 'created_at' | 'viral_score' | 'duration'
    sortOrder?: 'asc' | 'desc'
  }
) {
  const supabase = getSupabaseClient()
  
  let query = supabase
    .from('videos')
    .select('*')
    .eq('user_id', userId)
  
  // Apply filters
  if (options?.status) {
    query = query.eq('status', options.status)
  }
  
  // Apply sorting
  const sortBy = options?.sortBy || 'created_at'
  const sortOrder = options?.sortOrder || 'desc'
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })
  
  // Apply pagination
  if (options?.limit) {
    query = query.limit(options.limit)
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }
  
  const { data, error } = await query
  
  if (error) throw new Error(error.message)
  return { videos: data as Video[], error: null }
}

// GET: Ambil video yang viral (score > 70)
export async function getViralVideos(userId: string, minScore: number = 70) {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('user_id', userId)
    .gte('viral_score', minScore)
    .order('viral_score', { ascending: false })
  
  if (error) throw new Error(error.message)
  return { videos: data as Video[], error: null }
}

// POST: Tambah video baru
export async function addVideo(video: Partial<Video>) {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('videos')
    .insert({
      ...video,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return { video: data as Video, error: null }
}

// PUT: Update status video
export async function updateVideoStatus(videoId: string, status: Video['status']) {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('videos')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', videoId)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return { video: data as Video, error: null }
}

// PUT: Update viral score
export async function updateViralScore(videoId: string, score: number) {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('videos')
    .update({
      viral_score: score,
      updated_at: new Date().toISOString()
    })
    .eq('id', videoId)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return { video: data as Video, error: null }
}

// DELETE: Hapus video
export async function deleteVideo(videoId: string) {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', videoId)
  
  if (error) throw new Error(error.message)
  return { error: null }
}

// GET: Statistik video user
export async function getVideoStats(userId: string) {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('videos')
    .select('status, viral_score')
    .eq('user_id', userId)
  
  if (error) throw new Error(error.message)
  
  const stats = {
    total: data.length,
    pending: data.filter(v => v.status === 'pending').length,
    processing: data.filter(v => v.status === 'processing').length,
    ready: data.filter(v => v.status === 'ready').length,
    uploaded: data.filter(v => v.status === 'uploaded').length,
    failed: data.filter(v => v.status === 'failed').length,
    viral: data.filter(v => (v.viral_score || 0) >= 70).length,
    avgViralScore: data.reduce((sum, v) => sum + (v.viral_score || 0), 0) / (data.length || 1)
  }
  
  return { stats, error: null }
}
