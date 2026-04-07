// frontend/app/dashboard/features/hashtag-generator/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Globe, Sun, Moon, LogOut, LayoutDashboard, Hash, 
  Copy, Check, History, Trash2, Search, Eye, Loader2,
  TrendingUp, Sparkles, Download
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function HashtagGeneratorPage() {
  const router = useRouter();
  const supabase = createClient();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [keyword, setKeyword] = useState('');
  const [niche, setNiche] = useState('technology');
  const [platform, setPlatform] = useState('all');
  const [count, setCount] = useState(10);
  const [tone, setTone] = useState('mixed');
  const [generating, setGenerating] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);

  // NEW: Tema Google Trends
  const [themes, setThemes] = useState<any[]>([]);
  const [selectedTheme, setSelectedTheme] = useState('');

  useEffect(() => {
    fetchThemes();
  }, []);

  // =========================
  // GOOGLE TRENDS DATA
  // =========================
  const fetchThemes = () => {
    const data = [
      { name: 'Edukasi', keywords: ['learn coding online', 'study tips effective', 'online courses free'] },
      { name: 'Funny / Hiburan', keywords: ['funny videos compilation', 'viral memes 2026', 'prank videos funny'] },
      { name: 'Berita / Viral', keywords: ['breaking news today', 'world news update', 'viral news today'] },
      { name: 'Keuangan', keywords: ['passive income ideas', 'personal finance tips', 'how to save money'] },
      { name: 'Bisnis', keywords: ['online business ideas', 'small business startup', 'dropshipping business'] },
      { name: 'Teknologi & AI', keywords: ['AI tools 2026', 'ChatGPT tutorial', 'AI video generator'] },
      { name: 'Gaming', keywords: ['GTA 6 release', 'mobile games 2026', 'gaming livestream'] },
      { name: 'Musik', keywords: ['trending songs 2026', 'viral TikTok songs', 'new music release'] },
      { name: 'Review Gadget', keywords: ['best smartphone 2026', 'gadget review latest', 'iPhone vs Android'] },
      { name: 'Tutorial', keywords: ['how to edit video', 'capcut tutorial', 'canva design tutorial'] },
      { name: 'Lifestyle', keywords: ['morning routine', 'daily vlog life', 'healthy lifestyle'] },
      { name: 'Relationship', keywords: ['relationship advice', 'dating tips', 'toxic relationship signs'] },
      { name: 'Kuliner', keywords: ['street food viral', 'easy recipes', 'food review'] },
      { name: 'Kesehatan', keywords: ['home workout', 'healthy diet plan', 'fitness tips'] },
      { name: 'Travel', keywords: ['travel vlog', 'cheap travel tips', 'hidden places'] },
      { name: 'Parenting', keywords: ['parenting tips', 'baby care guide', 'kids education tips'] },
      { name: 'Motivasi', keywords: ['success motivation', 'self improvement tips', 'how to be successful'] },
      { name: 'Affiliate', keywords: ['affiliate marketing', 'sell online products', 'TikTok shop products'] },
      { name: 'Viral / Challenge', keywords: ['viral challenge', '24 hour challenge', 'trending TikTok challenge'] },
      { name: 'Otomotif', keywords: ['car review 2026', 'electric cars', 'motorcycle review'] },
      { name: 'Fashion', keywords: ['fashion trends 2026', 'outfit ideas', 'streetwear style'] },
      { name: 'Beauty', keywords: ['skincare routine', 'beauty tips', 'glowing skin tips'] },
      { name: 'Film & Series', keywords: ['new movies 2026', 'Netflix series', 'movie review'] },
      { name: 'Horor', keywords: ['horror stories', 'scary videos', 'mystery cases'] },
      { name: 'Sejarah', keywords: ['world history facts', 'historical events', 'ancient civilizations'] },
      { name: 'Sains', keywords: ['science experiments', 'space discovery', 'future technology'] },
      { name: 'Olahraga', keywords: ['football highlights', 'sports news', 'workout training'] },
      { name: 'DIY', keywords: ['DIY projects', 'handmade crafts', 'home decoration ideas'] },
      { name: 'Produktivitas', keywords: ['productivity tips', 'time management', 'daily habits success'] },
      { name: 'Karir', keywords: ['remote jobs', 'career tips', 'job interview tips'] }
    ];
    setThemes(data);
  };

  // =========================
  // GENERATE HASHTAG
  // =========================
  const generateHashtags = () => {
    if (!keyword) return toast.error('Masukkan keyword');
    setGenerating(true);

    setTimeout(() => {
      const result = Array.from({ length: count }, (_, i) => `#${keyword.replace(/\s/g,'')}${i+1}`);
      setHashtags(result);
      setGenerating(false);
      toast.success('Hashtag berhasil dibuat');
    }, 1000);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(hashtags.join(' '));
    toast.success('Tersalin');
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">HASHTAG GENERATOR</h1>
        <button onClick={() => router.push('/dashboard/admin')} className="text-sm text-blue-500">
          Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* FORM */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow space-y-4">

          <input
            value={keyword}
            onChange={(e)=>setKeyword(e.target.value)}
            placeholder="Keyword..."
            className="w-full p-2 border rounded"
          />

          {/* SELECT TEMA */}
          <select
            value={selectedTheme}
            onChange={(e)=>{
              setSelectedTheme(e.target.value);
              const t = themes.find(x=>x.name === e.target.value);
              if(t) setKeyword(t.keywords[0]);
            }}
            className="w-full p-2 border rounded"
          >
            <option value="">Pilih Tema Trending</option>
            {themes.map((t,i)=>(
              <option key={i} value={t.name}>{t.name}</option>
            ))}
          </select>

          <button
            onClick={generateHashtags}
            className="w-full bg-blue-500 text-white py-2 rounded"
          >
            {generating ? 'Generating...' : 'Generate'}
          </button>

          {/* RESULT */}
          {hashtags.length > 0 && (
            <div>
              <div className="flex justify-between mb-2">
                <h3>Result</h3>
                <button onClick={copyAll}>Copy All</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag,i)=>(
                  <span key={i} className="bg-gray-200 px-2 py-1 rounded text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* TRENDING */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
          <h3 className="font-semibold mb-4">Trending Keywords</h3>

          {themes.map((theme,i)=>(
            <div key={i} className="mb-3">
              <p className="text-xs font-bold text-gray-500">{theme.name}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {theme.keywords.map((kw:string,idx:number)=>(
                  <button
                    key={idx}
                    onClick={()=>setKeyword(kw)}
                    className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-blue-200"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
