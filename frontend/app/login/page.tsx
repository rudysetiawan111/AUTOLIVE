'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Mail, Lock, Eye, EyeOff, LogIn, Upload, Sun, Moon, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

const ADMIN_EMAILS = ['autolive1.0.0@gmail.com', 'marga.jaya.bird.shop@gmail.com', 'rudysetiawan111@gmail.com'];
const ADMIN_PASSWORD = '@Rs101185';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [tempAdminEmail, setTempAdminEmail] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState('');
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const supabase = createClient();

  useEffect(() => {
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
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

  const t = (key: string) => {
    const translations: any = {
      en: {
        email: 'Email',
        password: 'Password',
        login: 'Login',
        register: 'Register',
        slogan: 'Auto Content Upload Platform',
        title: 'LOGIN AUTOLIVE',
        free: 'FREE ACCESS',
        pro: 'PRO ACCESS',
        premium: 'PREMIUM ACCESS'
      },
      id: {
        email: 'Email',
        password: 'Kata Sandi',
        login: 'Masuk',
        register: 'Daftar',
        slogan: 'Platform Upload Konten Otomatis',
        title: 'LOGIN AUTOLIVE',
        free: 'AKSES FREE',
        pro: 'AKSES PRO',
        premium: 'AKSES PREMIUM'
      }
    };
    return translations[language]?.[key] || key;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Email dan password harus diisi');
    setLoading(true);
    try {
      if (ADMIN_EMAILS.includes(email) && password === ADMIN_PASSWORD) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) await supabase.auth.signUp({ email, password, options: { data: { full_name: email.split('@')[0] } } });
        setTempAdminEmail(email);
        toast.success('Selamat datang Admin! Pilih akses akun.');
        setShowRoleModal(true);
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Login berhasil!');
      window.location.href = '/dashboard';
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: string) => {
    let target = '/dashboard';
    if (role === 'admin') target = '/dashboard/admin';
    else if (role === 'premium') target = '/dashboard/premium';
    else if (role === 'pro') target = '/dashboard/pro';
    else if (role === 'free') target = '/dashboard/free';
    if (window.confirm(`Anda akan mengakses halaman dengan akses akun ${role.toUpperCase()}, apakah Anda akan melanjutkan?`)) {
      window.location.href = target;
    }
  };

  const handleFeatureClick = (featureName: string, description: string) => {
    alert(`📌 ${featureName}\n\n${description}`);
  };

  const featuresData = {
    free: [
      { name: 'Hashtag Generator', desc: 'Generate hashtags with AI, limited to 5 times per day' },
      { name: 'Title Generator', desc: 'Generate engaging video titles, 5 times per day' },
      { name: 'Content Analyzer', desc: 'Basic content analysis with simple scoring' },
      { name: 'Viral Filter', desc: 'View viral trends but cannot save' },
      { name: 'Engagement Analyzer', desc: 'Mock engagement metrics for learning' }
    ],
    pro: [
      { name: 'YouTube Downloader', desc: 'Download YouTube videos in various qualities' },
      { name: 'TikTok Downloader', desc: 'Download TikTok videos without watermark' },
      { name: 'Subtitle Generator', desc: 'Generate auto-subtitles for videos' },
      { name: 'Video Clipper', desc: 'Cut and trim videos easily' },
      { name: 'Shorts Generator', desc: 'Turn long videos into shorts' },
      { name: 'Queue System', desc: 'Access to shared processing queue' }
    ],
    premium: [
      { name: 'Scheduler', desc: 'Schedule video uploads at specific times' },
      { name: 'Auto Upload', desc: 'Automatically upload to YouTube and TikTok' },
      { name: 'Workflow Automation', desc: 'Create and execute complex workflows' },
      { name: 'Queue Priority', desc: 'Higher priority in processing queue' },
      { name: 'Unlimited', desc: 'No daily limits on generators' }
    ]
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header Sticky: Pengaturan bahasa, mode, tanggal */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-md py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {currentDateTime}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setLanguage(language === 'en' ? 'id' : 'en')} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
              <Globe className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            <button onClick={toggleTheme} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
              {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-gray-600" />}
            </button>
          </div>
        </div>
      </div>

      {/* Konten Utama - Posisi Atas (bukan tengah) */}
      <div className="w-full max-w-6xl mx-auto px-4 py-6">
        {/* Logo dan Judul */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-700 mb-3 shadow-lg">
            <Upload className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{t('slogan')}</p>
        </div>

        {/* Form Login - Lebih kecil dan di atas */}
        <div className="max-w-md mx-auto mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="you@example.com" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2">
                    {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><LogIn className="w-5 h-5" /> {t('login')}</>}
                </button>
                <Link href="/register" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition">
                  {t('register')}
                </Link>
              </div>
            </form>
          </div>
        </div>

        {/* Fitur Free, Pro, Premium - Grid 3 kolom (responsif) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Free */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-green-200 dark:border-green-800 overflow-hidden">
            <div className="bg-green-500 text-white text-center py-2 font-bold text-sm">🟢 {t('free')}</div>
            <div className="p-3 space-y-1 max-h-64 overflow-y-auto">
              {featuresData.free.map((feature, idx) => (
                <div key={idx} onClick={() => handleFeatureClick(feature.name, feature.desc)} className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/30 cursor-pointer transition text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {feature.name}
                </div>
              ))}
            </div>
          </div>

          {/* Pro */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-blue-200 dark:border-blue-800 overflow-hidden">
            <div className="bg-blue-500 text-white text-center py-2 font-bold text-sm">🔵 {t('pro')}</div>
            <div className="p-3 space-y-1 max-h-64 overflow-y-auto">
              {featuresData.pro.map((feature, idx) => (
                <div key={idx} onClick={() => handleFeatureClick(feature.name, feature.desc)} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer transition text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {feature.name}
                </div>
              ))}
            </div>
          </div>

          {/* Premium */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-purple-200 dark:border-purple-800 overflow-hidden">
            <div className="bg-purple-500 text-white text-center py-2 font-bold text-sm">🟣 {t('premium')}</div>
            <div className="p-3 space-y-1 max-h-64 overflow-y-auto">
              {featuresData.premium.map((feature, idx) => (
                <div key={idx} onClick={() => handleFeatureClick(feature.name, feature.desc)} className="p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/30 cursor-pointer transition text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {feature.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Pilih Role Admin */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4 text-center">Silakan pilih akses akun yang mau dipakai</h2>
            <p className="mb-6 text-center text-sm">Email: {tempAdminEmail}</p>
            <div className="space-y-3">
              <button onClick={() => handleRoleSelect('admin')} className="w-full flex items-center gap-3 p-3 border rounded-lg">👑 Admin - Akses penuh</button>
              <button onClick={() => handleRoleSelect('premium')} className="w-full flex items-center gap-3 p-3 border rounded-lg">⭐ Premium - Semua fitur</button>
              <button onClick={() => handleRoleSelect('pro')} className="w-full flex items-center gap-3 p-3 border rounded-lg">⚡ Pro - Kecuali jadwal</button>
              <button onClick={() => handleRoleSelect('free')} className="w-full flex items-center gap-3 p-3 border rounded-lg">🎁 Free - Terbatas 7 hari</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
