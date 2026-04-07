'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

import {
  Globe, Sun, Moon, LayoutDashboard,
  Loader2, Sparkles, TrendingUp, Save
} from 'lucide-react';

import toast from 'react-hot-toast';

export default function ContentAnalyzerPage() {

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
  // INPUT
  // ======================
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [hashtags, setHashtags] = useState('');

  const [loading, setLoading] = useState(false);

  // ======================
  // RESULT
  // ======================
  const [generated, setGenerated] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  // ======================
  // INIT
  // ======================
  useEffect(() => {
    updateTime();
    const interval = setInterval(updateTime, 1000);
    fetchUser();
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

  // ======================
  // AI GENERATE (API)
  // ======================
  const generateAI = async () => {
    if (!topic) return toast.error('Masukkan topik');

    setLoading(true);

    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({ topic })
    });

    const data = await res.json();

    setGenerated(data);

    // AUTO FILL
    setDescription(data.caption);
    setHashtags(data.hashtags.join(' '));

    setLoading(false);
    toast.success('AI Generated');
  };

  // ======================
  // ANALYZER + VIRAL SCORE
  // ======================
  const analyze = () => {

    let score = 50;

    if (topic.length > 20) score += 10;
    if (description.length > 50) score += 10;
    if (hashtags.split(' ').length > 5) score += 10;

    let viralScore = score;

    if (topic.toLowerCase().includes('viral')) viralScore += 10;
    if (hashtags.includes('#fyp')) viralScore += 10;
    if (description.length > 100) viralScore += 5;

    let status = 'LOW';
    if (score > 80) status = 'HIGH';
    else if (score > 65) status = 'MEDIUM';

    let prediction = 'LOW';
    if (viralScore > 85) prediction = '🔥 HIGH VIRAL';
    else if (viralScore > 70) prediction = '⚡ MEDIUM';

    const recommendations: string[] = [];

    if (topic.length < 20) {
      recommendations.push('Gunakan judul lebih panjang & menarik');
    }

    if (!topic.toLowerCase().includes('viral')) {
      recommendations.push('Tambahkan kata: VIRAL / TERBUKTI');
    }

    if (hashtags.split(' ').length < 5) {
      recommendations.push('Tambahkan hashtag');
    }

    if (description.length < 50) {
      recommendations.push('Perbaiki deskripsi');
    }

    if (prediction.includes('HIGH')) {
      recommendations.push('🔥 Siap upload sekarang!');
    }

    setResult({
      score,
      status,
      prediction,
      recommendations
    });

    toast.success('Analisis selesai');
  };

  // ======================
  // SAVE DATABASE
  // ======================
  const saveContent = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !result) return;

    await supabase.from('content_history').insert({
      user_id: user.id,
      title: topic,
      description,
      hashtags,
      score: result.score
    });

    toast.success('Disimpan ke database');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* HEADER */}
      <header className="sticky top-0 bg-white dark:bg-gray-800 shadow p-4">
        <div className="flex justify-between items-center">
          <h1 className="font-bold">AI CONTENT ENGINE</h1>

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
      <main className="max-w-3xl mx-auto p-6 space-y-6">

        {/* INPUT */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded shadow space-y-4">

          <h2 className="font-semibold flex gap-2">
            <Sparkles/> Generate & Analyze
          </h2>

          <input
            placeholder="Topik / Ide Konten"
            value={topic}
            onChange={(e)=>setTopic(e.target.value)}
            className="w-full p-2 border rounded"
          />

          <textarea
            placeholder="Deskripsi"
            value={description}
            onChange={(e)=>setDescription(e.target.value)}
            className="w-full p-2 border rounded"
          />

          <input
            placeholder="#hashtag"
            value={hashtags}
            onChange={(e)=>setHashtags(e.target.value)}
            className="w-full p-2 border rounded"
          />

          {/* BUTTONS */}
          <div className="grid grid-cols-3 gap-2">

            <button onClick={generateAI} className="bg-purple-600 text-white p-2 rounded">
              {loading ? <Loader2 className="animate-spin"/> : 'AI Generate'}
            </button>

            <button onClick={analyze} className="bg-blue-500 text-white p-2 rounded">
              Analyze
            </button>

            <button onClick={saveContent} className="bg-green-600 text-white p-2 rounded flex justify-center">
              <Save size={16}/>
            </button>

          </div>
        </div>

        {/* AI RESULT */}
        {generated && (
          <div className="bg-purple-50 p-4 rounded">
            <h3 className="font-bold">🤖 AI Result</h3>
            <p>{generated.title}</p>
            <p>{generated.caption}</p>
            <p>{generated.hashtags.join(' ')}</p>
          </div>
        )}

        {/* ANALYSIS */}
        {result && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow space-y-3">

            <p>Score: {result.score}</p>
            <p>Status: {result.status}</p>
            <p className="font-bold text-blue-500">{result.prediction}</p>

            <ul className="list-disc ml-5">
              {result.recommendations.map((r: string, i: number) => (
                <li key={i}>{r}</li>
              ))}
            </ul>

          </div>
        )}

      </main>
    </div>
  );
}
