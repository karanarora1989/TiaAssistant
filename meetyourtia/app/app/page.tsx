'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { BottomNav, FAB } from '@/components/tia/shared';
import { TaskCard } from '@/components/tia/TaskCard';
import { Task } from '@/lib/supabase';

// ── Helpers ───────────────────────────────────────────────────

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getLongDate() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}

// ── Section label ─────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-wider-08 text-text-ghost font-medium mb-3">
      {children}
    </p>
  );
}

// ── Skeleton ──────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-5 w-48 rounded-xl bg-surface-2 animate-pulse" />
        <div className="h-3.5 w-32 rounded-xl bg-surface-2 animate-pulse" />
      </div>
      <div className="flex gap-2">
        <div className="h-7 w-24 rounded-full bg-surface-2 animate-pulse" />
        <div className="h-7 w-24 rounded-full bg-surface-2 animate-pulse" />
      </div>
      <div className="space-y-3">
        <div className="h-14 w-full rounded-2xl bg-surface-2 animate-pulse" />
        <div className="h-14 w-full rounded-2xl bg-surface-2 animate-pulse" />
        <div className="h-14 w-full rounded-2xl bg-surface-2 animate-pulse" />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────

export default function HomeDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/tasks?view=upcoming&status=open');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch tasks');
      setTasks(data.data?.tasks ?? []);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Derived values
  const today = todayIso();
  const firstName = user?.firstName || user?.fullName?.split(' ')[0] || '';

  const interventionTasks = tasks.filter(t => t.needs_intervention);

  const allTodayTasks = tasks.filter(
    t => !t.needs_intervention && t.due_date_iso?.startsWith(today)
  );
  const todayTasks = allTodayTasks.slice(0, 3);
  const totalTodayCount = allTodayTasks.length;

  const todayChipCount = allTodayTasks.length;
  const overdueCount = tasks.filter(
    t => !t.needs_intervention && t.due_date_iso && t.due_date_iso < today
  ).length;

  const showStats = todayChipCount > 0 || overdueCount > 0;

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">

      {/* Top bar */}
      <div className="px-6 py-4 border-b border-border-1 flex-shrink-0">
        <h1 className="text-[15px] font-medium text-text-primary tracking-tighter-01">Tia</h1>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-[88px] space-y-6">

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Greeting */}
            <div>
              <h2 className="text-[22px] font-light tracking-tighter-02 text-text-primary leading-tight">
                {getGreeting()}{firstName ? `, ${firstName}` : ''}
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">{getLongDate()}</p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-overdue-red/10 border border-overdue-red rounded-xl">
                <p className="text-sm text-overdue-red">
                  Couldn't load your dashboard. Check your connection and try again.
                </p>
                <button
                  onClick={fetchTasks}
                  className="text-sm text-overdue-red underline mt-2"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Stats bar */}
            {!error && showStats && (
              <div className="flex gap-2 flex-wrap">
                {todayChipCount > 0 && (
                  <button
                    onClick={() => router.push('/app/tasks')}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-surface-1 border border-border-2 text-text-secondary"
                  >
                    {todayChipCount} {todayChipCount === 1 ? 'task' : 'tasks'} today
                  </button>
                )}
                {overdueCount > 0 && (
                  <button
                    onClick={() => router.push('/app/tasks')}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-overdue-red/10 border border-overdue-red/30 text-overdue-red"
                  >
                    {overdueCount} overdue
                  </button>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div>
              <SectionLabel>Quick Actions</SectionLabel>
              <div className="space-y-3">
                {[
                  { icon: '✏', label: 'Create Task', action: () => setSheetOpen(true) },
                  { icon: '✓', label: 'View Tasks', action: () => router.push('/app/tasks') },
                  { icon: '👥', label: 'My People', action: () => router.push('/app/people') },
                ].map(item => (
                  <div
                    key={item.label}
                    onClick={item.action}
                    className="bg-surface-1 border border-border-2 rounded-2xl p-4
                               flex items-center justify-between cursor-pointer
                               active:scale-[0.98] transition-smooth"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">{item.icon}</span>
                      <span className="text-sm font-medium text-text-primary">{item.label}</span>
                    </div>
                    <span className="text-text-ghost text-xs">›</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Needs Attention */}
            {!error && interventionTasks.length > 0 && (
              <div>
                <SectionLabel>Needs Attention</SectionLabel>
                <div className="space-y-3">
                  {interventionTasks.map(t => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onClick={() => router.push(`/app/tasks/${t.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Today's Tasks */}
            {!error && todayTasks.length > 0 && (
              <div>
                <SectionLabel>Today's Tasks</SectionLabel>
                <div className="space-y-3">
                  {todayTasks.map(t => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onClick={() => router.push(`/app/tasks/${t.id}`)}
                    />
                  ))}
                </div>
                {totalTodayCount > 3 && (
                  <button
                    onClick={() => router.push('/app/tasks')}
                    className="text-xs text-gold mt-3"
                  >
                    See all {totalTodayCount} tasks →
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Capture Bottom Sheet */}
      {sheetOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={() => setSheetOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-surface-0 rounded-t-[24px]
                          border-t border-border-1 px-4 pt-3 pb-8 z-50
                          animate-in slide-in-from-bottom duration-300">
            <div className="w-10 h-1 rounded-full bg-border-2 mx-auto mb-5" />
            <p className="text-[11px] uppercase tracking-wider-08 text-text-ghost font-medium mb-4">
              Capture
            </p>
            <div className="space-y-3">
              <div
                onClick={() => { setSheetOpen(false); router.push('/app/voice'); }}
                className="bg-surface-1 border border-border-2 rounded-2xl p-4
                           flex items-center gap-3 cursor-pointer
                           active:scale-[0.98] transition-smooth"
              >
                <span className="text-2xl">🎙</span>
                <div>
                  <p className="text-sm font-medium text-text-primary">Voice</p>
                  <p className="text-xs text-text-secondary mt-0.5">Speak tasks, Tia listens</p>
                </div>
              </div>
              <div
                onClick={() => { setSheetOpen(false); router.push('/app/chat'); }}
                className="bg-surface-1 border border-border-2 rounded-2xl p-4
                           flex items-center gap-3 cursor-pointer
                           active:scale-[0.98] transition-smooth"
              >
                <span className="text-2xl">💬</span>
                <div>
                  <p className="text-sm font-medium text-text-primary">Chat</p>
                  <p className="text-xs text-text-secondary mt-0.5">Type or chat, Tia extracts</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSheetOpen(false)}
              className="w-full py-3 mt-3 rounded-2xl bg-surface-2 border border-border-2
                         text-sm text-text-secondary active:scale-[0.98] transition-smooth"
            >
              Cancel
            </button>
          </div>
        </>
      )}

      <FAB onClick={() => setSheetOpen(true)} icon="+" />

      <BottomNav
        pathname={pathname}
        onNavigate={tab => {
          if (tab === 'tasks') router.push('/app/tasks');
          if (tab === 'people') router.push('/app/people');
        }}
      />
    </div>
  );
}
