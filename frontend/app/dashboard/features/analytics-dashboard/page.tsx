// frontend/app/dashboard/features/analytics-dashboard/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Globe, Sun, Moon, LogOut, LayoutDashboard,
  TrendingUp, DollarSign, Users, Activity,
  Calendar, Download, Eye, BarChart3, PieChart
} from 'lucide-react';
import toast from 'react-hot-toast';

// Mock charts (will use simple divs, can be replaced with recharts later)
const SimpleChart = ({ data, color }: { data: number[]; color: string }) => (
  <div className="flex items-end gap-1 h-32">
    {data.map((value, i) => (
      <div key={i} className="flex-1 flex flex-col items-center">
        <div className={`w-full ${color} rounded-t`} style={{ height: `${value}%` }}></div>
        <span className="text-xs mt-1">{i + 1}</span>
      </div>
    ))}
  </div>
);

export default function AnalyticsDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  // User info
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [subscriptionExpiry, setSubscriptionExpiry] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState('');

  // Analytics data
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    totalJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    totalContent: 0,
    viralScore: 0,
  });
  const [userGrowth, setUserGrowth] = useState<number[]>([65, 70, 78, 82, 88, 92, 95]);
  const [revenueData, setRevenueData] = useState<number[]>([2.5, 3.2, 4.1, 5.0, 6.3, 7.8, 9.2]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    fetchUserData();
    fetchAnalytics();
    fetchRecentActivities();
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

  const fetchAnalytics = async () => {
    setLoading(true);
    // Mock data - nanti ganti dengan API call aggregator
    setTimeout(() => {
      setStats({
        totalUsers: 1250,
        activeUsers: 890,
        totalRevenue: 45250000,
        totalJobs: 3420,
        completedJobs: 3150,
        failedJobs: 270,
        totalContent: 1890,
        viralScore: 78,
      });
      setLoading(false);
    }, 500);
  };

  const fetchRecentActivities = async () => {
    // Mock recent activities
    setRecentActivities([
      { id: '1', action: 'User registered', user: 'newuser@example.com', time: new Date().toISOString() },
      { id: '2', action: 'Video uploaded', user: 'creator@example.com', time: new Date(Date.now() - 3600000).toISOString() },
      { id: '3', action: 'Payment received', user: 'premium@example.com', time: new Date(Date.now() - 7200000).toISOString() },
      { id: '4', action: 'Job completed', user: 'system', time: new Date(Date.now() - 86400000).toISOString() },
    ]);
  };

  const t = (key: string) => {
    const translations: any = {
      en: {
        pageTitle: 'ANALYTICS DASHBOARD',
        subTitle: 'PERFORMANCE & INSIGHTS',
        description: 'Monitor your platform metrics and trends',
        backToDashboard: 'Dashboard',
        logout: 'Logout',
        userName: 'Username',
        role: 'Role',
        activeUntil: 'Active until',
        totalUsers: 'Total Users',
        activeUsers: 'Active Users',
        revenue: 'Revenue (Rp)',
        totalJobs: 'Total Jobs',
        completedJobs: 'Completed',
        failedJobs: 'Failed',
        totalContent: 'Total Content',
        viralScore: 'Viral Score',
        userGrowth: 'User Growth (7 days)',
        revenueTrend: 'Revenue Trend (millions)',
        recentActivity: 'Recent Activity',
        action: 'Action',
        user: 'User',
        time: 'Time',
        exportReport: 'Export Report',
      },
      id: {
        pageTitle: 'DASHBOARD ANALITIK',
        subTitle: 'KINERJA & Wawasan',
        description: 'Pantau metrik dan tren platform Anda',
        backToDashboard: 'Dashboard',
        logout: 'Keluar',
        userName: 'Nama Pengguna',
        role: 'Hak Akses',
        activeUntil: 'Aktif sampai',
        totalUsers: 'Total Pengguna',
        activeUsers: 'Pengguna Aktif',
        revenue: 'Pendapatan (Rp)',
        totalJobs: 'Total Job',
        completedJobs: 'Selesai',
        failedJobs: 'Gagal',
        totalContent: 'Total Konten',
        viralScore: 'Skor Viral',
        userGrowth: 'Pertumbuhan Pengguna (7 hari)',
        revenueTrend: 'Tren Pendapatan (juta)',
        recentActivity: 'Aktivitas Terbaru',
        action: 'Aksi',
        user: 'Pengguna',
        time: 'Waktu',
        exportReport: 'Ekspor Laporan',
      }
    };
    return translations[language]?.[key] || key;
  };

  const exportReport = () => {
    toast.success(language === 'en' ? 'Report export started' : 'Ekspor laporan dimulai');
    // In production, call API to generate CSV
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

      <main className="max-w-7xl mx-auto px-6 py-4">
        {/* Stats Cards */}
        {loading ? (
          <div className="text-center py-12">Loading analytics...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center">
                <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{t('totalUsers')}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center">
                <Activity className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{t('activeUsers')}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center">
                <DollarSign className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">Rp {(stats.totalRevenue / 1000).toFixed(0)}k</p>
                <p className="text-xs text-gray-500">{t('revenue')}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center">
                <TrendingUp className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.viralScore}%</p>
                <p className="text-xs text-gray-500">{t('viralScore')}</p>
              </div>
            </div>

            {/* Job Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center">
                <p className="text-sm text-gray-500">{t('totalJobs')}</p>
                <p className="text-2xl font-bold">{stats.totalJobs.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center">
                <p className="text-sm text-green-600">{t('completedJobs')}</p>
                <p className="text-2xl font-bold">{stats.completedJobs.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center">
                <p className="text-sm text-red-600">{t('failedJobs')}</p>
                <p className="text-2xl font-bold">{stats.failedJobs.toLocaleString()}</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> {t('userGrowth')}</h3>
                <SimpleChart data={userGrowth} color="bg-blue-500" />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2"><DollarSign className="w-4 h-4" /> {t('revenueTrend')}</h3>
                <SimpleChart data={revenueData} color="bg-green-500" />
              </div>
            </div>

            {/* Recent Activity & Export */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold flex items-center gap-2"><Activity className="w-4 h-4" /> {t('recentActivity')}</h3>
                <button onClick={exportReport} className="text-sm bg-primary text-white px-3 py-1 rounded-lg flex items-center gap-1">
                  <Download className="w-3 h-3" /> {t('exportReport')}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr><th className="p-2 text-left">{t('action')}</th><th className="p-2 text-left">{t('user')}</th><th className="p-2 text-left">{t('time')}</th></tr>
                  </thead>
                  <tbody>
                    {recentActivities.map(act => (
                      <tr key={act.id} className="border-t">
                        <td className="p-2">{act.action}</td>
                        <td className="p-2">{act.user}</td>
                        <td className="p-2 text-xs">{new Date(act.time).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
