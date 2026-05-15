import { getOpenTasksCount } from './context';
import { getUserPlan } from './auth';

export const FREE_TIER_LIMIT = 15;

/**
 * Check if user can create more tasks
 * Returns { allowed: boolean, current: number, limit: number }
 */
export async function checkFreeTierLimit(userId: string): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  plan: 'free' | 'pro';
}> {
  const plan = await getUserPlan();
  
  // Pro users have unlimited tasks
  if (plan === 'pro') {
    return {
      allowed: true,
      current: 0,
      limit: Infinity,
      plan: 'pro',
    };
  }
  
  // Free users limited to 5 open tasks
  const current = await getOpenTasksCount(userId);
  
  return {
    allowed: current < FREE_TIER_LIMIT,
    current,
    limit: FREE_TIER_LIMIT,
    plan: 'free',
  };
}

/**
 * Throw error if free tier limit exceeded
 */
export async function enforceFreeTierLimit(userId: string): Promise<void> {
  const check = await checkFreeTierLimit(userId);
  
  if (!check.allowed) {
    throw new Error(`Free tier limit reached. You have ${check.current} open tasks (limit: ${check.limit}). Upgrade to Pro for unlimited tasks.`);
  }
}
