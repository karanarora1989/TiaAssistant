'use client';

import { useState } from 'react';
import { Person } from '@/lib/supabase';
import { Button, Input, LoadingSpinner } from './shared';

interface PersonEditSheetProps {
  person?: Person;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function PersonEditSheet({ person, open, onClose, onSaved }: PersonEditSheetProps) {
  const isEdit = !!person;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState(person?.phone_number ?? '');
  const [role, setRole] = useState(person?.role ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        const res = await fetch(`/api/people/${person!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: phone.trim(), role: role.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Save failed');
      } else {
        if (!name.trim()) { setError('Name is required'); setSaving(false); return; }
        const res = await fetch('/api/people', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ people: [{ name: name.trim(), phone: phone.trim(), role: role.trim() }] }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Save failed');
      }
      onSaved();
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setError('');
    setDeleting(true);
    try {
      const res = await fetch(`/api/people/${person!.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      onSaved();
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Scrim */}
      <div className="fixed inset-0 bg-black/40 z-[59]" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-surface-1 rounded-t-2xl px-6 pt-5 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-medium text-text-primary">
            {isEdit ? 'Edit Contact' : 'Add Contact'}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {isEdit ? (
            <div>
              <p className="text-xs text-text-secondary mb-1">Name</p>
              <p className="text-sm font-medium text-text-primary">{person!.name}</p>
            </div>
          ) : (
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Raj Kumar"
              autoFocus
            />
          )}

          <Input
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
          />

          <Input
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Manager, Friend"
          />

          {error && <p className="text-xs text-overdue-red">{error}</p>}

          <Button
            onClick={handleSave}
            disabled={saving || deleting || (!isEdit && !name.trim())}
            className="w-full flex items-center justify-center gap-2"
          >
            {saving
              ? <><LoadingSpinner size="sm" /><span>Saving...</span></>
              : isEdit ? 'Save Changes' : 'Add Contact'}
          </Button>

          {isEdit && (
            <div className="pt-1">
              {deleteConfirm ? (
                <div className="space-y-2">
                  <p className="text-xs text-text-secondary text-center">
                    Are you sure? This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="flex-1 text-xs py-2 rounded-lg border border-border-2 text-text-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 text-xs py-2 rounded-lg border border-overdue-red text-overdue-red disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {deleting ? <LoadingSpinner size="sm" /> : 'Confirm delete'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="w-full text-xs text-overdue-red py-2 disabled:opacity-40"
                >
                  Delete contact
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
