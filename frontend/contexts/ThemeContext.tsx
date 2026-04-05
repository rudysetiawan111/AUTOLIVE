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
      root.style.setProperty('--primary', '#3B82F6'); // biru langit
      root.style.setProperty('--primary-dark', '#2563EB');
    } else {
      root.classList.add('dark');
      root.style.setProperty('--primary', '#E63946'); // merah untuk dark mode
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
