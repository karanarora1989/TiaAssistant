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
  }

  private assertKey() {
    if (!this.apiKey) throw new Error('Bland AI API key not configured');
  }

  /**
   * Make an AI phone call
   */
  async makeCall(request: BlandCallRequest): Promise<BlandCallResponse> {
    this.assertKey();
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
    this.assertKey();
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

}

// Export singleton instance
export const blandAI = new BlandAI();

// Export types
export type { BlandCallRequest, BlandCallResponse, BlandWebhookPayload };
