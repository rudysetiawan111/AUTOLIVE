'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';
import { Mail, Lock, Eye, EyeOff, LogIn, Upload, Sun, Moon } from 'lucide-react';
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
  const { theme, toggleTheme } = useTheme();
  const supabase = createClient();

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="fixed top-4 right-4 z-10">
        <button onClick={toggleTheme} className="p-2 rounded-lg shadow-md" style={{ backgroundColor: 'var(--bg-card)' }}>
          {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-700 mb-4 shadow-lg">
            <Upload className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">AUTOLIVE</h1>
        </div>
        <div className="card p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-10 py-3 rounded-xl border" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2">
                  {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : <><LogIn className="inline w-5 h-5 mr-2" /> Login</>}
            </button>
          </form>
          <p className="text-center text-sm mt-6">Belum punya akun? <Link href="/register" className="text-primary">Daftar</Link></p>
        </div>
      </div>

      {showRoleModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4 text-center">Pilih akses akun</h2>
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
