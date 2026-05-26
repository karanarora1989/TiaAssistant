/**
 * Urgency Detector
 * Analyzes tasks to determine call urgency and timing
 */

export type CallUrgency = 'low' | 'medium' | 'high' | 'critical';

interface UrgencyAnalysis {
  urgency: CallUrgency;
  callBeforeMinutes: number;
  maxRetries: number;
  retryIntervals: number[]; // Minutes between retries
  escalateToUser: boolean;
  escalateMethod: 'notification' | 'call';
}

const CRITICAL_KEYWORDS = [
  'medicine', 'medication', 'pills', 'insulin', 'doctor',
  'emergency', 'urgent', 'critical', 'asap', 'immediately',
  'hospital', 'health', 'safety'
];

const HIGH_KEYWORDS = [
  'meeting', 'call', 'deadline', 'presentation', 'demo',
  'client', 'boss', 'ceo', 'important', 'priority',
  'interview', 'appointment'
];

const MEDIUM_KEYWORDS = [
  'reminder', 'follow up', 'check', 'review', 'update',
  'send', 'email', 'report', 'document'
];

/**
 * Analyze task to determine urgency
 */
export function analyzeTaskUrgency(task: any): UrgencyAnalysis {
  const text = `${task.title} ${task.context || ''}`.toLowerCase();
  
  // Check for critical keywords
  if (CRITICAL_KEYWORDS.some(kw => text.includes(kw))) {
    return {
      urgency: 'critical',
      callBeforeMinutes: 5,
      maxRetries: 5,
      retryIntervals: [2, 5, 10, 15, 20],
      escalateToUser: true,
      escalateMethod: 'call'
    };
  }
  
  // Check for high priority keywords or explicit priority
  if (HIGH_KEYWORDS.some(kw => text.includes(kw)) || task.priority === 'high') {
    return {
      urgency: 'high',
      callBeforeMinutes: 15,
      maxRetries: 3,
      retryIntervals: [5, 10, 15],
      escalateToUser: true,
      escalateMethod: 'call'
    };
  }
  
  // Check for medium keywords
  if (MEDIUM_KEYWORDS.some(kw => text.includes(kw)) || task.priority === 'medium') {
    return {
      urgency: 'medium',
      callBeforeMinutes: 0,
      maxRetries: 2,
      retryIntervals: [10, 20],
      escalateToUser: true,
      escalateMethod: 'notification'
    };
  }
  
  // Default to low
  return {
    urgency: 'low',
    callBeforeMinutes: 0,
    maxRetries: 1,
    retryIntervals: [15],
    escalateToUser: false,
    escalateMethod: 'notification'
  };
}

/**
 * Calculate when to make the call
 */
export function calculateCallTime(task: any, urgency: UrgencyAnalysis): Date {
  if (!task.due_date_iso) {
    // No due date - call immediately
    return new Date();
  }
  
  const dueDate = new Date(task.due_date_iso);
  const callTime = new Date(dueDate.getTime() - urgency.callBeforeMinutes * 60 * 1000);
  
  // Don't call in the past
  const now = new Date();
  if (callTime < now) {
    return now;
  }
  
  return callTime;
}

/**
 * Calculate next retry time
 */
export function calculateNextRetry(
  lastCallTime: Date,
  attemptNumber: number,
  urgency: UrgencyAnalysis
): Date | null {
  if (attemptNumber >= urgency.maxRetries) {
    return null; // No more retries
  }
  
  const retryInterval = urgency.retryIntervals[attemptNumber] || urgency.retryIntervals[urgency.retryIntervals.length - 1];
  return new Date(lastCallTime.getTime() + retryInterval * 60 * 1000);
}

/**
 * Check if task needs escalation
 */
export function needsEscalation(
  task: any,
  callAttempts: number,
  urgency: UrgencyAnalysis
): boolean {
  // Critical tasks escalate after first failed attempt
  if (urgency.urgency === 'critical' && callAttempts >= 1) {
    return true;
  }
  
  // Other tasks escalate after all retries exhausted
  if (callAttempts >= urgency.maxRetries && urgency.escalateToUser) {
    return true;
  }
  
  return false;
}

/**
 * Get hours until/since due date
 */
export function getHoursFromDue(task: any): number {
  if (!task.due_date_iso) {
    return 0;
  }
  
  const now = new Date();
  const dueDate = new Date(task.due_date_iso);
  const diffMs = dueDate.getTime() - now.getTime();
  return Math.round(diffMs / (1000 * 60 * 60));
}

/**
 * Determine call type based on task state
 */
export function determineCallType(task: any): 'assignment' | 'reminder' | 'followup' {
  const hoursFromDue = getHoursFromDue(task);
  
  // If task is new (no calls made yet)
  if (!task.last_call_at) {
    return 'assignment';
  }
  
  // If task is overdue
  if (hoursFromDue < 0) {
    return 'followup';
  }
  
  // Otherwise it's a reminder
  return 'reminder';
}
