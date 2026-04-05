'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Gift, Star, Crown } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' });
  const [plan, setPlan] = useState<'free'|'pro'|'premium'>('free');
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingSub, setExistingSub] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLanguage();

  useEffect(() => {
    const checkEmail = async () => {
      if (!form.email || form.email.length < 5) return;
      const { data } = await supabase.from('users').select('subscription').eq('email', form.email).single();
      setExistingSub(data?.subscription || null);
    };
    const timer = setTimeout(checkEmail, 500);
    return () => clearTimeout(timer);
  }, [form.email]);

  const sendOtp = async () => {
    if (!form.email) return toast.error('Enter email');
    setLoading(true);
    try {
      await supabase.auth.signInWithOtp({ email: form.email, options: { shouldCreateUser: false } });
      toast.success(`OTP sent to ${form.email}`);
      setStep(2);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const verifyAndRegister = async () => {
    if (!otp) return toast.error('Enter OTP');
    setLoading(true);
    try {
      await supabase.auth.verifyOtp({ email: form.email, token: otp, type: 'email' });
      if (existingSub === 'free' && plan === 'free') {
        toast.error('Email already registered as FREE. Please upgrade.');
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.full_name, phone: form.phone } },
      });
      if (error) throw error;
      if (data.user) {
        const expiry = plan === 'free' ? new Date(Date.now() + 7*24*60*60*1000).toISOString() : null;
        await supabase.from('users').insert({
          id: data.user.id,
          email: form.email,
          full_name: form.full_name,
          phone: form.phone,
          role: 'user',
          subscription: plan,
          subscription_expiry: expiry,
        });
        toast.success('Registration successful!');
        if (plan === 'free') router.push('/login?registered=true');
        else {
          localStorage.setItem('pending_plan', plan);
          localStorage.setItem('pending_user_id', data.user.id);
          localStorage.setItem('pending_user_email', form.email);
          router.push('/payment');
        }
      }
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const plans = [
    { id: 'free', name: 'Free Trial', price: '$0', icon: Gift, features: ['7-day trial', 'All features'] },
    { id: 'pro', name: 'Pro', price: '$3', icon: Star, features: ['All except scheduler', 'Priority support'] },
    { id: 'premium', name: 'Premium', price: '$5', icon: Crown, features: ['All features', 'Scheduler', 'Analytics'] },
  ];

  const allowedPlans = () => {
    if (!existingSub) return ['free','pro','premium'];
    if (existingSub === 'free') return ['pro','premium'];
    return ['free','pro','premium'];
  };

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="max-w-6xl mx-auto">
        <button onClick={() => router.back()} className="mb-6 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={20} /> Back
        </button>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold mb-4">Choose Plan</h2>
            {plans.map(p => {
              const allowed = allowedPlans().includes(p.id);
              const Icon = p.icon;
              return (
                <div
                  key={p.id}
                  onClick={() => allowed && setPlan(p.id as any)}
                  className={`p-4 mb-3 rounded-xl border-2 cursor-pointer transition ${
                    plan === p.id ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-700'
                  } ${!allowed ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex justify-between">
                    <div>
                      <Icon className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
                      <h3 className="font-bold">{p.name}</h3>
                      <p className="text-primary font-bold">{p.price}</p>
                    </div>
                    {plan === p.id && <div className="w-6 h-6 rounded-full bg-primary text-white text-center">✓</div>}
                  </div>
                  <ul className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {p.features.map(f => <li key={f}>• {f}</li>)}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="card p-6">
            <h2 className="text-2xl font-bold mb-6">Create Account</h2>
            {step === 1 ? (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={form.full_name}
                  onChange={(e) => setForm({...form, full_name: e.target.value})}
                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={form.phone}
                  onChange={(e) => setForm({...form, phone: e.target.value})}
                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => setForm({...form, password: e.target.value})}
                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={form.confirm}
                  onChange={(e) => setForm({...form, confirm: e.target.value})}
                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={sendOtp}
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={6}
                />
                <button
                  onClick={verifyAndRegister}
                  disabled={loading}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify & Register'}
                </button>
                <button onClick={() => setStep(1)} className="w-full mt-2 text-sm hover:underline" style={{ color: 'var(--text-secondary)' }}>
                  ← Back
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
