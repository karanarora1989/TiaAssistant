'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, TopBar, LoadingSpinner, Card, StatusDot } from '@/components/tia/shared';
import { Task } from '@/lib/supabase';

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch task');
      }

      setTask(data.data.task);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDone = async () => {
    if (!task) return;

    setUpdating(true);
    setError('');

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update task');
      }

      // Redirect back to tasks
      router.push('/app/tasks');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setUpdating(false);
    }
  };

  const handleMarkBlocked = async () => {
    if (!task) return;

    const reason = prompt('Why is this task blocked?');
    if (!reason) return;

    setUpdating(true);
    setError('');

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'blocked',
          blocked_by: reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update task');
      }

      setTask(data.data.task);
      setUpdating(false);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-surface-0 flex flex-col">
        <TopBar
          title="Task"
          backLabel="Tasks"
          onBack={() => router.push('/app/tasks')}
        />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-sm text-overdue-red mb-4">{error || 'Task not found'}</p>
            <Button onClick={() => router.push('/app/tasks')} variant="ghost">
              Back to tasks
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const priorityDot = task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'gold' : 'green';
  const domainColor = task.task_domain === 'work' ? 'text-work-blue-text' : 'text-personal-purple-text';

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      <TopBar
        title="Task Details"
        backLabel="Tasks"
        onBack={() => router.push('/app/tasks')}
      />

      <div className="flex-1 px-6 py-6 overflow-y-auto">
        {/* Title */}
        <div className="flex items-start gap-3 mb-6">
          <StatusDot color={priorityDot as any} />
          <h1 className="text-xl font-light text-text-primary leading-tight flex-1">
            {task.title}
          </h1>
        </div>

        {/* Meta Cards */}
        <div className="space-y-3 mb-6">
          {task.context && (
            <Card>
              <h3 className="text-xs text-text-secondary mb-2 uppercase tracking-wider-03">
                Context
              </h3>
              <p className="text-sm text-text-primary leading-relaxed">
                {task.context}
              </p>
            </Card>
          )}

          <Card>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs text-text-secondary mb-1 uppercase tracking-wider-03">
                  Due Date
                </h3>
                <p className="text-sm text-text-primary">
                  {task.due_date || 'No deadline'}
                </p>
              </div>
              <div>
                <h3 className="text-xs text-text-secondary mb-1 uppercase tracking-wider-03">
                  Priority
                </h3>
                <p className="text-sm text-text-primary capitalize">
                  {task.priority}
                </p>
              </div>
            </div>
          </Card>

          {task.entity_name && (
            <Card>
              <h3 className="text-xs text-text-secondary mb-1 uppercase tracking-wider-03">
                {task.entity_type || 'Entity'}
              </h3>
              <p className={`text-sm ${domainColor} font-medium`}>
                {task.entity_name}
              </p>
            </Card>
          )}

          {task.assigned_to && task.assigned_to.length > 0 && (
            <Card>
              <h3 className="text-xs text-text-secondary mb-1 uppercase tracking-wider-03">
                Assigned To
              </h3>
              <p className="text-sm text-text-primary">
                {task.assigned_to.join(', ')}
              </p>
            </Card>
          )}

          {task.received_from && task.received_from.length > 0 && (
            <Card>
              <h3 className="text-xs text-text-secondary mb-1 uppercase tracking-wider-03">
                Received From
              </h3>
              <p className="text-sm text-text-primary">
                {task.received_from.join(', ')}
              </p>
            </Card>
          )}

          {task.carry_over_count && task.carry_over_count > 0 && (
            <Card className="bg-overdue-red/10 border-overdue-red">
              <h3 className="text-xs text-overdue-red mb-1 uppercase tracking-wider-03">
                Carried Over
              </h3>
              <p className="text-sm text-overdue-red">
                {task.carry_over_count} day{task.carry_over_count > 1 ? 's' : ''}
              </p>
            </Card>
          )}

          {task.status === 'blocked' && task.blocked_by && (
            <Card className="bg-overdue-red/10 border-overdue-red">
              <h3 className="text-xs text-overdue-red mb-1 uppercase tracking-wider-03">
                Blocked
              </h3>
              <p className="text-sm text-overdue-red">
                {task.blocked_by}
              </p>
            </Card>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-overdue-red/10 border border-overdue-red rounded-xl">
            <p className="text-sm text-overdue-red">{error}</p>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      {task.status === 'open' && (
        <div className="px-6 pb-6 space-y-2">
          <Button
            onClick={handleMarkDone}
            disabled={updating}
            className="w-full flex items-center justify-center gap-2"
          >
            {updating ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Updating...</span>
              </>
            ) : (
              '✓ Mark as done'
            )}
          </Button>
          <button
            onClick={handleMarkBlocked}
            disabled={updating}
            className="w-full text-xs text-text-muted hover:text-text-secondary text-center py-2 transition-smooth"
          >
            Mark as blocked
          </button>
        </div>
      )}

      {task.status === 'done' && (
        <div className="px-6 pb-6">
          <div className="p-4 bg-done-green/10 border border-done-green rounded-xl text-center">
            <p className="text-sm text-done-green-text">✓ Task completed</p>
          </div>
        </div>
      )}
    </div>
  );
}
