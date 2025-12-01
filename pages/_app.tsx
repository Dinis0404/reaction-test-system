import type { AppProps } from 'next/app';
import '../app/globals.css';
import { useEffect } from 'react';
import { ensureDefaultUsers } from '../lib/users';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('theme') : null;
      const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = saved || (prefersDark ? 'dark' : 'light');
      const root = document.documentElement;
      if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    } catch {}
    ensureDefaultUsers(['Mak Cheok Lam','Chan U Hin']);
  }, []);
  return (
    <>
      <Component {...pageProps} />
    </>
  );
}

