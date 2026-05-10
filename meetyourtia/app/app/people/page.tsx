'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav, FAB, EmptyState, LoadingSpinner, Card } from '@/components/tia/shared';

interface Person {
  id: string;
  name: string;
  role: string | null;
  sensitivity: string;
  task_count: number;
  open_task_count: number;
  last_mentioned: string;
}

export default function PeoplePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'home' | 'tasks' | 'people'>('people');
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPeople();
  }, []);

  const fetchPeople = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/people');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch people');
      }

      setPeople(data.data.people || []);
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
        <h1 className="text-[15px] font-medium text-text-primary tracking-tighter-01">
          People
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Everyone you've mentioned in tasks
        </p>
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

        {!loading && !error && people.length === 0 && (
          <EmptyState
            icon="👥"
            title="No people yet"
            description="As you capture tasks and mention people, they'll appear here."
            action={{
              label: 'Capture a task',
              onClick: () => router.push('/app/voice'),
            }}
          />
        )}

        {!loading && !error && people.length > 0 && (
          <div className="space-y-3">
            {people.map((person) => (
              <Card key={person.id} shimmer>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-text-primary mb-1">
                      {person.name}
                    </h3>
                    {person.role && (
                      <p className="text-xs text-text-secondary mb-2">
                        {person.role}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <span>{person.open_task_count} open task{person.open_task_count !== 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span>{person.task_count} total</span>
                    </div>
                  </div>
                  
                  {person.sensitivity !== 'normal' && (
                    <div className="px-2 py-1 bg-gold/10 border border-gold/30 rounded-lg">
                      <p className="text-[10px] text-gold uppercase tracking-wider-08">
                        {person.sensitivity}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* FAB - Voice Capture */}
      <FAB onClick={() => router.push('/app/voice')} icon="🎙" />

      {/* Bottom Navigation */}
      <BottomNav
        active={activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
          if (tab === 'home') router.push('/app');
          if (tab === 'tasks') router.push('/app/tasks');
        }}
      />
    </div>
  );
}
