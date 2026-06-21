'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Task } from '@/lib/supabase';
import { LoadingSpinner } from './shared';

interface AgentControlProps {
  taskId: string;
  task: Task;
  onUpdate: () => void;
}

type AgentState = 'disabled' | 'enabled_no_calls' | 'enabled_active' | 'needs_intervention';

function deriveState(task: Task): AgentState {
  if (!task.agent_enabled) return 'disabled';
  if (task.needs_intervention) return 'needs_intervention';
  if ((task.followup_count ?? 0) === 0) return 'enabled_no_calls';
  return 'enabled_active';
}

const OUTCOME_BADGE: Record<string, { label: string; cls: string }> = {
  confirmed_done:           { label: '✓ Confirmed done',        cls: 'bg-done-green/10 text-done-green border-done-green/20' },
  on_track:                { label: '✓ On track',              cls: 'bg-done-green/10 text-done-green border-done-green/20' },
  committed_new_eta:       { label: '🕐 New deadline',          cls: 'bg-gold/10 text-gold border-gold/20' },
  partial_progress:        { label: '↗ In progress',            cls: 'bg-work-blue/10 text-work-blue-text border-work-blue/20' },
  partial_progress_no_eta: { label: '↗ Partial — ETA needed',  cls: 'bg-gold/10 text-gold border-gold/20' },
  behind_no_commitment:    { label: '⏳ Behind',                cls: 'bg-overdue-red/10 text-overdue-red border-overdue-red/20' },
  no_commitment:           { label: '○ No update',              cls: 'bg-surface-2 text-text-muted border-border-2' },
  blocked_external:        { label: '🚫 Blocked',               cls: 'bg-overdue-red/10 text-overdue-red border-overdue-red/20' },
  blocked_cannot_complete: { label: "🙅 Can't complete",        cls: 'bg-overdue-red/10 text-overdue-red border-overdue-red/20' },
  no_answer:               { label: '📵 No answer — retrying',  cls: 'bg-surface-2 text-text-muted border-border-2' },
  no_answer_terminal:      { label: '📵 Unreachable',           cls: 'bg-overdue-red/10 text-overdue-red border-overdue-red/20' },
};

function OutcomeBadge({ state }: { state: string }) {
  const b = OUTCOME_BADGE[state] ?? { label: state, cls: 'bg-surface-2 text-text-muted border-border-2' };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${b.cls}`}>
      {b.label}
    </span>
  );
}

function formatDatetime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const dayLabel = isToday
    ? 'Today'
    : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return `${dayLabel} · ${time}`;
}

export function AgentControl({ taskId, task, onUpdate }: AgentControlProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [callWarning, setCallWarning] = useState('');

  const agentState = deriveState(task);
  const statusDetails = task.status_details as any;
  const lastOutcomeState: string | undefined = statusDetails?.outcome_state;
  const lastUpdateMessage: string | undefined = statusDetails?.last_update_message;
  const isOpen = agentState !== 'disabled';

  const handleToggle = async () => {
    if (agentState === 'needs_intervention') return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/tasks/${taskId}/agent`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_enabled: !task.agent_enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      setCallWarning(data.data?.call_reason || '');
      onUpdate();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/tasks/${taskId}/resolve-intervention`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to resolve intervention');
      }
      onUpdate();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-0">
      {/* Toggle row */}
      <div
        className={`flex items-center justify-between p-4 bg-surface-1 border border-border-2 ${
          isOpen ? 'rounded-t-2xl border-b-0' : 'rounded-2xl'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <div>
            <p
              className={`text-sm font-medium ${
                agentState === 'needs_intervention' ? 'text-text-secondary' : 'text-text-primary'
              }`}
            >
              Let Tia follow up
            </p>
            {agentState === 'disabled' && (
              <p className="text-xs text-text-secondary">
                {task.assigned_to === 'self'
                  ? 'Tia will call you to remind you about this.'
                  : `Tia will call ${task.assigned_to} and track this until it's done.`}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading || agentState === 'needs_intervention'}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            task.agent_enabled ? 'bg-gold' : 'bg-border-2'
          } ${agentState === 'needs_intervention' ? 'opacity-40' : ''} ${
            loading ? 'opacity-50' : ''
          }`}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              task.agent_enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Status body */}
      {agentState === 'enabled_no_calls' && (
        <div className="p-4 bg-surface-1 border border-border-2 border-t-0 rounded-b-2xl space-y-0.5">
          <p className="text-xs text-text-secondary">⏳ First call scheduled</p>
          {task.call_scheduled_at && (
            <p className="text-sm font-medium text-text-primary">
              {formatDatetime(task.call_scheduled_at)}
            </p>
          )}
        </div>
      )}

      {agentState === 'enabled_active' && (
        <div className="p-4 bg-surface-1 border border-border-2 border-t-0 rounded-b-2xl space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {lastOutcomeState && <OutcomeBadge state={lastOutcomeState} />}
            {task.last_followup_at && (
              <span className="text-[10px] text-text-ghost">
                {new Date(task.last_followup_at).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            )}
          </div>
          {lastUpdateMessage && (
            <p className="text-xs text-text-secondary italic">"{lastUpdateMessage}"</p>
          )}
          {(task as any).next_followup_at && (
            <p className="text-xs text-text-secondary">
              Next check-in:{' '}
              <span className="font-medium text-text-primary">
                {formatDatetime((task as any).next_followup_at)}
              </span>
            </p>
          )}
          <button
            onClick={() => router.push(`/app/tasks/${taskId}`)}
            className="text-xs text-gold underline"
          >
            View history ({task.followup_count ?? 0} follow-up
            {(task.followup_count ?? 0) !== 1 ? 's' : ''}) →
          </button>
        </div>
      )}

      {agentState === 'needs_intervention' && (
        <div className="p-4 bg-surface-1 border border-border-2 border-t-0 rounded-b-2xl space-y-2">
          <div className="bg-gold/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span>⚠️</span>
            <span className="text-xs font-medium text-gold">Needs your attention</span>
          </div>
          {lastOutcomeState && <OutcomeBadge state={lastOutcomeState} />}
          {task.blocked_by && (
            <p className="text-xs text-text-secondary">{task.blocked_by}</p>
          )}
          {(task.followup_count ?? 0) > 0 && (
            <p className="text-xs text-text-ghost">
              Tia followed up {task.followup_count} time{task.followup_count !== 1 ? 's' : ''}.
            </p>
          )}
          {lastUpdateMessage && (
            <p className="text-xs text-text-secondary italic">"{lastUpdateMessage}"</p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleResolve}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-lg border border-border-2 text-text-secondary disabled:opacity-50 flex items-center gap-1"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Mark resolved'}
            </button>
            <button
              onClick={() => router.push(`/app/tasks/${taskId}`)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gold text-gold"
            >
              View task →
            </button>
          </div>
        </div>
      )}

      {task.agent_enabled && callWarning && (
        <p className="text-xs text-overdue-red px-1 pt-2">⚠️ {callWarning}</p>
      )}
      {error && <p className="text-xs text-overdue-red px-1 pt-1">{error}</p>}
    </div>
  );
}
