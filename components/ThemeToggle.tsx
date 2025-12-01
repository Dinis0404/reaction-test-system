import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('theme') as 'light' | 'dark' | null;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initial = saved || (prefersDark ? 'dark' : 'light');
      setTheme(initial);
      const root = document.documentElement;
      if (initial === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    } catch {}
  }, []);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    const root = document.documentElement;
    if (next === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    try { window.localStorage.setItem('theme', next); } catch {}
  };
  return (
    <button
      onClick={toggle}
      aria-label="切換主題"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
    >
      <span className={`block transition-transform duration-500 ${theme === 'dark' ? 'rotate-0 scale-100' : 'rotate-180 scale-90'}`}>🌙</span>
    </button>
  );
}

