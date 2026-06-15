'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BottomNav } from '@/components/tia/shared';

interface ExtractedTask {
  title: string;
  context?: string;
  received_from?: string | null;
  assigned_to?: string;
  participants?: string[];
  due_date?: string;
  due_date_iso?: string;
  due_time?: string | null;
  time_sensitivity?: string;
  task_domain?: string;
  entity_type?: string | null;
  entity_name?: string | null;
  priority?: 'high' | 'medium' | 'low';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tasks?: ExtractedTask[];
  tasksSaved?: boolean;
  savingTasks?: boolean;
  saveError?: string;
  userMessageForSave?: string;
}

const SEED: ChatMessage = {
  id: 'seed',
  role: 'assistant',
  content: "Hi! What's on your plate today — type or speak.",
};

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
};

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();

  const [messages, setMessages] = useState<ChatMessage[]>([SEED]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Messaging ────────────────────────────────────────────────────────────

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    };

    setMessages(prev => [...prev, userMsg, { id: 'loading', role: 'assistant', content: '...' }]);
    setInputText('');
    setIsLoading(true);

    try {
      const history = [...messages, userMsg]
        .filter(m => m.id !== 'seed' && m.id !== 'loading')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to get response');

      const { reply, tasks } = data.data;

      setMessages(prev =>
        prev
          .filter(m => m.id !== 'loading')
          .concat({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: reply,
            tasks: tasks?.length > 0 ? tasks : undefined,
            userMessageForSave: trimmed,
          })
      );
    } catch {
      setMessages(prev =>
        prev
          .filter(m => m.id !== 'loading')
          .concat({ id: crypto.randomUUID(), role: 'assistant', content: 'Something went wrong — please try again.' })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const saveTasks = async (msgId: string, userMessage: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, savingTasks: true, saveError: undefined } : m));
    try {
      const res = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: userMessage, captureMethod: 'text' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save');
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, savingTasks: false, tasksSaved: true } : m));
    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, savingTasks: false, saveError: err.message } : m));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  // ─── Voice Recording ──────────────────────────────────────────────────────

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    } catch {
      // mic denied — silent fail, user can type
    }
  };

  const stopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setRecordingSeconds(0);
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.data?.text) {
        await sendMessage(data.data.text);
        setIsTranscribing(false);
        return;
      }
    } catch {
      // Whisper failed — try Web Speech fallback
    }
    await fallbackToWebSpeech(audioBlob);
  };

  const fallbackToWebSpeech = async (audioBlob: Blob) => {
    try {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
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

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsTranscribing(false);
        await sendMessage(transcript);
      };
      recognition.onerror = () => setIsTranscribing(false);
      recognition.onend = () => setIsTranscribing(false);

      recognition.start();
      audio.play();
    } catch {
      setIsTranscribing(false);
    }
  };

  const toggleMic = () => { isRecording ? stopRecording() : startRecording(); };

  const inputDisabled = isLoading || isRecording || isTranscribing;

  const formatSeconds = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">

      {/* Top bar */}
      <div className="px-6 py-4 border-b border-border-1 flex-shrink-0">
        <h1 className="text-[15px] font-medium text-text-primary tracking-tighter-01">Tia</h1>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-44 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

            {/* Loading dots */}
            {msg.id === 'loading' ? (
              <div className="bg-surface-1 border border-border-2 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[82%]">
                <span className="flex gap-1 items-center h-5">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-text-ghost animate-pulse"
                      style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </span>
              </div>

            ) : msg.role === 'assistant' ? (
              <div className="max-w-[85%] space-y-2">
                {/* Tia bubble */}
                <div className="bg-surface-1 border border-border-2 rounded-2xl rounded-tl-sm px-4 py-3">
                  <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* Inline task cards */}
                {msg.tasks && msg.tasks.length > 0 && !msg.tasksSaved && (
                  <div className="space-y-2 pl-1">
                    {msg.tasks.map((task, idx) => (
                      <div key={idx} className="bg-surface-2 rounded-xl p-3">
                        <div className="flex items-start gap-2">
                          <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority || 'medium']}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-primary leading-snug">{task.title}</p>
                            <p className="text-xs text-text-muted mt-0.5">
                              {[
                                task.due_date,
                                task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : null,
                                task.assigned_to && task.assigned_to !== 'self' ? `→ ${task.assigned_to}` : null,
                                task.received_from ? `from ${task.received_from}` : null,
                              ].filter(Boolean).join('  ·  ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {msg.saveError && (
                      <p className="text-xs text-red-400 pl-1">{msg.saveError}</p>
                    )}

                    <button
                      onClick={() => saveTasks(msg.id, msg.userMessageForSave || msg.content)}
                      disabled={msg.savingTasks}
                      className="w-full py-2.5 rounded-xl bg-gold text-surface-0 text-sm font-medium disabled:opacity-50 transition-smooth active:scale-95"
                    >
                      {msg.savingTasks ? 'Saving...' : `Save ${msg.tasks.length} task${msg.tasks.length === 1 ? '' : 's'}`}
                    </button>
                  </div>
                )}

                {/* Saved confirmation */}
                {msg.tasksSaved && (
                  <div className="pl-1">
                    <button
                      onClick={() => router.push('/app/tasks?view=upcoming')}
                      className="text-sm text-gold underline"
                    >
                      ✅ Saved — View in Tasks →
                    </button>
                  </div>
                )}
              </div>

            ) : (
              /* User bubble */
              <div className="bg-gold/10 border border-gold/20 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[82%]">
                <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar — fixed above BottomNav */}
      <div className="fixed bottom-[72px] left-0 right-0 bg-surface-0 border-t border-border-1 px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={inputDisabled}
            placeholder={
              isTranscribing ? 'Transcribing...'
              : isRecording ? `Recording... ${formatSeconds(recordingSeconds)}`
              : 'Message Tia...'
            }
            className="flex-1 bg-surface-3 border border-border-2 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-ghost focus:border-gold focus:outline-none transition-smooth resize-none disabled:opacity-50"
            style={{ maxHeight: '96px', overflowY: 'auto' }}
          />

          {/* Mic */}
          <button
            onClick={toggleMic}
            disabled={isLoading || isTranscribing}
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-smooth active:scale-95 disabled:opacity-40 ${
              isRecording ? 'bg-gold/20 text-gold animate-pulse' : 'bg-surface-2 text-text-muted hover:text-text-primary'
            }`}
          >
            <span className="text-lg">{isTranscribing ? '⏳' : '🎤'}</span>
          </button>

          {/* Send */}
          <button
            onClick={() => sendMessage(inputText)}
            disabled={!inputText.trim() || inputDisabled}
            className="w-10 h-10 rounded-full bg-gold flex items-center justify-center flex-shrink-0 transition-smooth active:scale-95 disabled:opacity-40"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L14 8L8 14M14 8H2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <BottomNav
        pathname={pathname}
        onNavigate={(tab) => {
          if (tab === 'tasks') router.push('/app/tasks');
          if (tab === 'people') router.push('/app/people');
        }}
      />
    </div>
  );
}
