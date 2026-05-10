import Razorpay from 'razorpay';

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export const RAZORPAY_PLANS = {
  monthly: {
    amount: 49900, // ₹499 in paise
    currency: 'INR',
    interval: 'monthly' as const,
    period: 1,
  },
  annual: {
    amount: 399900, // ₹3,999 in paise
    currency: 'INR',
    interval: 'yearly' as const,
    period: 1,
  },
};

/**
 * Create Razorpay subscription
 */
export async function createSubscription(
  planType: 'monthly' | 'annual',
  customerId: string,
  notes?: Record<string, string>
) {
  const plan = RAZORPAY_PLANS[planType];
  
  const subscription = await razorpay.subscriptions.create({
    plan_id: plan.interval === 'monthly' ? 'plan_monthly_id' : 'plan_annual_id', // Replace with actual plan IDs from Razorpay dashboard
    customer_notify: 1,
    total_count: 12, // 12 billing cycles
    notes: notes || {},
  });

  return subscription;
}

/**
 * Verify Razorpay webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return expectedSignature === signature;
}
