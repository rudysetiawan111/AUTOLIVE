// lib/supabase/queries/connections.ts
// Digunakan untuk mengelola koneksi ke YouTube/TikTok
// Gunanya: Menyimpan dan mengelola token OAuth

import { getSupabaseClient } from '../client'
import { PlatformConnection } from '../types'

// GET: Ambil semua koneksi user
export async function getUserConnections(userId: string) {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('platform_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
  
  if (error) throw new Error(error.message)
  return { connections: data as PlatformConnection[], error: null }
}

// GET: Ambil koneksi spesifik (YouTube/TikTok)
export async function getPlatformConnection(userId: string, platform: string) {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('platform_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', platform)
    .eq('status', 'active')
    .maybeSingle()
  
  if (error) throw new Error(error.message)
  return { connection: data as PlatformConnection | null, error: null }
}

// POST: Simpan koneksi baru (setelah OAuth success)
export async function saveConnection(connection: Partial<PlatformConnection>) {
  const supabase = getSupabaseClient()
  
  // Cek apakah sudah ada
  const { connection: existing } = await getPlatformConnection(
    connection.user_id!,
    connection.platform!
  )
  
  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('platform_connections')
      .update({
        ...connection,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return { connection: data as PlatformConnection, error: null }
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('platform_connections')
      .insert({
        ...connection,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return { connection: data as PlatformConnection, error: null }
  }
}

// PUT: Update token (refresh)
export async function updateToken(connectionId: string, newToken: string, newRefreshToken?: string) {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('platform_connections')
    .update({
      access_token: newToken,
      refresh_token: newRefreshToken,
      updated_at: new Date().toISOString()
    })
    .eq('id', connectionId)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return { connection: data as PlatformConnection, error: null }
}

// DELETE: Hapus koneksi (disconnect)
export async function removeConnection(connectionId: string) {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('platform_connections')
    .update({ status: 'revoked' })
    .eq('id', connectionId)
  
  if (error) throw new Error(error.message)
  return { error: null }
}
