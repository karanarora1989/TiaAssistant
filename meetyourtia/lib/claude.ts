import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Call Claude with system prompt, context, and messages
 * Includes error handling and fallback logic
 */
export async function callClaude(
  systemPrompt: string,
  messages: ClaudeMessage[],
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): Promise<ClaudeResponse> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature || 0.7,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return {
      content: content.text,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    };
  } catch (error: any) {
    console.error('Claude API error:', error);
    
    // Handle rate limits
    if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }
    
    // Handle overloaded
    if (error.status === 529) {
      throw new Error('Claude is temporarily overloaded. Please try again.');
    }
    
    // Generic error
    throw new Error(error.message || 'Failed to get response from Claude');
  }
}

/**
 * Parse JSON from Claude response with error handling
 */
export function parseClaudeJSON<T>(content: string): T {
  try {
    // Remove markdown code blocks if present
    const cleaned = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Failed to parse Claude JSON:', content);
    throw new Error('Invalid JSON response from Claude');
  }
}

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Trim context if it exceeds token limit
 */
export function trimContext(context: string, maxTokens: number = 1800): string {
  const estimatedTokens = estimateTokens(context);
  
  if (estimatedTokens <= maxTokens) {
    return context;
  }
  
  // Trim to approximate character count
  const maxChars = maxTokens * 4;
  return context.slice(0, maxChars) + '\n\n[Context trimmed due to length...]';
}
