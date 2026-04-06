'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Upload, Image, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPaymentSettings() {
  const [qrPro, setQrPro] = useState<string | null>(null);
  const [qrPremium, setQrPremium] = useState<string | null>(null);
  const [uploading, setUploading] = useState<{ pro: boolean; premium: boolean }>({ pro: false, premium: false });
  const supabase = createClient();

  useEffect(() => { fetchQrCodes(); }, []);

  const fetchQrCodes = async () => {
    const { data: proData } = await supabase.from('settings').select('value').eq('key', 'qr_pro').single();
    const { data: premiumData } = await supabase.from('settings').select('value').eq('key', 'qr_premium').single();
    if (proData) setQrPro(proData.value);
    if (premiumData) setQrPremium(premiumData.value);
  };

  const uploadQr = async (role: 'pro' | 'premium', file: File) => {
    if (!file) return;
    setUploading(prev => ({ ...prev, [role]: true }));
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `qr_${role}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('qr_codes').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('qr_codes').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;
      await supabase.from('settings').upsert({ key: `qr_${role}`, value: publicUrl }, { onConflict: 'key' });
      toast.success(`QR Code ${role.toUpperCase()} berhasil diupload`);
      fetchQrCodes();
    } catch (err: any) { toast.error(err.message); } finally { setUploading(prev => ({ ...prev, [role]: false })); }
  };

  const deleteQr = async (role: 'pro' | 'premium') => {
    if (!confirm(`Hapus QR Code untuk paket ${role.toUpperCase()}?`)) return;
    const { error } = await supabase.from('settings').update({ value: null }).eq('key', `qr_${role}`);
    if (error) toast.error(error.message);
    else { toast.success(`QR Code ${role.toUpperCase()} dihapus`); fetchQrCodes(); }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="border rounded-lg p-3"><h4 className="font-bold text-blue-600">Pro ($3)</h4>{qrPro ? <img src={qrPro} className="w-32 h-32 object-contain" /> : <div className="text-gray-400 py-4">Belum ada QR</div>}<label className="flex items-center gap-1 bg-blue-500 text-white px-2 py-1 rounded cursor-pointer text-xs"><Upload className="w-3 h-3" /> Upload<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadQr('pro', e.target.files[0])} /></label></div>
      <div className="border rounded-lg p-3"><h4 className="font-bold text-purple-600">Premium ($5)</h4>{qrPremium ? <img src={qrPremium} className="w-32 h-32 object-contain" /> : <div className="text-gray-400 py-4">Belum ada QR</div>}<label className="flex items-center gap-1 bg-purple-500 text-white px-2 py-1 rounded cursor-pointer text-xs"><Upload className="w-3 h-3" /> Upload<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadQr('premium', e.target.files[0])} /></label></div>
    </div>
  );
}
