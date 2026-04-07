// frontend/app/dashboard/features/title-generator/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Globe, Sun, Moon, LogOut, LayoutDashboard, Sparkles, 
  Copy, Check, History, Trash2, Search, Eye, 
  Youtube, Music, Instagram, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TitleGeneratorPage() {
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
  const [keyword, setKeyword] = useState('');
  const [platform, setPlatform] = useState('all');
  const [tone, setTone] = useState('interesting');
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [titles, setTitles] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

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
        item.keyword.toLowerCase().includes(searchTerm.toLowerCase())
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
      { id: '1', keyword: 'Tutorial AI', platform: 'youtube', tone: 'interesting', count: 5, date: new Date().toISOString(), titles: ['AI untuk Pemula', 'Tutorial AI Terbaru', 'Belajar AI dalam 10 Menit'] },
      { id: '2', keyword: 'Masakan Viral', platform: 'tiktok', tone: 'funny', count: 3, date: new Date(Date.now() - 86400000).toISOString(), titles: ['Resep Viral', 'Masakan Kekinian', 'Cooking Hack'] },
      { id: '3', keyword: 'OOTD Fashion', platform: 'instagram', tone: 'professional', count: 10, date: new Date(Date.now() - 172800000).toISOString(), titles: ['Style Inspo', 'Fashion Tips', 'OOTD Harian', 'Outfit Ideas'] },
    ]);
    setFilteredHistory(history);
  };

  const generateTitles = async () => {
    if (!keyword.trim()) {
      toast.error(language === 'en' ? 'Please enter a keyword' : 'Masukkan kata kunci');
      return;
    }
    setGenerating(true);
    // Simulasi AI call
    setTimeout(() => {
      const mockTitles = [];
      const platformNames = { youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram', all: 'Social Media' };
      for (let i = 0; i < count; i++) {
        mockTitles.push(`${keyword} - ${platformNames[platform as keyof typeof platformNames]} Title ${i+1} (${tone} tone)`);
      }
      setTitles(mockTitles);
      setGenerating(false);
      toast.success(language === 'en' ? `${count} titles generated!` : `${count} judul dihasilkan!`);
      // Add to history (mock)
      const newHistory = {
        id: Date.now().toString(),
        keyword: keyword,
        platform: platform,
        tone: tone,
        count: count,
        date: new Date().toISOString(),
        titles: mockTitles,
      };
      setHistory(prev => [newHistory, ...prev]);
    }, 1500);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success(language === 'en' ? 'Copied!' : 'Tersalin!');
  };

  const copyAllTitles = () => {
    if (titles.length === 0) return;
    const allText = titles.join('\n');
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
    toast.success(language === 'en' ? 'All titles copied!' : 'Semua judul tersalin!');
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
        pageTitle: 'AUTOLIVE TITLE GENERATOR',
        subTitle: 'GENERATE VIRAL TITLES',
        description: 'AI-powered title generation for YouTube, TikTok, Reels',
        backToDashboard: 'Dashboard',
        logout: 'Logout',
        userName: 'Username',
        role: 'Role',
        activeUntil: 'Active until',
        generateForm: 'Generate Title',
        keyword: 'Keyword / Topic',
        keywordPlaceholder: 'Enter keyword (e.g., "AI tutorial", "viral recipe")',
        platform: 'Platform',
        tone: 'Tone / Style',
        toneInteresting: 'Interesting (Clickbait)',
        toneProfessional: 'Professional',
        toneFunny: 'Funny',
        toneInspirational: 'Inspirational',
        toneShort: 'Short (SEO)',
        count: 'Number of titles',
        generateBtn: 'Generate Titles',
        generating: 'AI is thinking...',
        results: 'Generated Titles',
        copy: 'Copy',
        copyAll: 'Copy All',
        historyTitle: 'Generation History',
        searchHistory: 'Search keyword...',
        date: 'Date',
        keywordCol: 'Keyword',
        platformCol: 'Platform',
        countCol: 'Count',
        action: 'Action',
        viewDetail: 'View',
        remove: 'Remove',
        clearAll: 'Clear all history',
        noHistory: 'No generation history',
        modalTitle: 'Generated Titles',
        close: 'Close',
      },
      id: {
        pageTitle: 'AUTOLIVE TITLE GENERATOR',
        subTitle: 'GENERATE JUDUL VIRAL',
        description: 'Pembuatan judul bertenaga AI untuk YouTube, TikTok, Reels',
        backToDashboard: 'Dashboard',
        logout: 'Keluar',
        userName: 'Nama Pengguna',
        role: 'Hak Akses',
        activeUntil: 'Aktif sampai',
        generateForm: 'Generate Judul',
        keyword: 'Kata Kunci / Topik',
        keywordPlaceholder: 'Masukkan kata kunci (contoh: "tutorial AI", "resep viral")',
        platform: 'Platform',
        tone: 'Gaya / Nada',
        toneInteresting: 'Menarik (Clickbait)',
        toneProfessional: 'Profesional',
        toneFunny: 'Lucu',
        toneInspirational: 'Inspiratif',
        toneShort: 'Singkat (SEO)',
        count: 'Jumlah judul',
        generateBtn: 'Generate Judul',
        generating: 'AI sedang berpikir...',
        results: 'Judul Dihasilkan',
        copy: 'Salin',
        copyAll: 'Salin Semua',
        historyTitle: 'Riwayat Generate',
        searchHistory: 'Cari kata kunci...',
        date: 'Tanggal',
        keywordCol: 'Kata Kunci',
        platformCol: 'Platform',
        countCol: 'Jumlah',
        action: 'Aksi',
        viewDetail: 'Lihat',
        remove: 'Hapus',
        clearAll: 'Hapus semua riwayat',
        noHistory: 'Tidak ada riwayat generate',
        modalTitle: 'Judul Dihasilkan',
        close: 'Tutup',
      }
    };
    return translations[language]?.[key] || key;
  };

  const getPlatformIcon = (plat: string) => {
    if (plat === 'youtube') return <Youtube className="w-4 h-4 text-red-500" />;
    if (plat === 'tiktok') return <Music className="w-4 h-4 text-black dark:text-white" />;
    if (plat === 'instagram') return <Instagram className="w-4 h-4 text-pink-500" />;
    return <Globe className="w-4 h-4 text-gray-500" />;
  };

  const getToneName = (toneKey: string) => {
    const tones: any = {
      interesting: t('toneInteresting'),
      professional: t('toneProfessional'),
      funny: t('toneFunny'),
      inspirational: t('toneInspirational'),
      short: t('toneShort'),
    };
    return tones[toneKey] || toneKey;
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
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500" /> {t('generateForm')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('keyword')}</label>
                  <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={t('keywordPlaceholder')} className="w-full p-2 rounded-lg border" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('platform')}</label>
                    <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full p-2 rounded-lg border">
                      <option value="all">All Platforms</option>
                      <option value="youtube">YouTube</option>
                      <option value="tiktok">TikTok</option>
                      <option value="instagram">Instagram Reels</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('tone')}</label>
                    <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full p-2 rounded-lg border">
                      <option value="interesting">{t('toneInteresting')}</option>
                      <option value="professional">{t('toneProfessional')}</option>
                      <option value="funny">{t('toneFunny')}</option>
                      <option value="inspirational">{t('toneInspirational')}</option>
                      <option value="short">{t('toneShort')}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('count')}</label>
                  <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full p-2 rounded-lg border">
                    <option value={3}>3</option>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>
                <button onClick={generateTitles} disabled={generating} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {generating ? t('generating') : t('generateBtn')}
                </button>
              </div>

              {titles.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">{t('results')}</h4>
                    <button onClick={copyAllTitles} className="text-xs text-primary hover:underline flex items-center gap-1">
                      {copiedAll ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedAll ? t('copied') : t('copyAll')}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {titles.map((title, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <span className="text-sm">{title}</span>
                        <button onClick={() => copyToClipboard(title, idx)} className="text-primary hover:underline text-xs flex items-center gap-1">
                          {copiedIndex === idx ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedIndex === idx ? t('copied') : t('copy')}
                        </button>
                      </div>
                    ))}
                  </div>
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
                      <p className="font-medium text-sm">{item.keyword}</p>
                      <div className="flex flex-wrap gap-x-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1">{getPlatformIcon(item.platform)} {item.platform}</span>
                        <span>{getToneName(item.tone)}</span>
                        <span>{item.count} titles</span>
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => viewHistoryDetail(item)} className="text-primary hover:underline text-xs flex items-center gap-1"><Eye className="w-3 h-3" /> {t('viewDetail')}</button>
                      <button onClick={() => deleteHistoryItem(item.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
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
            <div className="space-y-2">
              {selectedHistory.titles.map((title: string, idx: number) => (
                <div key={idx} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">{title}</div>
              ))}
            </div>
            <button onClick={() => setShowModal(false)} className="mt-4 w-full bg-primary text-white py-2 rounded-lg">{t('close')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
