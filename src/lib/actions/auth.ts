'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export type AuthActionResult = {
  error?: string;
  success?: boolean;
  message?: string;
};

/**
 * Server action to authenticate a user with email and password.
 * Redirects to /dashboard upon successful authentication.
 */
export async function login(formData: FormData): Promise<AuthActionResult | void> {
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;
  const redirectTo = (formData.get('redirectTo') as string) || '/dashboard';

  if (!email || !password) {
    return { error: 'Please provide both email and password.' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect(redirectTo);
}

/**
 * Server action to register a new user.
 * Validates username format (alphanumeric and underscores only, 3-30 chars)
 * and passes username and display_name into raw_user_meta_data (options.data).
 */
export async function register(formData: FormData): Promise<AuthActionResult | void> {
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;
  const username = (formData.get('username') as string)?.trim().toLowerCase();
  const displayName = (formData.get('display_name') as string)?.trim();

  if (!email || !password || !username) {
    return { error: 'Email, password, and username are required.' };
  }

  // Enforce alphanumeric and underscore constraint
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  if (!usernameRegex.test(username)) {
    return {
      error:
        'Username must be between 3 and 30 characters and contain only letters, numbers, and underscores (_).',
    };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  const supabase = await createClient();

  // Pass username and display_name into options.data (raw_user_meta_data)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: displayName || username,
      },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes('rate limit')) {
      return {
        error:
          'Supabase email rate limit exceeded (free-tier projects limit confirmation emails to ~3/hour). Disable "Confirm email" in your Supabase Auth Providers settings to allow unlimited instant registrations.',
      };
    }
    return { error: error.message };
  }

  // If a session was established immediately, attempt creating/syncing profile row
  if (data?.user && data?.session) {
    try {
      await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          username,
          display_name: displayName || username,
        },
        { onConflict: 'id' }
      );
    } catch {
      // Profile creation handled by DB trigger if present
    }
  }

  // If email confirmation is required and no active session yet
  if (data?.user && !data?.session) {
    return {
      success: true,
      message: 'Account created! Please check your email to confirm your registration before signing in.',
    };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

/**
 * Server action to log out the currently authenticated user.
 * Clears session cookies and redirects to /login.
 */
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();

  try {
    const cookieStore = await cookies();
    cookieStore.delete('pragana_demo_session');
  } catch {
    // Ignore if outside cookie context
  }

  revalidatePath('/', 'layout');
  redirect('/login');
}
