// app/api/videos/upload/route.ts
// POST /api/videos/upload - Upload video file

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }
    
    // Check file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 500MB)' }, { status: 400 })
    }
    
    // Check file type
    const validTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }
    
    // Create upload directory if not exists
    const uploadDir = join(process.cwd(), 'uploads', user.id)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }
    
    // Save file locally
    const fileName = `${Date.now()}_${file.name}`
    const filePath = join(uploadDir, fileName)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)
    
    // Upload to Supabase Storage
    const storagePath = `${user.id}/${fileName}`
    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: '3600'
      })
    
    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      // Still continue with local file
    }
    
    // Get public URL if uploaded to storage
    let publicUrl = null
    if (!uploadError) {
      const { data: { publicUrl: url } } = supabase.storage
        .from('videos')
        .getPublicUrl(storagePath)
      publicUrl = url
    }
    
    // Get video duration using ffprobe (if available)
    let duration = null
    try {
      const { exec } = require('child_process')
      const durationCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
      
      duration = await new Promise((resolve) => {
        exec(durationCmd, (error: any, stdout: string) => {
          if (!error) {
            resolve(parseFloat(stdout))
          } else {
            resolve(null)
          }
        })
      })
    } catch (e) {
      console.warn('Could not get video duration:', e)
    }
    
    // Save to database
    const { data: video, error: dbError } = await supabase
      .from('videos')
      .insert({
        user_id: user.id,
        title: title || file.name,
        description: description || '',
        source_url: publicUrl,
        local_path: filePath,
        file_size: file.size,
        duration,
        status: 'pending'
      })
      .select()
      .single()
    
    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }
    
    // Add to queue for processing
    await supabase.from('queue_jobs').insert({
      user_id: user.id,
      job_type: 'video_analysis',
      priority: 1,
      payload: { video_id: video.id, file_path: filePath },
      status: 'pending',
      available_at: new Date().toISOString()
    })
    
    return NextResponse.json({
      success: true,
      data: video
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error in POST /api/videos/upload:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
