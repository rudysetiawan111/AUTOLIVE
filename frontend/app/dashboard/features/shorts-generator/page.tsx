// frontend/app/dashboard/features/shorts-generator/page.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Globe, Sun, Moon, LogOut, LayoutDashboard, Video, 
  Upload, Download, History, Trash2, Search, Eye, 
  Loader2, Music, Type, Check, AlertCircle, Play, Pause,
  FileVideo, Layers, Zap, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShortsGeneratorPage() {
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
  const [shorts, setShorts] = useState<{ id: number; url: string; duration: number }[]>([]);
  
  // Form state
  const [shortDuration, setShortDuration] = useState(30); // 15, 30, 60
  const [method, setMethod] = useState<'auto' | 'manual'>('auto');
  const [shortCount, setShortCount] = useState(3);
  const [customStart, setCustomStart] = useState(0);
  const [customEnd, setCustomEnd] = useState(30);
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [addMusic, setAddMusic] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState('none');
  const [addText, setAddText] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // History
  const [history, setHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredHistory, setFilteredHistory] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<any>(null);

  const durationOptions = [15, 30, 60];
  const aspectOptions = ['9:16', '1:1', '16:9'];
  const musicOptions = ['none', 'background1', 'background2', 'upbeat'];

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
      { id: '1', filename: 'tutorial_ai.mp4', shortsCount: 3, date: new Date().toISOString(), status: 'success' },
      { id: '2', filename: 'vlog_liburan.mp4', shortsCount: 2, date: new Date(Date.now() - 86400000).toISOString(), status: 'success' },
      { id: '3', filename: 'long_video.mp4', shortsCount: 0, date: new Date(Date.now() - 172800000).toISOString(), status: 'failed', error: 'Video too short' },
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
      setShorts([]);
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

  const startGeneration = () => {
    if (!file) {
      toast.error(language === 'en' ? 'Please upload a video first' : 'Upload video terlebih dahulu');
      return;
    }
    if (method === 'manual' && customStart >= customEnd) {
      toast.error(language === 'en' ? 'Invalid start/end time' : 'Waktu awal dan akhir tidak valid');
      return;
    }
    if (method === 'auto' && shortDuration * shortCount > videoDuration) {
      toast.error(language === 'en' ? 'Video duration too short for requested shorts' : 'Durasi video terlalu pendek untuk jumlah shorts yang diminta');
      return;
    }
    setProcessing(true);
    setProgress(0);
    setShorts([]);
    // Simulasi proses generate shorts (nanti panggil API)
    const totalSteps = method === 'auto' ? shortCount : 1;
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setProgress(Math.floor((currentStep / totalSteps) * 100));
      if (currentStep >= totalSteps) {
        clearInterval(interval);
        setProcessing(false);
        // Mock shorts result
        const mockShorts = [];
        for (let i = 0; i < totalSteps; i++) {
          mockShorts.push({
            id: i,
            url: URL.createObjectURL(file),
            duration: shortDuration,
          });
        }
        setShorts(mockShorts);
        toast.success(language === 'en' ? `${totalSteps} shorts generated!` : `${totalSteps} shorts berhasil dibuat!`);
        // Add to history
        const newHistory = {
          id: Date.now().toString(),
          filename: file.name,
          shortsCount: totalSteps,
          date: new Date().toISOString(),
          status: 'success',
        };
        setHistory(prev => [newHistory, ...prev]);
      }
    }, 800);
  };

  const downloadShort = (short: any) => {
    const a = document.createElement('a');
    a.href = short.url;
    a.download = `short_${short.id+1}.mp4`;
    a.click();
    toast.success(language === 'en' ? 'Download started' : 'Download dimulai');
  };

  const downloadAll = () => {
    // For mock, download first short only (in real app, zip all)
    if (shorts.length > 0) downloadShort(shorts[0]);
    toast.info(language === 'en' ? 'In production, all shorts would be zipped' : 'Pada production, semua shorts akan di-zip');
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
        pageTitle: 'AUTOLIVE SHORTS GENERATOR',
        subTitle: 'CREATE VIRAL SHORTS FROM LONG VIDEOS',
        description: 'AI-powered short video extraction and editing',
        backToDashboard: 'Dashboard',
        logout: 'Logout',
        userName: 'Username',
        role: 'Role',
        activeUntil: 'Active until',
        uploadVideo: 'Upload Video',
        chooseFile: 'Choose video file (MP4, MOV)',
        preview: 'Preview',
        shortSettings: 'Short Settings',
        duration: 'Short Duration',
        method: 'Extraction Method',
        auto: 'Automatic (AI finds highlights)',
        manual: 'Manual (select range)',
        numberOfShorts: 'Number of Shorts',
        startTime: 'Start (sec)',
        endTime: 'End (sec)',
        aspectRatio: 'Aspect Ratio',
        addMusic: 'Add Background Music',
        musicLibrary: 'Music Track',
        addText: 'Add Text Overlay',
        textContent: 'Text content',
        generateBtn: 'Generate Shorts',
        processing: 'Processing...',
        progress: 'Progress',
        results: 'Generated Shorts',
        downloadShort: 'Download',
        downloadAll: 'Download All',
        historyTitle: 'Generation History',
        searchHistory: 'Search filename...',
        filename: 'Filename',
        shortsCount: 'Shorts',
        date: 'Date',
        status: 'Status',
        success: 'Success',
        failed: 'Failed',
        action: 'Action',
        view: 'View',
        remove: 'Remove',
        clearAll: 'Clear all history',
        noHistory: 'No generation history',
        modalTitle: 'Generated Shorts',
        close: 'Close',
      },
      id: {
        pageTitle: 'AUTOLIVE SHORTS GENERATOR',
        subTitle: 'BUAT SHORTS VIRAL DARI VIDEO PANJANG',
        description: 'Ekstraksi dan edit video pendek bertenaga AI',
        backToDashboard: 'Dashboard',
        logout: 'Keluar',
        userName: 'Nama Pengguna',
        role: 'Hak Akses',
        activeUntil: 'Aktif sampai',
        uploadVideo: 'Upload Video',
        chooseFile: 'Pilih file video (MP4, MOV)',
        preview: 'Pratinjau',
        shortSettings: 'Pengaturan Shorts',
        duration: 'Durasi Shorts',
        method: 'Metode Ekstraksi',
        auto: 'Otomatis (AI cari bagian menarik)',
        manual: 'Manual (pilih rentang)',
        numberOfShorts: 'Jumlah Shorts',
        startTime: 'Mulai (detik)',
        endTime: 'Akhir (detik)',
        aspectRatio: 'Rasio Aspek',
        addMusic: 'Tambahkan Musik Latar',
        musicLibrary: 'Lagu',
        addText: 'Tambahkan Teks',
        textContent: 'Teks',
        generateBtn: 'Generate Shorts',
        processing: 'Memproses...',
        progress: 'Progres',
        results: 'Hasil Shorts',
        downloadShort: 'Download',
        downloadAll: 'Download Semua',
        historyTitle: 'Riwayat Generate',
        searchHistory: 'Cari nama file...',
        filename: 'Nama File',
        shortsCount: 'Shorts',
        date: 'Tanggal',
        status: 'Status',
        success: 'Berhasil',
        failed: 'Gagal',
        action: 'Aksi',
        view: 'Lihat',
        remove: 'Hapus',
        clearAll: 'Hapus semua riwayat',
        noHistory: 'Tidak ada riwayat generate',
        modalTitle: 'Hasil Shorts',
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
          {/* Kolom Kiri - Generator */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-purple-500" /> {t('uploadVideo')}</h3>
              <div className="space-y-4">
                <div>
                  <input type="file" accept="video/*" onChange={handleFileChange} className="w-full p-2 border rounded-lg" />
                </div>
                {videoUrl && (
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('preview')}</label>
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      <video ref={videoRef} src={videoUrl} className="w-full max-h-48 object-contain" controls={false} />
                      <button onClick={togglePlay} className="absolute bottom-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70">
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Duration: {videoDuration.toFixed(1)} sec</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">{t('shortSettings')}</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('duration')}</label>
                      <div className="flex gap-2">
                        {durationOptions.map(sec => (
                          <button
                            key={sec}
                            onClick={() => setShortDuration(sec)}
                            className={`px-3 py-1 rounded-full text-sm ${shortDuration === sec ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                          >
                            {sec}s
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">{t('method')}</label>
                      <div className="flex gap-4 mb-2">
                        <label className="flex items-center gap-2"><input type="radio" value="auto" checked={method === 'auto'} onChange={() => setMethod('auto')} /> {t('auto')}</label>
                        <label className="flex items-center gap-2"><input type="radio" value="manual" checked={method === 'manual'} onChange={() => setMethod('manual')} /> {t('manual')}</label>
                      </div>
                      {method === 'auto' ? (
                        <div>
                          <label className="block text-sm font-medium mb-1">{t('numberOfShorts')}</label>
                          <select value={shortCount} onChange={(e) => setShortCount(Number(e.target.value))} className="w-full p-2 border rounded-lg">
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={5}>5</option>
                          </select>
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

                    <div>
                      <label className="block text-sm font-medium mb-1">{t('aspectRatio')}</label>
                      <div className="flex gap-2">
                        {aspectOptions.map(ratio => (
                          <button
                            key={ratio}
                            onClick={() => setAspectRatio(ratio)}
                            className={`px-3 py-1 rounded-full text-sm ${aspectRatio === ratio ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                          >
                            {ratio}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 mb-2"><input type="checkbox" checked={addMusic} onChange={(e) => setAddMusic(e.target.checked)} /> {t('addMusic')}</label>
                      {addMusic && (
                        <select value={selectedMusic} onChange={(e) => setSelectedMusic(e.target.value)} className="w-full p-2 border rounded-lg">
                          <option value="none">None</option>
                          <option value="background1">Background 1</option>
                          <option value="background2">Background 2</option>
                          <option value="upbeat">Upbeat</option>
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-2 mb-2"><input type="checkbox" checked={addText} onChange={(e) => setAddText(e.target.checked)} /> {t('addText')}</label>
                      {addText && (
                        <input type="text" value={textContent} onChange={(e) => setTextContent(e.target.value)} placeholder="Text overlay" className="w-full p-2 border rounded-lg" />
                      )}
                    </div>

                    <button onClick={startGeneration} disabled={processing || !videoUrl} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                      {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {processing ? t('processing') : t('generateBtn')}
                    </button>
                    {processing && (
                      <div>
                        <div className="flex justify-between text-sm mb-1"><span>{t('progress')}</span><span>{progress}%</span></div>
                        <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-purple-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div></div>
                      </div>
                    )}

                    {shorts.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium">{t('results')}</h4>
                          <button onClick={downloadAll} className="text-sm bg-primary text-white px-3 py-1 rounded">{t('downloadAll')}</button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {shorts.map((short) => (
                            <div key={short.id} className="border rounded-lg p-2">
                              <video src={short.url} className="w-full h-24 object-cover rounded" />
                              <p className="text-xs text-center mt-1">{short.duration}s</p>
                              <button onClick={() => downloadShort(short)} className="w-full mt-1 text-xs bg-gray-200 dark:bg-gray-700 py-1 rounded">{t('downloadShort')}</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
                        <span>{item.shortsCount} shorts</span>
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
            <p className="text-sm text-gray-600 mb-3">{selectedHistory.filename} - {selectedHistory.shortsCount} shorts</p>
            <p className="text-xs text-gray-500">Preview not available in mock; in production would show short clips.</p>
            <button onClick={() => setShowModal(false)} className="mt-4 w-full bg-primary text-white py-2 rounded-lg">{t('close')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
