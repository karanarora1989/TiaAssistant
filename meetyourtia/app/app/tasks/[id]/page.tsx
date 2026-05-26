'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, TopBar, LoadingSpinner, Card, StatusDot } from '@/components/tia/shared';
import { Task } from '@/lib/supabase';
import { AgentControl } from '@/components/tia/AgentControl';

interface TaskHistory {
  id: string;
  change_type: string;
  field_changed: string;
  old_value: string;
  new_value: string;
  reason?: string;
  source: string;
  changed_at: string;
}

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [history, setHistory] = useState<TaskHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  
  // Voice update states
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [extractedIntent, setExtractedIntent] = useState<any>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    fetchTask();
    fetchHistory();
  }, [taskId]);

  const fetchTask = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch task');
      }

      setTask(data.data.task);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/history`);
      const data = await response.json();

      if (response.ok) {
        setHistory(data.data.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const startRecording = async () => {
    setError('');
    setTranscript('');
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
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setError('Failed to access microphone');
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
        await processVoiceUpdate(data.data.text);
      } else {
        setError('Transcription failed');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      setError('Transcription failed');
    } finally {
      setIsTranscribing(false);
    }
  };

  const processVoiceUpdate = async (text: string) => {
    setUpdating(true);

    try {
      const response = await fetch(`/api/tasks/${taskId}/update-voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process update');
      }

      setExtractedIntent(data.data.intent);
      setShowConfirmation(true);
      setUpdating(false);
    } catch (err: any) {
      setError(err.message || 'Failed to process update');
      setUpdating(false);
    }
  };

  const confirmUpdate = () => {
    setShowConfirmation(false);
    setTranscript('');
    setExtractedIntent(null);
    fetchTask();
    fetchHistory();
  };

  const handleQuickAction = async (action: string, days?: number) => {
    setUpdating(true);
    setError('');

    try {
      let updates: any = {};

      switch (action) {
        case 'done':
          updates = { status: 'done' };
          break;
        case 'reschedule':
          const newDate = new Date();
          newDate.setDate(newDate.getDate() + (days || 2));
          updates = {
            due_date_iso: newDate.toISOString().split('T')[0],
            due_date: `in ${days || 2} days`,
          };
          break;
        case 'cancel':
          const reason = prompt('Why cancel this task?');
          if (!reason) {
            setUpdating(false);
            return;
          }
          updates = {
            status: 'done',
            archived: true,
            status_details: { cancelled: true, cancel_reason: reason },
          };
          break;
      }

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update task');
      }

      if (action === 'done' || action === 'cancel') {
        router.push('/app/tasks');
      } else {
        setTask(data.data.task);
        fetchHistory();
        setUpdating(false);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="min-h-screen bg-surface-0 flex flex-col">
        <TopBar
          title="Task"
          backLabel="Tasks"
          onBack={() => router.push('/app/tasks')}
        />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-sm text-overdue-red mb-4">{error}</p>
            <Button onClick={() => router.push('/app/tasks')} variant="ghost">
              Back to tasks
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!task) return null;

  const priorityDot = task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'gold' : 'green';

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      <TopBar
        title="Task Details"
        backLabel="Tasks"
        onBack={() => router.push('/app/tasks')}
      />

      <div className="flex-1 px-6 py-6 overflow-y-auto pb-32">
        {/* Title */}
        <div className="flex items-start gap-3 mb-6">
          <StatusDot color={priorityDot as any} />
          <h1 className="text-xl font-light text-text-primary leading-tight flex-1">
            {task.title}
          </h1>
        </div>

        {/* Meta */}
        <Card className="mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-text-secondary mb-1">Due Date</p>
              <p className="text-text-primary">{task.due_date || 'No deadline'}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">Priority</p>
              <p className="text-text-primary capitalize">{task.priority}</p>
            </div>
            {task.assigned_to && task.assigned_to !== 'self' && (
              <div>
                <p className="text-xs text-text-secondary mb-1">Assigned To</p>
                <p className="text-text-primary">{task.assigned_to}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Agent Control Section */}
        {task.assigned_to && task.assigned_to !== 'self' && (
          <Card className="mb-6">
            <h3 className="text-xs text-text-secondary mb-3 uppercase tracking-wider-03">
              Autonomous Agent
            </h3>
            <AgentControl taskId={taskId} task={task} onUpdate={fetchTask} />
          </Card>
        )}

        {/* Voice Update Section */}
        <Card className="mb-6">
          <h3 className="text-xs text-text-secondary mb-3 uppercase tracking-wider-03">
            Update Task
          </h3>
          
          {!isRecording && !isTranscribing && !showConfirmation && (
            <button
              onClick={startRecording}
              className="w-full py-4 bg-gold-gradient rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-surface-0 hover:scale-105 transition-smooth"
            >
              <span className="text-xl">🎙️</span>
              <span>Tap to speak your update</span>
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              className="w-full py-4 bg-overdue-red rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-white animate-pulse"
            >
              <span className="text-xl">⏸</span>
              <span>Recording... Tap to stop</span>
            </button>
          )}

          {isTranscribing && (
            <div className="text-center py-4">
              <LoadingSpinner size="sm" />
              <p className="text-xs text-text-secondary mt-2">Processing...</p>
            </div>
          )}

          {showConfirmation && extractedIntent && (
            <div className="space-y-3">
              <div className="p-3 bg-surface-0 rounded-lg">
                <p className="text-xs text-text-secondary mb-1">You said:</p>
                <p className="text-sm text-text-primary">{transcript}</p>
              </div>
              <div className="p-3 bg-gold/10 rounded-lg">
                <p className="text-xs text-gold mb-1">Tia understood:</p>
                <p className="text-sm text-text-primary capitalize">{extractedIntent.action}</p>
                {extractedIntent.reason && (
                  <p className="text-xs text-text-secondary mt-1">{extractedIntent.reason}</p>
                )}
              </div>
              <Button onClick={confirmUpdate} className="w-full">
                ✓ Confirm Update
              </Button>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-border-1">
            <p className="text-xs text-text-secondary mb-2">Or use quick actions:</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickAction('done')}
                disabled={updating}
                className="px-3 py-2 bg-surface-0 border border-border-1 rounded-lg text-xs text-text-secondary hover:text-done-green hover:border-done-green transition-smooth disabled:opacity-50"
              >
                ✓ Done
              </button>
              <button
                onClick={() => handleQuickAction('reschedule', 2)}
                disabled={updating}
                className="px-3 py-2 bg-surface-0 border border-border-1 rounded-lg text-xs text-text-secondary hover:text-gold hover:border-gold transition-smooth disabled:opacity-50"
              >
                📅 +2 Days
              </button>
              <button
                onClick={() => handleQuickAction('cancel')}
                disabled={updating}
                className="px-3 py-2 bg-surface-0 border border-border-1 rounded-lg text-xs text-text-secondary hover:text-overdue-red hover:border-overdue-red transition-smooth disabled:opacity-50"
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </Card>

        {/* Task History */}
        {history.length > 0 && (
          <Card>
            <h3 className="text-xs text-text-secondary mb-4 uppercase tracking-wider-03">
              Task History
            </h3>
            <div className="space-y-3">
              {history.map((entry) => (
                <div key={entry.id} className="border-l-2 border-gold pl-3 pb-3">
                  <p className="text-xs text-text-secondary">
                    {formatDate(entry.changed_at)}
                  </p>
                  <p className="text-sm text-text-primary capitalize">
                    {entry.change_type}: {entry.field_changed}
                  </p>
                  {entry.reason && (
                    <p className="text-xs text-text-muted mt-1">
                      "{entry.reason}"
                    </p>
                  )}
                  <p className="text-xs text-text-muted">
                    via {entry.source}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-overdue-red/10 border border-overdue-red rounded-xl">
            <p className="text-sm text-overdue-red">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
