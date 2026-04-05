'use client';
import { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'id';

const translations = {
  en: {
    // Umum
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    welcome: 'Welcome',
    logout: 'Logout',
    dashboard: 'Dashboard',
    admin_panel: 'Admin Panel',
    settings: 'Settings',
    upgrade: 'Upgrade',
    free: 'Free',
    pro: 'Pro',
    premium: 'Premium',
    // Dashboard user
    viral_filter: 'Viral Filter',
    downloader: 'Downloader',
    editor: 'Editor',
    auto_upload: 'Auto Upload',
    scheduler: 'Scheduler',
    quick_access: 'Quick Access',
    upgrade_to_premium: 'Upgrade to Premium ($5)',
    upgrade_to_pro: 'Upgrade to Pro ($3)',
    // Notifikasi
    login_success: 'Login successful!',
    logout_success: 'Logout successful!',
    login_failed: 'Login failed!',
    register_success: 'Registration successful!',
    upgrade_required: 'Please upgrade your account',
  },
  id: {
    login: 'Masuk',
    register: 'Daftar',
    email: 'Email',
    password: 'Kata Sandi',
    welcome: 'Selamat Datang',
    logout: 'Keluar',
    dashboard: 'Dashboard',
    admin_panel: 'Panel Admin',
    settings: 'Pengaturan',
    upgrade: 'Upgrade',
    free: 'Gratis',
    pro: 'Pro',
    premium: 'Premium',
    viral_filter: 'Filter Viral',
    downloader: 'Downloader',
    editor: 'Editor',
    auto_upload: 'Upload Otomatis',
    scheduler: 'Penjadwalan',
    quick_access: 'Akses Cepat',
    upgrade_to_premium: 'Upgrade ke Premium ($5)',
    upgrade_to_pro: 'Upgrade ke Pro ($3)',
    login_success: 'Login berhasil!',
    logout_success: 'Logout berhasil!',
    login_failed: 'Login gagal!',
    register_success: 'Pendaftaran berhasil!',
    upgrade_required: 'Silakan upgrade akun Anda',
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
