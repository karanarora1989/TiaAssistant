'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button, TopBar, LoadingSpinner, Card } from '@/components/tia/shared';

export default function VoiceCapturePage() {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef<any>(null);

  const startRecording = () => {
    setError('');
    setTranscript('');
    
    // Check for Web Speech API support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Voice recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setError(`Error: ${event.error}`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
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
            disabled={isProcessing}
            className={`w-32 h-32 rounded-full flex items-center justify-center text-5xl transition-all ${
              isRecording
                ? 'bg-overdue-red shadow-lg shadow-overdue-red/30 animate-pulse'
                : 'bg-gold-gradient shadow-gold-strong hover:scale-105'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isRecording ? '⏸' : '🎙'}
          </button>
        </div>

        {/* Status */}
        <div className="text-center mb-6">
          {isRecording && (
            <p className="text-sm text-gold animate-pulse">Listening...</p>
          )}
          {!isRecording && !transcript && (
            <p className="text-sm text-text-secondary">Tap to start recording</p>
          )}
          {transcript && !isRecording && (
            <p className="text-sm text-done-green">Recording complete</p>
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
        {!transcript && !isRecording && (
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
                <span>Tap again to stop, then submit</span>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      {transcript && !isRecording && (
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
