'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

import {
  Globe, Sun, Moon, LayoutDashboard,
  Upload, Loader2, Sparkles, Calendar,
  RefreshCcw, Trash2, TrendingUp, DollarSign
} from 'lucide-react';

import toast from 'react-hot-toast';

export default function AutoUploadPage() {

  const router = useRouter();
  const supabase = createClient();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  // ======================
  // USER
  // ======================
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState('');

  // ======================
  // FORM
  // ======================
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('tiktok');
  const [schedule, setSchedule] = useState('');
  const [autoMode, setAutoMode] = useState(true);

  const [loading, setLoading] = useState(false);

  // ======================
  // DATA
  // ======================
  const [jobs, setJobs] = useState<any[]>([]);
  const [trending, setTrending] = useState<string[]>([]);
  const [earnings, setEarnings] = useState<number>(0);

  // ======================
  // INIT
  // ======================
  useEffect(() => {
    updateTime();
    const interval = setInterval(updateTime, 1000);
    fetchUser();
    fetchJobs();
    fetchTrending();
    fetchEarnings();
    return () => clearInterval(interval);
  }, []);

  const updateTime = () => {
    setCurrentDateTime(new Date().toLocaleString('id-ID'));
  };

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/login');

    const { data } = await supabase
      .from('users')
      .select('full_name, role, subscription')
      .eq('id', user.id)
      .single();

    setUserName(data?.full_name || user.email || 'User');
    setUserRole(data?.role === 'admin' ? 'ADMIN' : (data?.subscription || 'FREE').toUpperCase());
  };

  const fetchJobs = async () => {
    const { data } = await supabase
      .from('auto_jobs')
      .select('*')
      .order('created_at', { ascending: false });

    setJobs(data || []);
  };

  // ======================
  // SMART TRENDING (MOCK GOOGLE TRENDS)
  // ======================
  const fetchTrending = () => {
    setTrending([
      'AI tools 2026',
      'viral tiktok challenge',
      'make money online',
      'fitness tips',
      'travel vlog',
      'crypto news'
    ]);
  };

  // ======================
  // MONEY SYSTEM
  // ======================
  const fetchEarnings = async () => {
    const { data } = await supabase
      .from('earnings')
      .select('revenue');

    const total = data?.reduce((sum, item) => sum + Number(item.revenue), 0) || 0;
    setEarnings(total);
  };

  // ======================
  // AUTO LOOP SYSTEM
  // ======================
  const runAuto = async () => {
    if (!topic) return toast.error('Masukkan topik');

    setLoading(true);

    await fetch('/api/auto', {
      method: 'POST',
      body: JSON.stringify({
        topic,
        platform,
        schedule,
        auto: true,
        affiliate: true
      })
    });

    await supabase.from('auto_jobs').insert({
      topic,
      platform,
      status: 'queued'
    });

    toast.success('AUTO SYSTEM BERJALAN 🚀');

    setLoading(false);
    setTopic('');
    fetchJobs();
  };

  // ======================
  // RETRY + AI LOOP
  // ======================
  const retryJob = async (job: any) => {

    await fetch('/api/auto', {
      method: 'POST',
      body: JSON.stringify({
        topic: job.topic + ' viral',
        platform: job.platform,
        auto: true
      })
    });

    toast.success('AI LOOP aktif (regenerate)');
  };

  const deleteJob = async (id: string) => {
    await supabase.from('auto_jobs').delete().eq('id', id);
    fetchJobs();
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'processing': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* HEADER */}
      <header className="sticky top-0 bg-white dark:bg-gray-800 shadow p-4">
        <div className="flex justify-between items-center">
          <h1 className="font-bold">AUTO MONEY MACHINE</h1>

          <div className="flex gap-2">
            <button onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}>
              <Globe size={16}/>
            </button>
            <button onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>}
            </button>
          </div>
        </div>

        <div className="flex justify-between mt-2 text-xs">
          <span>{userName} | {userRole}</span>
          <span>{currentDateTime}</span>
        </div>

        <button
          onClick={() => router.push('/dashboard/admin')}
          className="text-blue-500 text-xs mt-2 flex items-center gap-1"
        >
          <LayoutDashboard size={12}/> Dashboard
        </button>
      </header>

      {/* MAIN */}
      <main className="max-w-6xl mx-auto p-6 space-y-6">

        {/* MONEY DASHBOARD */}
        <div className="bg-green-100 p-4 rounded flex justify-between items-center">
          <div className="flex items-center gap-2">
            <DollarSign/>
            <span>Total Earnings</span>
          </div>
          <span className="font-bold text-lg">Rp {earnings}</span>
        </div>

        {/* TRENDING */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h3 className="font-semibold flex gap-2 mb-2">
            <TrendingUp/> Trending Topic
          </h3>

          <div className="flex flex-wrap gap-2">
            {trending.map((t, i) => (
              <button
                key={i}
                onClick={() => setTopic(t)}
                className="px-3 py-1 bg-gray-200 rounded"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* FORM */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded shadow space-y-4">

          <h2 className="font-semibold flex gap-2">
            <Sparkles/> FULL AUTO SYSTEM
          </h2>

          <input
            placeholder="Topik"
            value={topic}
            onChange={(e)=>setTopic(e.target.value)}
            className="w-full p-2 border rounded"
          />

          <select
            value={platform}
            onChange={(e)=>setPlatform(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
          </select>

          <div className="flex items-center gap-2">
            <Calendar size={16}/>
            <input
              type="datetime-local"
              value={schedule}
              onChange={(e)=>setSchedule(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <button
            onClick={runAuto}
            className="w-full bg-purple-600 text-white p-2 rounded flex justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin"/> : <Upload/>}
            Jalankan Auto Money Machine
          </button>

        </div>

        {/* JOB LIST */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">

          <h3 className="font-bold mb-4">🚀 Pipeline</h3>

          <div className="space-y-3">
            {jobs.map(job => (
              <div key={job.id} className="border p-3 rounded flex justify-between items-center">

                <div>
                  <p className="font-medium">{job.topic}</p>
                  <p className="text-xs text-gray-500">{job.platform}</p>
                </div>

                <div className="flex items-center gap-3">

                  <span className={`text-xs ${statusColor(job.status)}`}>
                    {job.status}
                  </span>

                  <button onClick={() => retryJob(job)}>
                    <RefreshCcw size={14}/>
                  </button>

                  <button onClick={() => deleteJob(job.id)}>
                    <Trash2 size={14}/>
                  </button>

                </div>

              </div>
            ))}
          </div>

        </div>

      </main>
    </div>
  );
}
