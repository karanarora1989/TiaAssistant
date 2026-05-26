'use client';

import { useState } from 'react';
import { Person } from '@/lib/supabase';
import { Card, LoadingSpinner } from './shared';

interface PersonCardProps {
  person: Person;
  onUpdate: () => void;
}

export function PersonCard({ person, onUpdate }: PersonCardProps) {
  const [showAgentControls, setShowAgentControls] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agentEnabled, setAgentEnabled] = useState(person.agent_enabled || false);
  const [agentCall, setAgentCall] = useState(person.agent_call ?? true);
  const [agentRemind, setAgentRemind] = useState(person.agent_remind ?? true);
  const [agentFollowup, setAgentFollowup] = useState(person.agent_followup ?? true);

  const handleToggleAgent = async (enabled: boolean) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/people/${person.id}/agent`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_enabled: enabled,
          agent_call: agentCall,
          agent_remind: agentRemind,
          agent_followup: agentFollowup,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update agent settings');
      }

      setAgentEnabled(enabled);
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    if (!agentEnabled) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/people/${person.id}/agent`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_enabled: true,
          agent_call: agentCall,
          agent_remind: agentRemind,
          agent_followup: agentFollowup,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update agent settings');
      }

      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
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
          
          <div className="flex flex-col items-end gap-2">
            {person.sensitivity !== 'normal' && (
              <div className="px-2 py-1 bg-gold/10 border border-gold/30 rounded-lg">
                <p className="text-[10px] text-gold uppercase tracking-wider-08">
                  {person.sensitivity}
                </p>
              </div>
            )}
            <button
              onClick={() => setShowAgentControls(!showAgentControls)}
              className="text-xs text-text-secondary hover:text-gold transition-smooth"
            >
              {showAgentControls ? '▲ Hide' : '▼ Agent'}
            </button>
          </div>
        </div>

        {/* Agent Controls */}
        {showAgentControls && (
          <div className="pt-3 border-t border-border-1 space-y-3">
            {/* Main Toggle */}
            <div className="flex items-center justify-between p-3 bg-surface-0 rounded-lg border border-border-1">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">🤖</span>
                  <h4 className="text-xs font-medium text-text-primary">
                    Enable Agent
                  </h4>
                </div>
                <p className="text-[10px] text-text-secondary">
                  Auto-follow up on all tasks for {person.name}
                </p>
              </div>
              <button
                onClick={() => handleToggleAgent(!agentEnabled)}
                disabled={loading}
                className={`relative w-10 h-5 rounded-full transition-smooth ${
                  agentEnabled ? 'bg-gold' : 'bg-border-2'
                } ${loading ? 'opacity-50' : ''}`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-smooth ${
                    agentEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Granular Controls */}
            {agentEnabled && (
              <div className="space-y-2 p-3 bg-gold/5 rounded-lg border border-gold/20">
                <p className="text-[10px] text-text-secondary uppercase tracking-wider-03 mb-2">
                  Agent Capabilities
                </p>

                {/* Call */}
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📞</span>
                    <p className="text-xs text-text-primary">Phone Calls</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={agentCall}
                    onChange={(e) => setAgentCall(e.target.checked)}
                    className="w-3.5 h-3.5 accent-gold"
                  />
                </label>

                {/* Remind */}
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">⏰</span>
                    <p className="text-xs text-text-primary">Reminders</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={agentRemind}
                    onChange={(e) => setAgentRemind(e.target.checked)}
                    className="w-3.5 h-3.5 accent-gold"
                  />
                </label>

                {/* Follow-up */}
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🔄</span>
                    <p className="text-xs text-text-primary">Follow-ups</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={agentFollowup}
                    onChange={(e) => setAgentFollowup(e.target.checked)}
                    className="w-3.5 h-3.5 accent-gold"
                  />
                </label>

                {/* Update Button */}
                <button
                  onClick={handleUpdateSettings}
                  disabled={loading}
                  className="w-full mt-2 py-1.5 bg-gold-gradient rounded-lg text-[10px] font-medium text-surface-0 hover:scale-105 transition-smooth disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <LoadingSpinner size="sm" /> : '✓ Update Settings'}
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-2 bg-overdue-red/10 border border-overdue-red rounded-lg">
                <p className="text-[10px] text-overdue-red">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
