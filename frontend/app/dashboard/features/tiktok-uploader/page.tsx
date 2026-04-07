// frontend/app/dashboard/features/tiktok-uploader/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Globe, Sun, Moon, LogOut, LayoutDashboard, Upload, 
  Key, CheckCircle, AlertCircle, Loader2, ExternalLink,
  History, Music, Video, Hash, Copy
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TikTokUploaderPage() {
  const router = useRouter();
  const supabase = createClient();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  
  // User info
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [subscriptionExpiry, setSubscriptionExpiry] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState('');
  
  // OAuth & API settings
  const [clientKey, setClientKey] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  
  // Upload form
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [privacyStatus, setPrivacyStatus] = useState('public'); // public, friends, private
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Upload history (mock)
  const [history, setHistory] = useState<any[]>([]);
  
  useEffect(() => {
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    fetchUserData();
    fetchHistory();
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
    // Mock data
    setHistory([
      { id: 1, title: 'TikTok Viral Dance', status: 'success', date: new Date().toISOString(), views: 12345, url: 'https://tiktok.com/@user/video/abc123' },
      { id: 2, title: 'Funny Cat Compilation', status: 'success', date: new Date(Date.now() - 86400000).toISOString(), views: 9876, url: 'https://tiktok.com/@user/video/def456' },
      { id: 3, title: 'Failed Upload', status: 'failed', date: new Date(Date.now() - 172800000).toISOString(), error: 'Invalid video duration' },
    ]);
  };

  const handleConnect = () => {
    if (!clientKey.trim() || !clientSecret.trim()) {
      toast.error(language === 'en' ? 'Please fill Client Key and Client Secret' : 'Isi Client Key dan Client Secret');
      return;
    }
    setConnecting(true);
    setTimeout(() => {
      setAccessToken('mock_access_token_' + Date.now());
      setIsConnected(true);
      setConnecting(false);
      toast.success(language === 'en' ? 'Connected to TikTok API' : 'Terhubung ke TikTok API');
    }, 1500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('video/')) {
        toast.error(language === 'en' ? 'Please select a video file' : 'Pilih file video');
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error(language === 'en' ? 'File too large (max 100MB)' : 'File terlalu besar (maks 100MB)');
        return;
      }
      setVideoFile(file);
    }
  };

  const handleUpload = () => {
    if (!isConnected) {
      toast.error(language === 'en' ? 'Please connect to TikTok first' : 'Hubungkan ke TikTok terlebih dahulu');
      return;
    }
    if (!videoFile) {
      toast.error(language === 'en' ? 'Please select a video file' : 'Pilih file video');
      return;
    }
    if (!title.trim()) {
      toast.error(language === 'en' ? 'Please enter video title' : 'Masukkan judul video');
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          toast.success(language === 'en' ? 'Video uploaded to TikTok successfully!' : 'Video berhasil diupload ke TikTok!');
          // Add to history
          const newVideo = {
            id: Date.now(),
            title: title,
            status: 'success',
            date: new Date().toISOString(),
            views: 0,
            url: 'https://tiktok.com/@user/video/mock-id'
          };
          setHistory(prev => [newVideo, ...prev]);
          // Reset form
          setVideoFile(null);
          setTitle('');
          setDescription('');
          setHashtags('');
          const fileInput = document.getElementById('video-file') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const t = (key: string) => {
    const translations: any = {
      en: {
        pageTitle: 'AUTOLIVE TIKTOK UPLOADER',
        subTitle: 'UPLOAD TO TIKTOK',
        description: 'Upload your short videos directly to TikTok with API integration',
        backToDashboard: 'Dashboard',
        logout: 'Logout',
        userName: 'Username',
        role: 'Role',
        activeUntil: 'Active until',
        connection: 'TikTok API Connection',
        clientKey: 'Client Key',
        clientSecret: 'Client Secret',
        connectBtn: 'Connect to TikTok',
        connecting: 'Connecting...',
        connected: 'Connected',
        notConnected: 'Not Connected',
        uploadForm: 'Upload Video',
        videoFile: 'Video File',
        chooseFile: 'Choose video file (max 100MB, max 10min)',
        titleLabel: 'Title',
        descriptionLabel: 'Description',
        hashtagsLabel: 'Hashtags (comma separated)',
        privacyLabel: 'Privacy Status',
        public: 'Public',
        friends: 'Friends only',
        private: 'Private',
        uploadBtn: 'Upload to TikTok',
        uploading: 'Uploading...',
        uploadProgress: 'Upload Progress',
        historyTitle: 'Upload History',
        date: 'Date',
        videoTitle: 'Title',
        status: 'Status',
        views: 'Views',
        action: 'Action',
        view: 'View',
        success: 'Success',
        failed: 'Failed',
        retry: 'Retry',
        remove: 'Remove',
      },
      id: {
        pageTitle: 'AUTOLIVE TIKTOK UPLOADER',
        subTitle: 'UPLOAD KE TIKTOK',
        description: 'Upload video pendek Anda langsung ke TikTok dengan integrasi API',
        backToDashboard: 'Dashboard',
        logout: 'Keluar',
        userName: 'Nama Pengguna',
        role: 'Hak Akses',
        activeUntil: 'Aktif sampai',
        connection: 'Koneksi TikTok API',
        clientKey: 'Client Key',
        clientSecret: 'Client Secret',
        connectBtn: 'Hubungkan ke TikTok',
        connecting: 'Menghubungkan...',
        connected: 'Terhubung',
        notConnected: 'Tidak Terhubung',
        uploadForm: 'Upload Video',
        videoFile: 'File Video',
        chooseFile: 'Pilih file video (maks 100MB, maks 10 menit)',
        titleLabel: 'Judul',
        descriptionLabel: 'Deskripsi',
        hashtagsLabel: 'Hashtag (pisahkan koma)',
        privacyLabel: 'Status Privasi',
        public: 'Publik',
        friends: 'Hanya teman',
        private: 'Pribadi',
        uploadBtn: 'Upload ke TikTok',
        uploading: 'Mengupload...',
        uploadProgress: 'Progres Upload',
        historyTitle: 'Riwayat Upload',
        date: 'Tanggal',
        videoTitle: 'Judul',
        status: 'Status',
        views: 'Tayangan',
        action: 'Aksi',
        view: 'Lihat',
        success: 'Berhasil',
        failed: 'Gagal',
        retry: 'Ulangi',
        remove: 'Hapus',
      }
    };
    return translations[language]?.[key] || key;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* HEADER - Sama seperti halaman lainnya */}
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
          {/* Kiri: Konfigurasi API & Upload Form */}
          <div className="space-y-6">
            {/* API Connection Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Key className="w-5 h-5 text-primary" /> {t('connection')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('clientKey')}</label>
                  <input type="text" value={clientKey} onChange={(e) => setClientKey(e.target.value)} placeholder="TikTok Client Key" className="w-full p-2 rounded-lg border" disabled={isConnected} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('clientSecret')}</label>
                  <input type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} placeholder="TikTok Client Secret" className="w-full p-2 rounded-lg border" disabled={isConnected} />
                </div>
                <button onClick={handleConnect} disabled={isConnected || connecting} className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50">
                  {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  {connecting ? t('connecting') : t('connectBtn')}
                </button>
                {isConnected && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/30 p-2 rounded-lg">
                    <CheckCircle className="w-4 h-4" /> <span className="text-sm">{t('connected')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Form Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Upload className="w-5 h-5 text-primary" /> {t('uploadForm')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('videoFile')}</label>
                  <input id="video-file" type="file" accept="video/*" onChange={handleFileChange} className="w-full p-2 border rounded-lg" disabled={!isConnected || uploading} />
                  {videoFile && <p className="text-xs text-gray-500 mt-1">{videoFile.name} ({(videoFile.size / (1024*1024)).toFixed(2)} MB)</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('titleLabel')}</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Video title" className="w-full p-2 rounded-lg border" disabled={!isConnected || uploading} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('descriptionLabel')}</label>
                  <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Video description" className="w-full p-2 rounded-lg border" disabled={!isConnected || uploading} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('hashtagsLabel')}</label>
                  <input type="text" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#fyp, #viral, #trending" className="w-full p-2 rounded-lg border" disabled={!isConnected || uploading} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('privacyLabel')}</label>
                  <select value={privacyStatus} onChange={(e) => setPrivacyStatus(e.target.value)} className="w-full p-2 rounded-lg border" disabled={!isConnected || uploading}>
                    <option value="public">{t('public')}</option>
                    <option value="friends">{t('friends')}</option>
                    <option value="private">{t('private')}</option>
                  </select>
                </div>
                <button onClick={handleUpload} disabled={!isConnected || uploading || !videoFile || !title} className="w-full bg-black dark:bg-white dark:text-black hover:bg-gray-800 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Music className="w-4 h-4" />}
                  {uploading ? t('uploading') : t('uploadBtn')}
                </button>
                {uploading && (
                  <div>
                    <div className="flex justify-between text-sm mb-1"><span>{t('uploadProgress')}</span><span>{uploadProgress}%</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-black dark:bg-white h-2 rounded-full" style={{ width: `${uploadProgress}%` }}></div></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Kanan: Upload History */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><History className="w-5 h-5 text-primary" /> {t('historyTitle')}</h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {history.length === 0 && <p className="text-center text-gray-500 py-8">No upload history</p>}
              {history.map((item) => (
                <div key={item.id} className="border rounded-lg p-3 hover:shadow-sm transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-gray-500">{new Date(item.date).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === 'success' ? (
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{t('success')}</span>
                      ) : (
                        <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{t('failed')}</span>
                      )}
                    </div>
                  </div>
                  {item.status === 'success' && (
                    <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                      <span>{item.views} {t('views')}</span>
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">{t('view')} <ExternalLink className="w-3 h-3" /></a>
                    </div>
                  )}
                  {item.status === 'failed' && <p className="text-xs text-red-500 mt-1">{item.error}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
