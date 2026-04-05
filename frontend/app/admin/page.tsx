'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/components/Header';
import { Users, Settings, Image, Palette, Mail, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ users: 0, videos: 0 });
  const [logo, setLogo] = useState('');
  const [siteName, setSiteName] = useState('AUTOLIVE');
  const [primary, setPrimary] = useState('#3B82F6');
  const [secondary, setSecondary] = useState('#00B4D8');
  const [contact, setContact] = useState('support@autolive.com');
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLanguage();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const { data: user } = await supabase.from('users').select('role').eq('id', session.user.id).single();
      if (user?.role !== 'admin') { router.push('/dashboard'); return; }
      await loadData();
      loadSettings();
    };
    check();
  }, []);

  const loadData = async () => {
    const { data: usersData } = await supabase.from('users').select('*');
    setUsers(usersData || []);
    const { count: uc } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: vc } = await supabase.from('videos').select('*', { count: 'exact', head: true });
    setStats({ users: uc || 0, videos: vc || 0 });
  };

  const loadSettings = () => {
    setLogo(localStorage.getItem('app_logo') || '');
    setSiteName(localStorage.getItem('site_name') || 'AUTOLIVE');
    setPrimary(localStorage.getItem('primary_color') || '#3B82F6');
    setSecondary(localStorage.getItem('secondary_color') || '#00B4D8');
    setContact(localStorage.getItem('contact_email') || 'support@autolive.com');
  };

  const saveSettings = () => {
    localStorage.setItem('site_name', siteName);
    localStorage.setItem('primary_color', primary);
    localStorage.setItem('secondary_color', secondary);
    localStorage.setItem('contact_email', contact);
    toast.success('Settings saved');
  };

  const updateUser = async (id: string, field: string, value: string) => {
    await supabase.from('users').update({ [field]: value }).eq('id', id);
    toast.success('Updated');
    loadData();
  };

  const deleteUser = async (id: string) => {
    if (confirm('Delete user?')) {
      await supabase.from('users').delete().eq('id', id);
      toast.success('Deleted');
      loadData();
    }
  };

  return (
    <>
      <Header userEmail="Admin" userRole="admin" />
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Users /> {t('user_management')}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr><th>Email</th><th>Subscription</th><th>Role</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-t">
                      <td className="p-2">{u.email}</td>
                      <td><select value={u.subscription} onChange={(e) => updateUser(u.id, 'subscription', e.target.value)} className="p-1 border rounded"><option>free</option><option>pro</option><option>premium</option></select></td>
                      <td><select value={u.role} onChange={(e) => updateUser(u.id, 'role', e.target.value)} className="p-1 border rounded"><option>user</option><option>admin</option></select></td>
                      <td><button onClick={() => deleteUser(u.id)} className="text-red-500"><Trash2 size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Settings /> {t('settings')}</h2>
            <div className="space-y-4">
              <div><label>Logo</label><input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f){ const reader = new FileReader(); reader.onload = (ev) => { setLogo(ev.target?.result as string); localStorage.setItem('app_logo', ev.target?.result as string); }; reader.readAsDataURL(f); } }} /></div>
              <div><label>Site Name</label><input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="w-full p-2 border rounded" /></div>
              <div><label>Primary Color</label><input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} /></div>
              <div><label>Secondary Color</label><input type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)} /></div>
              <div><label>Contact Email</label><input type="email" value={contact} onChange={(e) => setContact(e.target.value)} className="w-full p-2 border rounded" /></div>
              <button onClick={saveSettings} className="bg-primary text-white px-4 py-2 rounded-lg">Save Settings</button>
            </div>
          </div>
        </div>
        <div className="mt-8"><h3 className="text-lg font-bold">Statistics</h3><p>Total Users: {stats.users} | Total Videos: {stats.videos}</p></div>
      </div>
    </>
  );
}
