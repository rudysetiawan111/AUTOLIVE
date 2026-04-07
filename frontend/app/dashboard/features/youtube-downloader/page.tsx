// frontend/app/dashboard/features/youtube-downloader/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Globe, Sun, Moon, LogOut, LayoutDashboard, Download, 
  Youtube, Music, Video, FileVideo, Loader2, CheckCircle,
  AlertCircle, ExternalLink, History, Trash2, Search, Clock,
  Eye, Hash, Copy, Link as LinkIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function YouTubeDownloaderPage() {
  const router = useRouter();
  const supabase = createClient();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  // User info
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [subscriptionExpiry, setSubscriptionExpiry] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState('');

  // Download form
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [quality, setQuality] = useState('720p');
  const [format, setFormat] = useState('mp4');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState('');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  
  // History
  const [history, setHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredHistory, setFilteredHistory] = useState<any[]>([]);

  useEffect(() => {
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    fetchUserData();
    fetchHistory();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredHistory(history);
    } else {
      setFilteredHistory(history.filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase())));
    }
  }, [searchTerm, history]);

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

  const fetchHistory = async () => {
    // Mock history (nanti diganti dengan API call)
    setHistory([
      { id: '1', title: 'Tutorial AI Video', quality: '1080p', format: 'mp4', date: new Date().toISOString(), status: 'success', size: 45.2, url: 'https://youtu.be/abc' },
      { id: '2', title: 'Vlog Seru', quality: '720p', format: 'mp4', date: new Date(Date.now() - 86400000).toISOString(), status: 'success', size: 32.1, url: 'https://youtu.be/def' },
      { id: '3', title: 'Musik Santai', quality: 'mp3', format: 'mp3', date: new Date(Date.now() - 172800000).toISOString(), status: 'failed', error: 'Timeout', url: 'https://youtu.be/ghi' },
    ]);
    setFilteredHistory(history);
  };

  const fetchVideoInfo = async () => {
    if (!url.trim()) {
      toast.error(language === 'en' ? 'Please enter a YouTube URL' : 'Masukkan URL YouTube');
      return;
    }
    // Mock fetch video info (nanti panggil API)
    setVideoInfo({
      title: 'Contoh Video YouTube',
      channel: 'Channel Name',
      duration: '5:32',
      thumbnail: 'https://via.placeholder.com/120x68?text=YT',
      formats: [
        { quality: '144p', size: 5, format: 'mp4' },
        { quality: '240p', size: 10, format: 'mp4' },
        { quality: '360p', size: 18, format: 'mp4' },
        { quality: '480p', size: 30, format: 'mp4' },
        { quality: '720p', size: 45, format: 'mp4' },
        { quality: '1080p', size: 80, format: 'mp4' },
        { quality: '4K', size: 200, format: 'mp4' },
        { quality: 'mp3', size: 5, format: 'mp3' },
      ]
    });
    toast.success(language === 'en' ? 'Video info loaded' : 'Info video dimuat');
  };

  const startDownload = () => {
    if (!videoInfo) {
      toast.error(language === 'en' ? 'Please fetch video info first' : 'Ambil info video terlebih dahulu');
      return;
    }
    setDownloading(true);
    setDownloadProgress(0);
    setDownloadSpeed('');
    const jobId = 'job_' + Date.now();
    setActiveJobId(jobId);
    
    // Simulasi progress download
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setDownloading(false);
          setActiveJobId(null);
          toast.success(language === 'en' ? 'Download completed!' : 'Download selesai!');
          // Tambahkan ke riwayat
          const newItem = {
            id: Date.now().toString(),
            title: videoInfo.title,
            quality: quality,
            format: format,
            date: new Date().toISOString(),
            status: 'success',
            size: (quality === '1080p' ? 80 : quality === '720p' ? 45 : quality === '480p' ? 30 : quality === '360p' ? 18 : quality === '240p' ? 10 : quality === '144p' ? 5 : 5),
            url: url
          };
          setHistory(prev => [newItem, ...prev]);
          return 100;
        }
        // Update kecepatan simulasi
        const speed = (Math.random() * 2 + 0.5).toFixed(1);
        setDownloadSpeed(`${speed} MB/s`);
        return prev + Math.random() * 15;
      });
    }, 500);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    toast.success(language === 'en' ? 'Item removed' : 'Item dihapus');
  };

  const clearAllHistory = () => {
    if (confirm(language === 'en' ? 'Delete all download history?' : 'Hapus semua riwayat download?')) {
      setHistory([]);
      toast.success(language === 'en' ? 'All history cleared' : 'Semua riwayat dihapus');
    }
  };

  const getEstimatedSize = () => {
    if (!videoInfo) return 0;
    const found = videoInfo.formats.find((f: any) => f.quality === quality && f.format === format);
    return found ? found.size : 0;
  };

  const t = (key: string) => {
    const translations: any = {
      en: {
        pageTitle: 'AUTOLIVE YOUTUBE DOWNLOADER',
        subTitle: 'DOWNLOAD FROM YOUTUBE',
        description: 'Download videos from YouTube easily',
        backToDashboard: 'Dashboard',
        logout: 'Logout',
        userName: 'Username',
        role: 'Role',
        activeUntil: 'Active until',
        downloadForm: 'Download Video',
        videoUrl: 'YouTube URL',
        urlPlaceholder: 'Enter YouTube URL (e.g., https://youtube.com/watch?v=...)',
        fetchInfo: 'Get Video Info',
        videoInfo: 'Video Info',
        title: 'Title',
        channel: 'Channel',
        duration: 'Duration',
        quality: 'Quality',
        format: 'Format',
        estimatedSize: 'Estimated size',
        downloadBtn: 'Download',
        downloading: 'Downloading',
        progress: 'Progress',
        speed: 'Speed',
        historyTitle: 'Download History',
        searchHistory: 'Search title...',
        date: 'Date',
        size: 'Size',
        status: 'Status',
        success: 'Success',
        failed: 'Failed',
        retry: 'Retry',
        remove: 'Remove',
        clearAll: 'Clear all history',
        noHistory: 'No download history',
        mb: 'MB',
      },
      id: {
        pageTitle: 'AUTOLIVE YOUTUBE DOWNLOADER',
        subTitle: 'DOWNLOAD DARI YOUTUBE',
        description: 'Download video dari YouTube dengan mudah',
        backToDashboard: 'Dashboard',
        logout: 'Keluar',
        userName: 'Nama Pengguna',
        role: 'Hak Akses',
        activeUntil: 'Aktif sampai',
        downloadForm: 'Download Video',
        videoUrl: 'URL YouTube',
        urlPlaceholder: 'Masukkan URL YouTube (contoh: https://youtube.com/watch?v=...)',
        fetchInfo: 'Ambil Info Video',
        videoInfo: 'Info Video',
        title: 'Judul',
        channel: 'Channel',
        duration: 'Durasi',
        quality: 'Kualitas',
        format: 'Format',
        estimatedSize: 'Perkiraan ukuran',
        downloadBtn: 'Download',
        downloading: 'Mendownload',
        progress: 'Progres',
        speed: 'Kecepatan',
        historyTitle: 'Riwayat Download',
        searchHistory: 'Cari judul...',
        date: 'Tanggal',
        size: 'Ukuran',
        status: 'Status',
        success: 'Berhasil',
        failed: 'Gagal',
        retry: 'Ulangi',
        remove: 'Hapus',
        clearAll: 'Hapus semua riwayat',
        noHistory: 'Tidak ada riwayat download',
        mb: 'MB',
      }
    };
    return translations[language]?.[key] || key;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* HEADER - Sama seperti halaman lainnya */}
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
          {/* Kolom Kiri - Form Download */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Download className="w-5 h-5 text-red-500" /> {t('downloadForm')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('videoUrl')}</label>
                  <div className="flex gap-2">
                    <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t('urlPlaceholder')} className="flex-1 p-2 rounded-lg border" />
                    <button onClick={fetchVideoInfo} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90">{t('fetchInfo')}</button>
                  </div>
                </div>
                {videoInfo && (
                  <div className="border rounded-lg p-3 space-y-2">
                    <div className="flex gap-3">
                      <img src={videoInfo.thumbnail} alt="Thumbnail" className="w-24 h-16 object-cover rounded" />
                      <div>
                        <p className="font-semibold">{videoInfo.title}</p>
                        <p className="text-xs text-gray-500">{videoInfo.channel} • {videoInfo.duration}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium">{t('quality')}</label>
                        <select value={quality} onChange={(e) => setQuality(e.target.value)} className="w-full p-1 border rounded text-sm">
                          {videoInfo.formats.map((f: any) => (
                            <option key={f.quality} value={f.quality}>{f.quality}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium">{t('format')}</label>
                        <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full p-1 border rounded text-sm">
                          <option value="mp4">MP4</option>
                          <option value="mp3">MP3</option>
                          <option value="webm">WEBM</option>
                        </select>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">{t('estimatedSize')}: {getEstimatedSize()} {t('mb')}</p>
                    <button onClick={startDownload} disabled={downloading} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                      {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Youtube className="w-4 h-4" />}
                      {downloading ? t('downloading') : t('downloadBtn')}
                    </button>
                    {downloading && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs"><span>{t('progress')}: {Math.round(downloadProgress)}%</span><span>{downloadSpeed}</span></div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${downloadProgress}%` }}></div></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Kolom Kanan - Riwayat Download */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><History className="w-5 h-5 text-primary" /> {t('historyTitle')}</h3>
              <button onClick={clearAllHistory} className="text-xs text-red-500 hover:underline flex items-center gap-1"><Trash2 className="w-3 h-3" /> {t('clearAll')}</button>
            </div>
            <div className="mb-3 relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('searchHistory')} className="w-full pl-8 pr-2 py-1 border rounded-lg text-sm" />
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredHistory.length === 0 && <p className="text-center text-gray-500 py-8">{t('noHistory')}</p>}
              {filteredHistory.map((item) => (
                <div key={item.id} className="border rounded-lg p-2 hover:shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.title}</p>
                      <div className="flex flex-wrap gap-x-3 text-xs text-gray-500 mt-1">
                        <span>{item.quality}</span>
                        <span>{item.format.toUpperCase()}</span>
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                        <span>{item.size} {t('mb')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === 'success' ? (
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{t('success')}</span>
                      ) : (
                        <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{t('failed')}</span>
                      )}
                      <button onClick={() => deleteHistoryItem(item.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                  {item.status === 'failed' && <p className="text-xs text-red-500 mt-1">{item.error}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
