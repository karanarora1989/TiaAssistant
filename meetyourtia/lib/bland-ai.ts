/**
 * Bland AI Integration
 * Handles AI voice calls for task management
 */

interface BlandCallRequest {
  phone_number: string;
  task: string;
  voice?: string;
  webhook?: string;
  metadata?: Record<string, any>;
  max_duration?: number;
  wait_for_greeting?: boolean;
  record?: boolean;
}

interface BlandCallResponse {
  call_id: string;
  status: string;
}

interface BlandWebhookPayload {
  call_id: string;
  status: 'completed' | 'failed' | 'no-answer' | 'busy';
  duration: number;
  transcript: string;
  recording_url?: string;
  metadata?: Record<string, any>;
}

class BlandAI {
  private apiKey: string;
  private baseUrl = 'https://api.bland.ai/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.BLAND_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Bland AI API key not configured');
    }
  }

  /**
   * Make an AI phone call
   */
  async makeCall(request: BlandCallRequest): Promise<BlandCallResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/calls`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: request.phone_number,
          task: request.task,
          voice: request.voice || 'maya',
          webhook: request.webhook,
          metadata: request.metadata,
          max_duration: request.max_duration || 300, // 5 minutes default
          wait_for_greeting: request.wait_for_greeting ?? true,
          record: request.record ?? true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Bland AI API error: ${error}`);
      }

      const data = await response.json();
      return {
        call_id: data.call_id,
        status: data.status,
      };
    } catch (error: any) {
      console.error('Bland AI makeCall error:', error);
      throw error;
    }
  }

  /**
   * Get call details
   */
  async getCall(callId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/calls/${callId}`, {
        headers: {
          'Authorization': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch call details');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Bland AI getCall error:', error);
      throw error;
    }
  }

  /**
   * Build call prompt for task assignment
   */
  buildAssignmentPrompt(task: any, userName: string): string {
    return `
You are Tia, an AI assistant for ${userName}.
You are professional, friendly, and concise.

Call ${task.assigned_to} to inform them about a new task:
- Task: ${task.title}
- Due: ${task.due_date || 'No specific deadline'}
- Priority: ${task.priority || 'medium'}

Goals:
1. Confirm they received the task
2. Ask if they have any questions
3. Confirm they can complete it by the due date

If they have concerns, note them and say you'll inform ${userName}.

Keep the call brief (under 2 minutes).
`;
  }

  /**
   * Build call prompt for reminder
   */
  buildReminderPrompt(task: any, userName: string, hoursUntilDue: number): string {
    return `
You are Tia, an AI assistant for ${userName}.
You are professional, friendly, and concise.

Call ${task.assigned_to} to remind them about:
- Task: ${task.title}
- Due: ${task.due_date} (in ${hoursUntilDue} hours)

Goals:
1. Ask for current status
2. Confirm they're on track
3. Ask if they need any help

If they're blocked, note the blocker and say you'll inform ${userName}.

Keep the call brief (under 2 minutes).
`;
  }

  /**
   * Build call prompt for follow-up
   */
  buildFollowupPrompt(task: any, userName: string, hoursOverdue: number): string {
    return `
You are Tia, an AI assistant for ${userName}.
You are professional, friendly, and understanding but firm.

Call ${task.assigned_to} about an overdue task:
- Task: ${task.title}
- Was due: ${task.due_date} (${hoursOverdue} hours ago)

Goals:
1. Ask why it's delayed
2. Get new completion estimate
3. Ask if they need help

Be understanding but emphasize the importance of completion.
If they need help, say you'll inform ${userName} immediately.

Keep the call brief (under 2 minutes).
`;
  }

  /**
   * Build call prompt for user escalation
   */
  buildEscalationPrompt(task: any, userName: string, reason: string): string {
    return `
You are Tia, calling ${userName} to escalate an issue.

Task: ${task.title}
Assigned to: ${task.assigned_to}
Issue: ${reason}

Be brief and clear:
1. Explain the situation
2. Mention you've tried calling ${task.assigned_to} multiple times
3. Ask if they want you to take any action

Keep the call very brief (under 1 minute).
`;
  }
}

// Export singleton instance
export const blandAI = new BlandAI();

// Export types
export type { BlandCallRequest, BlandCallResponse, BlandWebhookPayload };
