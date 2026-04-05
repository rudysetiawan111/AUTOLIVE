'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { createClient } from '@/lib/supabase/client';
import { LogOut, Sun, Moon, Globe, User, Crown, Star, Shield, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const Header = ({ userEmail, userRole, userSubscription }: any) => {
  const [time, setTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success(t('logout_success'));
    router.push('/login');
  };

  const formatTime = (date: Date) => date.toLocaleTimeString(language === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (date: Date) => date.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const getBadge = () => {
    if (userRole === 'admin') return <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500 text-white">ADMIN</span>;
    if (userSubscription === 'premium') return <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500 text-white"><Crown className="w-3 h-3 inline" /> PREMIUM</span>;
    if (userSubscription === 'pro') return <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500 text-white"><Star className="w-3 h-3 inline" /> PRO</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-500 text-white">FREE</span>;
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">AUTOLIVE</div>
            <div className="text-xs animate-pulse text-gray-500">Automate Your Content, Dominate The Algorithm</div>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-mono">{formatTime(time)}</div>
              <div className="text-xs text-gray-500">{formatDate(time)}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
                {userEmail?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium">{userEmail?.split('@')[0]}</div>
                {getBadge()}
              </div>
            </div>
            <button onClick={() => setLanguage(language === 'en' ? 'id' : 'en')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <Globe className="w-5 h-5" />
              <span className="ml-1 text-sm">{language === 'en' ? 'EN' : 'ID'}</span>
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-700" />}
            </button>
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <LogOut className="w-5 h-5 text-red-500" />
            </button>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
                  {userEmail?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium">{userEmail?.split('@')[0]}</div>
                  {getBadge()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono">{formatTime(time)}</div>
                <div className="text-xs text-gray-500">{formatDate(time)}</div>
              </div>
            </div>
            <div className="flex gap-4 justify-center">
              <button onClick={() => setLanguage(language === 'en' ? 'id' : 'en')} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                <Globe className="w-5 h-5" />
                <span className="ml-1 text-sm">{language === 'en' ? 'EN' : 'ID'}</span>
              </button>
              <button onClick={toggleTheme} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button onClick={handleLogout} className="p-2 rounded-lg bg-red-100 text-red-600">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
