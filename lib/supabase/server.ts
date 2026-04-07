// lib/supabase/server.ts
// Digunakan untuk API routes dan Server Components
// Gunanya: Untuk mengakses Supabase dari sisi server (Node.js)

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './types'

// Fungsi ini membuat client Supabase yang bekerja di server
// Kelebihannya: Lebih aman karena bisa menggunakan Service Role Key
// Bisa bypass RLS jika diperlukan (untuk admin operations)
export function createServerSupabaseClient() {
  const cookieStore = cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Mengambil cookie dari request
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        // Menyimpan cookie ke response
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        // Menghapus cookie
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

// Service Role Client (untuk admin operations)
// Gunanya: Untuk bypass semua RLS policies (hanya untuk backend)
// HATI-HATI: Jangan pernah expose key ini ke frontend!
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service key, bukan anon key
    {
      cookies: {
        get() { return '' },
        set() {},
        remove() {},
      },
    }
  )
}

// Contoh penggunaan di API route:
// const supabase = createServerSupabaseClient()
// const { data: user } = await supabase.auth.getUser()
