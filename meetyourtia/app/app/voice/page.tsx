'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, TopBar, LoadingSpinner, Card } from '@/components/tia/shared';

const MAX_DURATION = 300; // 5 minutes

type ProcessingStage = 'transcribing' | 'extracting' | 'identifying' | 'scheduling' | 'done';

interface ExtractedTask {
  title: string;
  context?: string;
  assigned_to?: string;  // Changed from string[] to string
  due_date?: string;
  priority?: string;
  entity_name?: string;
}

export default function VoiceCapturePage() {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('transcribing');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcriptionMethod, setTranscriptionMethod] = useState<'whisper' | 'webspeech' | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const processingMessages = {
    transcribing: { icon: '✨', text: 'Understanding your voice...', progress: 25 },
    extracting: { icon: '🧠', text: 'Extracting tasks...', progress: 50 },
    identifying: { icon: '👤', text: 'Identifying owners...', progress: 75 },
    scheduling: { icon: '📅', text: 'Setting due dates...', progress: 90 },
    done: { icon: '✅', text: 'All done! Review your tasks', progress: 100 },
  };

  // Duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
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

  // Audio visualization
  const analyzeAudio = (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255);
        
        if (isRecording) {
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        }
      };
      
      updateLevel();
    } catch (err) {
      console.error('Audio analysis error:', err);
    }
  };

  const startRecording = async () => {
    setError('');
    setTranscript('');
    setTranscriptionMethod(null);
    setShowPreview(false);
    setExtractedTasks([]);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Start audio visualization
      analyzeAudio(stream);

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
        
        // Clean up audio context
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
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
      setAudioLevel(0);
    }
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setProcessingStage('transcribing');
    setError('');

    try {
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

    await fallbackToWebSpeech(audioBlob);
  };

  const fallbackToWebSpeech = async (audioBlob: Blob) => {
    try {
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
      // Stage 1: Extracting
      setProcessingStage('extracting');
      await delay(800);

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

      // Stage 2: Identifying
      setProcessingStage('identifying');
      await delay(600);

      // Stage 3: Scheduling
      setProcessingStage('scheduling');
      await delay(400);

      // Stage 4: Done
      setProcessingStage('done');
      await delay(300);

      // Show preview
      setExtractedTasks(data.data.tasks || []);
      setShowPreview(true);
      setIsProcessing(false);

    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setIsProcessing(false);
    }
  };

  const confirmTasks = () => {
    router.push('/app/tasks');
  };

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      <TopBar
        title="Voice Capture"
        backLabel="Home"
        onBack={() => router.push('/app')}
      />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Recording State */}
        {!transcript && !isTranscribing && !isProcessing && !showPreview && (
          <>
            {/* Microphone Button */}
            <div className="mb-8">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-32 h-32 rounded-full flex items-center justify-center text-5xl transition-all ${
                  isRecording
                    ? 'bg-overdue-red shadow-lg shadow-overdue-red/30 animate-pulse'
                    : 'bg-gold-gradient shadow-gold-strong hover:scale-105'
                }`}
              >
                {isRecording ? '⏸' : '🎙'}
              </button>
            </div>

            {/* Waveform Visualization */}
            {isRecording && (
              <div className="flex items-center justify-center gap-1 h-20 mb-6">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-gold rounded-full transition-all duration-100"
                    style={{
                      height: `${Math.max(10, (Math.random() * audioLevel * 80) + (audioLevel * 20))}%`,
                      opacity: audioLevel > 0.05 ? 0.8 : 0.3,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Status */}
            <div className="text-center mb-6">
              {isRecording ? (
                <div>
                  <p className="text-sm text-gold animate-pulse flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-overdue-red rounded-full animate-pulse"></span>
                    Recording...
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                    {recordingDuration >= 240 && ' (max 5:00)'}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-text-secondary">Tap to start recording</p>
              )}
            </div>

            {/* Instructions */}
            {!isRecording && (
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
          </>
        )}

        {/* Transcribing State */}
        {isTranscribing && (
          <div className="text-center space-y-4">
            <div className="text-6xl animate-pulse">✨</div>
            <p className="text-sm text-gold">Understanding your voice...</p>
            <div className="w-64 bg-surface-1 rounded-full h-2">
              <div className="bg-gold-gradient h-2 rounded-full w-1/4 animate-pulse" />
            </div>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="text-center space-y-4 w-full max-w-md">
            <div className="text-6xl animate-bounce">
              {processingMessages[processingStage].icon}
            </div>
            <p className="text-sm text-gold">
              {processingMessages[processingStage].text}
            </p>
            <div className="w-full bg-surface-1 rounded-full h-2">
              <div
                className="bg-gold-gradient h-2 rounded-full transition-all duration-500"
                style={{ width: `${processingMessages[processingStage].progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Transcript Review */}
        {transcript && !isTranscribing && !isProcessing && !showPreview && (
          <>
            <div className="text-center mb-6">
              <p className="text-sm text-done-green">Recording complete</p>
              {transcriptionMethod && (
                <p className="text-xs text-text-secondary mt-1">
                  {transcriptionMethod === 'whisper' ? '✨ Premium transcription' : '⚠️ Fallback transcription'}
                </p>
              )}
            </div>

            <Card className="w-full max-w-md mb-6">
              <h3 className="text-xs text-text-secondary mb-2 uppercase tracking-wider-03">
                Transcript
              </h3>
              <p className="text-sm text-text-primary leading-relaxed">
                {transcript}
              </p>
            </Card>
          </>
        )}

        {/* Task Preview */}
        {showPreview && extractedTasks.length > 0 && (
          <div className="w-full max-w-md space-y-4">
            <h3 className="text-sm font-medium text-text-primary text-center">
              Found {extractedTasks.length} task{extractedTasks.length > 1 ? 's' : ''}:
            </h3>
            
            {extractedTasks.map((task, i) => (
              <Card key={i} className="space-y-3">
                <h4 className="text-sm font-medium text-text-primary flex items-start gap-2">
                  <span>📌</span>
                  <span className="flex-1">{task.title}</span>
                </h4>
                
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-text-secondary">
                    <span>👤</span>
                    <span>{task.assigned_to || 'Self'}</span>
                  </span>
                  <span className="flex items-center gap-1 text-text-secondary">
                    <span>📅</span>
                    <span>{task.due_date || 'No deadline'}</span>
                  </span>
                  <span className="flex items-center gap-1 text-text-secondary">
                    <span>🔥</span>
                    <span className="capitalize">{task.priority || 'medium'}</span>
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="w-full max-w-md mb-6 p-4 bg-overdue-red/10 border border-overdue-red rounded-xl">
            <p className="text-sm text-overdue-red">{error}</p>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      {transcript && !isRecording && !isTranscribing && !showPreview && (
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
              'Extract tasks →'
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

      {showPreview && (
        <div className="px-6 pb-6 space-y-2">
          <Button
            onClick={confirmTasks}
            className="w-full flex items-center justify-center gap-2"
          >
            ✅ Confirm & Create Tasks
          </Button>
          <button
            onClick={() => setShowPreview(false)}
            className="w-full text-xs text-text-muted hover:text-text-secondary text-center py-2 transition-smooth"
          >
            ← Back to edit
          </button>
        </div>
      )}
    </div>
  );
}
