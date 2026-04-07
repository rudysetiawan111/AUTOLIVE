// frontend/app/dashboard/features/video-clipper/page.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Globe, Sun, Moon, LogOut, LayoutDashboard, Scissors, 
  Upload, Download, History, Trash2, Search, Eye, 
  Loader2, Video, Clock, Check, AlertCircle, Play, Pause
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function VideoClipperPage() {
  const router = useRouter();
  const supabase = createClient();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  // User info
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [subscriptionExpiry, setSubscriptionExpiry] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState('');

  // Video state
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [clipMode, setClipMode] = useState<'preset' | 'custom'>('preset');
  const [presetDuration, setPresetDuration] = useState(30);
  const [customStart, setCustomStart] = useState(0);
  const [customEnd, setCustomEnd] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // History
  const [history, setHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredHistory, setFilteredHistory] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<any>(null);

  const presetOptions = [15, 30, 60, 90, 120, 150];

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
      setFilteredHistory(history.filter(item => 
        item.filename.toLowerCase().includes(searchTerm.toLowerCase())
      ));
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
    // Mock history (nanti panggil API)
    setHistory([
      { id: '1', filename: 'tutorial_ai.mp4', duration: '0:30', date: new Date().toISOString(), status: 'success', outputUrl: '#' },
      { id: '2', filename: 'vlog_liburan.mp4', duration: '1:00', date: new Date(Date.now() - 86400000).toISOString(), status: 'success', outputUrl: '#' },
      { id: '3', filename: 'long_video.mp4', duration: '2:30', date: new Date(Date.now() - 172800000).toISOString(), status: 'failed', error: 'Processing timeout' },
    ]);
    setFilteredHistory(history);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('video/')) {
        toast.error(language === 'en' ? 'Please select a video file' : 'Pilih file video');
        return;
      }
      setFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setResultUrl(null);
      // Reset duration when new file loaded
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        setVideoDuration(video.duration);
        setCustomEnd(Math.min(video.duration, 30));
        URL.revokeObjectURL(video.src);
      };
      video.src = url;
    }
  };

  const startProcessing = () => {
    if (!file) {
      toast.error(language === 'en' ? 'Please upload a video first' : 'Upload video terlebih dahulu');
      return;
    }
    let start = 0, end = 0;
    if (clipMode === 'preset') {
      start = 0;
      end = Math.min(presetDuration, videoDuration);
    } else {
      start = customStart;
      end = Math.min(customEnd, videoDuration);
      if (start >= end) {
        toast.error(language === 'en' ? 'Invalid start/end time' : 'Waktu awal dan akhir tidak valid');
        return;
      }
    }
    setProcessing(true);
    setProgress(0);
    // Simulasi proses clipping (nanti panggil API)
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setProcessing(false);
          // Mock result URL (simulasi)
          const mockOutputUrl = URL.createObjectURL(file);
          setResultUrl(mockOutputUrl);
          toast.success(language === 'en' ? 'Video clipped successfully!' : 'Video berhasil dipotong!');
          // Tambah ke riwayat
          const newHistory = {
            id: Date.now().toString(),
            filename: file.name,
            duration: `${end - start} sec`,
            date: new Date().toISOString(),
            status: 'success',
            outputUrl: mockOutputUrl,
          };
          setHistory(prev => [newHistory, ...prev]);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const downloadResult = () => {
    if (resultUrl) {
      const a = document.createElement('a');
      a.href = resultUrl;
      a.download = `clipped_${file?.name || 'video'}.mp4`;
      a.click();
      toast.success(language === 'en' ? 'Download started' : 'Download dimulai');
    }
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    toast.success(language === 'en' ? 'Item removed' : 'Item dihapus');
  };

  const clearAllHistory = () => {
    if (confirm(language === 'en' ? 'Delete all history?' : 'Hapus semua riwayat?')) {
      setHistory([]);
      toast.success(language === 'en' ? 'All history cleared' : 'Semua riwayat dihapus');
    }
  };

  const viewHistoryDetail = (item: any) => {
    setSelectedHistory(item);
    setShowModal(true);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const t = (key: string) => {
    const translations: any = {
      en: {
        pageTitle: 'AUTOLIVE VIDEO CLIPPER',
        subTitle: 'CLIP, CROP & EDIT VIDEOS',
        description: 'Trim, crop, and enhance your videos',
        backToDashboard: 'Dashboard',
        logout: 'Logout',
        userName: 'Username',
        role: 'Role',
        activeUntil: 'Active until',
        uploadVideo: 'Upload Video',
        chooseFile: 'Choose video file (MP4, MOV, AVI)',
        preview: 'Preview',
        clipMode: 'Clipping Mode',
        preset: 'Preset Duration',
        custom: 'Custom Range',
        durationSeconds: 'Duration (seconds)',
        startTime: 'Start (sec)',
        endTime: 'End (sec)',
        processBtn: 'Process Clip',
        processing: 'Processing...',
        progress: 'Progress',
        downloadResult: 'Download Result',
        historyTitle: 'Project History',
        searchHistory: 'Search filename...',
        filename: 'Filename',
        duration: 'Duration',
        date: 'Date',
        status: 'Status',
        success: 'Success',
        failed: 'Failed',
        action: 'Action',
        view: 'View',
        remove: 'Remove',
        clearAll: 'Clear all history',
        noHistory: 'No project history',
        modalTitle: 'Clipped Video',
        close: 'Close',
      },
      id: {
        pageTitle: 'AUTOLIVE VIDEO CLIPPER',
        subTitle: 'POTONG, CROP & EDIT VIDEO',
        description: 'Potong, crop, dan edit video Anda',
        backToDashboard: 'Dashboard',
        logout: 'Keluar',
        userName: 'Nama Pengguna',
        role: 'Hak Akses',
        activeUntil: 'Aktif sampai',
        uploadVideo: 'Upload Video',
        chooseFile: 'Pilih file video (MP4, MOV, AVI)',
        preview: 'Pratinjau',
        clipMode: 'Mode Pemotongan',
        preset: 'Durasi Preset',
        custom: 'Rentang Kustom',
        durationSeconds: 'Durasi (detik)',
        startTime: 'Mulai (detik)',
        endTime: 'Akhir (detik)',
        processBtn: 'Proses Clip',
        processing: 'Memproses...',
        progress: 'Progres',
        downloadResult: 'Download Hasil',
        historyTitle: 'Riwayat Proyek',
        searchHistory: 'Cari nama file...',
        filename: 'Nama File',
        duration: 'Durasi',
        date: 'Tanggal',
        status: 'Status',
        success: 'Berhasil',
        failed: 'Gagal',
        action: 'Aksi',
        view: 'Lihat',
        remove: 'Hapus',
        clearAll: 'Hapus semua riwayat',
        noHistory: 'Tidak ada riwayat proyek',
        modalTitle: 'Video Hasil Clip',
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
          {/* Kolom Kiri - Editor */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Scissors className="w-5 h-5 text-orange-500" /> {t('uploadVideo')}</h3>
              <div className="space-y-4">
                <div>
                  <input type="file" accept="video/*" onChange={handleFileChange} className="w-full p-2 border rounded-lg" />
                </div>
                {videoUrl && (
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('preview')}</label>
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      <video ref={videoRef} src={videoUrl} className="w-full max-h-64 object-contain" controls={false} />
                      <button onClick={togglePlay} className="absolute bottom-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70">
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Duration: {videoDuration.toFixed(1)} sec</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <label className="block text-sm font-medium mb-2">{t('clipMode')}</label>
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center gap-2"><input type="radio" value="preset" checked={clipMode === 'preset'} onChange={() => setClipMode('preset')} /> {t('preset')}</label>
                    <label className="flex items-center gap-2"><input type="radio" value="custom" checked={clipMode === 'custom'} onChange={() => setClipMode('custom')} /> {t('custom')}</label>
                  </div>
                  {clipMode === 'preset' ? (
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('durationSeconds')}</label>
                      <div className="flex flex-wrap gap-2">
                        {presetOptions.map(sec => (
                          <button
                            key={sec}
                            onClick={() => setPresetDuration(sec)}
                            className={`px-3 py-1 rounded-full text-sm ${presetDuration === sec ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                          >
                            {sec}s
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">{t('startTime')}</label>
                        <input type="number" value={customStart} onChange={(e) => setCustomStart(Number(e.target.value))} step="0.5" min="0" max={videoDuration} className="w-full p-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">{t('endTime')}</label>
                        <input type="number" value={customEnd} onChange={(e) => setCustomEnd(Number(e.target.value))} step="0.5" min="0" max={videoDuration} className="w-full p-2 border rounded-lg" />
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={startProcessing} disabled={processing || !videoUrl} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
                  {processing ? t('processing') : t('processBtn')}
                </button>
                {processing && (
                  <div>
                    <div className="flex justify-between text-sm mb-1"><span>{t('progress')}</span><span>{progress}%</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-orange-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div></div>
                  </div>
                )}
                {resultUrl && (
                  <div className="mt-4 pt-4 border-t">
                    <video src={resultUrl} className="w-full max-h-48 object-contain rounded" controls />
                    <button onClick={downloadResult} className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" /> {t('downloadResult')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Kolom Kanan - Riwayat */}
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
                      <p className="font-medium text-sm">{item.filename}</p>
                      <div className="flex flex-wrap gap-x-3 text-xs text-gray-500 mt-1">
                        <span>{item.duration}</span>
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === 'success' ? (
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{t('success')}</span>
                      ) : (
                        <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{t('failed')}</span>
                      )}
                      <button onClick={() => viewHistoryDetail(item)} className="text-primary hover:underline text-xs"><Eye className="w-3 h-3" /></button>
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

      {/* Modal Detail Riwayat */}
      {showModal && selectedHistory && selectedHistory.status === 'success' && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('modalTitle')}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">✕</button>
            </div>
            <video src={selectedHistory.outputUrl} className="w-full rounded-lg" controls />
            <button onClick={() => setShowModal(false)} className="mt-4 w-full bg-primary text-white py-2 rounded-lg">{t('close')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
