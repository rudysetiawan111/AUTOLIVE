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

  // Cek session dan redirect berdasarkan role dari database
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
        if (userData?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }
    };
    checkSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Email and password required');
    setLoading(true);
    try {
      // Cek apakah admin
      if (ADMIN_EMAILS.includes(email) && password === ADMIN_PASSWORD) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          await supabase.auth.signUp({ email, password, options: { data: { full_name: email.split('@')[0] } } });
        }
        setTempAdminEmail(email);
        setShowRoleModal(true);
        setLoading(false);
        return;
      }
      // User biasa
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success(t('login_success'));
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = async () => {
    setShowRoleModal(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const expiry = selectedRole === 'free' ? new Date(Date.now() + 7*24*60*60*1000).toISOString() : null;
      await supabase.from('users').upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
        role: selectedRole === 'admin' ? 'admin' : 'user',
        subscription: selectedRole === 'free' ? 'free' : selectedRole,
        subscription_expiry: expiry,
      });
    }
    toast.success(`Logged in as ${selectedRole.toUpperCase()}`);
    if (selectedRole === 'admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-4">
      {/* Tombol toggle bahasa dan tema */}
      <div className="fixed top-4 right-4 flex gap-2 z-10">
        <button onClick={() => setLanguage(language === 'en' ? 'id' : 'en')} className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          <Globe className="w-5 h-5" />
          <span className="ml-1 text-sm">{language === 'en' ? 'ID' : 'EN'}</span>
        </button>
        <button onClick={toggleTheme} className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-700" />}
        </button>
      </div>

      <div className="w-full max-w-4xl">
        {/* Logo dan judul */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r from-primary to-secondary mb-4 shadow-lg">
            <Upload className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">AUTOLIVE</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Auto Content Upload Platform</p>
        </div>

        {/* Login Form - di atas */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><LogIn className="w-5 h-5" /> Sign In</>}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary hover:underline font-medium">Register now</Link>
          </p>
          <div className="mt-6 text-center text-xs text-gray-400 border-t pt-4">
            © 2026 AUTOLIVE by <span className="font-semibold">RS</span>
          </div>
        </div>

        {/* Features Grid - di bawah login, vertikal */}
        <div>
          <h3 className="text-center text-gray-700 dark:text-gray-400 text-lg font-semibold mb-4">Powerful Features</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {features.map((feature, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedFeature(feature)}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-all cursor-pointer group border border-gray-200 dark:border-gray-700 hover:border-primary/50"
              >
                <div className="flex items-start gap-3">
                  <div className={`inline-flex p-2 rounded-lg bg-gradient-to-r ${feature.color} bg-opacity-10 group-hover:bg-opacity-20 transition`}>
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white">
                      {language === 'en' ? feature.titleEn : feature.titleId}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {language === 'en' ? feature.descEn : feature.descId}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-8 text-center">
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-3">
            <div className="text-2xl font-bold text-primary">10K+</div>
            <div className="text-xs text-gray-500">Users</div>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-3">
            <div className="text-2xl font-bold text-primary">1M+</div>
            <div className="text-xs text-gray-500">Videos</div>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-3">
            <div className="text-2xl font-bold text-primary">50+</div>
            <div className="text-xs text-gray-500">Countries</div>
          </div>
        </div>
      </div>

      {/* Feature Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelectedFeature(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className={`inline-flex p-2 rounded-lg bg-gradient-to-r ${selectedFeature.color} bg-opacity-10`}>
                <selectedFeature.icon className="w-6 h-6 text-primary" />
              </div>
              <button onClick={() => setSelectedFeature(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-xl font-bold mb-2">{language === 'en' ? selectedFeature.titleEn : selectedFeature.titleId}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{language === 'en' ? selectedFeature.longDescEn : selectedFeature.longDescId}</p>
            <button onClick={() => setSelectedFeature(null)} className="w-full py-2 bg-primary text-white rounded-lg hover:bg-red-700 transition">Close</button>
          </div>
        </div>
      )}

      {/* Role Selection Modal for Admin */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Select Access Role</h2>
            <p className="text-gray-500 mb-4">Email: {tempAdminEmail}</p>
            <div className="space-y-3">
              {[
                { role: 'admin', label: '👑 Admin', desc: 'Full access to Admin Panel' },
                { role: 'premium', label: '⭐ Premium', desc: 'All features ($5/month)' },
                { role: 'pro', label: '⚡ Pro', desc: 'All features except scheduler ($3/month)' },
                { role: 'free', label: '🎁 Free Trial', desc: 'Limited features for 7 days' },
              ].map((item) => (
                <button
                  key={item.role}
                  onClick={() => { setSelectedRole(item.role); handleRoleSelect(); }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition ${
                    selectedRole === item.role
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-semibold">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                  {selectedRole === item.role && <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs">✓</div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
