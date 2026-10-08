'use client';

import React, { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Validate username constraint: alphanumeric and underscores only, 3 to 30 characters
  const usernameValidation = useMemo(() => {
    if (!username) return { isValid: false, message: 'Required (3-30 characters)' };
    const regex = /^[a-zA-Z0-9_]+$/;
    if (username.length < 3) {
      return { isValid: false, message: 'Too short (min 3 characters)' };
    }
    if (username.length > 30) {
      return { isValid: false, message: 'Too long (max 30 characters)' };
    }
    if (!regex.test(username)) {
      return { isValid: false, message: 'Alphanumeric and underscores (_) only' };
    }
    return { isValid: true, message: 'Valid curator handle' };
  }, [username]);

  const handleProceedAsDemo = () => {
    const cleanUsername = username.trim().toLowerCase() || 'curator';
    const cleanDisplayName = displayName.trim() || cleanUsername;

    const demoProfile = {
      id: 'p-01',
      username: cleanUsername,
      display_name: cleanDisplayName,
      bio: `Curator of the ${cleanDisplayName} 3D Digital Pavilion.`,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      created_at: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('pragana_active_profile', JSON.stringify(demoProfile));
      document.cookie = 'pragana_demo_session=true; path=/; max-age=86400';
    }

    router.push('/dashboard?demo=true');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessInfo(null);
    setIsRateLimited(false);

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim();
    const cleanDisplayName = displayName.trim() || cleanUsername;

    // Strict validation
    if (!cleanEmail || !password || !cleanUsername) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (!usernameValidation.isValid) {
      setErrorMsg(usernameValidation.message);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();

        // Sign up and explicitly pass username & display_name into raw_user_meta_data
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              username: cleanUsername,
              display_name: cleanDisplayName,
            },
          },
        });

        if (error) {
          if (error.message.toLowerCase().includes('rate limit')) {
            setIsRateLimited(true);
            setErrorMsg(
              'Supabase email verification rate limit exceeded (free tier projects are limited to ~3 confirmation emails/hour).'
            );
          } else {
            setErrorMsg(error.message);
          }
          return;
        }

        // If session was established immediately
        if (data?.user && data?.session) {
          // Attempt inserting or upserting into profiles table
          try {
            await supabase.from('profiles').upsert(
              {
                id: data.user.id,
                username: cleanUsername,
                display_name: cleanDisplayName,
              },
              { onConflict: 'id' }
            );
          } catch {
            // Profile table trigger handles if present
          }

          router.push('/dashboard');
          router.refresh();
          return;
        }

        // If Supabase project requires email confirmation
        if (data?.user && !data?.session) {
          setSuccessInfo(
            `A confirmation link has been sent to ${cleanEmail}. Please verify your email to activate your atelier.`
          );
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to complete registration.');
      }
    });
  };

  return (
    <div className="bg-[#0b101d]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 sm:p-9 shadow-2xl shadow-black/80 relative overflow-hidden">
      {/* Top subtle ambient accent highlight */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-24 bg-indigo-500/20 blur-2xl rounded-full"
        aria-hidden="true"
      />

      {/* Header Badge & Title */}
      <div className="mb-7 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-[10px] font-mono tracking-widest text-indigo-400 uppercase mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          <span>Exhibition Atelier Registration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Create Curator Profile
        </h1>
        <p className="mt-2 text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
          Set up your digital pavilion, curate spatial exhibitions, and showcase 3D art installations.
        </p>
      </div>

      {/* Success Notification */}
      {successInfo && (
        <div
          role="status"
          className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5 animate-fadeIn"
        >
          <svg
            className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <div className="leading-relaxed">
            <p className="font-semibold text-emerald-300">Registration Complete!</p>
            <p className="mt-1 text-emerald-200/90">{successInfo}</p>
            <div className="mt-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-white bg-emerald-700/60 hover:bg-emerald-600/60 px-3 py-1.5 rounded-lg border border-emerald-400/40 transition-colors"
              >
                Proceed to Sign In &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Rate Limit Resolution Banner */}
      {isRateLimited && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs animate-fadeIn space-y-3"
        >
          <div className="flex items-start gap-2.5">
            <span className="text-amber-400 font-bold text-base leading-none">⚠️</span>
            <div>
              <p className="font-bold text-amber-300">Supabase Email Rate Limit Exceeded</p>
              <p className="mt-1 text-slate-300 leading-relaxed text-[11px]">
                Supabase limits free-tier projects to ~3 confirmation emails per hour when email verification is turned on.
              </p>
            </div>
          </div>

          <div className="bg-black/50 p-3 rounded-lg border border-amber-500/20 text-[11px] space-y-1 text-slate-300">
            <p className="font-semibold text-amber-400 font-mono">How to disable rate limits permanently in Supabase:</p>
            <p>1. Open your <strong>Supabase Dashboard</strong> &rarr; <strong>Authentication</strong> &rarr; <strong>Providers</strong> &rarr; <strong>Email</strong></p>
            <p>2. Toggle <strong>Confirm email</strong> to <strong className="text-emerald-400">OFF</strong> (Disabled) and click <strong>Save</strong>.</p>
            <p className="text-slate-400 text-[10px]">Signups will then create accounts and log in immediately without sending emails.</p>
          </div>

          <button
            type="button"
            onClick={handleProceedAsDemo}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-cyan-500 to-indigo-500 hover:from-amber-400 hover:via-cyan-400 hover:to-indigo-400 text-slate-950 font-bold text-xs font-mono transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <span>⚡</span>
            <span>Continue as @{username.trim() || 'curator'} (Instant Access)</span>
          </button>
        </div>
      )}

      {/* Standard Error Alert Banner (when not rate limited) */}
      {errorMsg && !isRateLimited && (
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

      {/* Registration Form */}
      {!successInfo && (
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Display Name */}
          <div>
            <label
              htmlFor="display_name"
              className="block text-xs font-mono tracking-wider text-slate-300 uppercase mb-1.5"
            >
              Curator Name
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Elena Vance"
              disabled={isPending}
              className="w-full px-4 py-2.5 bg-[#070b15]/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all disabled:opacity-60"
            />
          </div>

          {/* Username with Alphanumeric & Underscore Validation */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="username"
                className="block text-xs font-mono tracking-wider text-slate-300 uppercase"
              >
                Atelier Handle / Username <span className="text-cyan-400">*</span>
              </label>
              {username && (
                <span
                  className={`text-[10px] font-mono tracking-wider ${
                    usernameValidation.isValid ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {usernameValidation.message}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">
                @
              </span>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => {
                  // Clean or allow typing
                  setUsername(e.target.value.replace(/\s+/g, ''));
                }}
                placeholder="elena_vance"
                disabled={isPending}
                className={`w-full pl-8 pr-4 py-2.5 bg-[#070b15]/90 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-all disabled:opacity-60 font-mono ${
                  username && !usernameValidation.isValid
                    ? 'border-amber-500/70 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
                    : 'border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
                }`}
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500 font-mono">
              Letters, numbers, and underscores only. Permanent gallery link URL.
            </p>
          </div>

          {/* Email Address */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-mono tracking-wider text-slate-300 uppercase mb-1.5"
            >
              Curator Email <span className="text-cyan-400">*</span>
            </label>
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
              className="w-full px-4 py-2.5 bg-[#070b15]/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all disabled:opacity-60"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-mono tracking-wider text-slate-300 uppercase"
              >
                Password <span className="text-cyan-400">*</span>
              </label>
              <span className="text-[10px] font-mono text-slate-500">Min 6 characters</span>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={isPending}
                className="w-full px-4 py-2.5 pr-12 bg-[#070b15]/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all disabled:opacity-60"
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
            disabled={isPending || !usernameValidation.isValid}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 via-cyan-500 to-indigo-600 hover:from-indigo-400 hover:via-cyan-400 hover:to-indigo-500 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-lg shadow-indigo-500/20 hover:shadow-cyan-500/35 transition-all duration-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                <span>Creating Atelier Profile...</span>
              </>
            ) : (
              <span>Create Curator Atelier</span>
            )}
          </button>

          {/* Quick Demo Access Option */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-3 text-[10px] font-mono uppercase tracking-widest text-slate-500">Or Preview</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <button
            type="button"
            onClick={handleProceedAsDemo}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-cyan-500/50 text-slate-300 hover:text-white text-xs font-mono tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>⚡</span>
            <span>Explore Museum as {username ? `@${username}` : 'Guest Curator'} (Demo Mode)</span>
          </button>
        </form>
      )}

      {/* Switch to Login */}
      <div className="mt-7 pt-5 border-t border-white/5 text-center">
        <p className="text-xs text-slate-400">
          Already have an atelier account?{' '}
          <Link
            href="/login"
            className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4 transition-colors"
          >
            Sign In to Gallery
          </Link>
        </p>
      </div>
    </div>
  );
}
