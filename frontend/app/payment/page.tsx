'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Copy, CheckCircle, Building, Wallet, CreditCard, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentPage() {
  const [plan, setPlan] = useState<'pro'|'premium'|null>(null);
  const [userId, setUserId] = useState<string|null>(null);
  const [file, setFile] = useState<File|null>(null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<string|null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const p = localStorage.getItem('pending_plan') as 'pro'|'premium'|null;
    const uid = localStorage.getItem('pending_user_id');
    if (p && uid) { setPlan(p); setUserId(uid); }
    else router.push('/register');
  }, []);

  const price = plan === 'pro' ? 3 : 5;
  const methods = [
    { id: 'mandiri', name: 'Bank Mandiri', icon: <Building />, account: '1670010490901', owner: 'RUDY SETIAWAN' },
    { id: 'dana', name: 'DANA', icon: <Wallet />, account: '0895405573659', owner: 'RUDY SETIAWAN' },
    { id: 'paypal', name: 'PayPal', icon: <CreditCard />, account: 'https://www.paypal.me/RudySetiawan111', owner: 'Rudy Setiawan', isLink: true },
  ];

  const copy = (text: string, id: string) => { navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 2000); toast.success('Copied'); };

  const confirm = async () => {
    if (!file) return toast.error('Upload payment proof');
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('payment_proofs').upload(fileName, file);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('payment_proofs').getPublicUrl(fileName);
      await supabase.from('subscriptions').insert({ user_id: userId, plan, amount: price, payment_proof_url: urlData.publicUrl, status: 'pending' });
      const expiry = new Date(); expiry.setMonth(expiry.getMonth()+1);
      await supabase.from('users').update({ subscription: plan, subscription_expiry: expiry.toISOString() }).eq('id', userId);
      localStorage.removeItem('pending_plan'); localStorage.removeItem('pending_user_id');
      toast.success('Payment confirmed!');
      router.push('/dashboard');
    } catch (err: any) { toast.error(err.message); }
    finally { setUploading(false); }
  };

  if (!plan) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.back()} className="mb-6 flex items-center gap-2"><ArrowLeft size={20} /> Back</button>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-3"><div className="flex justify-between"><span>Plan</span><span className="capitalize font-bold">{plan}</span></div><div className="flex justify-between"><span>Price</span><span>${price} USD</span></div><div className="flex justify-between"><span>Total</span><span className="text-xl font-bold text-red-500">${price} USD</span></div></div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Payment Methods</h2>
            {methods.map(m => (
              <div key={m.id} className="p-3 border rounded-lg mb-3">
                <div className="flex items-center gap-2">{m.icon} <span className="font-semibold">{m.name}</span></div>
                <div className="flex justify-between items-center mt-2"><span>{m.account}</span>{m.isLink ? <a href={m.account} target="_blank" className="bg-red-600 text-white px-3 py-1 rounded">Pay</a> : <button onClick={() => copy(m.account, m.id)} className="text-sm">{copied === m.id ? <CheckCircle size={16} /> : <Copy size={16} />} Copy</button>}</div>
              </div>
            ))}
            <div className="mt-4"><label className="block mb-1">Upload Payment Proof</label><input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} /></div>
            <button onClick={confirm} disabled={uploading} className="w-full mt-6 bg-green-600 text-white p-3 rounded-lg">{uploading ? 'Processing...' : `Confirm Payment $${price}`}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
