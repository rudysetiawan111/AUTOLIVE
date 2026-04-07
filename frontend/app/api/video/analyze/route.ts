// app/api/videos/analyze/route.ts
// POST /api/videos/analyze - Analyze video for viral score

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const adminClient = createAdminClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { video_id } = body
    
    if (!video_id) {
      return NextResponse.json({ error: 'Video ID required' }, { status: 400 })
    }
    
    // Get video
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', video_id)
      .eq('user_id', user.id)
      .single()
    
    if (videoError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }
    
    // Update status to processing
    await supabase
      .from('videos')
      .update({ status: 'processing' })
      .eq('id', video_id)
    
    // Simulate AI analysis (replace with actual AI service)
    // In production, call OpenAI, Replicate, or custom ML model
    const viralScore = Math.random() * 100
    const isViral = viralScore >= 70
    
    const analysisResult = {
      viral_score: viralScore,
      is_viral: isViral,
      engagement_prediction: 50 + Math.random() * 40,
      audience_retention: 40 + Math.random() * 50,
      recommendations: isViral 
        ? ['Good content, ready to publish', 'Add trending hashtags', 'Post at peak hours']
        : ['Improve thumbnail quality', 'Add captions', 'Shorten video length']
    }
    
    // Save analysis
    const { data: analysis, error: analysisError } = await adminClient
      .from('content_analysis')
      .insert({
        video_id: video_id,
        analysis_type: 'viral_prediction',
        viral_prediction_score: analysisResult.viral_score,
        engagement_prediction: analysisResult.engagement_prediction,
        audience_retention_prediction: analysisResult.audience_retention,
        recommendations: analysisResult.recommendations
      })
      .select()
      .single()
    
    if (analysisError) {
      console.error('Analysis save error:', analysisError)
    }
    
    // Update video with viral score
    const { data: updatedVideo, error: updateError } = await supabase
      .from('videos')
      .update({
        viral_score: viralScore,
        status: 'ready',
        ai_metadata: analysisResult
      })
      .eq('id', video_id)
      .select()
      .single()
    
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    
    // Log activity
    await supabase.from('system_logs').insert({
      user_id: user.id,
      log_level: 'info',
      category: 'video',
      message: `Video analyzed: ${video.title}`,
      metadata: { video_id, viral_score: viralScore }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        video: updatedVideo,
        analysis: analysisResult
      }
    })
    
  } catch (error) {
    console.error('Error in POST /api/videos/analyze:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
