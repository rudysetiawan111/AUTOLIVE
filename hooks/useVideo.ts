// ✅ BENAR: hooks/useVideos.ts
// Lokasi: /your-project-root/hooks/useVideos.ts

'use client';

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Video } from '@/lib/supabase/types'
import toast from 'react-hot-toast'

export function useVideos(userId: string) {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    viral: 0,
    uploaded: 0,
    avgViralScore: 0
  })

  const loadVideos = useCallback(async () => {
    setLoading(true)
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      toast.error('Failed to load videos')
    } else {
      setVideos(data as Video[])
      
      const viralCount = data.filter(v => (v.viral_score || 0) >= 70).length
      const uploadedCount = data.filter(v => v.status === 'uploaded').length
      const avgScore = data.reduce((sum, v) => sum + (v.viral_score || 0), 0) / (data.length || 1)
      
      setStats({
        total: data.length,
        viral: viralCount,
        uploaded: uploadedCount,
        avgViralScore: avgScore
      })
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    if (userId) {
      loadVideos()
    }
  }, [userId, loadVideos])

  return {
    videos,
    loading,
    stats,
    refresh: loadVideos
  }
}
