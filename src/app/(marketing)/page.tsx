import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { MOCK_PROFILES, MOCK_GALLERIES } from '@/lib/mockData';

export default function MarketingPage() {
  const creators = MOCK_PROFILES;

  return (
    <div className="min-h-screen bg-[#05070c] text-white flex flex-col selection:bg-cyan-500 selection:text-black">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-6 relative overflow-hidden">
        {/* Atmospheric Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-cyan-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[400px] bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none" />

        {/* 1. Hero Section */}
        <section className="max-w-5xl mx-auto text-center flex flex-col items-center relative z-10 pt-8 pb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 text-xs font-mono uppercase tracking-widest mb-8">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            {/* <span>Next-Gen 3D Scrollytelling &bull; 60 FPS WebGL</span> */}
            <span>THE NEW ERA OF DIGITAL EXHIBITIONS</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
            Give Your Art{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">
              The Gallery Walls It Deserves
            </span>
          </h1>

          <p className="max-w-2xl text-base sm:text-lg text-slate-300 mb-10 leading-relaxed">
            Step beyond flat digital grids. Experience your art in breathing, room-scale depth within physical-scale rooms tailored entirely to your creative vision—crafting a living architectural sanctuary where every piece tells a multi-dimensional story
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              href="/pragana-innovations"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 hover:from-cyan-400 hover:to-fuchsia-400 text-slate-950 font-bold text-sm tracking-wide shadow-xl shadow-cyan-500/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Explore Featured Gallery</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 rounded-full backdrop-blur-md bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold text-sm tracking-wide transition-all hover:border-white/30 flex items-center justify-center gap-2"
            >
              <span>Creator Management Portal</span>
            </Link>
          </div>
        </section>

        {/* 2. Architectural Features Breakdown */}
        <section className="max-w-6xl mx-auto py-16 border-t border-white/10 relative z-10">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
              Engineered for Pure Visual Immersion
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Contract-driven rendering architecture guarantees desktop and mobile fluid performance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/10 backdrop-blur-md hover:border-cyan-500/30 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white mb-2">Dual Catmull-Rom Splines</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Parameterized translation and look-at curves glide the camera through gallery wings in lockstep with normalized vertical scroll depth.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/10 backdrop-blur-md hover:border-indigo-500/30 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white mb-2">1.8m Inspection Lerp</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Clicking any artwork plane pauses corridor progression and lerps the camera directly along the surface normal vector to an intimate curatorial distance.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/10 backdrop-blur-md hover:border-fuchsia-500/30 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white mb-2">Draw Call Discipline</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zero dynamic shadow maps, instanced structural light fixtures, and transient Zustand reads eliminate GC spikes and lock 60fps across devices.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Public Creator Directory */}
        <section className="max-w-6xl mx-auto py-16 border-t border-white/10 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">
                Curator Roster
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Public Creator Directory
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 sm:mt-0 max-w-sm">
              Discover verified artists hosting custom multi-tenant 3D exhibition halls.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creators.map((creator) => {
              const gallery = MOCK_GALLERIES[creator.username];
              const slotCount = gallery?.slots?.length ?? 6;

              return (
                <div
                  key={creator.id}
                  className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 flex flex-col justify-between backdrop-blur-md hover:border-white/20 transition-all group"
                >
                  <div>
                    {/* Creator Avatar & Header */}
                    <div className="flex items-center gap-4 mb-4">
                      {creator.avatar_url ? (
                        <img
                          src={creator.avatar_url}
                          alt={creator.display_name || creator.username || 'Creator avatar'}
                          className="w-14 h-14 rounded-full object-cover border-2 border-white/20 group-hover:border-cyan-400 transition-colors"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-600 via-indigo-600 to-fuchsia-600 flex items-center justify-center font-bold text-white text-lg border-2 border-white/20 group-hover:border-cyan-400 transition-colors uppercase shrink-0">
                          {(creator.display_name || creator.username || 'C').charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {creator.display_name}
                        </h3>
                        <span className="text-xs font-mono text-cyan-400">
                          @{creator.username}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-6">
                      {creator.bio}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 py-3 border-y border-white/10 mb-4">
                      <span>Exhibition Bays:</span>
                      <span className="text-white font-bold">{slotCount} Works Mounted</span>
                    </div>

                    <Link
                      href={`/${creator.username}`}
                      className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-cyan-500 hover:text-slate-950 text-white font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 group-hover:bg-cyan-500 group-hover:text-slate-950"
                    >
                      <span>Enter 3D Gallery</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; 2026 PraGana Innovations. All spatial rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-slate-300 transition-colors">Directory</Link>
            <Link href="/dashboard" className="hover:text-slate-300 transition-colors">Portal</Link>
            <Link href="/pragana-innovations" className="hover:text-slate-300 transition-colors">Showcase</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
