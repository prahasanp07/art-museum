import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Authentication | Imagini 3D Digital Art Museum',
  description: 'Curatorial atelier access for Imagini 3D digital art museum.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-hidden font-sans">
      {/* Background Architectural Ambient Light Orbs */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[480px] bg-gradient-to-b from-cyan-600/15 via-indigo-600/10 to-transparent blur-3xl rounded-full"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 w-[500px] h-[400px] bg-gradient-to-tl from-indigo-900/10 via-purple-900/5 to-transparent blur-3xl rounded-full"
        aria-hidden="true"
      />

      {/* Subtle Spatial Architectural Floor Grid */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#1e293b0f_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
        aria-hidden="true"
      />

      {/* Top Header Navigation */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link
          href="/"
          className="group flex items-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 p-[1px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#0a0f1d] rounded-[7px] flex items-center justify-center">
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

        <Link
          href="/"
          className="text-xs font-mono tracking-wider uppercase text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5"
        >
          <span>&larr;</span>
          <span>Back to Directory</span>
        </Link>
      </header>

      {/* Main Form Content Canvas */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Curatorial Museum Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-500 border-t border-white/5 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Curatorial Security Infrastructure Active</span>
        </div>
        <p className="tracking-widest uppercase">
          &copy; 2026 PraGana Innovations- 3D Digital Art Systems
        </p>
      </footer>
    </div>
  );
}
