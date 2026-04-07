// app/dashboard/features/workflow-automation/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  Youtube, Music2, Play, Settings, Calendar, Video,
  CheckCircle, AlertCircle, Loader2, Activity,
  TrendingUp, DollarSign, ListChecks, RefreshCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import YouTubeConnect from '@/components/YouTubeConnect';
import TikTokConnect from '@/components/TikTokConnect';
import AutomationSettings from '@/components/AutomationSettings';
import { useWorkflows } from '@/hooks/useWorkflows';
import { useVideos } from '@/hooks/useVideos';

interface ConnectedAccount {
  id: string;
  platform: 'youtube' | 'tiktok';
  channelName: string;
  channelId: string;
  thumbnail: string;
  subscribers?: number;
}

interface ExecutionResult {
  id: string;
  status: string;
  current_step: number;
  total_steps: number;
  created_at: string;
}

interface AnalyticsData {
  summary: {
    total_videos: number;
    viral_videos: number;
    total_views: number;
    total_revenue: number;
    workflow_success_rate: number;
  };
  top_videos: Array<{
    title: string;
    views: number;
    likes: number;
    platform: string;
  }>;
}

export default function WorkflowAutomationPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id || 'demo-user';
  
  // Hooks untuk data real
  const { workflows, loading: workflowsLoading, executeWorkflow, refresh: refreshWorkflows } = useWorkflows(userId);
  const { videos, stats: videoStats, refresh: refreshVideos } = useVideos(userId);
  
  // State untuk koneksi akun
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [isConnected, setIsConnected] = useState({ youtube: false, tiktok: false });
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  // State untuk eksekusi dan analytics
  const [isRunning, setIsRunning] = useState(false);
  const [executionResults, setExecutionResults] = useState<ExecutionResult[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  // ================= LOAD CONNECTED ACCOUNTS =================
  const loadConnectedAccounts = async () => {
    try {
      const res = await fetch('/api/connections');
      const data = await res.json();
      if (data.success) {
        const accounts = data.data.map((conn: any) => ({
          id: conn.id,
          platform: conn.platform,
          channelName: conn.display_name || conn.username,
          channelId: conn.platform_user_id,
          thumbnail: conn.avatar_url,
          subscribers: conn.followers_count
        }));
        setConnectedAccounts(accounts);
        setIsConnected({
          youtube: accounts.some((a: any) => a.platform === 'youtube'),
          tiktok: accounts.some((a: any) => a.platform === 'tiktok')
        });
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setLoadingConnections(false);
    }
  };

  // ================= LOAD ANALYTICS =================
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch('/api/analytics?period=week');
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  // ================= LOAD RECENT EXECUTIONS =================
  const fetchRecentExecutions = useCallback(async () => {
    try {
      const res = await fetch('/api/workflows/executions?limit=5');
      const data = await res.json();
      if (data.success) {
        setExecutionResults(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch executions:', error);
    }
  }, []);

  // ================= INITIAL LOADS =================
  useEffect(() => {
    loadConnectedAccounts();
    fetchAnalytics();
    fetchRecentExecutions();
  }, [fetchAnalytics, fetchRecentExecutions]);

  // ================= HANDLE CONNECT =================
  const handleConnect = (platform: 'youtube' | 'tiktok') => {
    window.location.href = `/api/auth/${platform}`;
  };

  // ================= RUN AUTOMATION (SETTINGS SAVED) =================
  const handleSaveSettings = async (settings: any) => {
    setShowSettings(false);
    
    // Cari workflow aktif atau buat baru (simulasi)
    let workflowId = workflows.find(w => w.status === 'active')?.id;
    if (!workflowId && workflows.length > 0) {
      workflowId = workflows[0].id;
      setSelectedWorkflowId(workflowId);
    }
    
    if (!workflowId) {
      toast.error('No workflow found. Please create a workflow first.');
      return;
    }
    
    // Simpan jadwal ke database (opsional)
    try {
      await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_name: 'Automation Schedule',
          task_type: 'workflow',
          schedule_config: settings.schedule,
          task_params: {
            workflow_id: workflowId,
            platforms: {
              youtube: settings.youtubeChannel,
              tiktok: settings.tiktokAccount
            },
            video_theme: settings.videoTheme,
            video_format: settings.videoFormat,
            ai_settings: settings.aiEnhancements
          }
        })
      });
      toast.success('Automation schedule saved!');
    } catch (error) {
      console.error('Failed to save schedule:', error);
    }
    
    // Langsung jalankan workflow sekali (opsional)
    await runWorkflow(workflowId);
  };

  const runWorkflow = async (workflowId: string) => {
    setIsRunning(true);
    toast.loading('Menjalankan AI Auto System...', { id: 'run' });
    
    try {
      const res = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_data: { auto_mode: true } })
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Execution failed');
      
      setExecutionResults(prev => [data.data, ...prev].slice(0, 10));
      toast.success('Workflow started successfully! 🚀', { id: 'run' });
      
      // Refresh data setelah beberapa detik
      setTimeout(() => {
        refreshWorkflows();
        refreshVideos();
        fetchAnalytics();
        fetchRecentExecutions();
      }, 3000);
      
    } catch (err: any) {
      toast.error(err.message || 'Gagal menjalankan sistem', { id: 'run' });
    } finally {
      setIsRunning(false);
    }
  };

  const canStartAutomation = isConnected.youtube || isConnected.tiktok;
  const totalRevenue = analytics?.summary.total_revenue || 0;
  const totalVideos = analytics?.summary.total_videos || videoStats.total || 0;
  const successCount = analytics?.summary.viral_videos || videoStats.viral || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Workflow Automation
          </h1>
          <p className="text-gray-400 mt-2">
            Hubungkan akun sosial media Anda untuk memulai automation video
          </p>
        </div>

        {/* STATS CARDS (dari versi kedua) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center border border-white/20">
            <TrendingUp className="mx-auto text-blue-400 mb-2" size={24} />
            <p className="text-2xl font-bold text-white">
              {analyticsLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : totalVideos}
            </p>
            <p className="text-sm text-gray-300">Konten Diproses</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center border border-white/20">
            <CheckCircle className="mx-auto text-green-400 mb-2" size={24} />
            <p className="text-2xl font-bold text-white">
              {analyticsLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : successCount}
            </p>
            <p className="text-sm text-gray-300">Sukses (Viral)</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center border border-white/20">
            <DollarSign className="mx-auto text-yellow-400 mb-2" size={24} />
            <p className="text-2xl font-bold text-white">
              {analyticsLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : `Rp ${totalRevenue.toLocaleString()}`}
            </p>
            <p className="text-sm text-gray-300">Revenue</p>
          </div>
        </div>

        {/* CONNECTION CARDS (dari versi pertama) */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* YouTube Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Youtube className="w-8 h-8 text-red-500" />
                <h2 className="text-xl font-semibold text-white">YouTube</h2>
              </div>
              {isConnected.youtube && <CheckCircle className="w-6 h-6 text-green-400" />}
            </div>
            {isConnected.youtube ? (
              <div className="space-y-3">
                {connectedAccounts.filter(acc => acc.platform === 'youtube').map(acc => (
                  <div key={acc.id} className="bg-white/5 rounded-lg p-3">
                    <p className="text-white font-medium">{acc.channelName}</p>
                    <p className="text-sm text-gray-400">{acc.subscribers?.toLocaleString()} subscribers</p>
                  </div>
                ))}
                <button onClick={() => handleConnect('youtube')} className="w-full mt-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition">
                  Connect Another Channel
                </button>
              </div>
            ) : (
              <button onClick={() => handleConnect('youtube')} className="w-full px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2">
                <Youtube size={20} /> Connect YouTube Channel
              </button>
            )}
          </div>

          {/* TikTok Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Music2 className="w-8 h-8 text-pink-500" />
                <h2 className="text-xl font-semibold text-white">TikTok</h2>
              </div>
              {isConnected.tiktok && <CheckCircle className="w-6 h-6 text-green-400" />}
            </div>
            {isConnected.tiktok ? (
              <div className="space-y-3">
                {connectedAccounts.filter(acc => acc.platform === 'tiktok').map(acc => (
                  <div key={acc.id} className="bg-white/5 rounded-lg p-3">
                    <p className="text-white font-medium">{acc.channelName}</p>
                  </div>
                ))}
                <button onClick={() => handleConnect('tiktok')} className="w-full mt-2 px-4 py-2 bg-pink-600/20 text-pink-400 rounded-lg hover:bg-pink-600/30 transition">
                  Connect Another Account
                </button>
              </div>
            ) : (
              <button onClick={() => handleConnect('tiktok')} className="w-full px-6 py-3 bg-pink-600 text-white rounded-xl font-semibold hover:bg-pink-700 transition flex items-center justify-center gap-2">
                <Music2 size={20} /> Connect TikTok Account
              </button>
            )}
          </div>
        </div>

        {/* START AUTOMATION BUTTON */}
        <div className="text-center mb-6">
          <button
            onClick={() => setShowSettings(true)}
            disabled={!canStartAutomation}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all transform flex items-center gap-3 mx-auto ${
              canStartAutomation 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:scale-105 cursor-pointer shadow-lg shadow-purple-500/50' 
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isRunning ? <Loader2 className="animate-spin" size={24} /> : <Play size={24} />}
            Start Automation
            {!canStartAutomation && <AlertCircle size={18} className="text-yellow-400" />}
          </button>
          {!canStartAutomation && (
            <p className="text-sm text-yellow-400 mt-2">*Connect at least one platform to enable automation</p>
          )}
        </div>

        {/* RECENT EXECUTIONS (dari versi kedua) */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 mb-6">
          <h2 className="font-bold text-white mb-3 flex items-center gap-2">
            <Activity size={18} /> Recent Executions
          </h2>
          {executionResults.length === 0 ? (
            <p className="text-sm text-gray-400">No executions yet. Click Start Automation to begin.</p>
          ) : (
            <div className="space-y-2">
              {executionResults.map(exec => (
                <div key={exec.id} className="bg-white/5 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">Execution {exec.id.slice(0, 8)}</p>
                    <p className="text-xs text-gray-400">Step {exec.current_step}/{exec.total_steps} • {new Date(exec.created_at).toLocaleString()}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    exec.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    exec.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>{exec.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WORKFLOW LIST (dari versi kedua) */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <h2 className="font-bold text-white mb-3 flex items-center gap-2">
            <ListChecks size={18} /> Workflow List
            <button onClick={refreshWorkflows} className="ml-auto p-1 hover:bg-white/10 rounded">
              <RefreshCcw size={16} className="text-gray-400" />
            </button>
          </h2>
          {workflowsLoading ? (
            <Loader2 className="animate-spin mx-auto text-white" />
          ) : workflows.length === 0 ? (
            <p className="text-sm text-gray-400">No workflows found. Create one via API or dashboard.</p>
          ) : (
            <div className="space-y-2">
              {workflows.map(wf => (
                <div key={wf.id} className="bg-white/5 rounded-lg p-3 flex justify-between items-center hover:bg-white/10 transition">
                  <div>
                    <p className="text-white font-semibold">{wf.name}</p>
                    <p className="text-xs text-gray-400">{wf.workflow_type || 'General'} • Last run: {wf.last_run_at ? new Date(wf.last_run_at).toLocaleDateString() : 'Never'}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    wf.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    wf.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>{wf.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AUTOMATION SETTINGS MODAL */}
        {showSettings && (
          <AutomationSettings 
            connectedAccounts={connectedAccounts}
            onClose={() => setShowSettings(false)}
            onSave={handleSaveSettings}
          />
        )}

      </div>
    </div>
  );
}
