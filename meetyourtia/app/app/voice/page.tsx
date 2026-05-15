'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, TopBar, LoadingSpinner, Card } from '@/components/tia/shared';

const MAX_DURATION = 300; // 5 minutes

export default function VoiceCapturePage() {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcriptionMethod, setTranscriptionMethod] = useState<'whisper' | 'webspeech' | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          // Auto-stop at 5 minutes
          if (newDuration >= MAX_DURATION) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    setError('');
    setTranscript('');
    setTranscriptionMethod(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setError('Failed to access microphone. Please allow microphone access.');
      console.error('Microphone error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setError('');

    try {
      // Try Whisper first
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.data?.text) {
        setTranscript(data.data.text);
        setTranscriptionMethod('whisper');
        setIsTranscribing(false);
        return;
      }
    } catch (error) {
      console.error('Whisper failed, falling back to Web Speech:', error);
    }

    // Fallback to Web Speech API
    await fallbackToWebSpeech(audioBlob);
  };

  const fallbackToWebSpeech = async (audioBlob: Blob) => {
    try {
      // Check for Web Speech API support
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        setError('Voice recognition is not supported. Please try again or use a different browser.');
        setIsTranscribing(false);
        return;
      }

      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      // Play the audio and transcribe
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        setTranscriptionMethod('webspeech');
        setIsTranscribing(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Web Speech error:', event.error);
        setError('Transcription failed. Please try recording again.');
        setIsTranscribing(false);
      };

      recognition.onend = () => {
        setIsTranscribing(false);
      };

      // Start recognition and play audio
      recognition.start();
      audio.play();

    } catch (err: any) {
      setError('Transcription failed. Please try again.');
      setIsTranscribing(false);
      console.error('Fallback error:', err);
    }
  };

  const handleSubmit = async () => {
    if (!transcript.trim()) {
      setError('Please record something first');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcript.trim(),
          captureMethod: 'voice',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to capture task');
      }

      // Redirect to tasks view
      router.push('/app/tasks');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      <TopBar
        title="Voice Capture"
        backLabel="Home"
        onBack={() => router.push('/app')}
      />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Microphone Button */}
        <div className="mb-8">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isTranscribing || isProcessing}
            className={`w-32 h-32 rounded-full flex items-center justify-center text-5xl transition-all ${
              isRecording
                ? 'bg-overdue-red shadow-lg shadow-overdue-red/30 animate-pulse'
                : 'bg-gold-gradient shadow-gold-strong hover:scale-105'
            } ${(isTranscribing || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isRecording ? '⏸' : '🎙'}
          </button>
        </div>

        {/* Status */}
        <div className="text-center mb-6">
          {isRecording && (
            <div>
              <p className="text-sm text-gold animate-pulse">Recording...</p>
              <p className="text-xs text-text-secondary mt-1">
                {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                {recordingDuration >= 240 && ' (max 5:00)'}
              </p>
            </div>
          )}
          {isTranscribing && (
            <div>
              <p className="text-sm text-gold animate-pulse">Transcribing...</p>
              <p className="text-xs text-text-secondary mt-1">Please wait</p>
            </div>
          )}
          {!isRecording && !isTranscribing && !transcript && (
            <p className="text-sm text-text-secondary">Tap to start recording</p>
          )}
          {transcript && !isRecording && !isTranscribing && (
            <div>
              <p className="text-sm text-done-green">Recording complete</p>
              {transcriptionMethod && (
                <p className="text-xs text-text-secondary mt-1">
                  {transcriptionMethod === 'whisper' ? '✨ Premium transcription' : '⚠️ Fallback transcription'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Transcript */}
        {transcript && (
          <Card className="w-full max-w-md mb-6">
            <h3 className="text-xs text-text-secondary mb-2 uppercase tracking-wider-03">
              Transcript
            </h3>
            <p className="text-sm text-text-primary leading-relaxed">
              {transcript}
            </p>
          </Card>
        )}

        {/* Error */}
        {error && (
          <div className="w-full max-w-md mb-6 p-4 bg-overdue-red/10 border border-overdue-red rounded-xl">
            <p className="text-sm text-overdue-red">{error}</p>
          </div>
        )}

        {/* Instructions */}
        {!transcript && !isRecording && !isTranscribing && (
          <div className="w-full max-w-md">
            <h3 className="text-sm font-medium text-text-primary mb-3">
              How to use voice capture:
            </h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-gold">1.</span>
                <span>Tap the microphone to start recording</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold">2.</span>
                <span>Speak naturally about your tasks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold">3.</span>
                <span>Tap again to stop and transcribe</span>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      {transcript && !isRecording && !isTranscribing && (
        <div className="px-6 pb-6 space-y-2">
          <Button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Processing...</span>
              </>
            ) : (
              'Capture task →'
            )}
          </Button>
          <button
            onClick={() => {
              setTranscript('');
              setError('');
              setTranscriptionMethod(null);
            }}
            className="w-full text-xs text-text-muted hover:text-text-secondary text-center py-2 transition-smooth"
          >
            Clear and try again
          </button>
        </div>
      )}
    </div>
  );
}
