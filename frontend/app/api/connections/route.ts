// app/api/connections/route.ts
// GET /api/connections - Get user platform connections
// POST /api/connections - Save connection
// DELETE /api/connections/[id] - Remove connection

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
    
    const { data: connections, error } = await supabase
      .from('platform_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Don't send access tokens to frontend
    const safeConnections = connections?.map(conn => ({
      ...conn,
      access_token: undefined,
      refresh_token: undefined
    }))
    
    return NextResponse.json({
      success: true,
      data: safeConnections
    })
    
  } catch (error) {
    console.error('Error in GET /api/connections:', error)
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
    const { platform, platform_user_id, username, display_name, access_token, refresh_token } = body
    
    // Check if connection exists
    const { data: existing } = await supabase
      .from('platform_connections')
      .select('id')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .maybeSingle()
    
    let result
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('platform_connections')
        .update({
          platform_user_id,
          username,
          display_name,
          access_token,
          refresh_token,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
      
      if (error) throw error
      result = data
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('platform_connections')
        .insert({
          user_id: user.id,
          platform,
          platform_user_id,
          username,
          display_name,
          access_token,
          refresh_token,
          status: 'active'
        })
        .select()
        .single()
      
      if (error) throw error
      result = data
    }
    
    return NextResponse.json({
      success: true,
      data: { ...result, access_token: undefined, refresh_token: undefined }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error in POST /api/connections:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
