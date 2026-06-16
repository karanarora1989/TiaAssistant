'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';

function FiltersContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useUser();

  const [category, setCategory] = useState(params.get('category') ?? 'all');
  const [selectedPeople, setSelectedPeople] = useState<string[]>(
    params.get('people')?.split(',').filter(Boolean) ?? []
  );
  const [people, setPeople] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('people')
      .select('name')
      .eq('user_id', user.id)
      .order('name')
      .then(({ data }) => setPeople(data?.map(p => p.name) ?? []));
  }, [user]);

  const togglePerson = (name: string) =>
    setSelectedPeople(prev =>
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );

  const activeCount = (category !== 'all' ? 1 : 0) + selectedPeople.length;

  const handleApply = () => {
    const p = new URLSearchParams();
    if (category !== 'all') p.set('category', category);
    if (selectedPeople.length) p.set('people', selectedPeople.join(','));
    router.push(`/app/tasks?${p.toString()}`);
  };

  const handleClearAll = () => {
    setCategory('all');
    setSelectedPeople([]);
  };

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-1">
        <button onClick={() => router.back()} className="text-sm text-text-secondary">
          Cancel
        </button>
        <span className="text-[13px] font-medium text-text-primary">Filters</span>
        <button onClick={handleClearAll} className="text-sm text-gold">
          Clear all
        </button>
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto pb-28">
        {/* Category */}
        <div>
          <p className="text-[11px] uppercase tracking-wider-08 text-text-ghost font-medium mb-3">
            Category
          </p>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'work', 'personal'] as const).map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-smooth ${
                  category === c
                    ? 'bg-[#151008] text-gold border-gold/30'
                    : 'bg-surface-1 text-text-muted border-border-2'
                }`}
              >
                {c === 'all' ? 'All' : c === 'work' ? 'Work' : 'Personal'}
              </button>
            ))}
          </div>
        </div>

        {/* Person */}
        <div>
          <p className="text-[11px] uppercase tracking-wider-08 text-text-ghost font-medium mb-3">
            Person
          </p>
          {people.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              {people.map(name => (
                <button
                  key={name}
                  onClick={() => togglePerson(name)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-smooth ${
                    selectedPeople.includes(name)
                      ? 'bg-[#151008] text-gold border-gold/30'
                      : 'bg-surface-1 text-text-muted border-border-2'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-ghost">
              People appear here as you add delegated tasks
            </p>
          )}
        </div>

        {/* Extensible placeholder */}
        <div className="border border-dashed border-border-2 rounded-xl p-4 text-center">
          <p className="text-xs text-text-ghost">More filters coming soon</p>
          <p className="text-[10px] text-text-ghost mt-1">Priority · Status · Due date range</p>
        </div>
      </div>

      {/* Apply button */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border-1 bg-surface-0 px-4 pt-3 pb-8">
        <button
          onClick={handleApply}
          className="w-full py-3 bg-gold-gradient rounded-2xl text-sm font-medium text-surface-0"
        >
          {activeCount > 0
            ? `Show tasks · ${activeCount} filter${activeCount > 1 ? 's' : ''} active`
            : 'Show all tasks'}
        </button>
      </div>
    </div>
  );
}

export default function FiltersPage() {
  return (
    <Suspense>
      <FiltersContent />
    </Suspense>
  );
}
