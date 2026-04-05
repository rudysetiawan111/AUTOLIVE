'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/components/Header';
import { Flame, Download, Edit3, Upload, Calendar, Settings, TrendingUp, Users, Activity, Image, Palette, Mail, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const MENU = [
  { id: 'viral', nameKey: 'viral_filter', icon: Flame, color: 'from-red-500 to-orange-500', desc: 'Find trending content' },
  { id: 'download', nameKey: 'downloader', icon: Download, color: 'from-blue-500 to-cyan-500', desc: 'Download videos' },
  { id: 'editor', nameKey: 'editor', icon: Edit3, color: 'from-green-500 to-emerald-500', desc: 'Edit & add subtitles' },
  { id: 'upload', nameKey: 'auto_upload', icon: Upload, color: 'from-purple-500 to-pink-500', desc: 'Upload to YouTube/TikTok' },
  { id: 'scheduler', nameKey: 'scheduler', icon: Calendar, color: 'from-yellow-500 to-orange-500', desc: 'Schedule uploads' },
  { id: 'settings', nameKey: 'settings', icon: Settings, color: 'from-gray-500 to-gray-700', desc: 'Account settings' },
];

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ users: 0, videos: 0, schedules: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [logo, setLogo] = useState('');
  const [siteName, setSiteName] = useState('AUTOLIVE');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState('#00B4D8');
  const [contactEmail, setContactEmail] = useState('support@autolive.com');
  const router = useRouter();
  const { t } = useLanguage();
  const supabase = createClient();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const { data: db } = await supabase.from('users').select('role').eq('id', session.user.id).single();
      if (db?.role !== 'admin') { router.push('/free'); return; }
      setUser(session.user);
      await loadData();
      loadSettings();
      setLoading(false);
    };
    check();
  }, []);

  const loadData = async () => {
    const { data: usersData } = await supabase.from('users').select('*');
    setUsers(usersData || []);
    const { count: uc } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: vc } = await supabase.from('videos').select('*', { count: 'exact', head: true });
    const { count: sc } = await supabase.from('schedules').select('*', { count: 'exact', head: true });
    setStats({ users: uc || 0, videos: vc || 0, schedules: sc || 0 });
  };

  const loadSettings = () => {
    setLogo(localStorage.getItem('app_logo') || '');
    setSiteName(localStorage.getItem('site_name') || 'AUTOLIVE');
    setPrimaryColor(localStorage.getItem('primary_color') || '#3B82F6');
    setSecondaryColor(localStorage.getItem('secondary_color') || '#00B4D8');
    setContactEmail(localStorage.getItem('contact_email') || 'support@autolive.com');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const logoData = event.target?.result as string;
        localStorage.setItem('app_logo', logoData);
        setLogo(logoData);
        toast.success('Logo updated!');
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = () => {
    localStorage.setItem('site_name', siteName);
    localStorage.setItem('primary_color', primaryColor);
    localStorage.setItem('secondary_color', secondaryColor);
    localStorage.setItem('contact_email', contactEmail);
    document.documentElement.style.setProperty('--primary', primaryColor);
    document.documentElement.style.setProperty('--secondary', secondaryColor);
    toast.success('Settings saved');
  };

  const updateUser = async (userId: string, field: string, value: string) => {
    await supabase.from('users').update({ [field]: value }).eq('id', userId);
    toast.success('User updated');
    loadData();
  };

  const deleteUser = async (userId: string) => {
    if (confirm('Delete this user?')) {
      await supabase.from('users').delete().eq('id', userId);
      toast.success('User deleted');
      loadData();
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <>
      <Header userEmail={user?.email} userRole="admin" userSubscription="premium" />
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-2 mb-6 border-b pb-2">
          <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-lg ${activeTab === 'dashboard' ? 'bg-primary text-white' : 'hover:bg-gray-200'}`}>
            Dashboard
          </button>
          <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg ${activeTab === 'users' ? 'bg-primary text-white' : 'hover:bg-gray-200'}`}>
            User Management
          </button>
          <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-lg ${activeTab === 'settings' ? 'bg-primary text-white' : 'hover:bg-gray-200'}`}>
            Website Settings
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="card p-4"><div className="text-2xl font-bold text-primary">{stats.users}</div><div>Total Users</div></div>
              <div className="card p-4"><div className="text-2xl font-bold text-primary">{stats.videos}</div><div>Total Videos</div></div>
              <div className="card p-4"><div className="text-2xl font-bold text-primary">{stats.schedules}</div><div>Schedules</div></div>
              <div className="card p-4"><div className="text-2xl font-bold text-primary">$0</div><div>Revenue</div></div>
            </div>
            <div className="card p-6 mb-8">
              <h3 className="text-lg font-semibold">Welcome, Admin {user?.email?.split('@')[0]}!</h3>
              <p className="text-gray-500">You have full access to all features.</p>
            </div>
            <h3 className="text-lg font-semibold mb-4">{t('quick_access')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MENU.map((item) => (
                <div key={item.id} onClick={() => router.push(`/features/${item.id}`)} className="card p-4 cursor-pointer hover:shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${item.color} bg-opacity-10`}>
                      <item.icon className="text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{t(item.nameKey)}</h4>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <div className="card p-6 overflow-x-auto">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Users /> User Management</h2>
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2">Subscription</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">
                      <select value={u.subscription} onChange={(e) => updateUser(u.id, 'subscription', e.target.value)} className="p-1 border rounded">
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="premium">Premium</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <select value={u.role} onChange={(e) => updateUser(u.id, 'role', e.target.value)} className="p-1 border rounded">
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <button onClick={() => deleteUser(u.id)} className="text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">Website Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Logo</label>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-sm" />
                {logo && <img src={logo} alt="Logo" className="h-12 mt-2" />}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Site Name</label>
                <input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-800" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Primary Color</label>
                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Secondary Color</label>
                <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Email</label>
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-800" />
              </div>
              <button onClick={saveSettings} className="bg-primary text-white px-4 py-2 rounded-lg">
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
