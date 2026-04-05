'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Mail, Lock, Eye, EyeOff, LogIn, Upload, TrendingUp, Edit, Zap, Shield, Clock, X, Sun, Moon, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

const ADMIN_EMAILS = ['autolive1.0.0@gmail.com', 'marga.jaya.bird.shop@gmail.com', 'rudysetiawan111@gmail.com'];
const ADMIN_PASSWORD = '@Rs101185';

const features = [
  { icon: Upload, titleEn: 'Auto Upload', titleId: 'Upload Otomatis', descEn: 'Auto upload to YouTube & TikTok', descId: 'Upload otomatis ke YouTube & TikTok', longDescEn: 'Automatically upload your videos to YouTube and TikTok platforms.', longDescId: 'Upload video secara otomatis ke YouTube dan TikTok.', color: 'from-red-500 to-orange-500' },
  { icon: TrendingUp, titleEn: 'Viral Filter', titleId: 'Filter Viral', descEn: 'Find trending content', descId: 'Temukan konten viral', longDescEn: 'AI-powered filter to find viral content across platforms.', longDescId: 'Filter bertenaga AI untuk menemukan konten viral.', color: 'from-blue-500 to-cyan-500' },
  { icon: Edit, titleEn: 'AI Editor', titleId: 'Editor AI', descEn: 'Edit with AI', descId: 'Edit dengan AI', longDescEn: 'AI video editor with auto-subtitles and enhancement.', longDescId: 'Editor video AI dengan subtitle otomatis.', color: 'from-green-500 to-emerald-500' },
  { icon: Zap, titleEn: 'Fast Processing', titleId: 'Proses Cepat', descEn: 'Fast & efficient', descId: 'Cepat & efisien', longDescEn: 'High-speed servers for quick processing.', longDescId: 'Server kecepatan tinggi untuk proses cepat.', color: 'from-yellow-500 to-orange-500' },
  { icon: Shield, titleEn: 'Secure', titleId: 'Aman', descEn: 'Enterprise security', descId: 'Keamanan enterprise', longDescEn: 'Your data is encrypted and protected.', longDescId: 'Data Anda dienkripsi dan dilindungi.', color: 'from-purple-500 to-pink-500' },
  { icon: Clock, titleEn: 'Schedule', titleId: 'Jadwal', descEn: 'Schedule uploads', descId: 'Jadwalkan upload', longDescEn: 'Set automatic upload schedules.', longDescId: 'Atur jadwal upload otomatis.', color: 'from-indigo-500 to-purple-500' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('free');
  const [tempAdminEmail, setTempAdminEmail] = useState('');
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: userData } = await supabase.from('users').select('role, subscription').eq('id', session.user.id).single();
        if (userData?.role === 'admin') router.push('/dashboard/admin');
        else if (userData?.subscription === 'premium') router.push('/dashboard/premium');
        else if (userData?.subscription === 'pro') router.push('/dashboard/pro');
        else if (userData?.subscription === 'free') router.push('/dashboard/free');
        else router.push('/dashboard');
      }
    };
    checkSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Email and password required');
    setLoading(true);
    try {
      // Cek apakah email admin
      if (ADMIN_EMAILS.includes(email) && password === ADMIN_PASSWORD) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) await supabase.auth.signUp({ email, password, options: { data: { full_name: email.split('@')[0] } } });
        setTempAdminEmail(email);
        toast.success('Selamat datang Mas Admin! Silakan pilih akses akun yang mau dipakai.');
        setShowRoleModal(true);
        setLoading(false);
        return;
      }
      // User biasa
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userData } = await supabase.from('users').select('subscription').eq('id', user?.id).single();
      const role = userData?.subscription || 'free';
      toast.success(t('login_success'));
      if (role === 'premium') router.push('/dashboard/premium');
      else if (role === 'pro') router.push('/dashboard/pro');
      else if (role === 'free') router.push('/dashboard/free');
      else router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = async (role: string) => {
    setShowRoleModal(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const expiry = role === 'free' ? new Date(Date.now() + 7*24*60*60*1000).toISOString() : null;
      await supabase.from('users').upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
        role: role === 'admin' ? 'admin' : 'user',
        subscription: role === 'free' ? 'free' : role,
        subscription_expiry: expiry,
      });
    }
    toast.success(`Anda masuk sebagai ${role.toUpperCase()}`);
    if (role === 'admin') router.push('/dashboard/admin');
    else if (role === 'premium') router.push('/dashboard/premium');
    else if (role === 'pro') router.push('/dashboard/pro');
    else router.push('/dashboard/free');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="fixed top-4 right-4 flex gap-2 z-10">
        <button onClick={() => setLanguage(language === 'en' ? 'id' : 'en')} className="p-2 rounded-lg shadow-md" style={{ backgroundColor: 'var(--bg-card)' }}>
          <Globe className="w-5 h-5" /><span className="ml-1 text-sm">{language === 'en' ? 'ID' : 'EN'}</span>
        </button>
        <button onClick={toggleTheme} className="p-2 rounded-lg shadow-md" style={{ backgroundColor: 'var(--bg-card)' }}>
          {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="w-full max-w-6xl px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-r from-primary to-secondary mb-4 shadow-lg">
            <Upload className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">AUTOLIVE</h1>
          <p className="mt-2 text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>Auto Content Upload Platform</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="card p-6 md:p-8">
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
              <button type="submit" disabled={loading} className="w-full btn-primary font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><LogIn className="w-5 h-5" /> {t('login')}</>}
              </button>
            </form>
            <p className="text-center text-sm mt-6">
              {t('dont_have_account')} <Link href="/register" className="text-primary hover:underline font-medium">{t('register_now')}</Link>
            </p>
            <div className="mt-6 text-center text-xs border-t pt-4" style={{ color: 'var(--text-secondary)', borderColor: 'var(--text-secondary)' }}>
              © 2026 AUTOLIVE by RS
            </div>
          </div>

          <div>
            <h3 className="text-center text-lg font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>Powerful Features</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature, idx) => (
                <div key={idx} onClick={() => setSelectedFeature(feature)} className="card p-4 cursor-pointer hover:shadow-lg transition">
                  <div className="flex items-start gap-3">
                    <div className={`inline-flex p-2 rounded-lg bg-gradient-to-r ${feature.color} bg-opacity-10`}>
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{language === 'en' ? feature.titleEn : feature.titleId}</h4>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{language === 'en' ? feature.descEn : feature.descId}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-8 text-center">
          <div className="card p-3"><div className="text-2xl font-bold text-primary">10K+</div><div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Users</div></div>
          <div className="card p-3"><div className="text-2xl font-bold text-primary">1M+</div><div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Videos</div></div>
          <div className="card p-3"><div className="text-2xl font-bold text-primary">50+</div><div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Countries</div></div>
        </div>
      </div>

      {selectedFeature && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelectedFeature(null)}>
          <div className="card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className={`inline-flex p-2 rounded-lg bg-gradient-to-r ${selectedFeature.color} bg-opacity-10`}>
                <selectedFeature.icon className="w-6 h-6 text-primary" />
              </div>
              <button onClick={() => setSelectedFeature(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <h3 className="text-xl font-bold mb-2">{language === 'en' ? selectedFeature.titleEn : selectedFeature.titleId}</h3>
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>{language === 'en' ? selectedFeature.longDescEn : selectedFeature.longDescId}</p>
            <button onClick={() => setSelectedFeature(null)} className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition">Close</button>
          </div>
        </div>
      )}

      {showRoleModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Silakan pilih akses akun yang mau dipakai</h2>
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Email: {tempAdminEmail}</p>
            <div className="space-y-3">
              <button onClick={() => handleRoleSelect('admin')} className="w-full flex items-center justify-between p-3 rounded-lg border-2 transition hover:border-primary">
                <div><div className="font-semibold">👑 Admin</div><div className="text-xs text-gray-500">Akses penuh ke Panel Admin</div></div>
              </button>
              <button onClick={() => handleRoleSelect('premium')} className="w-full flex items-center justify-between p-3 rounded-lg border-2 transition hover:border-primary">
                <div><div className="font-semibold">⭐ Premium</div><div className="text-xs text-gray-500">Akses semua fitur ($5/bulan)</div></div>
              </button>
              <button onClick={() => handleRoleSelect('pro')} className="w-full flex items-center justify-between p-3 rounded-lg border-2 transition hover:border-primary">
                <div><div className="font-semibold">⚡ Pro</div><div className="text-xs text-gray-500">Akses semua fitur kecuali jadwal ($3/bulan)</div></div>
              </button>
              <button onClick={() => handleRoleSelect('free')} className="w-full flex items-center justify-between p-3 rounded-lg border-2 transition hover:border-primary">
                <div><div className="font-semibold">🎁 Free</div><div className="text-xs text-gray-500">Akses terbatas 7 hari</div></div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
