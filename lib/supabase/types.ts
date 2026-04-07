// lib/supabase/types.ts
// Digunakan untuk type definitions semua tabel di database
// Gunanya: Agar TypeScript bisa autocomplete dan mengecek error saat query

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      // ============ USERS TABLE ============
      users: {
        Row: {
          id: string
          auth_id: string | null
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'free' | 'pro' | 'premium' | 'admin'
          subscription_status: 'active' | 'inactive' | 'trial' | 'expired'
          subscription_expires_at: string | null
          credits: number
          created_at: string
          updated_at: string
          last_login: string | null
        }
        Insert: {
          id?: string
          auth_id?: string | null
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'free' | 'pro' | 'premium' | 'admin'
          subscription_status?: 'active' | 'inactive' | 'trial' | 'expired'
          subscription_expires_at?: string | null
          credits?: number
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }

      // ============ PLATFORM CONNECTIONS ============
      platform_connections: {
        Row: {
          id: string
          user_id: string
          platform: 'youtube' | 'tiktok' | 'instagram' | 'facebook'
          platform_user_id: string
          username: string
          display_name: string
          avatar_url: string | null
          access_token: string
          refresh_token: string | null
          token_expires_at: string | null
          followers_count: number
          total_posts: number
          is_verified: boolean
          status: 'active' | 'expired' | 'revoked' | 'error'
          last_sync_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          platform: 'youtube' | 'tiktok' | 'instagram' | 'facebook'
          platform_user_id: string
          username: string
          display_name: string
          avatar_url?: string | null
          access_token: string
          refresh_token?: string | null
          token_expires_at?: string | null
          followers_count?: number
          total_posts?: number
          is_verified?: boolean
          status?: 'active' | 'expired' | 'revoked' | 'error'
          last_sync_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['platform_connections']['Insert']>
      }

      // ============ VIDEOS TABLE ============
      videos: {
        Row: {
          id: string
          user_id: string
          source_url: string | null
          local_path: string | null
          title: string | null
          description: string | null
          duration: number | null
          file_size: number | null
          resolution: string | null
          aspect_ratio: string | null
          thumbnail_url: string | null
          status: 'pending' | 'processing' | 'ready' | 'failed' | 'uploaded'
          viral_score: number | null
          copyright_status: string | null
          copyright_details: Json | null
          ai_metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          source_url?: string | null
          local_path?: string | null
          title?: string | null
          description?: string | null
          duration?: number | null
          file_size?: number | null
          resolution?: string | null
          aspect_ratio?: string | null
          thumbnail_url?: string | null
          status?: 'pending' | 'processing' | 'ready' | 'failed' | 'uploaded'
          viral_score?: number | null
          copyright_status?: string | null
          copyright_details?: Json | null
          ai_metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['videos']['Insert']>
      }

      // ============ WORKFLOWS TABLE ============
      workflows: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          workflow_type: string | null
          steps: Json
          triggers: Json | null
          settings: Json | null
          status: 'draft' | 'active' | 'paused' | 'archived'
          last_run_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          workflow_type?: string | null
          steps: Json
          triggers?: Json | null
          settings?: Json | null
          status?: 'draft' | 'active' | 'paused' | 'archived'
          last_run_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['workflows']['Insert']>
      }

      // ============ WORKFLOW EXECUTIONS ============
      workflow_executions: {
        Row: {
          id: string
          workflow_id: string
          user_id: string
          status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
          current_step: number
          total_steps: number | null
          input_data: Json | null
          output_data: Json | null
          error_message: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workflow_id: string
          user_id: string
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
          current_step?: number
          total_steps?: number | null
          input_data?: Json | null
          output_data?: Json | null
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['workflow_executions']['Insert']>
      }

      // ============ SCHEDULED TASKS ============
      scheduled_tasks: {
        Row: {
          id: string
          user_id: string
          task_name: string
          task_type: string
          schedule_config: Json
          task_params: Json | null
          status: 'active' | 'paused' | 'completed'
          last_run_at: string | null
          next_run_at: string | null
          total_runs: number
          successful_runs: number
          failed_runs: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_name: string
          task_type: string
          schedule_config: Json
          task_params?: Json | null
          status?: 'active' | 'paused' | 'completed'
          last_run_at?: string | null
          next_run_at?: string | null
          total_runs?: number
          successful_runs?: number
          failed_runs?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['scheduled_tasks']['Insert']>
      }

      // ============ QUEUE JOBS ============
      queue_jobs: {
        Row: {
          id: string
          user_id: string
          job_type: string
          priority: number
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'retry'
          payload: Json | null
          result: Json | null
          retry_count: number
          max_retries: number
          error_message: string | null
          locked_at: string | null
          locked_by: string | null
          available_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_type: string
          priority?: number
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'retry'
          payload?: Json | null
          result?: Json | null
          retry_count?: number
          max_retries?: number
          error_message?: string | null
          locked_at?: string | null
          locked_by?: string | null
          available_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['queue_jobs']['Insert']>
      }

      // ============ DASHBOARD METRICS ============
      dashboard_metrics: {
        Row: {
          id: string
          user_id: string
          metric_date: string
          total_videos_processed: number
          total_uploads: number
          total_views: number
          total_revenue: number
          viral_videos_count: number
          avg_engagement_rate: number | null
          top_performing_platform: string | null
          metrics: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          metric_date: string
          total_videos_processed?: number
          total_uploads?: number
          total_views?: number
          total_revenue?: number
          viral_videos_count?: number
          avg_engagement_rate?: number | null
          top_performing_platform?: string | null
          metrics?: Json | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['dashboard_metrics']['Insert']>
      }
    }
  }
}

// Helper types untuk memudahkan penggunaan
export type User = Database['public']['Tables']['users']['Row']
export type PlatformConnection = Database['public']['Tables']['platform_connections']['Row']
export type Video = Database['public']['Tables']['videos']['Row']
export type Workflow = Database['public']['Tables']['workflows']['Row']
export type WorkflowExecution = Database['public']['Tables']['workflow_executions']['Row']
export type ScheduledTask = Database['public']['Tables']['scheduled_tasks']['Row']
export type QueueJob = Database['public']['Tables']['queue_jobs']['Row']
export type DashboardMetric = Database['public']['Tables']['dashboard_metrics']['Row']
