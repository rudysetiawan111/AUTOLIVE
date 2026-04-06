'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Users, Settings, QrCode, LogOut, Shield, Upload, 
  Image, Save, BarChart, Globe, Sun, Moon, Search, X,
  ChevronDown, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminPaymentSettings from '@/components/AdminPaymentSettings';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [websiteSettings, setWebsiteSettings] = useState({
    logo_url: '',
    site_name: 'AUTOLIVE',
    primary_color: '#3b82f6',
    footer_text: '© 2026 AUTOLIVE by RS'
  });
  const [saving, setSaving] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminRole, setAdminRole] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editRole, setEditRole] = useState('');
  const [editSubscription, setEditSubscription] = useState('');
  const [openFeatures, setOpenFeatures] = useState(true);
  const [openAnalytics, setOpenAnalytics] = useState(true);
  const [openSettings, setOpenSettings] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState('');
  const router = useRouter();
  const supabase = createClient();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

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
        dashboard: 'DASHBOARD ADMIN',
        slogan: 'Content Management System',
        logout: 'Logout',
        features: 'FEATURES',
        analytics: 'ANALYTICS',
        website: 'SETTINGS',
        searchUser: 'Search User',
        searchPlaceholder: 'Enter email...',
        search: 'Search',
        editUser: 'Edit User Access',
        email: 'Email',
        role: 'Role',
        subscription: 'Subscription',
        save: 'Save',
        cancel: 'Cancel',
        userNotFound: 'User not found',
        confirmEdit: 'Edit this user?',
        userUpdated: 'User updated successfully',
        websiteLogo: 'Website Logo',
        uploadLogo: 'Upload Logo',
        qrPayment: 'QR Payment',
        generalSettings: 'General Settings',
        siteName: 'Site Name',
        primaryColor: 'Primary Color',
        footerText: 'Footer Text',
        status: 'Status'
      },
      id: {
        dashboard: 'DASHBOARD ADMIN',
        slogan: 'Sistem Manajemen Konten',
        logout: 'Keluar',
        features: 'FITUR',
        analytics: 'ANALITIK',
        website: 'PENGATURAN',
        searchUser: 'Cari User',
        searchPlaceholder: 'Masukkan email...',
        search: 'Cari',
        editUser: 'Edit Hak Akses User',
        email: 'Email',
        role: 'Peran',
        subscription: 'Langganan',
        save: 'Simpan',
        cancel: 'Batal',
        userNotFound: 'User tidak ditemukan',
        confirmEdit: 'Edit user ini?',
        userUpdated: 'User berhasil diupdate',
        websiteLogo: 'Logo Website',
        uploadLogo: 'Upload Logo',
        qrPayment: 'QR Pembayaran',
        generalSettings: 'Pengaturan Umum',
        siteName: 'Nama Situs',
        primaryColor: 'Warna Utama',
        footerText: 'Teks Footer',
        status: 'Status'
      }
    };
    return translations[language]?.[key] || key;
  };

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    else setUsers(data || []);
    setLoadingUsers(false);
  }, [supabase]);

  const fetchWebsiteSettings = useCallback(async () => {
    const { data: logoData } = await supabase.from('settings').select('value').eq('key', 'website_logo').single();
    const { data: siteNameData } = await supabase.from('settings').select('value').eq('key', 'site_name').single();
    const { data: primaryColorData } = await supabase.from('settings').select('value').eq('key', 'primary_color').single();
    const { data: footerTextData } = await supabase.from('settings').select('value').eq('key', 'footer_text').single();
    setWebsiteSettings({
      logo_url: logoData?.value || '',
      site_name: siteNameData?.value || 'AUTOLIVE',
      primary_color: primaryColorData?.value || '#3b82f6',
      footer_text: footerTextData?.value || '© 2026 AUTOLIVE by RS'
    });
  }, [supabase]);

  const getAdminData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setAdminEmail(user.email || 'admin@autolive.com');
      const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
      setAdminRole(userData?.role || 'Admin');
    }
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
    fetchWebsiteSettings();
    getAdminData();
  }, [fetchUsers, fetchWebsiteSettings, getAdminData]);

  const updateUserRole = async (userId: string, newRole: string, newSubscription: string | null) => {
    const { error } = await supabase.from('users').update({ role: newRole, subscription: newSubscription }).eq('id', userId);
    if (error) toast.error(error.message);
    else {
      toast.success(t('userUpdated'));
      await fetchUsers();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const saveWebsiteSettings = async () => {
    setSaving(true);
    try {
      await supabase.from('settings').upsert({ key: 'site_name', value: websiteSettings.site_name }, { onConflict: 'key' });
      await supabase.from('settings').upsert({ key: 'primary_color', value: websiteSettings.primary_color }, { onConflict: 'key' });
      await supabase.from('settings').upsert({ key: 'footer_text', value: websiteSettings.footer_text }, { onConflict: 'key' });
      toast.success('Pengaturan website disimpan');
    } catch (err) {
      toast.error('Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file: File) => {
    if (!file) return;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('website_assets').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('website_assets').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;
      await supabase.from('settings').upsert({ key: 'website_logo', value: publicUrl }, { onConflict: 'key' });
      setWebsiteSettings(prev => ({ ...prev, logo_url: publicUrl }));
      toast.success('Logo berhasil diupload');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) {
      toast.error('Masukkan alamat email');
      return;
    }
    const foundUser = users.find(u => u.email?.toLowerCase() === searchEmail.toLowerCase());
    if (!foundUser) {
      toast.error(t('userNotFound'));
      return;
    }
    if (window.confirm(t('confirmEdit'))) {
      setEditingUser(foundUser);
      setEditRole(foundUser.role || 'user');
      setEditSubscription(foundUser.subscription || 'free');
      setShowEditModal(true);
      setSearchEmail('');
    }
  };

  const handleSaveEdit = async () => {
    if (editingUser) {
      let finalRole = editRole;
      let finalSubscription = editSubscription;
      if (editRole === 'admin') {
        finalSubscription = null;
      } else if (editRole === 'user') {
        finalSubscription = editSubscription;
      }
      await updateUserRole(editingUser.id, finalRole, finalSubscription);
      setShowEditModal(false);
      setEditingUser(null);
    }
  };

  const featuresList = [
    { name: 'Hashtag Generator', slug: 'hashtag-generator' },
    { name: 'Title Generator', slug: 'title-generator' },
    { name: 'Content Analyzer', slug: 'content-analyzer' },
    { name: 'Viral Filter', slug: 'viral-filter' },
    { name: 'Engagement Analyzer', slug: 'engagement-analyzer' },
    { name: 'Analytics Dashboard', slug: 'analytics-dashboard' },
    { name: 'YouTube Downloader', slug: 'youtube-downloader' },
    { name: 'TikTok Downloader', slug: 'tiktok-downloader' },
    { name: 'Subtitle Generator', slug: 'subtitle-generator' },
    { name: 'Video Clipper', slug: 'video-clipper' },
    { name: 'Shorts Generator', slug: 'shorts-generator' },
    { name: 'YouTube Uploader', slug: 'youtube-uploader' },
    { name: 'TikTok Uploader', slug: 'tiktok-uploader' },
    { name: 'Scheduler (Delay Upload)', slug: 'scheduler' },
    { name: 'Auto Upload', slug: 'auto-upload' },
    { name: 'Workflow Automation', slug: 'workflow-automation' },
    { name: 'Queue System', slug: 'queue-system' },
    { name: 'Rate Limiter', slug: 'rate-limiter' },
    { name: 'Logging System', slug: 'logging-system' }
  ];

  const analyticsList = [
    { name: 'Engagement Analyzer', slug: 'engagement-analyzer' },
    { name: 'Analytics Dashboard', slug: 'analytics-dashboard' }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header Elegan */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('dashboard')}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('slogan')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setLanguage(language === 'en' ? 'id' : 'en')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <Globe className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
              </button>
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm transition">
                <LogOut className="w-4 h-4" /> {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Admin & Waktu */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-col items-center gap-2 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              📧 {adminEmail} | 👑 {adminRole || 'Admin'}
            </p>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            🕐 {currentDateTime}
          </div>
        </div>
      </div>

      {/* 3 Kolom Menu Utama - Bisa dibuka bersamaan */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* FEATURES */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setOpenFeatures(!openFeatures)}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 hover:from-blue-100 dark:hover:from-blue-900/50 transition"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-gray-800 dark:text-white">{t('features')}</span>
              </div>
              {openFeatures ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {openFeatures && (
              <div className="p-3 max-h-80 overflow-y-auto">
                {featuresList.map((feature) => (
                  <Link key={feature.slug} href={`/dashboard/features/${feature.slug}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span className="text-gray-700 dark:text-gray-300">{feature.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ANALYTICS */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setOpenAnalytics(!openAnalytics)}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 hover:from-green-100 dark:hover:from-green-900/50 transition"
            >
              <div className="flex items-center gap-2">
                <BarChart className="w-5 h-5 text-green-600" />
                <span className="font-bold text-gray-800 dark:text-white">{t('analytics')}</span>
              </div>
              {openAnalytics ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {openAnalytics && (
              <div className="p-3">
                {analyticsList.map((item) => (
                  <Link key={item.slug} href={`/dashboard/features/${item.slug}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* SETTINGS */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setOpenSettings(!openSettings)}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 hover:from-purple-100 dark:hover:from-purple-900/50 transition"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                <span className="font-bold text-gray-800 dark:text-white">{t('website')}</span>
              </div>
              {openSettings ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {openSettings && (
              <div className="p-3 space-y-4 max-h-80 overflow-y-auto">
                {/* Search User */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1"><Search className="w-3 h-3" /> {t('searchUser')}</h4>
                  <div className="flex gap-2">
                    <input type="email" value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} placeholder={t('searchPlaceholder')} className="flex-1 p-2 rounded-lg border text-sm dark:bg-gray-800" />
                    <button onClick={handleSearchUser} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">🔍 {t('search')}</button>
                  </div>
                </div>
                {/* Logo */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">{t('websiteLogo')}</h4>
                  <div className="flex items-center gap-3">
                    {websiteSettings.logo_url && <img src={websiteSettings.logo_url} alt="Logo" className="h-8 w-auto" />}
                    <label className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs cursor-pointer">📤 {t('uploadLogo')}<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} /></label>
                  </div>
                </div>
                {/* QR Payment */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">{t('qrPayment')}</h4>
                  <AdminPaymentSettings />
                </div>
                {/* General Settings */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">{t('generalSettings')}</h4>
                  <div className="space-y-2">
                    <input type="text" value={websiteSettings.site_name} onChange={(e) => setWebsiteSettings({...websiteSettings, site_name: e.target.value})} className="w-full p-2 rounded-lg border text-sm" placeholder={t('siteName')} />
                    <div className="flex gap-2"><input type="color" value={websiteSettings.primary_color} onChange={(e) => setWebsiteSettings({...websiteSettings, primary_color: e.target.value})} className="w-10 h-10 rounded" /><input type="text" value={websiteSettings.primary_color} onChange={(e) => setWebsiteSettings({...websiteSettings, primary_color: e.target.value})} className="flex-1 p-2 rounded-lg border text-sm" /></div>
                    <input type="text" value={websiteSettings.footer_text} onChange={(e) => setWebsiteSettings({...websiteSettings, footer_text: e.target.value})} className="w-full p-2 rounded-lg border text-sm" />
                    <button onClick={saveWebsiteSettings} disabled={saving} className="w-full bg-green-600 text-white py-2 rounded-lg text-sm">{saving ? '...' : t('save')}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Edit User */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('editUser')}</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-200 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">{t('email')}</label><input type="email" value={editingUser.email} disabled className="w-full p-2 rounded-lg border bg-gray-100" /></div>
              <div><label className="block text-sm font-medium mb-1">{t('role')}</label><select value={editRole} onChange={(e) => setEditRole(e.target.value)} className="w-full p-2 rounded-lg border"><option value="user">User</option><option value="admin">Admin</option></select></div>
              {editRole !== 'admin' && (<div><label className="block text-sm font-medium mb-1">{t('subscription')}</label><select value={editSubscription} onChange={(e) => setEditSubscription(e.target.value)} className="w-full p-2 rounded-lg border"><option value="free">Free</option><option value="pro">Pro</option><option value="premium">Premium</option></select></div>)}
              <div className="flex gap-3 pt-3"><button onClick={handleSaveEdit} className="flex-1 bg-green-600 text-white py-2 rounded-lg">{t('save')}</button><button onClick={() => setShowEditModal(false)} className="flex-1 bg-gray-500 text-white py-2 rounded-lg">{t('cancel')}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
