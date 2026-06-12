'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BottomNav, FAB, EmptyState, LoadingSpinner, Chip } from '@/components/tia/shared';
import { TaskCard } from '@/components/tia/TaskCard';
import { Task } from '@/lib/supabase';

export default function TasksPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [view, setView] = useState<'today' | 'upcoming'>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('view');
      if (p === 'upcoming') return 'upcoming';
    }
    return 'today';
  });
  const [domain, setDomain] = useState<'all' | 'work' | 'personal'>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasks();
  }, [view, domain]);

  const fetchTasks = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        view,
        status: 'open',
      });

      if (domain !== 'all') {
        params.append('domain', domain);
      }

      const response = await fetch(`/api/tasks?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tasks');
      }

      setTasks(data.data.tasks || []);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-0 pb-24">
      {/* Top Bar */}
      <div className="px-6 py-4 border-b border-border-1">
        <h1 className="text-[15px] font-medium text-text-primary tracking-tighter-01 mb-4">
          Tasks
        </h1>

        {/* View Tabs */}
        <div className="flex gap-2 mb-3">
          <Chip
            selected={view === 'today'}
            onClick={() => setView('today')}
          >
            Today
          </Chip>
          <Chip
            selected={view === 'upcoming'}
            onClick={() => setView('upcoming')}
          >
            Next 5 days
          </Chip>
        </div>

        {/* Domain Filter */}
        <div className="flex gap-2">
          <Chip
            selected={domain === 'all'}
            onClick={() => setDomain('all')}
          >
            All
          </Chip>
          <Chip
            selected={domain === 'work'}
            onClick={() => setDomain('work')}
          >
            Work
          </Chip>
          <Chip
            selected={domain === 'personal'}
            onClick={() => setDomain('personal')}
          >
            Personal
          </Chip>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {error && (
          <div className="p-4 bg-overdue-red/10 border border-overdue-red rounded-xl mb-4">
            <p className="text-sm text-overdue-red">{error}</p>
          </div>
        )}

        {!loading && !error && tasks.length === 0 && (
          <EmptyState
            icon="✓"
            title={view === 'today' ? 'All clear for today!' : 'Nothing coming up'}
            description={view === 'today' 
              ? 'You have no tasks due today. Great work!' 
              : 'No tasks in the next 5 days.'}
            action={{
              label: 'Capture a task',
              onClick: () => router.push('/app/voice'),
            }}
          />
        )}

        {!loading && !error && tasks.length > 0 && (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => router.push(`/app/tasks/${task.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB - Voice Capture */}
      <FAB onClick={() => router.push('/app/voice')} icon="🎙" />

      {/* Bottom Navigation */}
      <BottomNav
        pathname={pathname}
        onNavigate={(tab) => {
          if (tab === 'home') router.push('/app');
          if (tab === 'people') router.push('/app/people');
        }}
      />
    </div>
  );
}
