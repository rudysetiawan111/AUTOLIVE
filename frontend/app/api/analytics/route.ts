// app/api/analytics/route.ts
// GET /api/analytics - Get dashboard analytics

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
    const period = searchParams.get('period') || 'week' // day, week, month, year
    
    // Calculate date range
    const endDate = new Date()
    let startDate = new Date()
    
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1)
        break
      case 'week':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
    }
    
    // Get video stats
    const { data: videos } = await supabase
      .from('videos')
      .select('status, viral_score, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
    
    // Get workflow stats
    const { data: workflows } = await supabase
      .from('workflow_executions')
      .select('status, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
    
    // Get upload stats from platform
    const { data: uploads } = await supabase
      .from('upload_history')
      .select('platform, views, likes, comments, uploaded_at')
      .eq('user_id', user.id)
      .gte('uploaded_at', startDate.toISOString())
    
    // Calculate metrics
    const totalVideos = videos?.length || 0
    const viralVideos = videos?.filter(v => (v.viral_score || 0) >= 70).length || 0
    const successfulWorkflows = workflows?.filter(w => w.status === 'completed').length || 0
    const failedWorkflows = workflows?.filter(w => w.status === 'failed').length || 0
    
    const totalViews = uploads?.reduce((sum, u) => sum + (u.views || 0), 0) || 0
    const totalLikes = uploads?.reduce((sum, u) => sum + (u.likes || 0), 0) || 0
    const totalComments = uploads?.reduce((sum, u) => sum + (u.comments || 0), 0) || 0
    
    // Platform breakdown
    const platformStats: any = {}
    uploads?.forEach(u => {
      if (!platformStats[u.platform]) {
        platformStats[u.platform] = { views: 0, likes: 0, comments: 0, videos: 0 }
      }
      platformStats[u.platform].views += u.views || 0
      platformStats[u.platform].likes += u.likes || 0
      platformStats[u.platform].comments += u.comments || 0
      platformStats[u.platform].videos += 1
    })
    
    // Daily trend data
    const dailyData: any[] = []
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const dayVideos = videos?.filter(v => v.created_at.split('T')[0] === dateStr).length || 0
      const dayUploads = uploads?.filter(u => u.uploaded_at.split('T')[0] === dateStr).length || 0
      const dayViews = uploads?.filter(u => u.uploaded_at.split('T')[0] === dateStr)
        .reduce((sum, u) => sum + (u.views || 0), 0) || 0
      
      dailyData.push({
        date: dateStr,
        videos: dayVideos,
        uploads: dayUploads,
        views: dayViews
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return NextResponse.json({
      success: true,
      data: {
        period,
        summary: {
          total_videos: totalVideos,
          viral_videos: viralVideos,
          viral_percentage: totalVideos ? (viralVideos / totalVideos * 100).toFixed(1) : 0,
          successful_workflows: successfulWorkflows,
          failed_workflows: failedWorkflows,
          workflow_success_rate: successfulWorkflows + failedWorkflows ? 
            (successfulWorkflows / (successfulWorkflows + failedWorkflows) * 100).toFixed(1) : 0,
          total_views: totalViews,
          total_likes: totalLikes,
          total_comments: totalComments,
          avg_engagement_rate: totalViews ? ((totalLikes + totalComments) / totalViews * 100).toFixed(1) : 0
        },
        platform_breakdown: platformStats,
        daily_trend: dailyData,
        top_videos: uploads?.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10) || []
      }
    })
    
  } catch (error) {
    console.error('Error in GET /api/analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
