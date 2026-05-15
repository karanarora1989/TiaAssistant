import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { successResponse, errorResponse } from '@/lib/api-handler';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get('audio') as File;
    
    if (!audio) {
      return errorResponse('No audio file provided', 400);
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return errorResponse('OpenAI API key not configured', 500);
    }

    console.log('Transcribing audio with Whisper:', {
      name: audio.name,
      type: audio.type,
      size: audio.size,
    });

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: 'whisper-1',
      language: 'en',
      response_format: 'text',
    });

    console.log('Whisper transcription successful');

    return successResponse({
      text: transcription,
      method: 'whisper',
    }, 'Transcription successful');

  } catch (error: any) {
    console.error('Whisper transcription error:', error);
    return errorResponse(
      error.message || 'Transcription failed',
      500
    );
  }
}
