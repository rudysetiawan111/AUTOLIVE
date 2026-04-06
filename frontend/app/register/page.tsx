'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, User, Eye, EyeOff, LogIn, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('free');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Email dan password harus diisi');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Password tidak cocok');
      return;
    }
    if (password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    setLoading(true);
    try {
      // 1. Daftar ke Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: email.split('@')[0] }
        }
      });
      
      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Gagal mendaftar');

      // 2. Simpan data user ke tabel users
      let subscription = selectedRole;
      let role = 'user';
      let subscriptionExpiry = null;
      
      if (selectedRole === 'free') {
        subscriptionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      }
      if (selectedRole === 'admin') {
        role = 'admin';
        subscription = null;
      }

      const { error: upsertError } = await supabase.from('users').upsert({
        id: authData.user.id,
        email: email,
        full_name: email.split('@')[0],
        role: role,
        subscription: subscription === 'free' ? 'free' : (subscription === 'pro' ? 'pro' : (subscription === 'premium' ? 'premium' : null)),
        subscription_expiry: subscriptionExpiry,
      });

      if (upsertError) throw upsertError;

      toast.success('Pendaftaran berhasil!');

      // 3. Redirect sesuai pilihan role
      if (selectedRole === 'free') {
        // Langsung ke dashboard free
        router.push('/dashboard/free');
      } else {
        // Redirect ke halaman pembayaran dengan parameter role dan email
        router.push(`/payment?role=${selectedRole}&email=${encodeURIComponent(email)}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-700 mb-4 shadow-lg">
            <Upload className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Daftar Akun</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Mulai gunakan AUTOLIVE sekarang</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="email@example.com"
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
                  placeholder="minimal 6 karakter"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2"
                >
                  {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Konfirmasi Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="ulangi password"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Pilih Hak Akses</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('free')}
                  className={`p-3 rounded-xl border-2 transition ${
                    selectedRole === 'free'
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="text-xl mb-1">🎁</div>
                  <div className="font-semibold text-sm">Free</div>
                  <div className="text-xs text-gray-500">7 hari trial</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('pro')}
                  className={`p-3 rounded-xl border-2 transition ${
                    selectedRole === 'pro'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="text-xl mb-1">⚡</div>
                  <div className="font-semibold text-sm">Pro</div>
                  <div className="text-xs text-gray-500">$3/bulan</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('premium')}
                  className={`p-3 rounded-xl border-2 transition ${
                    selectedRole === 'premium'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="text-xl mb-1">⭐</div>
                  <div className="font-semibold text-sm">Premium</div>
                  <div className="text-xs text-gray-500">$5/bulan</div>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Lanjutkan Pendaftaran</>
              )}
            </button>
          </form>
          <p className="text-center text-sm mt-6">
            Sudah punya akun?{' '}
            <a href="/login" className="text-primary hover:underline">
              Login di sini
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
