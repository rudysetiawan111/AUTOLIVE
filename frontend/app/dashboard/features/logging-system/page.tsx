// frontend/app/dashboard/features/logging-system/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Globe, Sun, Moon, LogOut, LayoutDashboard, Activity, 
  AlertCircle, AlertTriangle, Info, Bug, Search, 
  Filter, Calendar, Download, RefreshCw, Eye, ChevronLeft,
  ChevronRight, X, FileText, User, Server, Cpu
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoggingSystemPage() {
  const router = useRouter();
  const supabase = createClient();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  // User info
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [subscriptionExpiry, setSubscriptionExpiry] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState('');

  // Log data & filters
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevels, setSelectedLevels] = useState({
    error: true,
    warning: true,
    info: true,
    debug: false
  });
  const [logType, setLogType] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [stats, setStats] = useState({ error: 0, warning: 0, info: 0, debug: 0 });

  useEffect(() => {
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    fetchUserData();
    fetchLogs();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;
    if (autoRefresh) {
      refreshInterval = setInterval(fetchLogs, 10000);
    }
    return () => clearInterval(refreshInterval);
  }, [autoRefresh, selectedLevels, logType, dateFrom, dateTo, userEmail, searchText, page]);

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

  const fetchLogs = async () => {
    setLoading(true);
    // Mock data - nanti ganti dengan API call ke database
    setTimeout(() => {
      const mockLogs = [
        { id: '1', level: 'error', type: 'system', user: 'user@example.com', action: 'download_youtube', message: 'Connection timeout to YouTube API', ip: '192.168.1.1', createdAt: new Date().toISOString(), details: { stack: 'Error: Timeout', url: 'https://youtube.com/watch?v=abc' } },
        { id: '2', level: 'warning', type: 'queue', user: 'system', action: 'queue_monitor', message: 'Queue load is high (>100 jobs)', ip: '', createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: '3', level: 'info', type: 'user_activity', user: 'admin@autolive.com', action: 'login', message: 'Admin logged in successfully', ip: '10.0.0.1', createdAt: new Date(Date.now() - 7200000).toISOString() },
        { id: '4', level: 'debug', type: 'api', user: '', action: 'api_call', message: 'GET /api/queue/stats - 200 OK', ip: '127.0.0.1', createdAt: new Date(Date.now() - 86400000).toISOString() },
      ];
      setLogs(mockLogs);
      setStats({ error: 5, warning: 12, info: 234, debug: 89 });
      setTotalPages(3);
      setLoading(false);
    }, 500);
  };

  const getLevelIcon = (level: string) => {
    switch(level) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      case 'debug': return <Bug className="w-4 h-4 text-gray-500" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch(level) {
      case 'error': return <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Error</span>;
      case 'warning': return <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">Warning</span>;
      case 'info': return <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Info</span>;
      case 'debug': return <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Debug</span>;
      default: return null;
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'system') return <Server className="w-3 h-3" />;
    if (type === 'api') return <Cpu className="w-3 h-3" />;
    if (type === 'queue') return <Activity className="w-3 h-3" />;
    return <User className="w-3 h-3" />;
  };

  const resetFilters = () => {
    setSelectedLevels({ error: true, warning: true, info: true, debug: false });
    setLogType('all');
    setDateFrom('');
    setDateTo('');
    setUserEmail('');
    setSearchText('');
    setPage(1);
    fetchLogs();
  };

  const exportLogs = () => {
    toast.success(language === 'en' ? 'Export started' : 'Ekspor dimulai');
    // In real app, call API to generate CSV
  };

  const filteredLogs = logs.filter(log => {
    if (!selectedLevels[log.level as keyof typeof selectedLevels]) return false;
    if (logType !== 'all' && log.type !== logType) return false;
    if (userEmail && !log.user.includes(userEmail)) return false;
    if (searchText && !log.message.toLowerCase().includes(searchText.toLowerCase()) && !log.action.toLowerCase().includes(searchText.toLowerCase())) return false;
    if (dateFrom && new Date(log.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(log.createdAt) > new Date(dateTo)) return false;
    return true;
  });

  const t = (key: string) => {
    const translations: any = {
      en: {
        pageTitle: 'LOGGING SYSTEM',
        subTitle: 'MONITOR SYSTEM ACTIVITY',
        description: 'View and filter error, activity, and API logs',
        backToDashboard: 'Dashboard',
        logout: 'Logout',
        userName: 'Username',
        role: 'Role',
        activeUntil: 'Active until',
        filterPanel: 'Filter Logs',
        logLevel: 'Log Level',
        error: 'Error',
        warning: 'Warning',
        info: 'Info',
        debug: 'Debug',
        logType: 'Log Type',
        allTypes: 'All',
        system: 'System',
        api: 'API',
        queue: 'Queue',
        userActivity: 'User Activity',
        dateRange: 'Date Range',
        from: 'From',
        to: 'To',
        userEmailFilter: 'User Email',
        applyFilters: 'Apply Filters',
        reset: 'Reset',
        export: 'Export CSV',
        logEntries: 'Log Entries',
        searchPlaceholder: 'Search in message/action...',
        level: 'Level',
        timestamp: 'Timestamp',
        user: 'User',
        action: 'Action',
        message: 'Message',
        ip: 'IP Address',
        actions: 'Actions',
        detail: 'Detail',
        noLogs: 'No logs found',
        previous: 'Previous',
        next: 'Next',
        autoRefresh: 'Auto-refresh (10s)',
        statsTitle: 'Log Statistics',
        detailTitle: 'Log Detail',
        close: 'Close',
        details: 'Details',
      },
      id: {
        pageTitle: 'SISTEM LOGGING',
        subTitle: 'MONITOR AKTIVITAS SISTEM',
        description: 'Lihat dan filter log error, aktivitas, dan API',
        backToDashboard: 'Dashboard',
        logout: 'Keluar',
        userName: 'Nama Pengguna',
        role: 'Hak Akses',
        activeUntil: 'Aktif sampai',
        filterPanel: 'Filter Log',
        logLevel: 'Level Log',
        error: 'Error',
        warning: 'Warning',
        info: 'Info',
        debug: 'Debug',
        logType: 'Tipe Log',
        allTypes: 'Semua',
        system: 'Sistem',
        api: 'API',
        queue: 'Antrian',
        userActivity: 'Aktivitas User',
        dateRange: 'Rentang Tanggal',
        from: 'Dari',
        to: 'Sampai',
        userEmailFilter: 'Email User',
        applyFilters: 'Terapkan Filter',
        reset: 'Reset',
        export: 'Ekspor CSV',
        logEntries: 'Entri Log',
        searchPlaceholder: 'Cari di pesan/aksi...',
        level: 'Level',
        timestamp: 'Waktu',
        user: 'User',
        action: 'Aksi',
        message: 'Pesan',
        ip: 'Alamat IP',
        actions: 'Aksi',
        detail: 'Detail',
        noLogs: 'Tidak ada log',
        previous: 'Sebelumnya',
        next: 'Selanjutnya',
        autoRefresh: 'Auto-refresh (10d)',
        statsTitle: 'Statistik Log',
        detailTitle: 'Detail Log',
        close: 'Tutup',
        details: 'Detail',
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
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 text-center border-l-4 border-red-500">
            <p className="text-2xl font-bold text-red-600">{stats.error}</p>
            <p className="text-xs text-gray-500">{t('error')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 text-center border-l-4 border-yellow-500">
            <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
            <p className="text-xs text-gray-500">{t('warning')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 text-center border-l-4 border-blue-500">
            <p className="text-2xl font-bold text-blue-600">{stats.info}</p>
            <p className="text-xs text-gray-500">{t('info')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 text-center border-l-4 border-gray-500">
            <p className="text-2xl font-bold text-gray-600">{stats.debug}</p>
            <p className="text-xs text-gray-500">{t('debug')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filter Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Filter className="w-5 h-5 text-primary" /> {t('filterPanel')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('logLevel')}</label>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-1"><input type="checkbox" checked={selectedLevels.error} onChange={(e) => setSelectedLevels({...selectedLevels, error: e.target.checked})} /> {t('error')}</label>
                  <label className="flex items-center gap-1"><input type="checkbox" checked={selectedLevels.warning} onChange={(e) => setSelectedLevels({...selectedLevels, warning: e.target.checked})} /> {t('warning')}</label>
                  <label className="flex items-center gap-1"><input type="checkbox" checked={selectedLevels.info} onChange={(e) => setSelectedLevels({...selectedLevels, info: e.target.checked})} /> {t('info')}</label>
                  <label className="flex items-center gap-1"><input type="checkbox" checked={selectedLevels.debug} onChange={(e) => setSelectedLevels({...selectedLevels, debug: e.target.checked})} /> {t('debug')}</label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('logType')}</label>
                <select value={logType} onChange={(e) => setLogType(e.target.value)} className="w-full p-2 border rounded-lg">
                  <option value="all">{t('allTypes')}</option>
                  <option value="system">{t('system')}</option>
                  <option value="api">{t('api')}</option>
                  <option value="queue">{t('queue')}</option>
                  <option value="user_activity">{t('userActivity')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('dateRange')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="datetime-local" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="p-2 border rounded-lg text-sm" />
                  <input type="datetime-local" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="p-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('userEmailFilter')}</label>
                <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="user@example.com" className="w-full p-2 border rounded-lg" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={fetchLogs} className="flex-1 bg-primary text-white py-2 rounded-lg flex items-center justify-center gap-1"><Search className="w-4 h-4" /> {t('applyFilters')}</button>
                <button onClick={resetFilters} className="flex-1 bg-gray-500 text-white py-2 rounded-lg flex items-center justify-center gap-1"><RefreshCw className="w-4 h-4" /> {t('reset')}</button>
              </div>
              <button onClick={exportLogs} className="w-full bg-green-600 text-white py-2 rounded-lg flex items-center justify-center gap-1"><Download className="w-4 h-4" /> {t('export')}</button>
            </div>
          </div>

          {/* Log Table */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> {t('logEntries')}</h3>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} /> {t('autoRefresh')}</label>
            </div>
            <div className="mb-3 relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder={t('searchPlaceholder')} className="w-full pl-8 pr-2 py-1 border rounded-lg text-sm" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="p-2 text-left">{t('level')}</th>
                    <th className="p-2 text-left">{t('timestamp')}</th>
                    <th className="p-2 text-left">{t('user')}</th>
                    <th className="p-2 text-left">{t('action')}</th>
                    <th className="p-2 text-left">{t('message')}</th>
                    <th className="p-2 text-left">{t('ip')}</th>
                    <th className="p-2 text-left">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={7} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>}
                  {!loading && filteredLogs.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-500">{t('noLogs')}</td></tr>}
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="p-2">{getLevelBadge(log.level)}</td>
                      <td className="p-2 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="p-2">{log.user || '-'}</td>
                      <td className="p-2"><div className="flex items-center gap-1">{getTypeIcon(log.type)} {log.action}</div></td>
                      <td className="p-2 max-w-xs truncate">{log.message}</td>
                      <td className="p-2 text-xs">{log.ip || '-'}</td>
                      <td className="p-2"><button onClick={() => { setSelectedLog(log); setShowDetailModal(true); }} className="text-primary hover:underline">{t('detail')}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                <span>Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('detailTitle')}</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              <p><strong>ID:</strong> {selectedLog.id}</p>
              <p><strong>{t('level')}:</strong> {getLevelBadge(selectedLog.level)}</p>
              <p><strong>{t('timestamp')}:</strong> {new Date(selectedLog.createdAt).toLocaleString()}</p>
              <p><strong>{t('user')}:</strong> {selectedLog.user || '-'}</p>
              <p><strong>{t('action')}:</strong> {selectedLog.action}</p>
              <p><strong>{t('message')}:</strong> {selectedLog.message}</p>
              <p><strong>IP:</strong> {selectedLog.ip || '-'}</p>
              <p><strong>{t('details')}:</strong> <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-auto">{JSON.stringify(selectedLog.details, null, 2)}</pre></p>
            </div>
            <button onClick={() => setShowDetailModal(false)} className="mt-4 w-full bg-primary text-white py-2 rounded-lg">{t('close')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
