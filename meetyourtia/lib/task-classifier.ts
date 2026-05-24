/**
 * Task Classification Utilities
 * Determines if Tia should take autonomous action on a task
 */

export interface Task {
  id: string;
  user_id: string;
  assigned_from?: string | null;
  assigned_to?: string | null;
  status: 'not_started' | 'wip' | 'blocked' | 'done';
  archived: boolean;
}

/**
 * Determines if a task is delegated (assigned to someone else)
 * Tia ONLY acts on delegated tasks
 */
export function isDelegatedTask(task: Task): boolean {
  // Task is delegated if:
  // 1. assigned_to exists and is not null
  // 2. assigned_to is not "self"
  // 3. assigned_from is the owner (user_id)
  // 4. Task is not done or archived
  
  return (
    task.assigned_to !== null &&
    task.assigned_to !== undefined &&
    task.assigned_to !== '' &&
    task.assigned_to !== 'self' &&
    task.assigned_from === task.user_id &&
    task.status !== 'done' &&
    !task.archived
  );
}

/**
 * Determines if a task is self-assigned
 * Tia does NOT act on self-assigned tasks
 */
export function isSelfAssignedTask(task: Task): boolean {
  return (
    task.assigned_to === null ||
    task.assigned_to === undefined ||
    task.assigned_to === '' ||
    task.assigned_to === 'self' ||
    task.assigned_from === null ||
    task.assigned_from === undefined
  );
}

/**
 * Checks if Tia can take autonomous action on this task
 */
export function canTiaAct(task: Task): boolean {
  return isDelegatedTask(task);
}

/**
 * Gets the action type for a task
 */
export function getTaskActionType(task: Task): 'autonomous' | 'reminder' | 'none' {
  if (isDelegatedTask(task)) {
    return 'autonomous'; // Tia follows up autonomously
  } else if (isSelfAssignedTask(task) && task.status !== 'done') {
    return 'reminder'; // Just remind the user
  } else {
    return 'none'; // No action needed
  }
}

/**
 * Validates task delegation
 */
export function validateDelegation(task: Partial<Task>): {
  valid: boolean;
  error?: string;
} {
  if (!task.assigned_to) {
    return { valid: false, error: 'assigned_to is required' };
  }

  if (!task.assigned_from) {
    return { valid: false, error: 'assigned_from is required' };
  }

  if (task.assigned_to === task.assigned_from) {
    return { valid: false, error: 'Cannot delegate to yourself' };
  }

  return { valid: true };
}
