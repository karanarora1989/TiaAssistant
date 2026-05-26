'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav, FAB, EmptyState, LoadingSpinner } from '@/components/tia/shared';
import { PersonCard } from '@/components/tia/PersonCard';
import { Person } from '@/lib/supabase';

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[15px] font-medium text-text-primary tracking-tighter-01">
              People
            </h1>
            <p className="text-xs text-text-secondary mt-1">
              Everyone you've mentioned in tasks
            </p>
          </div>
          <button
            onClick={() => router.push('/app/people/import')}
            className="px-3 py-1.5 bg-gold-gradient rounded-lg text-xs font-medium text-surface-0 hover:scale-105 transition-smooth flex items-center gap-1"
          >
            <span>📇</span>
            <span>Import</span>
          </button>
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
              <PersonCard 
                key={person.id} 
                person={person} 
                onUpdate={fetchPeople}
              />
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
