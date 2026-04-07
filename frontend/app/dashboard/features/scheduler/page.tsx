// frontend/app/dashboard/features/scheduler/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Globe, Sun, Moon, LogOut, LayoutDashboard, Calendar, 
  Clock, Repeat, Flag, Edit2, Trash2, StopCircle, 
  History, Search, Plus, Loader2, CheckCircle, AlertCircle,
  Youtube, Music, Eye
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';

export default function SchedulerPage() {
  const router = useRouter();
  const supabase = createClient();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  // User info
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [subscriptionExpiry, setSubscriptionExpiry] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState('');

  // Form state
  const [videoId, setVideoId] = useState('');
  const [platform, setPlatform] = useState<'youtube' | 'tiktok' | 'both'>('youtube');
  const [scheduleDate, setScheduleDate] = useState<Date>(new Date(Date.now() + 3600000));
  const [recurrence, setRecurrence] = useState<'once' | 'daily' | 'weekly' | 'monthly'>('once');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [videos, setVideos] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [filter, setFilter] = useState<'active' | 'history' | 'all'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSchedules, setFilteredSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<any[]>([]);

  useEffect(() => {
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    fetchUserData();
    fetchVideos();
    fetchSchedules();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = schedules;
    if (filter === 'active') filtered = schedules.filter(s => s.status === 'scheduled');
    if (filter === 'history') filtered = schedules.filter(s => s.status === 'completed' || s.status === 'failed');
    if (searchTerm) filtered = filtered.filter(s => s.video_title.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredSchedules(filtered);
  }, [schedules, filter, searchTerm]);

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
      setUserName(userData?.full_name || user.email?.split('@')[0] || 'User');
      setUserRole(userData?.role === 'admin' ? 'ADMIN' : (userData?.subscription?.toUpperCase() || 'FREE'));
      if (userData?.subscription_expiry) {
        const expiryDate = new Date(userData.subscription_expiry);
        setSubscriptionExpiry(expiryDate.toLocaleDateString('id-ID'));
      }
    } else {
      router.push('/login');
    }
  };

  const fetchVideos = async () => {
    // Mock videos (nanti panggil API)
    setVideos([
      { id: '1', title: 'Tutorial AI Video', platform: 'youtube' },
      { id: '2', title: 'Vlog Liburan', platform: 'tiktok' },
      { id: '3', title: 'Review Gadget', platform: 'both' },
    ]);
  };

  const fetchSchedules = async () => {
    setLoading(true);
    // Mock schedules (nanti panggil API)
    setSchedules([
      { id: '1', video_id: '1', video_title: 'Tutorial AI Video', platform: 'youtube', scheduled_at: new Date(Date.now() + 86400000).toISOString(), recurrence: 'once', priority: 'high', status: 'scheduled', created_at: new Date().toISOString() },
      { id: '2', video_id: '2', video_title: 'Vlog Liburan', platform: 'tiktok', scheduled_at: new Date(Date.now() + 172800000).toISOString(), recurrence: 'weekly', priority: 'normal', status: 'scheduled', created_at: new Date().toISOString() },
      { id: '3', video_id: '3', video_title: 'Review Gadget', platform: 'both', scheduled_at: new Date(Date.now() - 86400000).toISOString(), recurrence: 'once', priority: 'normal', status: 'completed', created_at: new Date(Date.now() - 172800000).toISOString() },
    ]);
    setLoading(false);
  };

  const createSchedule = async () => {
    if (!videoId) {
      toast.error(language === 'en' ? 'Please select a video' : 'Pilih video');
      return;
    }
    if (scheduleDate <= new Date()) {
      toast.error(language === 'en' ? 'Schedule time must be in the future' : 'Waktu jadwal harus di masa depan');
      return;
    }
    setCreating(true);
    // Simulasi API call
    setTimeout(() => {
      const selectedVideo = videos.find(v => v.id === videoId);
      const newSchedule = {
        id: Date.now().toString(),
        video_id: videoId,
        video_title: selectedVideo?.title || 'Unknown',
        platform: platform,
        scheduled_at: scheduleDate.toISOString(),
        recurrence: recurrence,
        priority: priority,
        status: 'scheduled',
        created_at: new Date().toISOString(),
      };
      setSchedules(prev => [newSchedule, ...prev]);
      toast.success(language === 'en' ? 'Schedule created!' : 'Jadwal dibuat!');
      // Reset form
      setVideoId('');
      setPlatform('youtube');
      setScheduleDate(new Date(Date.now() + 3600000));
      setRecurrence('once');
      setPriority('normal');
      setNotes('');
      setCreating(false);
    }, 1000);
  };

  const stopSchedule = async (id: string) => {
    if (confirm(language === 'en' ? 'Stop this recurring schedule?' : 'Hentikan jadwal berulang ini?')) {
      setSchedules(prev => prev.map(s => s.id === id ? { ...s, status: 'stopped' } : s));
      toast.success(language === 'en' ? 'Schedule stopped' : 'Jadwal dihentikan');
    }
  };

  const deleteSchedule = async (id: string) => {
    if (confirm(language === 'en' ? 'Delete this schedule?' : 'Hapus jadwal ini?')) {
      setSchedules(prev => prev.filter(s => s.id !== id));
      toast.success(language === 'en' ? 'Schedule deleted' : 'Jadwal dihapus');
    }
  };

  const viewLogs = (scheduleId: string) => {
    // Mock logs
    setSelectedLogs([
      { id: '1', schedule_id: scheduleId, executed_at: new Date().toISOString(), status: 'success', message: 'Upload successful', video_url: 'https://youtu.be/example' },
    ]);
    setShowLogModal(true);
  };

  const getPlatformIcon = (plat: string) => {
    if (plat === 'youtube') return <Youtube className="w-4 h-4 text-red-500" />;
    if (plat === 'tiktok') return <Music className="w-4 h-4 text-black dark:text-white" />;
    return <Globe className="w-4 h-4 text-gray-500" />;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'scheduled') return <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Terjadwal</span>;
    if (status === 'completed') return <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Selesai</span>;
    if (status === 'failed') return <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Gagal</span>;
    return <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Dihentikan</span>;
  };

  const t = (key: string) => {
    const translations: any = {
      en: {
        pageTitle: 'AUTOLIVE SCHEDULER',
        subTitle: 'SCHEDULE VIDEO UPLOADS',
        description: 'Plan and automate your content calendar',
        backToDashboard: 'Dashboard',
        logout: 'Logout',
        userName: 'Username',
        role: 'Role',
        activeUntil: 'Active until',
        createSchedule: 'Create New Schedule',
        selectVideo: 'Select Video',
        platform: 'Platform',
        dateTime: 'Date & Time',
        recurrence: 'Recurrence',
        once: 'Once',
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        priority: 'Priority',
        low: 'Low',
        normal: 'Normal',
        high: 'High',
        notes: 'Notes (optional)',
        createBtn: 'Schedule Upload',
        creating: 'Creating...',
        schedulesTitle: 'Schedules & History',
        filterActive: 'Active',
        filterHistory: 'History',
        filterAll: 'All',
        searchPlaceholder: 'Search by video title...',
        video: 'Video',
        time: 'Time',
        freq: 'Freq',
        status: 'Status',
        actions: 'Actions',
        edit: 'Edit',
        stop: 'Stop',
        delete: 'Delete',
        logs: 'Logs',
        noSchedules: 'No schedules found',
        modalTitle: 'Upload Logs',
        close: 'Close',
      },
      id: {
        pageTitle: 'AUTOLIVE SCHEDULER',
        subTitle: 'JADWALKAN UPLOAD VIDEO',
        description: 'Rencanakan dan otomatisasi kalender konten Anda',
        backToDashboard: 'Dashboard',
        logout: 'Keluar',
        userName: 'Nama Pengguna',
        role: 'Hak Akses',
        activeUntil: 'Aktif sampai',
        createSchedule: 'Buat Jadwal Baru',
        selectVideo: 'Pilih Video',
        platform: 'Platform',
        dateTime: 'Tanggal & Waktu',
        recurrence: 'Frekuensi',
        once: 'Sekali',
        daily: 'Harian',
        weekly: 'Mingguan',
        monthly: 'Bulanan',
        priority: 'Prioritas',
        low: 'Rendah',
        normal: 'Normal',
        high: 'Tinggi',
        notes: 'Catatan (opsional)',
        createBtn: 'Jadwalkan Upload',
        creating: 'Membuat...',
        schedulesTitle: 'Jadwal & Riwayat',
        filterActive: 'Aktif',
        filterHistory: 'Riwayat',
        filterAll: 'Semua',
        searchPlaceholder: 'Cari berdasarkan judul video...',
        video: 'Video',
        time: 'Waktu',
        freq: 'Freq',
        status: 'Status',
        actions: 'Aksi',
        edit: 'Edit',
        stop: 'Hentikan',
        delete: 'Hapus',
        logs: 'Log',
        noSchedules: 'Tidak ada jadwal',
        modalTitle: 'Log Upload',
        close: 'Tutup',
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

      <main className="max-w-6xl mx-auto px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kolom Kiri - Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> {t('createSchedule')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('selectVideo')}</label>
                <select value={videoId} onChange={(e) => setVideoId(e.target.value)} className="w-full p-2 border rounded-lg">
                  <option value="">-- {language === 'en' ? 'Select video' : 'Pilih video'} --</option>
                  {videos.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('platform')}</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2"><input type="radio" value="youtube" checked={platform === 'youtube'} onChange={() => setPlatform('youtube')} /> YouTube</label>
                  <label className="flex items-center gap-2"><input type="radio" value="tiktok" checked={platform === 'tiktok'} onChange={() => setPlatform('tiktok')} /> TikTok</label>
                  <label className="flex items-center gap-2"><input type="radio" value="both" checked={platform === 'both'} onChange={() => setPlatform('both')} /> Both</label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('dateTime')}</label>
                <DatePicker selected={scheduleDate} onChange={(date: Date) => setScheduleDate(date)} showTimeSelect dateFormat="Pp" className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('recurrence')}</label>
                <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as any)} className="w-full p-2 border rounded-lg">
                  <option value="once">{t('once')}</option>
                  <option value="daily">{t('daily')}</option>
                  <option value="weekly">{t('weekly')}</option>
                  <option value="monthly">{t('monthly')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('priority')}</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="w-full p-2 border rounded-lg">
                  <option value="low">{t('low')}</option>
                  <option value="normal">{t('normal')}</option>
                  <option value="high">{t('high')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('notes')}</label>
                <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full p-2 border rounded-lg" />
              </div>
              <button onClick={createSchedule} disabled={creating} className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                {creating ? t('creating') : t('createBtn')}
              </button>
            </div>
          </div>

          {/* Kolom Kanan - Daftar Jadwal */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> {t('schedulesTitle')}</h3>
            </div>
            <div className="flex gap-2 mb-3 border-b">
              <button onClick={() => setFilter('active')} className={`px-3 py-1 text-sm ${filter === 'active' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>{t('filterActive')}</button>
              <button onClick={() => setFilter('history')} className={`px-3 py-1 text-sm ${filter === 'history' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>{t('filterHistory')}</button>
              <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm ${filter === 'all' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>{t('filterAll')}</button>
            </div>
            <div className="mb-3 relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('searchPlaceholder')} className="w-full pl-8 pr-2 py-1 border rounded-lg text-sm" />
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {loading && <p className="text-center py-8">Loading...</p>}
              {!loading && filteredSchedules.length === 0 && <p className="text-center text-gray-500 py-8">{t('noSchedules')}</p>}
              {filteredSchedules.map((s) => (
                <div key={s.id} className="border rounded-lg p-3 hover:shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getPlatformIcon(s.platform)}
                        <span className="font-medium text-sm">{s.video_title}</span>
                        {getStatusBadge(s.status)}
                      </div>
                      <div className="text-xs text-gray-500 space-x-3">
                        <span><Calendar className="inline w-3 h-3 mr-1" />{new Date(s.scheduled_at).toLocaleString()}</span>
                        <span><Repeat className="inline w-3 h-3 mr-1" />{s.recurrence}</span>
                        <span><Flag className="inline w-3 h-3 mr-1" />{s.priority}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {s.status === 'scheduled' && (
                        <>
                          <button onClick={() => stopSchedule(s.id)} className="text-orange-500 hover:text-orange-700 p-1" title={t('stop')}><StopCircle className="w-4 h-4" /></button>
                          <button onClick={() => deleteSchedule(s.id)} className="text-red-500 hover:text-red-700 p-1" title={t('delete')}><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                      {s.status === 'completed' && (
                        <>
                          <button onClick={() => viewLogs(s.id)} className="text-blue-500 hover:text-blue-700 p-1" title={t('logs')}><Eye className="w-4 h-4" /></button>
                          <button onClick={() => deleteSchedule(s.id)} className="text-red-500 hover:text-red-700 p-1" title={t('delete')}><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                      {s.status === 'failed' && (
                        <button onClick={() => deleteSchedule(s.id)} className="text-red-500 hover:text-red-700 p-1" title={t('delete')}><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Modal Logs */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('modalTitle')}</h2>
              <button onClick={() => setShowLogModal(false)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">✕</button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {selectedLogs.map(log => (
                <div key={log.id} className="border rounded p-2">
                  <p className="text-xs text-gray-500">{new Date(log.executed_at).toLocaleString()}</p>
                  <p className="text-sm">{log.message}</p>
                  {log.video_url && <a href={log.video_url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs hover:underline">View Video</a>}
                </div>
              ))}
            </div>
            <button onClick={() => setShowLogModal(false)} className="mt-4 w-full bg-primary text-white py-2 rounded-lg">{t('close')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
