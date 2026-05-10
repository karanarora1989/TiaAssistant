// Rate limiting temporarily disabled for MVP deployment
// TODO: Install @upstash/redis and configure Upstash account to enable rate limiting
// import { Redis } from '@upstash/redis';

const RATE_LIMIT_WINDOW = 60; // 60 seconds
const RATE_LIMIT_MAX = 20; // 20 requests per minute per user

/**
 * Check rate limit for user
 * Returns { allowed: boolean, remaining: number, reset: number }
 * 
 * NOTE: Currently disabled - always returns allowed: true
 * To enable: Install @upstash/redis and uncomment Redis code
 */
export async function checkRateLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  reset: number;
}> {
  // Rate limiting disabled for MVP - always allow
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX,
    reset: RATE_LIMIT_WINDOW,
  };
  
  /* UNCOMMENT TO ENABLE RATE LIMITING:
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  
  const key = `rate_limit:${userId}`;
  const now = Date.now();
  const windowStart = now - (RATE_LIMIT_WINDOW * 1000);

  try {
    await redis.zremrangebyscore(key, 0, windowStart);
    const count = await redis.zcard(key);

    if (count >= RATE_LIMIT_MAX) {
      const oldest = await redis.zrange(key, 0, 0, { withScores: true }) as Array<{ score: number; member: string }>;
      const resetTime = oldest.length > 0 
        ? Math.ceil((oldest[0].score + (RATE_LIMIT_WINDOW * 1000) - now) / 1000)
        : RATE_LIMIT_WINDOW;

      return {
        allowed: false,
        remaining: 0,
        reset: resetTime,
      };
    }

    await redis.zadd(key, { score: now, member: `${now}:${Math.random()}` });
    await redis.expire(key, RATE_LIMIT_WINDOW);

    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX - (count + 1),
      reset: RATE_LIMIT_WINDOW,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX,
      reset: RATE_LIMIT_WINDOW,
    };
  }
  */
}

/**
 * Enforce rate limit - throws if exceeded
 * NOTE: Currently disabled
 */
export async function enforceRateLimit(userId: string): Promise<void> {
  const result = await checkRateLimit(userId);
  
  if (!result.allowed) {
    throw new Error(`Rate limit exceeded. Try again in ${result.reset} seconds.`);
  }
}
