// app/api/videos/route.ts
// GET /api/videos - Get user videos
// POST /api/videos - Create video record

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
    const viral = searchParams.get('viral') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Build query
    let query = supabase
      .from('videos')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    
    if (viral) {
      query = query.gte('viral_score', 70)
    }
    
    const { data: videos, error, count } = await query
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Get stats
    const { data: allVideos } = await supabase
      .from('videos')
      .select('status, viral_score')
      .eq('user_id', user.id)
    
    const stats = {
      total: allVideos?.length || 0,
      pending: allVideos?.filter(v => v.status === 'pending').length || 0,
      processing: allVideos?.filter(v => v.status === 'processing').length || 0,
      ready: allVideos?.filter(v => v.status === 'ready').length || 0,
      uploaded: allVideos?.filter(v => v.status === 'uploaded').length || 0,
      failed: allVideos?.filter(v => v.status === 'failed').length || 0,
      viral: allVideos?.filter(v => (v.viral_score || 0) >= 70).length || 0,
      avgViralScore: allVideos?.reduce((sum, v) => sum + (v.viral_score || 0), 0) / (allVideos.length || 1) || 0
    }
    
    return NextResponse.json({
      success: true,
      data: videos,
      stats,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + limit < (count || 0)
      }
    })
    
  } catch (error) {
    console.error('Error in GET /api/videos:', error)
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
    const { title, description, source_url, local_path, duration, file_size, resolution, aspect_ratio } = body
    
    // Create video record
    const { data: video, error } = await supabase
      .from('videos')
      .insert({
        user_id: user.id,
        title,
        description,
        source_url,
        local_path,
        duration,
        file_size,
        resolution,
        aspect_ratio,
        status: 'pending'
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Add to queue for processing
    await supabase.from('queue_jobs').insert({
      user_id: user.id,
      job_type: 'video_analysis',
      priority: 1,
      payload: { video_id: video.id },
      status: 'pending',
      available_at: new Date().toISOString()
    })
    
    return NextResponse.json({
      success: true,
      data: video
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error in POST /api/videos:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
