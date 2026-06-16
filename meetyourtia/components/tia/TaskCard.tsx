'use client';

import { useState } from 'react';
import { Task } from '@/lib/supabase';
import { StatusDot } from './shared';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

const OUTCOME_BADGE: Record<string, { label: string; cls: string }> = {
  on_track:                { label: '✓ On track',              cls: 'bg-done-green/10 text-done-green border-done-green/20' },
  committed_new_eta:       { label: '🕐 New deadline',          cls: 'bg-gold/10 text-gold border-gold/20' },
  partial_progress:        { label: '↗ In progress',            cls: 'bg-work-blue/10 text-work-blue-text border-work-blue/20' },
  partial_progress_no_eta: { label: '↗ Partial — ETA needed',  cls: 'bg-gold/10 text-gold border-gold/20' },
  behind_no_commitment:    { label: '⏳ Behind',                cls: 'bg-overdue-red/10 text-overdue-red border-overdue-red/20' },
  no_commitment:           { label: '○ No update',              cls: 'bg-surface-2 text-text-muted border-border-2' },
  blocked_external:        { label: '🚫 Blocked',               cls: 'bg-overdue-red/10 text-overdue-red border-overdue-red/20' },
  blocked_cannot_complete: { label: "🙅 Can't complete",        cls: 'bg-overdue-red/10 text-overdue-red border-overdue-red/20' },
  no_answer:               { label: '📵 Retrying',              cls: 'bg-surface-2 text-text-muted border-border-2' },
  no_answer_terminal:      { label: '📵 Unreachable',           cls: 'bg-overdue-red/10 text-overdue-red border-overdue-red/20' },
};

function OutcomeBadge({ state }: { state: string }) {
  const b = OUTCOME_BADGE[state];
  if (!b) return null;
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${b.cls}`}>
      {b.label}
    </span>
  );
}

function formatNextCheckin(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return `Today · ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function EscalationCard({ task, onClick }: { task: Task; onClick?: () => void }) {
  const statusDetails = task.status_details as any;
  const lastUpdateMessage: string | undefined = statusDetails?.last_update_message;
  const outcomeState: string | undefined = statusDetails?.outcome_state;

  const stateLabel =
    outcomeState === 'blocked_external'
      ? '🚫 Blocked'
      : outcomeState === 'blocked_cannot_complete'
      ? "🙅 Can't complete"
      : '📵 Unreachable';

  const priorityDot =
    task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'gold' : 'green';

  return (
    <div
      onClick={onClick}
      className="bg-surface-1 border border-overdue-red/40 border-l-2 border-l-overdue-red rounded-2xl p-4 cursor-pointer"
    >
      <div className="bg-gold/10 rounded-lg px-3 py-1.5 mb-3 flex items-center gap-2">
        <span className="text-sm">⚠️</span>
        <span className="text-xs font-medium text-gold">Needs your attention</span>
      </div>
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="text-sm font-normal text-text-primary leading-snug flex-1">{task.title}</h3>
        <StatusDot color={priorityDot as any} size="sm" />
      </div>
      {task.assigned_to && task.assigned_to !== 'self' && (
        <p className="text-xs text-text-secondary mb-3">
          {task.assigned_to}
          {task.due_date ? ` · ${task.due_date}` : ''}
        </p>
      )}
      <div className="border-t border-border-2 pt-3 space-y-1">
        <p className="text-xs text-overdue-red">
          {stateLabel}
          {task.blocked_by ? ` — ${task.blocked_by}` : ''}
        </p>
        {(task.followup_count ?? 0) > 0 && (
          <p className="text-xs text-text-ghost">
            Tia followed up {task.followup_count} time{task.followup_count !== 1 ? 's' : ''}
          </p>
        )}
        {lastUpdateMessage && (
          <p className="text-xs text-text-secondary italic mt-1">"{lastUpdateMessage}"</p>
        )}
      </div>
    </div>
  );
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const [agentEnabled, setAgentEnabled] = useState(task.agent_enabled || false);
  const [loading, setLoading] = useState(false);

  // Self-task: assigned_to is 'self' or empty — no agent toggle
  const isSelf = !task.assigned_to || task.assigned_to === 'self';

  // Escalation variant
  if (task.needs_intervention) {
    return <EscalationCard task={task} onClick={onClick} />;
  }

  const statusDetails = task.status_details as any;
  const lastOutcomeState: string | undefined = statusDetails?.outcome_state;
  const lastUpdateMessage: string | undefined = statusDetails?.last_update_message;
  const hasFollowups = (task.followup_count ?? 0) > 0;
  const nextFollowupAt = (task as any).next_followup_at as string | undefined;

  const carryOverDays = task.carry_over_count ?? 0;
  let carryOverStyle = '';
  if (carryOverDays >= 3) {
    carryOverStyle = 'bg-carry-3-bg border-carry-3-border border-l-2 border-l-carry-3-accent';
  } else if (carryOverDays === 2) {
    carryOverStyle = 'bg-carry-2-bg border-carry-2-border border-l-2 border-l-carry-2-accent';
  } else if (carryOverDays === 1) {
    carryOverStyle = 'bg-carry-1-bg border-carry-1-border border-l-2 border-l-carry-1-accent';
  } else {
    carryOverStyle = 'bg-surface-1 border-border-2';
  }

  const priorityDot =
    task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'gold' : 'green';

  const handleAgentToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/agent`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_enabled: !agentEnabled }),
      });
      if (res.ok) setAgentEnabled(!agentEnabled);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClick}
      className={`${carryOverStyle} border rounded-2xl p-4 cursor-pointer transition-smooth hover:border-gold/30 card-shimmer`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm font-normal text-text-primary leading-snug flex-1">{task.title}</h3>
        <StatusDot color={priorityDot as any} size="sm" />
      </div>

      {/* Owner + received from */}
      {(!isSelf || task.received_from) && (
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {!isSelf && (
            <span className="text-xs text-text-secondary">{task.assigned_to}</span>
          )}
          {task.received_from && (
            <>
              {!isSelf && <span className="text-xs text-text-ghost">·</span>}
              <span className="text-xs text-text-muted">from {task.received_from}</span>
            </>
          )}
          {agentEnabled && !isSelf && (
            <span className="text-[10px] px-1.5 py-0.5 bg-gold/10 border border-gold/30 rounded text-gold">
              🤖 Agent
            </span>
          )}
        </div>
      )}

      {/* Date / time */}
      <div className="flex items-center gap-2 text-xs text-text-secondary">
        {task.due_date && <span>{task.due_date}</span>}
        {task.due_time && (
          <>
            <span>•</span>
            <span>{task.due_time}</span>
          </>
        )}
      </div>

      {/* Carry-over */}
      {carryOverDays > 0 && (
        <div className="mt-2 text-[10px] text-overdue-red uppercase tracking-wider-08">
          Carried {carryOverDays} day{carryOverDays > 1 ? 's' : ''}
        </div>
      )}

      {/* Follow-up status row — only for delegated tasks with active agent */}
      {!isSelf && agentEnabled && hasFollowups && lastOutcomeState && (
        <div className="border-t border-border-2 pt-3 mt-3 space-y-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <OutcomeBadge state={lastOutcomeState} />
            {nextFollowupAt && (
              <span className="text-[10px] text-text-ghost">
                {formatNextCheckin(nextFollowupAt)}
              </span>
            )}
          </div>
          {lastUpdateMessage && (
            <p className="text-xs text-text-secondary italic truncate">"{lastUpdateMessage}"</p>
          )}
        </div>
      )}

      {/* Agent toggle — only for delegated tasks */}
      {!isSelf && (
        <div
          className={`mt-3 pt-3 border-t border-border-2 flex items-center justify-between ${
            agentEnabled && hasFollowups && lastOutcomeState ? 'mt-2' : ''
          }`}
        >
          <span className="text-xs text-text-secondary">🤖 Agent</span>
          <button
            onClick={handleAgentToggle}
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
      )}
    </div>
  );
}
