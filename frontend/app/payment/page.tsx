'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role'); // 'pro' atau 'premium'
  const email = searchParams.get('email');
  
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const supabase = createClient();

  const price = role === 'pro' ? 3 : role === 'premium' ? 5 : 0;
  const title = role === 'pro' ? 'Pro - $3/bulan' : role === 'premium' ? 'Premium - $5/bulan' : 'Paket Tidak Valid';
  
  useEffect(() => {
    if (!role || (role !== 'pro' && role !== 'premium')) {
      toast.error('Paket tidak valid');
      router.push('/register');
      return;
    }
    if (!email) {
      toast.error('Email tidak ditemukan');
      router.push('/register');
      return;
    }

    // Ambil QR code dari database (tabel settings)
    const fetchQr = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', `qr_${role}`)
        .single();
      
      if (error || !data?.value) {
        setQrUrl(null);
      } else {
        setQrUrl(data.value);
      }
      setLoading(false);
    };
    fetchQr();
  }, [role, email, router, supabase]);

  const handleConfirmPayment = async () => {
    if (!email || !role) return;
    setConfirming(true);
    try {
      // Cari user berdasarkan email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
      
      if (userError || !userData) {
        throw new Error('User tidak ditemukan');
      }
      
      // Update subscription user (simulasi konfirmasi pembayaran)
      const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const { error: updateError } = await supabase
        .from('users')
        .update({
          subscription: role,
          subscription_expiry: expiry,
          role: 'user'
        })
        .eq('id', userData.id);
      
      if (updateError) throw updateError;
      
      toast.success('Pembayaran dikonfirmasi! Mengalihkan ke dashboard...');
      setTimeout(() => {
        if (role === 'pro') router.push('/dashboard/pro');
        else router.push('/dashboard/premium');
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || 'Gagal konfirmasi');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-full max-w-lg px-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm mb-4 hover:underline"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>

        <div className="card p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">Selesaikan Pembayaran</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {email}
            </p>
            <div className="inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-primary to-secondary text-white">
              {title}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p>Memuat QR Code...</p>
            </div>
          ) : qrUrl ? (
            <>
              <div className="flex justify-center mb-6">
                <img
                  src={qrUrl}
                  alt="QR Code Pembayaran"
                  className="w-64 h-64 object-contain border rounded-xl p-2 bg-white"
                />
              </div>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                Scan QR Code di atas untuk melakukan pembayaran sebesar <strong>${price}</strong>
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="text-xs text-center text-yellow-800 dark:text-yellow-300">
                  ⚠️ Setelah melakukan pembayaran, tekan tombol konfirmasi di bawah.
                  <br />
                  Pembayaran akan diverifikasi secara manual oleh admin.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <p className="mb-2">QR Code untuk paket ini belum tersedia.</p>
              <p className="text-sm text-gray-500">Silakan hubungi admin atau gunakan transfer manual ke:</p>
              <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="font-mono text-sm">Bank Mandiri: 123-456-7890</p>
                <p className="font-mono text-sm">a.n. AUTOLIVE Official</p>
              </div>
            </div>
          )}

          <button
            onClick={handleConfirmPayment}
            disabled={confirming}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition mt-4"
          >
            {confirming ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><CheckCircle className="w-5 h-5" /> Konfirmasi Pembayaran Selesai</>
            )}
          </button>

          <p className="text-center text-xs mt-6 text-gray-500">
            Dengan mengkonfirmasi, Anda menyetujui <a href="#" className="underline">Syarat & Ketentuan</a> yang berlaku.
          </p>
        </div>
      </div>
    </div>
  );
}
