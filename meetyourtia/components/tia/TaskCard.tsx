'use client';

import { useState } from 'react';
import { Task } from '@/lib/supabase';
import { StatusDot } from './shared';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
}

export function TaskCard({ task, onClick, onSwipeRight, onSwipeLeft }: TaskCardProps) {
  const [agentEnabled, setAgentEnabled] = useState(task.agent_enabled || false);
  const [loading, setLoading] = useState(false);

  const handleAgentToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setLoading(true);

    try {
      const response = await fetch(`/api/tasks/${task.id}/agent`, {
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
      }
    } catch (error) {
      console.error('Failed to toggle agent:', error);
    } finally {
      setLoading(false);
    }
  };

  // Determine carry-over styling
  const carryOverDays = task.carry_over_count || 0;
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

  // Domain color
  const domainColor = task.task_domain === 'work' ? 'work-blue-text' : 'personal-purple-text';
  
  // Priority indicator
  const priorityDot = task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'gold' : 'green';

  return (
    <div
      onClick={onClick}
      className={`${carryOverStyle} border rounded-2xl p-4 cursor-pointer transition-smooth hover:border-gold/30 card-shimmer`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm font-normal text-text-primary leading-snug flex-1">
          {task.title}
        </h3>
        <StatusDot color={priorityDot as any} size="sm" />
      </div>

      {/* Owner + Received From (inline) */}
      {((task.assigned_to && task.assigned_to !== 'self') || task.received_from) && (
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs text-text-secondary">
            {task.assigned_to && task.assigned_to !== 'self' ? task.assigned_to : 'You'}
          </span>
          {task.received_from && (
            <>
              <span className="text-xs text-text-ghost">·</span>
              <span className="text-xs text-text-muted">from {task.received_from}</span>
            </>
          )}
          {task.agent_enabled && (
            <span className="text-[10px] px-1.5 py-0.5 bg-gold/10 border border-gold/30 rounded text-gold">
              🤖 Agent
            </span>
          )}
        </div>
      )}

      {/* Date and Time */}
      <div className="flex items-center gap-2 text-xs text-text-secondary">
        {task.due_date && (
          <span>{task.due_date}</span>
        )}
        {task.due_time && (
          <>
            <span>•</span>
            <span>{task.due_time}</span>
          </>
        )}
      </div>

      {/* Carry-over indicator */}
      {carryOverDays > 0 && (
        <div className="mt-2 text-[10px] text-overdue-red uppercase tracking-wider-08">
          Carried {carryOverDays} day{carryOverDays > 1 ? 's' : ''}
        </div>
      )}

      {/* Agent Toggle */}
      <div className="mt-3 pt-3 border-t border-border-2 flex items-center justify-between">
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
    </div>
  );
}
