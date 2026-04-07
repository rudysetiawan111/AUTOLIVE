// frontend/app/dashboard/features/rate-limiter/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Globe, Sun, Moon, LogOut, LayoutDashboard, Zap, 
  Save, Edit2, Check, X, Search, User, Shield,
  Activity, Cpu, Download, Upload, Video, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function RateLimiterPage() {
  const router = useRouter();
  const supabase = createClient();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [subscriptionExpiry, setSubscriptionExpiry] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Rate limits per role (FREE, PRO, PREMIUM, ADMIN)
  const [limits, setLimits] = useState({
    free: { ai: 5, download: 3, upload: 0, processing: 0, scheduler: 0 },
    pro: { ai: 50, download: 30, upload: 5, processing: 10, scheduler: 5 },
    premium: { ai: 999, download: 999, upload: 50, processing: 100, scheduler: 50 },
    admin: { ai: 9999, download: 9999, upload: 9999, processing: 9999, scheduler: 9999 }
  });
  
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  // User override search
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [userOverrides, setUserOverrides] = useState<any[]>([]);

  useEffect(() => {
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    fetchUserData();
    fetchRateLimits();
    fetchUserOverrides();
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

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: userData } = await supabase.from('users').select('full_name, role, subscription, subscription_expiry').eq('id', user.id).single();
      setUserName(userData?.full_name || user.email?.split('@')[0] || 'Admin');
      setUserRole(userData?.role === 'admin' ? 'ADMIN' : (userData?.subscription?.toUpperCase() || 'ADMIN'));
      if (userData?.subscription_expiry) {
        const expiryDate = new Date(userData.subscription_expiry);
        setSubscriptionExpiry(expiryDate.toLocaleDateString('id-ID'));
      }
    } else {
      router.push('/login');
    }
  };

  const fetchRateLimits = async () => {
    setLoading(true);
    // Mock data - in real app, fetch from settings table
    setTimeout(() => {
      setLimits({
        free: { ai: 5, download: 3, upload: 0, processing: 0, scheduler: 0 },
        pro: { ai: 50, download: 30, upload: 5, processing: 10, scheduler: 5 },
        premium: { ai: 999, download: 999, upload: 50, processing: 100, scheduler: 50 },
        admin: { ai: 9999, download: 9999, upload: 9999, processing: 9999, scheduler: 9999 }
      });
      setLoading(false);
    }, 500);
  };

  const fetchUserOverrides = async () => {
    // Mock user overrides
    setUserOverrides([
      { id: '1', email: 'test@example.com', overrides: { ai: 100, download: 50 } },
      { id: '2', email: 'vip@example.com', overrides: { ai: 500, download: 200, upload: 100 } }
    ]);
  };

  const startEditRole = (role: string) => {
    setEditingRole(role);
    setEditValues({ ...limits[role as keyof typeof limits] });
  };

  const cancelEdit = () => {
    setEditingRole(null);
    setEditValues({});
  };

  const saveRoleLimits = async (role: string) => {
    setSaving(true);
    // Simulate API save
    setTimeout(() => {
      setLimits(prev => ({ ...prev, [role]: editValues }));
      setEditingRole(null);
      setSaving(false);
      toast.success(language === 'en' ? `Rate limits for ${role.toUpperCase()} saved` : `Batas rate untuk ${role.toUpperCase()} disimpan`);
    }, 500);
  };

  const handleEditChange = (field: string, value: number) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  };

  const searchUserOverride = async () => {
    if (!searchEmail.trim()) {
      toast.error(language === 'en' ? 'Enter email address' : 'Masukkan alamat email');
      return;
    }
    // Mock search
    if (searchEmail === 'test@example.com') {
      setSearchResult({ email: 'test@example.com', currentOverrides: { ai: 100, download: 50 } });
    } else {
      setSearchResult(null);
      toast.error(language === 'en' ? 'User not found' : 'User tidak ditemukan');
    }
  };

  const saveUserOverride = async () => {
    if (!searchResult) return;
    setSaving(true);
    setTimeout(() => {
      setUserOverrides(prev => [...prev, { id: Date.now().toString(), email: searchResult.email, overrides: searchResult.currentOverrides }]);
      setSearchResult(null);
      setSearchEmail('');
      setSaving(false);
      toast.success(language === 'en' ? 'User override saved' : 'Override user disimpan');
    }, 500);
  };

  const deleteUserOverride = async (id: string) => {
    if (confirm(language === 'en' ? 'Delete this user override?' : 'Hapus override user ini?')) {
      setUserOverrides(prev => prev.filter(u => u.id !== id));
      toast.success(language === 'en' ? 'Override deleted' : 'Override dihapus');
    }
  };

  const t = (key: string) => {
    const translations: any = {
      en: {
        pageTitle: 'RATE LIMITER CONTROL',
        subTitle: 'MANAGE API & FEATURE LIMITS',
        description: 'Set rate limits per role or per user',
        backToDashboard: 'Dashboard',
        logout: 'Logout',
        userName: 'Username',
        role: 'Role',
        activeUntil: 'Active until',
        roleLimits: 'Rate Limits by Role',
        feature: 'Feature',
        aiRequests: 'AI Requests',
        downloads: 'Downloads',
        uploads: 'Uploads',
        processing: 'Processing (min)',
        scheduler: 'Scheduled Jobs',
        actions: 'Actions',
        edit: 'Edit',
        save: 'Save',
        cancel: 'Cancel',
        userOverrides: 'User Overrides',
        searchUser: 'Search User by Email',
        searchPlaceholder: 'Enter email address...',
        search: 'Search',
        setOverride: 'Set Override',
        currentOverrides: 'Current Overrides',
        limit: 'Limit',
        delete: 'Delete',
        noOverrides: 'No user overrides',
        free: 'FREE',
        pro: 'PRO',
        premium: 'PREMIUM',
        admin: 'ADMIN',
      },
      id: {
        pageTitle: 'KONTROL RATE LIMITER',
        subTitle: 'KELOLA BATAS API & FITUR',
        description: 'Atur batas rate per role atau per user',
        backToDashboard: 'Dashboard',
        logout: 'Keluar',
        userName: 'Nama Pengguna',
        role: 'Hak Akses',
        activeUntil: 'Aktif sampai',
        roleLimits: 'Batas Rate per Role',
        feature: 'Fitur',
        aiRequests: 'Request AI',
        downloads: 'Download',
        uploads: 'Upload',
        processing: 'Processing (menit)',
        scheduler: 'Job Terjadwal',
        actions: 'Aksi',
        edit: 'Edit',
        save: 'Simpan',
        cancel: 'Batal',
        userOverrides: 'Override User',
        searchUser: 'Cari User berdasarkan Email',
        searchPlaceholder: 'Masukkan alamat email...',
        search: 'Cari',
        setOverride: 'Set Override',
        currentOverrides: 'Override Saat Ini',
        limit: 'Batas',
        delete: 'Hapus',
        noOverrides: 'Tidak ada override user',
        free: 'FREE',
        pro: 'PRO',
        premium: 'PREMIUM',
        admin: 'ADMIN',
      }
    };
    return translations[language]?.[key] || key;
  };

  const roleOrder = ['free', 'pro', 'premium', 'admin'];
  const featureFields = ['ai', 'download', 'upload', 'processing', 'scheduler'];

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
          {/* Kolom Kiri - Rate Limits per Role */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /> {t('roleLimits')}</h3>
            {loading ? (
              <p className="text-center py-8">Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="p-2 text-left">{t('feature')}</th>
                      {roleOrder.map(role => <th key={role} className="p-2 text-center">{t(role)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {featureFields.map(field => (
                      <tr key={field} className="border-t">
                        <td className="p-2 font-medium">{t(field === 'ai' ? 'aiRequests' : field === 'download' ? 'downloads' : field === 'upload' ? 'uploads' : field === 'processing' ? 'processing' : 'scheduler')}</td>
                        {roleOrder.map(role => {
                          const isEditing = editingRole === role;
                          const value = isEditing ? editValues[field] : limits[role as keyof typeof limits][field as keyof typeof limits['free']];
                          return (
                            <td key={role} className="p-2 text-center">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={value}
                                  onChange={(e) => handleEditChange(field, parseInt(e.target.value) || 0)}
                                  className="w-20 p-1 border rounded text-center"
                                  min="0"
                                />
                              ) : (
                                <span>{value}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    <tr className="border-t">
                      <td className="p-2"></td>
                      {roleOrder.map(role => (
                        <td key={role} className="p-2 text-center">
                          {editingRole === role ? (
                            <div className="flex justify-center gap-1">
                              <button onClick={() => saveRoleLimits(role)} disabled={saving} className="text-green-500 hover:text-green-700"><Check className="w-4 h-4" /></button>
                              <button onClick={cancelEdit} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                            </div>
                          ) : (
                            <button onClick={() => startEditRole(role)} className="text-blue-500 hover:text-blue-700"><Edit2 className="w-4 h-4" /></button>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Kolom Kanan - User Overrides */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><User className="w-5 h-5 text-primary" /> {t('userOverrides')}</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">{t('searchUser')}</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="flex-1 p-2 border rounded-lg text-sm"
                />
                <button onClick={searchUserOverride} className="bg-primary text-white px-3 py-2 rounded-lg text-sm">🔍 {t('search')}</button>
              </div>
              {searchResult && (
                <div className="mt-3 p-3 border rounded-lg">
                  <p className="font-medium">{searchResult.email}</p>
                  <div className="mt-2 space-y-2">
                    {Object.entries(searchResult.currentOverrides).map(([feature, limit]) => (
                      <div key={feature} className="flex items-center gap-2">
                        <span className="text-sm w-24">{feature}</span>
                        <input
                          type="number"
                          value={limit as number}
                          onChange={(e) => setSearchResult({ ...searchResult, currentOverrides: { ...searchResult.currentOverrides, [feature]: parseInt(e.target.value) || 0 } })}
                          className="w-24 p-1 border rounded text-sm"
                        />
                      </div>
                    ))}
                    <button onClick={saveUserOverride} disabled={saving} className="mt-2 bg-green-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1">
                      {saving ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-3 h-3" />}
                      {t('setOverride')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">{t('currentOverrides')}</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {userOverrides.length === 0 && <p className="text-gray-500 text-sm">{t('noOverrides')}</p>}
                {userOverrides.map(override => (
                  <div key={override.id} className="border rounded-lg p-2 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{override.email}</p>
                      <div className="flex gap-2 text-xs text-gray-500 mt-1">
                        {Object.entries(override.overrides).map(([feature, limit]) => (
                          <span key={feature}>{feature}: {limit}</span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => deleteUserOverride(override.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
