// frontend/app/dashboard/features/subtitle-generator/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Globe, Sun, Moon, LogOut, LayoutDashboard, Subtitles, 
  Upload, FileText, Download, Copy, Check, History, 
  Trash2, Search, Eye, Loader2, AlertCircle, Music, Video
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubtitleGeneratorPage() {
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
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [inputMethod, setInputMethod] = useState<'file' | 'url'>('file');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('same');
  const [subtitleStyle, setSubtitleStyle] = useState('standard');
  const [outputFormat, setOutputFormat] = useState('srt');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ text: string; srt: string; vtt: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // History
  const [history, setHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredHistory, setFilteredHistory] = useState<any[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

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
      { id: '1', filename: 'tutorial_ai.mp4', duration: '5:32', sourceLang: 'en', targetLang: 'same', date: new Date().toISOString(), status: 'success', text: 'Subtitle text example...' },
      { id: '2', filename: 'vlog_liburan.mp4', duration: '12:15', sourceLang: 'id', targetLang: 'same', date: new Date(Date.now() - 86400000).toISOString(), status: 'success', text: 'Subtitle text example...' },
      { id: '3', filename: 'podcast_gagal.mp3', duration: '45:00', sourceLang: 'en', targetLang: 'same', date: new Date(Date.now() - 172800000).toISOString(), status: 'failed', error: 'Duration too long for free tier' },
    ]);
    setFilteredHistory(history);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
        toast.error(language === 'en' ? 'Please select a video or audio file' : 'Pilih file video atau audio');
        return;
      }
      setFile(file);
    }
  };

  const generateSubtitles = async () => {
    if (inputMethod === 'file' && !file) {
      toast.error(language === 'en' ? 'Please select a file' : 'Pilih file');
      return;
    }
    if (inputMethod === 'url' && !url.trim()) {
      toast.error(language === 'en' ? 'Please enter a URL' : 'Masukkan URL');
      return;
    }
    setGenerating(true);
    setProgress(0);
    // Simulasi proses AI (nanti panggil API)
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setGenerating(false);
          // Mock result
          const mockText = `1\n00:00:01,000 --> 00:00:04,000\nHello world, this is an auto-generated subtitle.\n\n2\n00:00:05,000 --> 00:00:08,000\nIt supports multiple languages and styles.`;
          setResult({ text: mockText, srt: mockText, vtt: mockText.replace(/,/g, '.') });
          toast.success(language === 'en' ? 'Subtitles generated!' : 'Subtitle berhasil dibuat!');
          // Add to history
          const newHistory = {
            id: Date.now().toString(),
            filename: file ? file.name : url,
            duration: '0:30',
            sourceLang: sourceLang,
            targetLang: targetLang,
            date: new Date().toISOString(),
            status: 'success',
            text: mockText,
          };
          setHistory(prev => [newHistory, ...prev]);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const downloadSubtitle = (format: string) => {
    if (!result) return;
    let content = '';
    let filename = `subtitle.${format}`;
    if (format === 'srt') content = result.srt;
    else if (format === 'vtt') content = result.vtt;
    else content = result.text.replace(/\d+\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}\n/g, '').replace(/\n\n/g, '\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const urlBlob = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = urlBlob;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(urlBlob);
    toast.success(language === 'en' ? `Downloaded as ${format.toUpperCase()}` : `Diunduh sebagai ${format.toUpperCase()}`);
  };

  const copyText = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(language === 'en' ? 'Copied!' : 'Tersalin!');
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

  const t = (key: string) => {
    const translations: any = {
      en: {
        pageTitle: 'AUTOLIVE SUBTITLE GENERATOR',
        subTitle: 'GENERATE AUTO SUBTITLES',
        description: 'AI-powered subtitle generation for videos',
        backToDashboard: 'Dashboard',
        logout: 'Logout',
        userName: 'Username',
        role: 'Role',
        activeUntil: 'Active until',
        generateForm: 'Generate Subtitles',
        inputMethod: 'Input Method',
        file: 'Upload File',
        url: 'Video URL',
        chooseFile: 'Choose video/audio file',
        urlPlaceholder: 'YouTube, TikTok, or direct video URL',
        sourceLang: 'Source Language',
        targetLang: 'Target Language (optional)',
        sameAsSource: 'Same as source',
        subtitleStyle: 'Subtitle Style',
        styleStandard: 'Standard',
        styleUppercase: 'Uppercase',
        styleLowercase: 'Lowercase',
        styleEmoji: 'With emojis',
        outputFormat: 'Output Format',
        generateBtn: 'Generate Subtitles',
        generating: 'AI is processing...',
        progress: 'Progress',
        results: 'Generated Subtitles',
        downloadSrt: 'Download SRT',
        downloadVtt: 'Download VTT',
        downloadTxt: 'Download TXT',
        copyText: 'Copy Text',
        copied: 'Copied!',
        historyTitle: 'Generation History',
        searchHistory: 'Search filename...',
        date: 'Date',
        filename: 'Filename',
        duration: 'Duration',
        language: 'Language',
        status: 'Status',
        success: 'Success',
        failed: 'Failed',
        action: 'Action',
        view: 'View',
        remove: 'Remove',
        clearAll: 'Clear all history',
        noHistory: 'No generation history',
        modalTitle: 'Generated Subtitles',
        close: 'Close',
      },
      id: {
        pageTitle: 'AUTOLIVE SUBTITLE GENERATOR',
        subTitle: 'GENERATE SUBTITLE OTOMATIS',
        description: 'Pembuatan subtitle otomatis untuk video dengan AI',
        backToDashboard: 'Dashboard',
        logout: 'Keluar',
        userName: 'Nama Pengguna',
        role: 'Hak Akses',
        activeUntil: 'Aktif sampai',
        generateForm: 'Generate Subtitle',
        inputMethod: 'Metode Input',
        file: 'Upload File',
        url: 'URL Video',
        chooseFile: 'Pilih file video/audio',
        urlPlaceholder: 'URL YouTube, TikTok, atau video langsung',
        sourceLang: 'Bahasa Sumber',
        targetLang: 'Bahasa Target (opsional)',
        sameAsSource: 'Sama dengan sumber',
        subtitleStyle: 'Gaya Subtitle',
        styleStandard: 'Standar',
        styleUppercase: 'Huruf besar',
        styleLowercase: 'Huruf kecil',
        styleEmoji: 'Dengan emoji',
        outputFormat: 'Format Output',
        generateBtn: 'Generate Subtitle',
        generating: 'AI sedang memproses...',
        progress: 'Progres',
        results: 'Subtitle Dihasilkan',
        downloadSrt: 'Download SRT',
        downloadVtt: 'Download VTT',
        downloadTxt: 'Download TXT',
        copyText: 'Salin Teks',
        copied: 'Tersalin!',
        historyTitle: 'Riwayat Generate',
        searchHistory: 'Cari nama file...',
        date: 'Tanggal',
        filename: 'Nama File',
        duration: 'Durasi',
        language: 'Bahasa',
        status: 'Status',
        success: 'Berhasil',
        failed: 'Gagal',
        action: 'Aksi',
        view: 'Lihat',
        remove: 'Hapus',
        clearAll: 'Hapus semua riwayat',
        noHistory: 'Tidak ada riwayat generate',
        modalTitle: 'Subtitle Dihasilkan',
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
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Subtitles className="w-5 h-5 text-green-500" /> {t('generateForm')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('inputMethod')}</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2"><input type="radio" value="file" checked={inputMethod === 'file'} onChange={() => setInputMethod('file')} /> {t('file')}</label>
                    <label className="flex items-center gap-2"><input type="radio" value="url" checked={inputMethod === 'url'} onChange={() => setInputMethod('url')} /> {t('url')}</label>
                  </div>
                </div>
                {inputMethod === 'file' ? (
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('chooseFile')}</label>
                    <input type="file" accept="video/*,audio/*" onChange={handleFileChange} className="w-full p-2 border rounded-lg" />
                    {file && <p className="text-xs text-gray-500 mt-1">{file.name} ({(file.size / (1024*1024)).toFixed(2)} MB)</p>}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('url')}</label>
                    <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t('urlPlaceholder')} className="w-full p-2 rounded-lg border" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('sourceLang')}</label>
                    <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} className="w-full p-2 rounded-lg border">
                      <option value="auto">Auto-detect</option>
                      <option value="id">Indonesia</option>
                      <option value="en">English</option>
                      <option value="zh">Mandarin</option>
                      <option value="hi">Hindi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('targetLang')}</label>
                    <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="w-full p-2 rounded-lg border">
                      <option value="same">{t('sameAsSource')}</option>
                      <option value="id">Indonesia</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('subtitleStyle')}</label>
                    <select value={subtitleStyle} onChange={(e) => setSubtitleStyle(e.target.value)} className="w-full p-2 rounded-lg border">
                      <option value="standard">{t('styleStandard')}</option>
                      <option value="uppercase">{t('styleUppercase')}</option>
                      <option value="lowercase">{t('styleLowercase')}</option>
                      <option value="emoji">{t('styleEmoji')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('outputFormat')}</label>
                    <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} className="w-full p-2 rounded-lg border">
                      <option value="srt">SRT</option>
                      <option value="vtt">VTT</option>
                      <option value="txt">TXT</option>
                    </select>
                  </div>
                </div>
                <button onClick={generateSubtitles} disabled={generating} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Subtitles className="w-4 h-4" />}
                  {generating ? t('generating') : t('generateBtn')}
                </button>
                {generating && (
                  <div>
                    <div className="flex justify-between text-sm mb-1"><span>{t('progress')}</span><span>{progress}%</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div></div>
                  </div>
                )}
              </div>

              {result && (
                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">{t('results')}</h4>
                    <div className="flex gap-2">
                      <button onClick={() => downloadSubtitle('srt')} className="text-xs bg-blue-500 text-white px-2 py-1 rounded">{t('downloadSrt')}</button>
                      <button onClick={() => downloadSubtitle('vtt')} className="text-xs bg-blue-500 text-white px-2 py-1 rounded">{t('downloadVtt')}</button>
                      <button onClick={() => downloadSubtitle('txt')} className="text-xs bg-blue-500 text-white px-2 py-1 rounded">{t('downloadTxt')}</button>
                      <button onClick={copyText} className="text-xs bg-gray-500 text-white px-2 py-1 rounded flex items-center gap-1">{copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{t('copyText')}</button>
                    </div>
                  </div>
                  <pre className="p-3 bg-gray-100 dark:bg-gray-900 rounded-lg text-xs overflow-x-auto max-h-64">{result.text}</pre>
                </div>
              )}
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
                        <span>{item.sourceLang.toUpperCase()}</span>
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
      {showModal && selectedHistory && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('modalTitle')}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">✕</button>
            </div>
            <pre className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs overflow-x-auto">{selectedHistory.text}</pre>
            <button onClick={() => setShowModal(false)} className="mt-4 w-full bg-primary text-white py-2 rounded-lg">{t('close')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
