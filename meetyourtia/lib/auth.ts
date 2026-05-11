import { currentUser } from '@clerk/nextjs/server';

/**
 * Get authenticated user ID from Clerk
 * Throws if not authenticated
 * Uses currentUser() instead of auth() to work without middleware
 */
export async function getAuthUserId(): Promise<string> {
  const user = await currentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user.id;
}

/**
 * Get current user with metadata
 */
export async function getCurrentUser() {
  const user = await currentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  const user = await currentUser();
  
  if (!user) {
    return false;
  }
  
  return user.publicMetadata?.onboarding_complete === true;
}

/**
 * Get user's plan from Clerk metadata
 */
export async function getUserPlan(): Promise<'free' | 'pro'> {
  const user = await currentUser();
  
  if (!user) {
    return 'free';
  }
  
  return (user.publicMetadata?.plan as 'free' | 'pro') || 'free';
}

/**
 * Check if user is on Pro plan
 */
export async function isProUser(): Promise<boolean> {
  const plan = await getUserPlan();
  return plan === 'pro';
}
