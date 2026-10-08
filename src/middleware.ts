import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Root Next.js middleware:
 * - Synchronizes and refreshes Supabase auth cookies
 * - Protects all /dashboard routes, redirecting unauthenticated visitors to /login
 * - Redirects logged-in users away from /login and /register to /dashboard
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static public assets: images, fonts, 3D glb/ktx2 files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|glb|ktx2|mp3|mp4|hdr|bin)$).*)',
  ],
};
