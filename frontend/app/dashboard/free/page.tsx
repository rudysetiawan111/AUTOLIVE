'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  LogOut, Shield, Globe, Sun, Moon, 
  ChevronDown, ChevronRight, Upload, TrendingUp, Edit, Eye, Share2, Clock, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function FreeDashboard() {
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
      toast.error('Masa trial 7 hari Anda telah berakhir. Silakan upgrade akun!');
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
      setUserSubscription(userData?.subscription || 'Free');
      
      if (userData?.subscription_expiry) {
        setSubscriptionExpiry(userData.subscription_expiry);
        const expiryDate = new Date(userData.subscription_expiry);
        const now = new Date();
        
        if (expiryDate <= now) {
          setIsExpired(true);
          toast.error('Masa trial 7 hari Anda telah berakhir. Silakan upgrade akun!');
          setTimeout(() => {
            router.push('/payment?role=pro&email=' + encodeURIComponent(user.email));
          }, 3000);
        }
      } else {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
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
        dashboard: 'DASHBOARD FREE ACCOUNT',
        slogan: 'Limited Access - 7 Days Trial',
        logout: 'Logout',
        features: 'AVAILABLE FEATURES',
        status: 'Status',
        subscription: 'Subscription',
        expiry: 'Expiry',
        days: 'days',
        hours: 'hours',
        minutes: 'minutes',
        seconds: 'seconds',
        upgrade: 'Upgrade Account',
        upgradeMessage: 'Your free trial has expired or will expire soon. Upgrade to Pro or Premium for more features!',
        expired: 'Expired',
        active: 'Active',
        timeRemaining: 'Time Remaining',
        trialEnding: 'Your trial will end in:'
      },
      id: {
        dashboard: 'DASHBOARD AKUN FREE',
        slogan: 'Akses Terbatas - Masa Trial 7 Hari',
        logout: 'Keluar',
        features: 'FITUR YANG TERSEDIA',
        status: 'Status',
        subscription: 'Langganan',
        expiry: 'Berakhir',
        days: 'hari',
        hours: 'jam',
        minutes: 'menit',
        seconds: 'detik',
        upgrade: 'Upgrade Akun',
        upgradeMessage: 'Masa trial gratis Anda telah berakhir atau akan segera berakhir. Upgrade ke Pro atau Premium untuk fitur lebih lengkap!',
        expired: 'Kadaluarsa',
        active: 'Aktif',
        timeRemaining: 'Sisa Waktu',
        trialEnding: 'Masa trial Anda akan berakhir dalam:'
      }
    };
    return translations[language]?.[key] || key;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleUpgrade = () => {
    router.push('/payment?role=pro&email=' + encodeURIComponent(userEmail));
  };

  const handleFeatureClick = (featureName: string, description: string) => {
    if (isExpired || (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0)) {
      alert(`⚠️ ${featureName}\n\n${t('upgradeMessage')}`);
      return;
    }
    alert(`📌 ${featureName}\n\n${description}`);
  };

  // Fitur yang tersedia untuk FREE
  const featuresList = [
    { name: 'Hashtag Generator', desc: 'Generate hashtags with AI, limited to 5 times per day', icon: Upload },
    { name: 'Title Generator', desc: 'Generate engaging video titles, 5 times per day', icon: Edit },
    { name: 'Content Analyzer', desc: 'Basic content analysis with simple scoring', icon: Eye },
    { name: 'Viral Filter', desc: 'View viral trends but cannot save', icon: TrendingUp },
    { name: 'Engagement Analyzer', desc: 'Mock engagement metrics for learning', icon: Share2 }
  ];

  const isActive = !isExpired && (timeLeft.days > 0 || timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0);
  const isWarning = timeLeft.days <= 1 && timeLeft.days >= 0 && isActive;

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t('expired')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{t('upgradeMessage')}</p>
          <button onClick={handleUpgrade} className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 rounded-xl transition">
            🚀 {t('upgrade')}
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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{t('dashboard')}</h1>
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

      {/* Info User & Timer Free */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-col items-center gap-2 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              📧 {userEmail} | 👑 {t('subscription')}: {userSubscription}
            </p>
          </div>
          
          {/* Timer Free - Sisa Waktu (Hari, Jam, Menit, Detik) */}
          <div className="text-center mt-2">
            <div className={`inline-flex items-center gap-4 rounded-xl px-6 py-3 ${
              isWarning 
                ? 'bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-950/50 dark:to-orange-950/50'
                : 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50'
            }`}>
              <Clock className={`w-5 h-5 ${isWarning ? 'text-orange-600' : 'text-green-600'}`} />
              <div className="flex gap-4 text-center">
                <div>
                  <div className={`text-2xl font-bold ${isWarning ? 'text-orange-700' : 'text-green-700'}`}>{timeLeft.days}</div>
                  <div className="text-xs text-gray-500">{t('days')}</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${isWarning ? 'text-orange-700' : 'text-green-700'}`}>{timeLeft.hours}</div>
                  <div className="text-xs text-gray-500">{t('hours')}</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${isWarning ? 'text-orange-700' : 'text-green-700'}`}>{timeLeft.minutes}</div>
                  <div className="text-xs text-gray-500">{t('minutes')}</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${isWarning ? 'text-orange-700' : 'text-green-700'}`}>{timeLeft.seconds}</div>
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

      {/* Peringatan 1 hari terakhir */}
      {isWarning && (
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-xl p-3 text-center">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              ⚠️ {t('trialEnding')} {timeLeft.days} {t('days')} {timeLeft.hours} {t('hours')} {timeLeft.minutes} {t('minutes')}! Segera upgrade agar tidak kehilangan akses.
            </p>
          </div>
        </div>
      )}

      {/* Tombol Upgrade */}
      <div className="max-w-7xl mx-auto px-6 py-3">
        <button onClick={handleUpgrade} className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 rounded-xl transition shadow-md">
          🚀 {t('upgrade')} (Mulai dari Rp 50.000/bulan)
        </button>
      </div>

      {/* Fitur yang Tersedia */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => setOpenFeatures(!openFeatures)}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-900/30 hover:from-green-100 dark:hover:from-green-900/50 transition"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
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
                    onClick={() => handleFeatureClick(feature.name, feature.desc)}
                    className="flex items-center gap-3 p-3 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950/30 cursor-pointer transition"
                  >
                    <feature.icon className="w-5 h-5 text-green-500" />
                    <div>
                      <h4 className="font-semibold text-sm text-gray-800 dark:text-white">{feature.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{feature.desc}</p>
                    </div>
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
