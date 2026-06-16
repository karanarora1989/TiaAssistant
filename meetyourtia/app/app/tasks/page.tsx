'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { BottomNav, FAB, EmptyState, LoadingSpinner } from '@/components/tia/shared';
import { TaskCard } from '@/components/tia/TaskCard';
import { Task } from '@/lib/supabase';

// ── DayStrip ─────────────────────────────────────────────────

function buildDays() {
  const today = new Date();
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      dayLabel: i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
      dateNum: d.getDate(),
      iso: d.toISOString().split('T')[0],
    };
  });
}

function DayStrip({
  selectedIso,
  onSelect,
}: {
  selectedIso: string;
  onSelect: (iso: string) => void;
}) {
  const days = buildDays();
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {days.map(d => (
        <button
          key={d.iso}
          onClick={() => onSelect(d.iso)}
          className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border transition-smooth min-w-[52px] ${
            d.iso === selectedIso
              ? 'bg-[#151008] border-gold/30'
              : 'bg-surface-1 border-border-2'
          }`}
        >
          <span
            className={`text-[10px] font-medium ${
              d.iso === selectedIso ? 'text-gold' : 'text-text-ghost'
            }`}
          >
            {d.dayLabel}
          </span>
          <span
            className={`text-base font-medium ${
              d.iso === selectedIso ? 'text-gold' : 'text-text-primary'
            }`}
          >
            {d.dateNum}
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

function TasksContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedDay, setSelectedDay] = useState(todayIso());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const activeCategory = searchParams.get('category') ?? 'all';
  const activePeople = searchParams.get('people')?.split(',').filter(Boolean) ?? [];
  const filterCount =
    (activeCategory !== 'all' ? 1 : 0) + activePeople.length;

  useEffect(() => {
    fetchTasks();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/tasks?view=upcoming&status=open');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch tasks');
      setTasks(data.data?.tasks ?? []);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering
  const needsAttention = tasks.filter(t => t.needs_intervention);

  const dayTasks = tasks
    .filter(t => !t.needs_intervention)
    .filter(t => {
      if (!t.due_date_iso) return selectedDay === todayIso();
      return String(t.due_date_iso).startsWith(selectedDay);
    })
    .filter(t => activeCategory === 'all' || t.task_domain === activeCategory)
    .filter(t => activePeople.length === 0 || activePeople.includes(t.assigned_to ?? ''));

  return (
    <div className="min-h-screen bg-surface-0 pb-24">
      {/* Top bar */}
      <div className="px-6 py-4 border-b border-border-1">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[15px] font-medium text-text-primary tracking-tighter-01">
            Tasks
          </h1>
          <button
            onClick={() => router.push('/app/tasks/filters')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-smooth ${
              filterCount > 0
                ? 'bg-[#151008] border-gold/30 text-gold'
                : 'bg-surface-1 border-border-2 text-text-secondary'
            }`}
          >
            <span>⊟</span>
            <span>Filters{filterCount > 0 ? ` · ${filterCount}` : ''}</span>
          </button>
        </div>

        {/* DayStrip */}
        <DayStrip selectedIso={selectedDay} onSelect={setSelectedDay} />
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {error && (
          <div className="p-4 bg-overdue-red/10 border border-overdue-red rounded-xl">
            <p className="text-sm text-overdue-red">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Needs Attention section */}
            {needsAttention.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wider-08 text-text-ghost font-medium mb-3">
                  Needs attention
                </p>
                <div className="space-y-3">
                  {needsAttention.map(t => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onClick={() => router.push(`/app/tasks/${t.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Day tasks */}
            {dayTasks.length === 0 && needsAttention.length === 0 ? (
              <EmptyState
                icon="✓"
                title="All clear"
                description="No tasks for this day."
                action={{ label: 'Capture a task', onClick: () => router.push('/app/voice') }}
              />
            ) : dayTasks.length === 0 ? null : (
              <div>
                {needsAttention.length > 0 && (
                  <p className="text-[11px] uppercase tracking-wider-08 text-text-ghost font-medium mb-3">
                    Tasks
                  </p>
                )}
                <div className="space-y-3">
                  {dayTasks.map(t => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onClick={() => router.push(`/app/tasks/${t.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <FAB onClick={() => router.push('/app/voice')} icon="🎙" />
      <BottomNav
        pathname={pathname}
        onNavigate={tab => {
          if (tab === 'home') router.push('/app');
          if (tab === 'people') router.push('/app/people');
        }}
      />
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense>
      <TasksContent />
    </Suspense>
  );
}
