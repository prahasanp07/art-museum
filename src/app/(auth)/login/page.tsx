'use client';

import React, { useState, useTransition, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirectTo') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        // Successfully authenticated: refresh router cache and navigate
        router.push(redirectTo);
        router.refresh();
      } catch (err: any) {
        setErrorMsg(err?.message || 'An unexpected authentication error occurred.');
      }
    });
  };

  return (
    <div className="bg-[#0b101d]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 sm:p-9 shadow-2xl shadow-black/80 relative overflow-hidden">
      {/* Top subtle ambient accent highlight */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-24 bg-cyan-500/20 blur-2xl rounded-full"
        aria-hidden="true"
      />

      {/* Header Badge & Title */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-mono tracking-widest text-cyan-400 uppercase mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>Curatorial Access</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Sign In to Imagini
        </h1>
        <p className="mt-2 text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
          Enter your curator credentials to manage your 3D digital museum, exhibitions, and artwork slots.
        </p>
      </div>

      {/* Error Alert Banner */}
      {errorMsg && (
        <div
          role="alert"
          className="mb-6 p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn"
        >
          <svg
            className="w-4 h-4 text-red-400 mt-0.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="leading-tight">{errorMsg}</span>
        </div>
      )}

      {/* Authentication Form */}
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-mono tracking-wider text-slate-300 uppercase mb-2"
          >
            Curator Email
          </label>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="curator@atelier.art"
              disabled={isPending}
              className="w-full px-4 py-3 bg-[#070b15]/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all disabled:opacity-60"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="password"
              className="block text-xs font-mono tracking-wider text-slate-300 uppercase"
            >
              Master Password
            </label>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={isPending}
              className="w-full px-4 py-3 pr-12 bg-[#070b15]/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors focus:outline-none"
            >
              {showPassword ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-cyan-500 hover:from-cyan-400 hover:via-indigo-500 hover:to-cyan-400 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all duration-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <svg
                className="animate-spin w-4 h-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Authenticating...</span>
            </>
          ) : (
            <span>Sign In to Gallery</span>
          )}
        </button>

        {/* Quick Demo Access Button */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-3 text-[10px] font-mono uppercase tracking-widest text-slate-500">Or Preview</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <button
          type="button"
          onClick={() => {
            document.cookie = 'pragana_demo_session=true; path=/; max-age=86400';
            router.push('/dashboard?demo=true');
          }}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-cyan-500/50 text-slate-300 hover:text-white text-xs font-mono tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>⚡</span>
          <span>Access Curator Portal (Demo Session)</span>
        </button>
      </form>

      {/* Switch to Register */}
      <div className="mt-8 pt-6 border-t border-white/5 text-center">
        <p className="text-xs text-slate-400">
          Need to create a new museum profile?{' '}
          <Link
            href="/register"
            className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4 transition-colors"
          >
            Register Atelier Account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#0b101d]/90 border border-white/10 rounded-2xl p-12 text-center text-slate-400 text-xs font-mono">
          Loading Curatorial Portal...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
