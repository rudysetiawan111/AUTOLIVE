'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  LogOut, Shield, Globe, Sun, Moon, 
  ChevronDown, ChevronRight, Upload, TrendingUp, Edit, 
  Download, Video, Film, Subtitles, Cpu, Calendar, 
  Clock, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProDashboard() {
  const [userEmail, setUserEmail] = useState('');
  const [userSubscription, setUserSubscription] = useState('');
  const [subscriptionExpiry, setSubscriptionExpiry] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [openFeatures, setOpenFeatures] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const router = useRouter();
  const supabase = createClient();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    updateDateTime();
    const dateTimeInterval = setInterval(updateDateTime, 1000);
    return () => clearInterval(dateTimeInterval);
  }, []);

  useEffect(() => {
    getUserData();
    const expiryInterval = setInterval(() => {
      checkExpiry();
      updateTimeLeft();
    }, 1000);
    return () => clearInterval(expiryInterval);
  }, [subscriptionExpiry]);

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

  const updateTimeLeft = () => {
    if (!subscriptionExpiry) return;
    const expiryDate = new Date(subscriptionExpiry);
    const now = new Date();
    const diff = expiryDate.getTime() - now.getTime();
    
    if (diff <= 0) {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    setTimeLeft({ days, hours, minutes, seconds });
  };

  const checkExpiry = () => {
    if (!subscriptionExpiry) return;
    const expiryDate = new Date(subscriptionExpiry);
    const now = new Date();
    
    if (expiryDate <= now && !isExpired) {
      setIsExpired(true);
      toast.error('Masa langganan Pro Anda telah berakhir. Silakan perpanjang!');
      setTimeout(() => {
        router.push('/payment?role=pro&email=' + encodeURIComponent(userEmail));
      }, 3000);
    }
  };

  const getUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email || 'user@autolive.com');
      const { data: userData } = await supabase.from('users').select('subscription, subscription_expiry').eq('id', user.id).single();
      setUserSubscription(userData?.subscription || 'Pro');
      
      if (userData?.subscription_expiry) {
        setSubscriptionExpiry(userData.subscription_expiry);
        const expiryDate = new Date(userData.subscription_expiry);
        const now = new Date();
        
        if (expiryDate <= now) {
          setIsExpired(true);
          toast.error('Masa langganan Pro Anda telah berakhir. Silakan perpanjang!');
          setTimeout(() => {
            router.push('/payment?role=pro&email=' + encodeURIComponent(user.email));
          }, 3000);
        }
      } else {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        const { error: updateError } = await supabase.from('users').update({ subscription_expiry: expiryDate.toISOString() }).eq('id', user.id);
        if (!updateError) {
          setSubscriptionExpiry(expiryDate.toISOString());
        }
      }
    } else {
      router.push('/login');
    }
  };

  const t = (key: string) => {
    const translations: any = {
      en: {
        dashboard: 'DASHBOARD PRO ACCOUNT',
        slogan: 'Full Production Tools & Queue Access',
        logout: 'Logout',
        features: 'PRO FEATURES',
        status: 'Status',
        subscription: 'Subscription',
        expiry: 'Expiry',
        days: 'days',
        hours: 'hours',
        minutes: 'minutes',
        seconds: 'seconds',
        renew: 'Renew Subscription',
        renewMessage: 'Your Pro subscription has expired. Please renew to continue using Pro features.',
        expired: 'Expired',
        active: 'Active',
        timeRemaining: 'Time Remaining',
        premiumOnly: 'PREMIUM ONLY'
      },
      id: {
        dashboard: 'DASHBOARD AKUN PRO',
        slogan: 'Alat Produksi Lengkap & Akses Antrian',
        logout: 'Keluar',
        features: 'FITUR PRO',
        status: 'Status',
        subscription: 'Langganan',
        expiry: 'Berakhir',
        days: 'hari',
        hours: 'jam',
        minutes: 'menit',
        seconds: 'detik',
        renew: 'Perpanjang Langganan',
        renewMessage: 'Langganan Pro Anda telah berakhir. Silakan perpanjang untuk terus menggunakan fitur Pro.',
        expired: 'Kadaluarsa',
        active: 'Aktif',
        timeRemaining: 'Sisa Waktu',
        premiumOnly: 'HANYA PREMIUM'
      }
    };
    return translations[language]?.[key] || key;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleRenew = () => {
    router.push('/payment?role=pro&email=' + encodeURIComponent(userEmail));
  };

  const handleFeatureClick = (featureName: string, description: string, isPremiumOnly: boolean = false) => {
    if (isPremiumOnly) {
      alert(`⚠️ ${featureName}\n\nFitur ini hanya tersedia untuk PREMIUM. Silakan upgrade ke Premium!`);
      return;
    }
    alert(`📌 ${featureName}\n\n${description}`);
  };

  // Fitur Pro (aktif) dan Premium (tidak aktif)
  const featuresList = [
    { name: 'Hashtag Generator', desc: 'Generate unlimited hashtags with AI', icon: Upload, premiumOnly: false },
    { name: 'Title Generator', desc: 'Generate unlimited video titles', icon: Edit, premiumOnly: false },
    { name: 'Content Analyzer', desc: 'Advanced content analysis with detailed scoring', icon: TrendingUp, premiumOnly: false },
    { name: 'Viral Filter', desc: 'AI-powered viral content detection', icon: TrendingUp, premiumOnly: false },
    { name: 'Engagement Analyzer', desc: 'Full engagement metrics analytics', icon: TrendingUp, premiumOnly: false },
    { name: 'YouTube Downloader', desc: 'Download YouTube videos in HD', icon: Download, premiumOnly: false },
    { name: 'TikTok Downloader', desc: 'Download TikTok videos without watermark', icon: Download, premiumOnly: false },
    { name: 'Subtitle Generator', desc: 'AI-powered subtitle generation', icon: Subtitles, premiumOnly: false },
    { name: 'Video Clipper', desc: 'Cut and trim videos with precision', icon: Film, premiumOnly: false },
    { name: 'Shorts Generator', desc: 'Turn long videos into shorts', icon: Video, premiumOnly: false },
    { name: 'Queue System', desc: 'Priority queue access', icon: Cpu, premiumOnly: false },
    { name: 'Scheduler', desc: 'Schedule video uploads at specific times', icon: Calendar, premiumOnly: true },
    { name: 'Auto Upload', desc: 'Automatic upload to platforms', icon: Upload, premiumOnly: true },
    { name: 'Workflow Automation', desc: 'Create and execute complex workflows', icon: Upload, premiumOnly: true },
    { name: 'Queue Priority', desc: 'Highest priority in processing queue', icon: Cpu, premiumOnly: true },
    { name: 'Analytics Dashboard', desc: 'Complete analytics dashboard', icon: TrendingUp, premiumOnly: true }
  ];

  const isActive = !isExpired && (timeLeft.days > 0 || timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0);

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t('expired')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{t('renewMessage')}</p>
          <button onClick={handleRenew} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 rounded-xl transition">
            🔄 {t('renew')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header Elegan */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{t('dashboard')}</h1>
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

      {/* Info User & Timer Pro */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-col items-center gap-2 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              📧 {userEmail} | 👑 {t('subscription')}: {userSubscription}
            </p>
          </div>
          
          {/* Timer Pro - Sisa Waktu (Hari, Jam, Menit, Detik) */}
          <div className="text-center mt-2">
            <div className="inline-flex items-center gap-4 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-950/50 dark:to-cyan-950/50 rounded-xl px-6 py-3">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div className="flex gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{timeLeft.days}</div>
                  <div className="text-xs text-gray-500">{t('days')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{timeLeft.hours}</div>
                  <div className="text-xs text-gray-500">{t('hours')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{timeLeft.minutes}</div>
                  <div className="text-xs text-gray-500">{t('minutes')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{timeLeft.seconds}</div>
                  <div className="text-xs text-gray-500">{t('seconds')}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            🕐 {currentDateTime}
          </div>
        </div>
      </div>

      {/* Tombol Perpanjang */}
      <div className="max-w-7xl mx-auto px-6 py-3">
        <button onClick={handleRenew} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 rounded-xl transition shadow-md">
          🔄 {t('renew')} (Rp 50.000 / bulan)
        </button>
      </div>

      {/* Fitur Pro & Premium */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => setOpenFeatures(!openFeatures)}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-900/30 hover:from-blue-100 dark:hover:from-blue-900/50 transition"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-gray-800 dark:text-white">{t('features')}</span>
            </div>
            {openFeatures ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {openFeatures && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {featuresList.map((feature, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleFeatureClick(feature.name, feature.desc, feature.premiumOnly)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition ${
                      !feature.premiumOnly 
                        ? 'border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer' 
                        : 'border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50'
                    }`}
                  >
                    <feature.icon className={`w-5 h-5 ${!feature.premiumOnly ? 'text-blue-500' : 'text-gray-400'}`} />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-gray-800 dark:text-white">{feature.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{feature.desc}</p>
                    </div>
                    {feature.premiumOnly && (
                      <span className="text-xs font-bold text-purple-500 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-full">
                        {t('premiumOnly')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
