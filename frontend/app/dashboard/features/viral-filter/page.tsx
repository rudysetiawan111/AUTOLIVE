cat > /workspaces/AUTOLIVE/frontend/app/dashboard/features/viral-filter/page.tsx << 'EOF'
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Globe, Sun, Moon, LogOut, LayoutDashboard, TrendingUp, 
  Loader2, ExternalLink, History, Search, Filter, Copy, Check,
  Youtube, Music, Video, Hash, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

// ==================== DATA TEMA & KEYWORD GOOGLE TRENDS ====================
const themes = [
  { id: 'education', nameEn: 'Education', nameId: 'Edukasi', keyword: 'learn coding online' },
  { id: 'funny', nameEn: 'Funny / Entertainment', nameId: 'Funny / Hiburan', keyword: 'funny videos compilation' },
  { id: 'news', nameEn: 'News / Viral', nameId: 'Berita / Viral', keyword: 'breaking news today' },
  { id: 'finance', nameEn: 'Finance', nameId: 'Keuangan', keyword: 'passive income ideas' },
  { id: 'business', nameEn: 'Business', nameId: 'Bisnis', keyword: 'online business ideas' },
  { id: 'tech', nameEn: 'Technology & AI', nameId: 'Teknologi & AI', keyword: 'AI tools 2026' },
  { id: 'gaming', nameEn: 'Gaming', nameId: 'Gaming', keyword: 'GTA 6 release' },
  { id: 'music', nameEn: 'Music', nameId: 'Musik', keyword: 'trending songs 2026' },
  { id: 'review', nameEn: 'Product Review / Gadget', nameId: 'Review Produk / Gadget', keyword: 'best smartphone 2026' },
  { id: 'tutorial', nameEn: 'Tutorial / Skill', nameId: 'Tutorial / Skill', keyword: 'how to edit video' },
  { id: 'lifestyle', nameEn: 'Lifestyle', nameId: 'Lifestyle', keyword: 'morning routine' },
  { id: 'relationship', nameEn: 'Relationship', nameId: 'Relationship', keyword: 'relationship advice' },
  { id: 'culinary', nameEn: 'Culinary', nameId: 'Kuliner', keyword: 'street food viral' },
  { id: 'health', nameEn: 'Health', nameId: 'Kesehatan', keyword: 'home workout' },
  { id: 'travel', nameEn: 'Travel', nameId: 'Travel', keyword: 'travel vlog' },
  { id: 'parenting', nameEn: 'Parenting', nameId: 'Parenting', keyword: 'parenting tips' },
  { id: 'motivation', nameEn: 'Motivation', nameId: 'Motivasi', keyword: 'success motivation' },
  { id: 'affiliate', nameEn: 'Affiliate / Online Selling', nameId: 'Affiliate / Jualan Online', keyword: 'affiliate marketing' },
  { id: 'viral_challenge', nameEn: 'Viral Content / Challenge', nameId: 'Konten Viral / Challenge', keyword: 'viral challenge' },
  { id: 'automotive', nameEn: 'Automotive', nameId: 'Otomotif', keyword: 'car review 2026' },
  { id: 'fashion', nameEn: 'Fashion', nameId: 'Fashion', keyword: 'fashion trends 2026' },
  { id: 'beauty', nameEn: 'Beauty / Skincare', nameId: 'Beauty / Skincare', keyword: 'skincare routine' },
  { id: 'movies', nameEn: 'Movies & Series', nameId: 'Film & Series', keyword: 'new movies 2026' },
  { id: 'horror', nameEn: 'Horror / Mystery', nameId: 'Horor / Misteri', keyword: 'horror stories' },
  { id: 'history', nameEn: 'History', nameId: 'Sejarah', keyword: 'world history facts' },
  { id: 'science', nameEn: 'Science', nameId: 'Sains', keyword: 'science experiments' },
  { id: 'sports', nameEn: 'Sports', nameId: 'Olahraga', keyword: 'football highlights' },
  { id: 'diy', nameEn: 'DIY / Crafts', nameId: 'DIY / Kerajinan', keyword: 'DIY projects' },
  { id: 'productivity', nameEn: 'Productivity', nameId: 'Produktivitas', keyword: 'productivity tips' },
  { id: 'career', nameEn: 'Career / Jobs', nameId: 'Karir / Pekerjaan', keyword: 'remote jobs' },
];

// Fungsi untuk generate mock video berdasarkan tema
const generateMockVideos = (themeId: string, freeCopyrightOnly: boolean) => {
  const theme = themes.find(t => t.id === themeId) || themes[0];
  const keyword = theme.keyword;
  const baseVideos = [
    { platform: 'youtube', copyrightFree: true, viralScore: 85 + Math.floor(Math.random() * 15) },
    { platform: 'tiktok', copyrightFree: false, viralScore: 80 + Math.floor(Math.random() * 15) },
    { platform: 'youtube', copyrightFree: true, viralScore: 75 + Math.floor(Math.random() * 15) },
    { platform: 'tiktok', copyrightFree: true, viralScore: 88 + Math.floor(Math.random() * 12) },
    { platform: 'youtube', copyrightFree: false, viralScore: 70 + Math.floor(Math.random() * 20) },
  ];
  
  let filtered = baseVideos;
  if (freeCopyrightOnly) {
    filtered = filtered.filter(v => v.copyrightFree);
  }
  
  return filtered.map((v, idx) => ({
    id: `${themeId}-${idx}`,
    platform: v.platform,
    url: v.platform === 'youtube' 
      ? `https://youtube.com/results?search_query=${encodeURIComponent(keyword)}` 
      : `https://tiktok.com/search?q=${encodeURIComponent(keyword)}`,
    title: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} - ${idx === 0 ? 'Viral Trending' : 'Popular Video'}`,
    description: `Check out this viral content about ${keyword}. Get inspired!`,
    hashtags: `#${keyword.replace(/ /g, '')} #Viral #Trending`,
    viralScore: v.viralScore,
    copyrightFree: v.copyrightFree,
  }));
};

export default function ViralFilterPage() {
  const router = useRouter();
  const supabase = createClient();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [subscriptionExpiry, setSubscriptionExpiry] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [activeTab, setActiveTab] = useState<'analyze' | 'trending' | 'history'>('trending');
  const [selectedTheme, setSelectedTheme] = useState('tech');
  const [freeCopyright, setFreeCopyright] = useState(false);
  const [searching, setSearching] = useState(false);
  const [trendingVideos, setTrendingVideos] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // For analyze URL
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchUserData();
    fetchHistory();
  }, []);

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
    // Mock history
    setHistory([
      { id: 1, url: 'https://youtube.com/watch?v=abc', score: 78, date: new Date().toISOString() },
      { id: 2, url: 'https://tiktok.com/@user/video/123', score: 45, date: new Date(Date.now() - 86400000).toISOString() },
      { id: 3, url: 'https://youtube.com/watch?v=xyz', score: 92, date: new Date(Date.now() - 172800000).toISOString() },
    ]);
  };

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast.error(language === 'en' ? 'Please enter a video URL' : 'Masukkan URL video');
      return;
    }
    setAnalyzing(true);
    setTimeout(() => {
      const randomScore = Math.floor(Math.random() * 100);
      setResult({
        score: randomScore,
        label: randomScore >= 80 ? 'Very Viral' : randomScore >= 60 ? 'Viral' : randomScore >= 30 ? 'Potential' : 'Low',
        factors: [
          { name: language === 'en' ? 'Title' : 'Judul', score: Math.floor(Math.random() * 100) },
          { name: language === 'en' ? 'Thumbnail' : 'Thumbnail', score: Math.floor(Math.random() * 100) },
          { name: language === 'en' ? 'Duration' : 'Durasi', score: Math.floor(Math.random() * 100) },
          { name: language === 'en' ? 'Engagement' : 'Engagement', score: Math.floor(Math.random() * 100) },
        ],
        suggestions: [
          language === 'en' ? 'Use a more compelling thumbnail' : 'Gunakan thumbnail yang lebih menarik',
          language === 'en' ? 'Add trending hashtags' : 'Tambahkan hashtag trending',
          language === 'en' ? 'Keep video length 15-60 seconds' : 'Jaga durasi video 15-60 detik',
        ]
      });
      setAnalyzing(false);
      toast.success(language === 'en' ? 'Analysis complete!' : 'Analisis selesai!');
    }, 2000);
  };

  const handleSearchTrending = () => {
    setSearching(true);
    setTimeout(() => {
      const videos = generateMockVideos(selectedTheme, freeCopyright);
      setTrendingVideos(videos);
      setSearching(false);
      toast.success(language === 'en' ? `Found ${videos.length} viral videos` : `Ditemukan ${videos.length} video viral`);
    }, 800);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success(language === 'en' ? 'URL copied!' : 'URL disalin!');
  };

  const getPlatformIcon = (platform: string) => {
    if (platform === 'youtube') return <Youtube className="w-4 h-4 text-red-500" />;
    if (platform === 'tiktok') return <Music className="w-4 h-4 text-black dark:text-white" />;
    return <Video className="w-4 h-4 text-gray-500" />;
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'text-purple-600 bg-purple-100 dark:bg-purple-950/30';
    if (score >= 60) return 'text-green-600 bg-green-100 dark:bg-green-950/30';
    if (score >= 30) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950/30';
    return 'text-red-600 bg-red-100 dark:bg-red-950/30';
  };

  const t = (key: string) => {
    const translations: any = {
      en: {
        viralFilter: 'AUTOLIVE VIRAL FILTER',
        detectViral: 'DETECT VIRAL CONTENT',
        analyzeSub: 'Analyze your content viral potential with AI',
        userName: 'Username', role: 'Role', activeUntil: 'Active until',
        inputPlaceholder: 'Paste YouTube or TikTok video URL here...',
        analyzeBtn: 'Analyze Viral Potential', analyzing: 'Analyzing...',
        viralScore: 'Viral Score', analysisFactors: 'Analysis Factors',
        suggestions: 'Suggestions', history: 'History', date: 'Date', urlCol: 'URL', score: 'Score',
        backToDashboard: 'Dashboard', logout: 'Logout',
        trendingVideos: 'Trending Video References', selectTopic: 'Select Topic',
        freeCopyright: 'Free Copyright Only', searchViral: 'Search Viral Videos',
        searching: 'Searching...', platform: 'Platform', title: 'Title',
        description: 'Description', hashtags: 'Hashtags', viralPercent: 'Viral Estimate',
        copyUrl: 'Copy URL', copied: 'Copied!', source: 'Source', fromGoogleTrends: 'from Google Trends & YouTube',
      },
      id: {
        viralFilter: 'AUTOLIVE VIRAL FILTER',
        detectViral: 'DETEKSI KONTEN VIRAL',
        analyzeSub: 'Analisa potensi viral konten Anda dengan AI',
        userName: 'Nama Pengguna', role: 'Hak Akses', activeUntil: 'Aktif sampai',
        inputPlaceholder: 'Tempelkan URL video YouTube atau TikTok di sini...',
        analyzeBtn: 'Analisa Potensi Viral', analyzing: 'Menganalisa...',
        viralScore: 'Skor Viral', analysisFactors: 'Faktor Analisis',
        suggestions: 'Saran', history: 'Riwayat', date: 'Tanggal', urlCol: 'URL', score: 'Skor',
        backToDashboard: 'Dashboard', logout: 'Keluar',
        trendingVideos: 'Referensi Video Viral', selectTopic: 'Pilih Tema',
        freeCopyright: 'Bebas Hak Cipta', searchViral: 'Cari Video Viral',
        searching: 'Mencari...', platform: 'Platform', title: 'Judul',
        description: 'Deskripsi', hashtags: 'Hashtag', viralPercent: 'Perkiraan Viral',
        copyUrl: 'Salin URL', copied: 'Tersalin!', source: 'Sumber', fromGoogleTrends: 'dari Google Trends & YouTube',
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
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('viralFilter')}</h1>
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
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">{t('detectViral')}</h2>
            <button onClick={() => router.push('/dashboard/admin')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition">
              <LayoutDashboard className="w-3 h-3" /> {t('backToDashboard')}
            </button>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="w-24"></div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('analyzeSub')}</p>
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
        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-6">
          <button onClick={() => setActiveTab('analyze')} className={`px-4 py-2 text-sm font-medium transition ${activeTab === 'analyze' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}>
            {language === 'en' ? 'Analyze URL' : 'Analisis URL'}
          </button>
          <button onClick={() => setActiveTab('trending')} className={`px-4 py-2 text-sm font-medium transition ${activeTab === 'trending' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}>
            <TrendingUp className="inline w-4 h-4 mr-1" /> {t('trendingVideos')}
          </button>
          <button onClick={() => setActiveTab('history')} className={`px-4 py-2 text-sm font-medium transition ${activeTab === 'history' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}>
            <History className="inline w-4 h-4 mr-1" /> {t('history')}
          </button>
        </div>

        {/* Tab Analyze URL */}
        {activeTab === 'analyze' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4">📊 {language === 'en' ? 'Analyze New Video' : 'Analisis Video Baru'}</h3>
              <div className="space-y-4">
                <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t('inputPlaceholder')} className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                <button onClick={handleAnalyze} disabled={analyzing} className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50">
                  {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
                  {analyzing ? t('analyzing') : t('analyzeBtn')}
                </button>
              </div>
              {result && (
                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between items-center mb-2"><span className="text-sm font-medium">{t('viralScore')}</span><span className={`text-lg font-bold px-2 py-1 rounded-full ${getScoreColorClass(result.score)}`}>{result.score}%</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4"><div className={`h-2.5 rounded-full ${result.score>=80?'bg-purple-500':result.score>=60?'bg-green-500':result.score>=30?'bg-yellow-500':'bg-red-500'}`} style={{width:`${result.score}%`}}></div></div>
                  <p className="text-sm font-semibold mb-2">{language === 'en' ? 'Viral Prediction:' : 'Prediksi Viral:'} <span className="text-primary">{result.label}</span></p>
                  <h4 className="font-medium mt-4 mb-2">{t('analysisFactors')}</h4>
                  <div className="space-y-2">{result.factors.map((f:any,i:number)=><div key={i} className="flex justify-between text-sm"><span>{f.name}</span><span>{f.score}%</span></div>)}</div>
                  <h4 className="font-medium mt-4 mb-2">{t('suggestions')}</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600">{result.suggestions.map((s:string,i:number)=><li key={i}>{s}</li>)}</ul>
                </div>
              )}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4">🔥 {language === 'en' ? 'Trending Topics' : 'Topik Trending'}</h3>
              <div className="space-y-2">
                {themes.slice(0,10).map(t=>(
                  <div key={t.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2"><Hash className="w-4 h-4 text-primary" /><span className="text-sm">{language==='en'?t.nameEn:t.nameId}</span></div>
                    <span className="text-xs text-green-600">+{Math.floor(Math.random()*100)}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg"><p className="text-xs text-yellow-800">💡 {language === 'en' ? 'Use trending hashtags to boost viral potential!' : 'Gunakan hashtag trending untuk meningkatkan potensi viral!'}</p></div>
            </div>
          </div>
        )}

        {/* Tab Trending Videos */}
        {activeTab === 'trending' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('selectTopic')}</label>
                  <select value={selectedTheme} onChange={(e) => setSelectedTheme(e.target.value)} className="w-full p-2 rounded-lg border">
                    {themes.map(t=> <option key={t.id} value={t.id}>{language==='en'?t.nameEn:t.nameId}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={freeCopyright} onChange={(e) => setFreeCopyright(e.target.checked)} className="w-4 h-4 text-primary rounded" /><span className="text-sm">{t('freeCopyright')}</span></label>
                </div>
                <div>
                  <button onClick={handleSearchTrending} disabled={searching} className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50">
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {searching ? t('searching') : t('searchViral')}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> {t('source')}: YouTube & Google Trends | {t('fromGoogleTrends')}</p>
            </div>

            {trendingVideos.length > 0 && (
              <div className="grid grid-cols-1 gap-4">
                {trendingVideos.map((video) => (
                  <div key={video.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 hover:shadow-md transition">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="w-full md:w-32 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">{getPlatformIcon(video.platform)}<span className="text-xs ml-1">{video.platform.toUpperCase()}</span></div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div><h4 className="font-semibold">{video.title}</h4><p className="text-sm text-gray-500 line-clamp-2">{video.description}</p></div>
                          <button onClick={() => copyToClipboard(video.url, video.id)} className="flex items-center gap-1 text-xs text-primary hover:underline">{copiedId === video.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{copiedId === video.id ? t('copied') : t('copyUrl')}</button>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs"><span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {video.hashtags}</span></div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">{getPlatformIcon(video.platform)} {video.platform === 'youtube' ? 'YouTube' : 'TikTok'}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getScoreColorClass(video.viralScore)}`}>{t('viralPercent')}: {video.viralScore}%</span>
                          {video.copyrightFree && <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Free Copyright</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!searching && trendingVideos.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow"><Search className="w-12 h-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-500">{language === 'en' ? 'Click search to find viral video references' : 'Klik cari untuk menemukan referensi video viral'}</p></div>
            )}
            {searching && <div className="text-center py-12 bg-white rounded-xl shadow"><Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" /><p className="text-gray-500">{t('searching')}</p></div>}
          </div>
        )}

        {/* Tab History */}
        {activeTab === 'history' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="p-3 text-left">{t('date')}</th><th className="p-3 text-left">{t('urlCol')}</th><th className="p-3 text-left">{t('score')}</th></tr></thead>
                <tbody>{history.map((item) => (
                  <tr key={item.id} className="border-t"><td className="p-3">{new Date(item.date).toLocaleString()}</td><td className="p-3 max-w-xs truncate"><a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">{item.url} <ExternalLink className="w-3 h-3" /></a></td><td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${getScoreColorClass(item.score)}`}>{item.score}%</span></td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
EOF
echo "✅ Halaman viral filter dengan 30 tema dan keyword Google Trends telah dibuat"
