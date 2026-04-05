'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/components/Header';
import { Flame, Download, Edit3, Upload, Calendar, Settings, TrendingUp, Video, Eye, Clock, Crown, Star, CreditCard, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const MENU = [
  { id: 'viral', nameKey: 'viral_filter', icon: Flame, role: 'free', color: 'from-red-500 to-orange-500', desc: 'Find trending content' },
  { id: 'download', nameKey: 'downloader', icon: Download, role: 'pro', color: 'from-blue-500 to-cyan-500', desc: 'Download videos' },
  { id: 'editor', nameKey: 'editor', icon: Edit3, role: 'pro', color: 'from-green-500 to-emerald-500', desc: 'Edit & add subtitles' },
  { id: 'upload', nameKey: 'auto_upload', icon: Upload, role: 'pro', color: 'from-purple-500 to-pink-500', desc: 'Upload to YouTube/TikTok' },
  { id: 'scheduler', nameKey: 'scheduler', icon: Calendar, role: 'premium', color: 'from-yellow-500 to-orange-500', desc: 'Schedule uploads' },
  { id: 'settings', nameKey: 'settings', icon: Settings, role: 'free', color: 'from-gray-500 to-gray-700', desc: 'Account settings' },
];

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { t, language } = useLanguage();
  const supabase = createClient();

  useEffect(() => {
    const fetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      setUser(session.user);
      let { data: db } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      if (!db) {
        db = { id: session.user.id, email: session.user.email, full_name: session.user.email.split('@')[0], role: 'user', subscription: 'free', subscription_expiry: new Date(Date.now()+7*24*60*60*1000).toISOString() };
        await supabase.from('users').insert(db);
      }
      setUserData(db);
      setLoading(false);
    };
    fetch();
  }, []);

  const canAccess = (roleReq: string) => {
    if (userData?.role === 'admin') return true;
    if (roleReq === 'free') return true;
    if (roleReq === 'pro') return userData?.subscription === 'pro' || userData?.subscription === 'premium';
    if (roleReq === 'premium') return userData?.subscription === 'premium';
    return false;
  };

  const handleClick = (item: any) => {
    if (!canAccess(item.role)) {
      toast.error(t('upgrade_required'));
      return;
    }
    router.push(`/features/${item.id}`);
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <>
      <Header userEmail={user?.email} userRole={userData?.role} userSubscription={userData?.subscription} />
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 shadow">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">{user?.email?.charAt(0).toUpperCase()}</div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold">{t('welcome')}, {userData?.full_name || user?.email?.split('@')[0]}!</h2>
              <p className="text-gray-500">{user?.email}</p>
            </div>
            {userData?.subscription === 'free' && (
              <button onClick={() => router.push('/payment')} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition">
                {t('upgrade_to_pro')}
              </button>
            )}
            {userData?.subscription === 'pro' && (
              <button onClick={() => router.push('/payment')} className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition">
                {t('upgrade_to_premium')}
              </button>
            )}
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-4">{t('quick_access')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MENU.map((item) => (
            <div
              key={item.id}
              onClick={() => handleClick(item)}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow cursor-pointer hover:shadow-lg transition"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${item.color} bg-opacity-10`}>
                  <item.icon className="text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{t(item.nameKey)}</h4>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                {!canAccess(item.role) && <Lock className="text-gray-400" size={16} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
