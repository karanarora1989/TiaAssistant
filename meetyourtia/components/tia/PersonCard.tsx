'use client';

import { useState } from 'react';
import { Person } from '@/lib/supabase';
import { Card, LoadingSpinner } from './shared';

interface PersonCardProps {
  person: Person;
  onUpdate: () => void;
}

export function PersonCard({ person, onUpdate }: PersonCardProps) {
  const [loading, setLoading] = useState(false);
  const [agentEnabled, setAgentEnabled] = useState(person.agent_enabled || false);

  const handleToggleAgent = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/people/${person.id}/agent`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_enabled: !agentEnabled,
          agent_call: true,
          agent_remind: true,
          agent_followup: true,
        }),
      });

      if (response.ok) {
        setAgentEnabled(!agentEnabled);
        onUpdate();
      }
    } catch (err: any) {
      console.error('Failed to toggle agent:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card shimmer>
      <div className="space-y-3">
        {/* Person Info */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-medium text-text-primary">
                {person.name}
              </h3>
              {agentEnabled && (
                <span className="text-[10px] px-1.5 py-0.5 bg-gold/10 border border-gold/30 rounded text-gold">
                  🤖 Agent
                </span>
              )}
            </div>
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

        {/* Agent Toggle */}
        <div className="pt-3 border-t border-border-2 flex items-center justify-between">
          <span className="text-xs text-text-secondary">🤖 Agent</span>
          <button
            onClick={handleToggleAgent}
            disabled={loading}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              agentEnabled ? 'bg-gold' : 'bg-surface-2 border border-border-1'
            } ${loading ? 'opacity-50' : ''}`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                agentEnabled ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </Card>
  );
}
