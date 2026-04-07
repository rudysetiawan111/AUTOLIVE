// lib/supabase/client.ts
// Digunakan untuk frontend components (browser)
// Gunanya: Untuk mengakses Supabase dari komponen React di sisi client

import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types'

// Fungsi ini membuat client Supabase yang bekerja di browser
// Client ini bisa melakukan:
// 1. Query data (SELECT)
// 2. Insert/Update/Delete data
// 3. Real-time subscription (listening to changes)
// 4. Authentication (login, register, logout)
export function createClient() {
  return createBrowserClient<Database>(
    // URL Supabase dari environment variable
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Anon key (boleh暴露 karena dibatasi RLS policies)
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Singleton pattern: Buat satu instance dan reuse
// Gunanya: Agar tidak membuat koneksi baru setiap kali dipanggil
let clientInstance: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseClient() {
  if (!clientInstance) {
    clientInstance = createClient()
  }
  return clientInstance
}

// Contoh penggunaan di komponen React:
// const supabase = getSupabaseClient()
// const { data } = await supabase.from('videos').select('*')
