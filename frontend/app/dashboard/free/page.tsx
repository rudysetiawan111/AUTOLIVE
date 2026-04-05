'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/components/Header';
import { Flame, Settings, TrendingUp, CreditCard } from 'lucide-react';

const MENU = [
  { id: 'viral', nameKey: 'viral_filter', icon: Flame, color: 'from-red-500 to-orange-500', desc: 'Find trending content' },
  { id: 'settings', nameKey: 'settings', icon: Settings, color: 'from-gray-500 to-gray-700', desc: 'Account settings' },
];

export default function FreeDashboard() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { t } = useLanguage();
  const supabase = createClient();

  useEffect(() => {
    const fetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      setUser(session.user);
      const { data: db } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      setUserData(db);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <>
      <Header userEmail={user?.email} userRole={userData?.role} userSubscription={userData?.subscription} />
      <div className="container mx-auto px-4 py-6">
        <div className="card p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">{user?.email?.charAt(0).toUpperCase()}</div>
            <div className="flex-1 text-center sm:text-left"><h2 className="text-2xl font-bold">{t('welcome')}, {userData?.full_name || user?.email?.split('@')[0]}!</h2><p className="text-gray-500 dark:text-gray-400">{user?.email}</p><div className="mt-1"><span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-500 text-white">FREE TRIAL</span></div></div>
            <button onClick={() => router.push('/payment')} className="btn-primary px-4 py-2 rounded-lg">{t('upgrade_to_pro')}</button>
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-4">{t('quick_access')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MENU.map(item => (<div key={item.id} onClick={() => router.push(`/features/${item.id}`)} className="card p-4 cursor-pointer hover:shadow-lg"><div className="flex items-center gap-3"><div className={`p-2 rounded-lg bg-gradient-to-r ${item.color} bg-opacity-10`}><item.icon className="text-primary" /></div><div><h4 className="font-semibold">{t(item.nameKey)}</h4><p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p></div></div></div>))}
        </div>
      </div>
    </>
  );
}
