import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
]);

// Onboarding routes
const isOnboardingRoute = createRouteMatcher([
  '/app/onboarding(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes without authentication
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  
  const { userId } = await auth();
  
  // Require auth for all /app routes
  if (!userId && req.nextUrl.pathname.startsWith('/app')) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }
  
  // Check onboarding completion for authenticated app routes (skip for onboarding pages)
  if (userId && req.nextUrl.pathname.startsWith('/app') && !isOnboardingRoute(req)) {
    try {
      const user = await auth();
      const metadata = user.sessionClaims?.metadata as { onboarding_complete?: boolean } | undefined;
      const onboardingComplete = metadata?.onboarding_complete;
      
      if (!onboardingComplete) {
        return NextResponse.redirect(new URL('/app/onboarding', req.url));
      }
    } catch (error) {
      console.error('Middleware error checking onboarding:', error);
      // Allow request to proceed on error to avoid blocking
    }
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
