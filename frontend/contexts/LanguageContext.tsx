'use client';
import { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'id';

const translations = {
  en: {
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    dont_have_account: "Don't have an account?",
    register_now: 'Register now',
    welcome: 'Welcome',
    quick_access: 'Quick Access',
    viral_filter: 'Viral Filter',
    downloader: 'Downloader',
    editor: 'Editor',
    auto_upload: 'Auto Upload',
    scheduler: 'Scheduler',
    settings: 'Settings',
    upgrade_to_pro: 'Upgrade to Pro ($3)',
    upgrade_to_premium: 'Upgrade to Premium ($5)',
    admin_panel: 'Admin Panel',
    user_management: 'User Management',
    website_settings: 'Website Settings',
    save_settings: 'Save Settings',
    login_success: 'Login successful!',
    logout_success: 'Logout successful!',
    upgrade_required: 'Please upgrade your account',
    select_access_role: 'Select Access Role',
    admin_access: 'Admin',
    admin_desc: 'Full access to Admin Panel',
    premium_access: 'Premium',
    premium_desc: 'All features ($5/month)',
    pro_access: 'Pro',
    pro_desc: 'All features except scheduler ($3/month)',
    free_access: 'Free Trial',
    free_desc: 'Limited features for 7 days',
  },
  id: {
    login: 'Masuk',
    register: 'Daftar',
    email: 'Email',
    password: 'Kata Sandi',
    dont_have_account: 'Belum punya akun?',
    register_now: 'Daftar sekarang',
    welcome: 'Selamat Datang',
    quick_access: 'Akses Cepat',
    viral_filter: 'Filter Viral',
    downloader: 'Downloader',
    editor: 'Editor',
    auto_upload: 'Upload Otomatis',
    scheduler: 'Penjadwalan',
    settings: 'Pengaturan',
    upgrade_to_pro: 'Upgrade ke Pro ($3)',
    upgrade_to_premium: 'Upgrade ke Premium ($5)',
    admin_panel: 'Panel Admin',
    user_management: 'Manajemen User',
    website_settings: 'Pengaturan Website',
    save_settings: 'Simpan Pengaturan',
    login_success: 'Login berhasil!',
    logout_success: 'Logout berhasil!',
    upgrade_required: 'Silakan upgrade akun Anda',
    select_access_role: 'Pilih Akses',
    admin_access: 'Admin',
    admin_desc: 'Akses penuh ke Panel Admin',
    premium_access: 'Premium',
    premium_desc: 'Semua fitur ($5/bulan)',
    pro_access: 'Pro',
    pro_desc: 'Semua fitur kecuali jadwal ($3/bulan)',
    free_access: 'Uji Coba Gratis',
    free_desc: 'Fitur terbatas 7 hari',
  },
};

const LanguageContext = createContext<any>(null);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLang] = useState<Language>('en');
  useEffect(() => {
    const saved = localStorage.getItem('lang') as Language;
    if (saved) setLang(saved);
  }, []);

  const t = (key: string) => translations[lang][key] || key;
  const setLanguage = (l: Language) => {
    setLang(l);
    localStorage.setItem('lang', l);
  };

  return (
    <LanguageContext.Provider value={{ language: lang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
