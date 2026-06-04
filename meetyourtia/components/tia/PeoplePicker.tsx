'use client';

// Generic reusable people picker bottom sheet.
// Use the 'title' prop to customise the sheet heading for different contexts.

import { useState, useEffect, useRef } from 'react';
import { Person } from '@/lib/supabase';
import { LoadingSpinner } from './shared';

interface PeoplePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (name: string) => void;
  onClear: () => void;
  currentValue?: string;
  people: Person[];
  title?: string;
}

export function PeoplePicker({
  isOpen,
  onClose,
  onSelect,
  onClear,
  currentValue,
  people,
  title = 'Select Person',
}: PeoplePickerProps) {
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setAddError('');
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = people.filter(p => {
    const q = query.toLowerCase();
    if (!q) return true;
    if (p.name.toLowerCase().includes(q)) return true;
    if (p.aliases?.some(a => a.toLowerCase().includes(q))) return true;
    return false;
  });

  const hasExactMatch = people.some(
    p => p.name.toLowerCase() === query.toLowerCase()
  );
  const showAddOption = query.trim().length > 0 && !hasExactMatch;

  const handleAddNew = async () => {
    if (!query.trim()) return;
    setAdding(true);
    setAddError('');
    try {
      const res = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ people: [{ name: query.trim() }] }),
      });
      if (!res.ok) throw new Error('failed');
      onSelect(query.trim());
    } catch {
      setAddError("Couldn't add person. Try again.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-surface-1 rounded-t-2xl p-6 flex flex-col max-h-[65vh]">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-border-1 rounded-full mx-auto mb-4 flex-shrink-0" />

        {/* Title */}
        <h3 className="text-[15px] font-medium text-text-primary tracking-tighter-01 mb-4 flex-shrink-0">
          {title}
        </h3>

        {/* Search */}
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search people..."
          className="w-full bg-surface-3 border border-border-2 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-ghost focus:border-gold focus:outline-none transition-smooth mb-3 flex-shrink-0"
        />

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length > 0 && (
            <>
              <p className="text-[10px] font-medium tracking-wider-08 text-text-ghost uppercase mb-2">
                Your People
              </p>
              {filtered.map(person => (
                <button
                  key={person.id}
                  onClick={() => onSelect(person.name)}
                  className={`w-full text-left py-3 border-b border-border-2 text-sm transition-smooth hover:text-gold ${
                    currentValue?.toLowerCase() === person.name.toLowerCase()
                      ? 'text-gold font-medium'
                      : 'text-text-primary'
                  }`}
                >
                  {person.name}
                </button>
              ))}
            </>
          )}

          {filtered.length === 0 && !showAddOption && (
            <p className="text-sm text-text-muted text-center py-6">
              No people yet. Type a name to add someone.
            </p>
          )}

          {showAddOption && (
            <button
              onClick={handleAddNew}
              disabled={adding}
              className="w-full text-left py-3 text-sm text-gold font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {adding ? <LoadingSpinner size="sm" /> : <span>+</span>}
              <span>Add &ldquo;{query.trim()}&rdquo;</span>
            </button>
          )}

          {addError && (
            <p className="text-xs text-overdue-red mt-2">{addError}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border-2 mt-3 flex-shrink-0">
          <button
            onClick={() => { onClear(); onClose(); }}
            className="text-sm text-text-muted hover:text-text-secondary transition-smooth"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="text-sm text-text-muted hover:text-text-secondary transition-smooth"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
