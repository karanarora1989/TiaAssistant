'use client';

import { useState } from 'react';
import { Task } from '@/lib/supabase';
import { LoadingSpinner } from './shared';

interface AgentControlProps {
  taskId: string;
  task: Task;
  onUpdate: () => void;
}

export function AgentControl({ taskId, task, onUpdate }: AgentControlProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agentEnabled, setAgentEnabled] = useState(task.agent_enabled || false);
  const [agentCall, setAgentCall] = useState(task.agent_call ?? true);
  const [agentRemind, setAgentRemind] = useState(task.agent_remind ?? true);
  const [agentFollowup, setAgentFollowup] = useState(task.agent_followup ?? true);

  const handleToggleAgent = async (enabled: boolean) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/tasks/${taskId}/agent`, {
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
      const response = await fetch(`/api/tasks/${taskId}/agent`, {
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
    <div className="space-y-4">
      {/* Main Toggle */}
      <div className="flex items-center justify-between p-4 bg-surface-0 rounded-xl border border-border-1">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🤖</span>
            <h4 className="text-sm font-medium text-text-primary">
              Enable Agent
            </h4>
          </div>
          <p className="text-xs text-text-secondary">
            Tia will autonomously follow up with {task.assigned_to}
          </p>
        </div>
        <button
          onClick={() => handleToggleAgent(!agentEnabled)}
          disabled={loading}
          className={`relative w-12 h-6 rounded-full transition-smooth ${
            agentEnabled ? 'bg-gold' : 'bg-border-2'
          } ${loading ? 'opacity-50' : ''}`}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-smooth ${
              agentEnabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Granular Controls */}
      {agentEnabled && (
        <div className="space-y-3 p-4 bg-gold/5 rounded-xl border border-gold/20">
          <p className="text-xs text-text-secondary uppercase tracking-wider-03 mb-2">
            Agent Capabilities
          </p>

          {/* Call */}
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="text-base">📞</span>
              <div>
                <p className="text-sm text-text-primary">Phone Calls</p>
                <p className="text-xs text-text-secondary">Make follow-up calls</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={agentCall}
              onChange={(e) => setAgentCall(e.target.checked)}
              className="w-4 h-4 accent-gold"
            />
          </label>

          {/* Remind */}
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="text-base">⏰</span>
              <div>
                <p className="text-sm text-text-primary">Reminders</p>
                <p className="text-xs text-text-secondary">Send reminder messages</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={agentRemind}
              onChange={(e) => setAgentRemind(e.target.checked)}
              className="w-4 h-4 accent-gold"
            />
          </label>

          {/* Follow-up */}
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="text-base">🔄</span>
              <div>
                <p className="text-sm text-text-primary">Follow-ups</p>
                <p className="text-xs text-text-secondary">Check progress regularly</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={agentFollowup}
              onChange={(e) => setAgentFollowup(e.target.checked)}
              className="w-4 h-4 accent-gold"
            />
          </label>

          {/* Update Button */}
          <button
            onClick={handleUpdateSettings}
            disabled={loading}
            className="w-full mt-3 py-2 bg-gold-gradient rounded-lg text-xs font-medium text-surface-0 hover:scale-105 transition-smooth disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <LoadingSpinner size="sm" /> : '✓ Update Settings'}
          </button>
        </div>
      )}

      {/* Agent Status */}
      {agentEnabled && (
        <div className="p-3 bg-done-green/10 border border-done-green/30 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm">✓</span>
            <p className="text-xs text-done-green">
              Agent is active and will follow up with {task.assigned_to}
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-overdue-red/10 border border-overdue-red rounded-lg">
          <p className="text-xs text-overdue-red">{error}</p>
        </div>
      )}
    </div>
  );
}
