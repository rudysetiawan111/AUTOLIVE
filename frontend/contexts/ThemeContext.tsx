'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext<any>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<'light'|'dark'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light'|'dark';
    if (saved) setTheme(saved);
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');
    applyTheme(theme);
  }, [theme]);

  const applyTheme = (newTheme: string) => {
    const root = document.documentElement;
    if (newTheme === 'light') {
      root.classList.remove('dark');
      root.style.setProperty('--bg-primary', '#E6F0FA');  // biru langit sangat soft
      root.style.setProperty('--bg-card', '#FFFFFF');
      root.style.setProperty('--text-primary', '#1E3A8A'); // biru tua
      root.style.setProperty('--text-secondary', '#3B82F6');
      root.style.setProperty('--primary', '#3B82F6');
      root.style.setProperty('--primary-dark', '#2563EB');
    } else {
      root.classList.add('dark');
      root.style.setProperty('--bg-primary', '#0F172A');
      root.style.setProperty('--bg-card', '#1E293B');
      root.style.setProperty('--text-primary', '#F8FAFC');
      root.style.setProperty('--text-secondary', '#94A3B8');
      root.style.setProperty('--primary', '#E63946');
      root.style.setProperty('--primary-dark', '#C72A3E');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
