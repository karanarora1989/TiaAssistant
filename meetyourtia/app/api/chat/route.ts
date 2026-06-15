import { NextRequest } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { callClaude, parseClaudeJSON } from '@/lib/claude';
import { buildContext } from '@/lib/context';
import { enforceRateLimit } from '@/lib/rate-limit';
import { successResponse, errorResponse } from '@/lib/api-handler';

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    await enforceRateLimit(userId);

    const body = await req.json();
    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return errorResponse('Messages are required', 400);
    }

    const context = await buildContext(userId);
    const today = new Date().toISOString().split('T')[0];

    const systemPrompt = `You are Tia, a sharp and warm AI executive assistant. You help your user stay on top of their work and personal tasks.

${context}

Today's date is ${today}.

Your job in this chat:
1. Respond conversationally and naturally — you're a trusted assistant, not a bot.
2. When the user mentions anything that sounds like a task, to-do, commitment, or thing they need to do or delegate, extract it/them.
3. If no tasks are present, keep "tasks" as an empty array.

ALWAYS respond with valid JSON in this exact shape:
{
  "message": "Your conversational reply here",
  "tasks": [
    {
      "title": "The deliverable or outcome",
      "context": "Why this task exists",
      "received_from": "Person who asked or null",
      "assigned_to": "self or person name",
      "participants": [],
      "due_date": "Today / Tomorrow / Monday / etc.",
      "due_date_iso": "YYYY-MM-DD",
      "due_time": null,
      "time_sensitivity": "hard | soft | flexible",
      "task_domain": "work | personal",
      "entity_type": "project | patient | product | null",
      "entity_name": "Title Case Name or null",
      "priority": "high | medium | low"
    }
  ]
}

Rules:
- due_date_iso is REQUIRED. If no date given, default to today (${today}).
- Keep your message warm, concise, and human. No lists unless they add real value.
- Never wrap JSON in markdown code blocks.
- Only extract tasks that are genuinely actionable commitments — not hypotheticals or examples.`;

    const response = await callClaude(systemPrompt, messages, {
      maxTokens: 2000,
      temperature: 0.7,
    });

    const parsed = parseClaudeJSON<{ message: string; tasks: any[] }>(response.content);

    return successResponse({
      reply: parsed.message,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return errorResponse(error.message || 'Failed to get response', 500);
  }
}
