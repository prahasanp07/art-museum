'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export function Navbar() {
  const [pathname, setPathname] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname);
    }

    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        setIsAuthenticated(Boolean(data?.user));
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsAuthenticated(Boolean(session?.user));
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  const portalHref = isAuthenticated ? '/dashboard' : '/login';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between backdrop-blur-md bg-black/40 border border-white/10 rounded-full px-6 py-3 shadow-2xl">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 flex items-center justify-center p-[1px] shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
              <span className="text-sm font-black bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
                IG
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-wider text-white uppercase group-hover:text-cyan-400 transition-colors">
              Imagini
            </span>
            <span className="text-[9px] tracking-widest text-slate-400 uppercase -mt-1 font-mono">
              3D Digital Art Museum
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium tracking-wider uppercase text-slate-300">
          <Link
            href="/"
            className={`transition-colors hover:text-white ${pathname === '/' ? 'text-cyan-400 font-semibold' : ''
              }`}
          >
            Directory
          </Link>
          <Link
            href="/pragana-innovations"
            className={`transition-colors hover:text-white ${pathname === '/pragana-innovations' ? 'text-cyan-400 font-semibold' : ''
              }`}
          >
            Live Gallery
          </Link>
          <Link
            href={portalHref}
            className={`transition-colors hover:text-white ${pathname === '/dashboard' || pathname === '/login' ? 'text-cyan-400 font-semibold' : ''
              }`}
          >
            {isAuthenticated ? 'Dashboard' : 'Sign In'}
          </Link>
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <Link
            href={portalHref}
            className="text-xs font-semibold px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            Creator Portal
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
