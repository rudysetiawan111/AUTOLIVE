// frontend/app/dashboard/features/queue-system/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Globe, Sun, Moon, LogOut, LayoutDashboard, Activity, 
  Clock, CheckCircle, XCircle, Loader2, RefreshCw, 
  Search, Eye, Trash2, RotateCw, Pause, Play, Filter,
  Zap, Download, Upload, Video, Subtitles, Scissors
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function QueueSystemPage() {
  const router = useRouter();
  const supabase = createClient();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  // User info
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [subscriptionExpiry, setSubscriptionExpiry] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState('');

  // Queue stats
  const [stats, setStats] = useState({
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    delayed: 0
  });
  const [jobs, setJobs] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    fetchUserData();
    fetchQueueData();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;
    if (autoRefresh) {
      refreshInterval = setInterval(fetchQueueData, 5000);
    }
    return () => clearInterval(refreshInterval);
  }, [autoRefresh]);

  const updateDateTime = () => {
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const dayName = days[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const time = now.toLocaleTimeString('id-ID');
    setCurrentDateTime(`${dayName}, ${day} ${month} ${year} | ${time}`);
  };

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: userData } = await supabase.from('users').select('full_name, role, subscription, subscription_expiry').eq('id', user.id).single();
      setUserName(userData?.full_name || user.email?.split('@')[0] || 'Admin');
      setUserRole(userData?.role === 'admin' ? 'ADMIN' : (userData?.subscription?.toUpperCase() || 'ADMIN'));
      if (userData?.subscription_expiry) {
        const expiryDate = new Date(userData.subscription_expiry);
        setSubscriptionExpiry(expiryDate.toLocaleDateString('id-ID'));
      }
    } else {
      router.push('/login');
    }
  };

  const fetchQueueData = async () => {
    setLoading(true);
    // Mock data - nanti ganti dengan API call ke BullMQ
    setTimeout(() => {
      setStats({
        waiting: 12,
        active: 3,
        completed: 245,
        failed: 8,
        delayed: 2
      });
      setJobs([
        { id: 'job_001', type: 'download_youtube', userId: 'user1@example.com', priority: 'high', status: 'waiting', createdAt: new Date().toISOString(), data: { url: 'https://youtube.com/watch?v=abc' } },
        { id: 'job_002', type: 'upload_tiktok', userId: 'user2@example.com', priority: 'normal', status: 'active', createdAt: new Date().toISOString(), data: { videoId: 'vid_123' } },
        { id: 'job_003', type: 'generate_subtitle', userId: 'user1@example.com', priority: 'low', status: 'failed', createdAt: new Date(Date.now() - 3600000).toISOString(), error: 'Timeout error', data: {} },
        { id: 'job_004', type: 'clip_video', userId: 'user3@example.com', priority: 'high', status: 'completed', createdAt: new Date(Date.now() - 7200000).toISOString(), data: {} },
        { id: 'job_005', type: 'download_tiktok', userId: 'user4@example.com', priority: 'normal', status: 'delayed', createdAt: new Date().toISOString(), data: { url: 'https://tiktok.com/@user/video/xyz' } },
      ]);
      setLoading(false);
    }, 300);
  };

  const retryJob = async (jobId: string) => {
    toast.success(language === 'en' ? `Retrying job ${jobId}` : `Mengulang job ${jobId}`);
    // Simulate API
    setJobs(prev => prev.map(job => job.id === jobId ? { ...job, status: 'waiting', error: undefined } : job));
    setStats(prev => ({ ...prev, failed: prev.failed - 1, waiting: prev.waiting + 1 }));
  };

  const cancelJob = async (jobId: string) => {
    if (confirm(language === 'en' ? 'Cancel this job?' : 'Batalkan job ini?')) {
      toast.success(language === 'en' ? `Job ${jobId} cancelled` : `Job ${jobId} dibatalkan`);
      setJobs(prev => prev.filter(job => job.id !== jobId));
      // Update stats
      const cancelledJob = jobs.find(j => j.id === jobId);
      if (cancelledJob) {
        if (cancelledJob.status === 'waiting') setStats(prev => ({ ...prev, waiting: prev.waiting - 1 }));
        if (cancelledJob.status === 'active') setStats(prev => ({ ...prev, active: prev.active - 1 }));
        if (cancelledJob.status === 'delayed') setStats(prev => ({ ...prev, delayed: prev.delayed - 1 }));
      }
    }
  };

  const clearCompleted = async () => {
    if (confirm(language === 'en' ? 'Clear all completed jobs?' : 'Hapus semua job yang selesai?')) {
      setJobs(prev => prev.filter(job => job.status !== 'completed'));
      setStats(prev => ({ ...prev, completed: 0 }));
      toast.success(language === 'en' ? 'Completed jobs cleared' : 'Job selesai dihapus');
    }
  };

  const retryAllFailed = async () => {
    const failedJobs = jobs.filter(j => j.status === 'failed');
    if (failedJobs.length === 0) {
      toast.error(language === 'en' ? 'No failed jobs' : 'Tidak ada job gagal');
      return;
    }
    setJobs(prev => prev.map(job => job.status === 'failed' ? { ...job, status: 'waiting', error: undefined } : job));
    setStats(prev => ({ ...prev, failed: 0, waiting: prev.waiting + failedJobs.length }));
    toast.success(language === 'en' ? `Retrying ${failedJobs.length} jobs` : `Mengulang ${failedJobs.length} job`);
  };

  const getJobTypeIcon = (type: string) => {
    if (type.includes('download')) return <Download className="w-4 h-4" />;
    if (type.includes('upload')) return <Upload className="w-4 h-4" />;
    if (type.includes('subtitle')) return <Subtitles className="w-4 h-4" />;
    if (type.includes('clip')) return <Scissors className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'waiting': return <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Waiting</span>;
      case 'active': return <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">Active</span>;
      case 'completed': return <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Completed</span>;
      case 'failed': return <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Failed</span>;
      case 'delayed': return <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">Delayed</span>;
      default: return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'high': return <span className="text-xs text-red-600">High</span>;
      case 'normal': return <span className="text-xs text-blue-600">Normal</span>;
      case 'low': return <span className="text-xs text-gray-500">Low</span>;
      default: return null;
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (filter !== 'all' && job.status !== filter) return false;
    if (searchTerm && !job.id.includes(searchTerm) && !job.type.includes(searchTerm) && !job.userId.includes(searchTerm)) return false;
    return true;
  });

  const t = (key: string) => {
    const translations: any = {
      en: {
        pageTitle: 'QUEUE SYSTEM',
        subTitle: 'MONITOR & MANAGE JOBS',
        description: 'Real-time queue monitoring and job control',
        backToDashboard: 'Dashboard',
        logout: 'Logout',
        userName: 'Username',
        role: 'Role',
        activeUntil: 'Active until',
        queueOverview: 'Queue Overview',
        waiting: 'Waiting',
        active: 'Active',
        completed: 'Completed',
        failed: 'Failed',
        delayed: 'Delayed',
        refresh: 'Refresh',
        autoRefresh: 'Auto-refresh',
        jobList: 'Job List',
        all: 'All',
        searchPlaceholder: 'Search by ID, type, or user...',
        id: 'ID',
        type: 'Type',
        user: 'User',
        priority: 'Priority',
        status: 'Status',
        created: 'Created',
        actions: 'Actions',
        retry: 'Retry',
        cancel: 'Cancel',
        clearCompleted: 'Clear Completed',
        retryAllFailed: 'Retry All Failed',
        noJobs: 'No jobs found',
        jobDetail: 'Job Detail',
        close: 'Close',
        data: 'Data',
        error: 'Error',
      },
      id: {
        pageTitle: 'SISTEM ANTRIAN',
        subTitle: 'MONITOR & KELOLA JOB',
        description: 'Monitoring antrian real-time dan kontrol job',
        backToDashboard: 'Dashboard',
        logout: 'Keluar',
        userName: 'Nama Pengguna',
        role: 'Hak Akses',
        activeUntil: 'Aktif sampai',
        queueOverview: 'Ringkasan Antrian',
        waiting: 'Menunggu',
        active: 'Aktif',
        completed: 'Selesai',
        failed: 'Gagal',
        delayed: 'Ditunda',
        refresh: 'Refresh',
        autoRefresh: 'Auto-refresh',
        jobList: 'Daftar Job',
        all: 'Semua',
        searchPlaceholder: 'Cari berdasarkan ID, tipe, atau user...',
        id: 'ID',
        type: 'Tipe',
        user: 'User',
        priority: 'Prioritas',
        status: 'Status',
        created: 'Dibuat',
        actions: 'Aksi',
        retry: 'Ulang',
        cancel: 'Batal',
        clearCompleted: 'Hapus Selesai',
        retryAllFailed: 'Ulang Semua Gagal',
        noJobs: 'Tidak ada job',
        jobDetail: 'Detail Job',
        close: 'Tutup',
        data: 'Data',
        error: 'Error',
      }
    };
    return translations[language]?.[key] || key;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="w-24"></div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('pageTitle')}</h1>
            <div className="flex items-center gap-1">
              <button onClick={() => setLanguage(language === 'en' ? 'id' : 'en')} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <Globe className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              <button onClick={toggleTheme} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-gray-600" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="w-24"></div>
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">{t('subTitle')}</h2>
            <button onClick={() => router.push('/dashboard/admin')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition">
              <LayoutDashboard className="w-3 h-3" /> {t('backToDashboard')}
            </button>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="w-24"></div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('description')}</p>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition">
              <LogOut className="w-3 h-3" /> {t('logout')}
            </button>
          </div>
          <div className="text-center mt-2">
            <p className="text-xs text-gray-600 dark:text-gray-400">{userName} | {userRole} | {subscriptionExpiry ? `${t('activeUntil')}: ${subscriptionExpiry}` : ''}</p>
          </div>
          <div className="text-right mt-1">
            <p className="text-xs text-gray-400 dark:text-gray-500">{currentDateTime}</p>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 mt-3"></div>
        </div>
      </header>

      <div className="h-4"></div>

      <main className="max-w-7xl mx-auto px-6 py-4">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center">
            <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.waiting}</p>
            <p className="text-xs text-gray-500">{t('waiting')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center">
            <Activity className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.active}</p>
            <p className="text-xs text-gray-500">{t('active')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.completed}</p>
            <p className="text-xs text-gray-500">{t('completed')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center">
            <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.failed}</p>
            <p className="text-xs text-gray-500">{t('failed')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center">
            <Clock className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.delayed}</p>
            <p className="text-xs text-gray-500">{t('delayed')}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <button onClick={fetchQueueData} className="p-2 bg-primary text-white rounded-lg flex items-center gap-1"><RefreshCw className="w-4 h-4" /> {t('refresh')}</button>
            <button onClick={retryAllFailed} className="p-2 bg-orange-500 text-white rounded-lg flex items-center gap-1"><RotateCw className="w-4 h-4" /> {t('retryAllFailed')}</button>
            <button onClick={clearCompleted} className="p-2 bg-gray-500 text-white rounded-lg flex items-center gap-1"><Trash2 className="w-4 h-4" /> {t('clearCompleted')}</button>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="w-4 h-4" />
            {t('autoRefresh')}
          </label>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap gap-2 mb-4">
          {['all', 'waiting', 'active', 'completed', 'failed', 'delayed'].map(status => (
            <button key={status} onClick={() => setFilter(status)} className={`px-3 py-1 rounded-full text-sm ${filter === status ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
              {t(status === 'all' ? 'all' : status)}
            </button>
          ))}
          <div className="relative ml-auto">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('searchPlaceholder')} className="pl-8 pr-2 py-1 border rounded-lg text-sm" />
          </div>
        </div>

        {/* Job Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="p-3 text-left">{t('id')}</th>
                  <th className="p-3 text-left">{t('type')}</th>
                  <th className="p-3 text-left">{t('user')}</th>
                  <th className="p-3 text-left">{t('priority')}</th>
                  <th className="p-3 text-left">{t('status')}</th>
                  <th className="p-3 text-left">{t('created')}</th>
                  <th className="p-3 text-left">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={7} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>}
                {!loading && filteredJobs.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-500">{t('noJobs')}</td></tr>}
                {filteredJobs.map(job => (
                  <tr key={job.id} className="border-t">
                    <td className="p-3 font-mono text-xs">{job.id}</td>
                    <td className="p-3"><div className="flex items-center gap-1">{getJobTypeIcon(job.type)} {job.type.replace(/_/g, ' ')}</div></td>
                    <td className="p-3">{job.userId}</td>
                    <td className="p-3">{getPriorityBadge(job.priority)}</td>
                    <td className="p-3">{getStatusBadge(job.status)}</td>
                    <td className="p-3">{new Date(job.createdAt).toLocaleString()}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedJob(job); setShowDetailModal(true); }} className="text-blue-500 hover:text-blue-700"><Eye className="w-4 h-4" /></button>
                        {job.status === 'failed' && <button onClick={() => retryJob(job.id)} className="text-green-500 hover:text-green-700"><RotateCw className="w-4 h-4" /></button>}
                        {(job.status === 'waiting' || job.status === 'active' || job.status === 'delayed') && <button onClick={() => cancelJob(job.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Job Detail Modal */}
      {showDetailModal && selectedJob && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('jobDetail')}</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              <p><strong>ID:</strong> {selectedJob.id}</p>
              <p><strong>Type:</strong> {selectedJob.type}</p>
              <p><strong>User:</strong> {selectedJob.userId}</p>
              <p><strong>Priority:</strong> {selectedJob.priority}</p>
              <p><strong>Status:</strong> {selectedJob.status}</p>
              <p><strong>Created:</strong> {new Date(selectedJob.createdAt).toLocaleString()}</p>
              <p><strong>Data:</strong> <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-auto">{JSON.stringify(selectedJob.data, null, 2)}</pre></p>
              {selectedJob.error && <p><strong>Error:</strong> <span className="text-red-500">{selectedJob.error}</span></p>}
            </div>
            <button onClick={() => setShowDetailModal(false)} className="mt-4 w-full bg-primary text-white py-2 rounded-lg">{t('close')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
