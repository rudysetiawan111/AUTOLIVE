// app/api/webhook/route.ts
// POST /api/webhook - Receive webhooks from platforms

import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    // Get webhook signature for verification
    const signature = request.headers.get('x-webhook-signature')
    const platform = request.headers.get('x-platform')
    
    // Verify webhook (implement signature verification based on platform)
    // if (!verifyWebhookSignature(signature, body)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    // }
    
    const body = await request.json()
    
    // Handle different platform webhooks
    switch (platform) {
      case 'youtube':
        await handleYouTubeWebhook(body, supabase)
        break
      case 'tiktok':
        await handleTikTokWebhook(body, supabase)
        break
      default:
        console.log(`Unknown platform: ${platform}`)
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error in POST /api/webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleYouTubeWebhook(payload: any, supabase: any) {
  const { videoId, channelId, views, likes, comments } = payload
  
  // Update engagement analytics
  await supabase
    .from('engagement_analytics')
    .insert({
      platform: 'youtube',
      platform_video_id: videoId,
      views,
      likes,
      comments,
      fetched_at: new Date().toISOString()
    })
  
  // Update upload history
  await supabase
    .from('upload_history')
    .update({
      views_after_upload: views,
      likes_after_upload: likes,
      comments_after_upload: comments
    })
    .eq('platform_video_id', videoId)
}

async function handleTikTokWebhook(payload: any, supabase: any) {
  const { videoId, userId, views, likes, comments, shares } = payload
  
  await supabase
    .from('engagement_analytics')
    .insert({
      platform: 'tiktok',
      platform_video_id: videoId,
      views,
      likes,
      comments,
      shares,
      fetched_at: new Date().toISOString()
    })
}
