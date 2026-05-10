import { Task } from '@/lib/supabase';
import { StatusDot } from './shared';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
}

export function TaskCard({ task, onClick, onSwipeRight, onSwipeLeft }: TaskCardProps) {
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

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-text-secondary">
        {task.due_date && (
          <span>{task.due_date}</span>
        )}
        {task.entity_name && (
          <span className={`text-${domainColor}`}>
            {task.entity_name}
          </span>
        )}
        {task.assigned_to && task.assigned_to.length > 0 && (
          <span>→ {task.assigned_to.join(', ')}</span>
        )}
      </div>

      {/* Carry-over indicator */}
      {carryOverDays > 0 && (
        <div className="mt-2 text-[10px] text-overdue-red uppercase tracking-wider-08">
          Carried {carryOverDays} day{carryOverDays > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
