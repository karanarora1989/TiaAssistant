'use client';

import { useState } from 'react';
import { LoadingSpinner } from './shared';

interface UnresolvedPersonBannerProps {
  name: string;
  onResolved: () => void;
  onSkip: () => void;
}

export function UnresolvedPersonBanner({ name, onResolved, onSkip }: UnresolvedPersonBannerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ people: [{ name }] }),
      });
      if (!res.ok) throw new Error('failed');
      onResolved();
    } catch {
      setError('Could not add. Try again.');
      setLoading(false);
    }
  };

  return (
    <div className="-mt-3 px-4 py-3 bg-gold/5 border border-gold/20 border-t-0 rounded-b-2xl">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-text-secondary flex-1">
          {name} isn&apos;t in your People yet.
        </p>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleAdd}
            disabled={loading}
            className="text-xs text-gold font-medium flex items-center gap-1 disabled:opacity-50"
          >
            {loading && <LoadingSpinner size="sm" />}
            Add {name}
          </button>
          <button
            onClick={onSkip}
            className="text-xs text-text-ghost hover:text-text-muted transition-smooth"
          >
            Skip
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-overdue-red mt-1">{error}</p>}
    </div>
  );
}
