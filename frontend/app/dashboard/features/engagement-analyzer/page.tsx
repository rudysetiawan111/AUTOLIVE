'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

import {
  Globe, Sun, Moon, LogOut, LayoutDashboard,
  Loader2, TrendingUp, BarChart3
} from 'lucide-react';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

import toast from 'react-hot-toast';

export default function EngagementAnalyzerPage() {

  const router = useRouter();
  const supabase = createClient();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  // ======================
  // USER STATE
  // ======================
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [subscriptionExpiry, setSubscriptionExpiry] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState('');

  // ======================
  // INPUT STATE
  // ======================
  const [views, setViews] = useState('');
  const [likes, setLikes] = useState('');
  const [comments, setComments] = useState('');
  const [shares, setShares] = useState('');
  const [clicks, setClicks] = useState('');
  const [watchTime, setWatchTime] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // A/B TEST
  const [videoB, setVideoB] = useState<any>(null);

  // LEADERBOARD
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // ======================
  // INIT
  // ======================
  useEffect(() => {
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    fetchUser();
    fetchLeaderboard();
    return () => clearInterval(interval);
  }, []);

  const updateDateTime = () => {
    setCurrentDateTime(new Date().toLocaleString('id-ID'));
  };

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/login');

    const { data } = await supabase
      .from('users')
      .select('full_name, role, subscription, subscription_expiry')
      .eq('id', user.id)
      .single();

    setUserName(data?.full_name || user.email || 'User');
    setUserRole(data?.role === 'admin' ? 'ADMIN' : (data?.subscription || 'FREE').toUpperCase());

    if (data?.subscription_expiry) {
      setSubscriptionExpiry(new Date(data.subscription_expiry).toLocaleDateString('id-ID'));
    }
  };

  // ======================
  // AI RECOMMENDATION
  // ======================
  const generateRecommendations = (engagementRate: number, ctr: number, avgWatch: number) => {
    const rec: string[] = [];

    if (engagementRate < 5) {
      rec.push('Tambahkan hook kuat di 3 detik pertama');
      rec.push('Gunakan caption yang memancing komentar');
    }

    if (ctr < 3) {
      rec.push('Perbaiki thumbnail & judul');
    }

    if (avgWatch < 5) {
      rec.push('Durasi terlalu panjang, buat lebih cepat');
    }

    if (engagementRate > 10) {
      rec.push('🔥 Konten sangat bagus, scale up');
    }

    return rec;
  };

  // ======================
  // ANALYZE
  // ======================
  const analyze = () => {
    if (!views) return toast.error('Masukkan views');

    setLoading(true);

    setTimeout(() => {
      const v = Number(views);
      const l = Number(likes);
      const c = Number(comments);
      const s = Number(shares);
      const clk = Number(clicks);
      const wt = Number(watchTime);

      const engagementRate = ((l + c + s) / v) * 100;
      const ctr = (clk / v) * 100;
      const avgWatch = wt / v;

      let insight = 'Konten biasa';
      if (engagementRate > 10 && ctr > 5) insight = '🔥 Berpotensi VIRAL';

      const recommendations = generateRecommendations(engagementRate, ctr, avgWatch);

      setResult({
        engagementRate: engagementRate.toFixed(2),
        ctr: ctr.toFixed(2),
        avgWatch: avgWatch.toFixed(2),
        insight,
        recommendations,
        chartData: [
          { name: 'Likes', value: l },
          { name: 'Comments', value: c },
          { name: 'Shares', value: s },
          { name: 'Clicks', value: clk }
        ]
      });

      setLoading(false);
    }, 1000);
  };

  // ======================
  // SAVE HISTORY
  // ======================
  const saveHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !result) return;

    await supabase.from('engagement_history').insert({
      user_id: user.id,
      views: Number(views),
      likes: Number(likes),
      comments: Number(comments),
      shares: Number(shares),
      ctr: Number(result.ctr),
      engagement_rate: Number(result.engagementRate),
    });

    toast.success('Disimpan');
    fetchLeaderboard();
  };

  // ======================
  // LEADERBOARD
  // ======================
  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('engagement_history')
      .select('*')
      .order('engagement_rate', { ascending: false })
      .limit(5);

    setLeaderboard(data || []);
  };

  // ======================
  // COMPARE
  // ======================
  const compareVideos = () => {
    if (!videoB) return 'Tambahkan Video B';
    return result.engagementRate > videoB.engagementRate
      ? 'Video A lebih baik'
      : 'Video B lebih baik';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* HEADER */}
      <header className="bg-white dark:bg-gray-800 p-4 shadow">
        <div className="flex justify-between items-center">
          <h1 className="font-bold">ENGAGEMENT ANALYZER</h1>
          <div className="flex gap-2">
            <button onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}><Globe size={16}/></button>
            <button onClick={toggleTheme}>{theme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>}</button>
          </div>
        </div>
        <div className="text-xs text-center mt-2">
          {userName} | {userRole} {subscriptionExpiry && `| ${subscriptionExpiry}`}
        </div>
        <div className="text-right text-xs">{currentDateTime}</div>
      </header>

      {/* CONTENT */}
      <main className="max-w-4xl mx-auto p-6 space-y-6">

        {/* INPUT */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded shadow space-y-2">
          <h2 className="font-semibold flex gap-2"><BarChart3/> Input Data</h2>

          <input placeholder="Views" value={views} onChange={e=>setViews(e.target.value)} className="w-full p-2 border rounded"/>
          <input placeholder="Likes" value={likes} onChange={e=>setLikes(e.target.value)} className="w-full p-2 border rounded"/>
          <input placeholder="Comments" value={comments} onChange={e=>setComments(e.target.value)} className="w-full p-2 border rounded"/>
          <input placeholder="Shares" value={shares} onChange={e=>setShares(e.target.value)} className="w-full p-2 border rounded"/>
          <input placeholder="Clicks" value={clicks} onChange={e=>setClicks(e.target.value)} className="w-full p-2 border rounded"/>
          <input placeholder="Watch Time" value={watchTime} onChange={e=>setWatchTime(e.target.value)} className="w-full p-2 border rounded"/>

          <button onClick={analyze} className="bg-blue-500 text-white p-2 rounded w-full flex justify-center gap-2">
            {loading ? <Loader2 className="animate-spin"/> : <TrendingUp/>} Analyze
          </button>
        </div>

        {/* RESULT */}
        {result && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow space-y-4">

            <p>Engagement: {result.engagementRate}%</p>
            <p>CTR: {result.ctr}%</p>
            <p>Watch: {result.avgWatch}</p>
            <p className="font-bold">{result.insight}</p>

            {/* RECOMMENDATION */}
            <ul className="list-disc ml-5">
              {result.recommendations.map((r: string, i: number) => (
                <li key={i}>{r}</li>
              ))}
            </ul>

            {/* BUTTON */}
            <div className="flex gap-2">
              <button onClick={saveHistory} className="bg-green-500 text-white px-3 py-1 rounded">Save</button>
              <button onClick={()=>setVideoB(result)} className="bg-gray-500 text-white px-3 py-1 rounded">Set Video B</button>
            </div>

            {/* COMPARE */}
            {videoB && <p>{compareVideos()}</p>}

            {/* CHART */}
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={result.chartData}>
                  <XAxis dataKey="name"/>
                  <YAxis/>
                  <Tooltip/>
                  <Bar dataKey="value"/>
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        )}

        {/* LEADERBOARD */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
          <h3 className="font-bold mb-2">🏆 Leaderboard</h3>
          {leaderboard.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>#{i+1}</span>
              <span>{item.engagement_rate}%</span>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
