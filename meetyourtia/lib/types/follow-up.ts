export type OutcomeState =
  | 'confirmed_done'
  | 'on_track'
  | 'committed_new_eta'
  | 'partial_progress'
  | 'partial_progress_no_eta'
  | 'behind_no_commitment'
  | 'no_commitment'
  | 'blocked_external'
  | 'blocked_cannot_complete'
  | 'no_answer'
  | 'no_answer_terminal'
  | 'analysis_failed';

export interface TranscriptAnalysis {
  task_id: string;
  outcome_state: OutcomeState;
  call_summary: string;
  last_update_message: string;
  next_action: 'schedule_followup' | 'mark_done' | 'set_intervention' | 'no_action';
  next_followup_at: string | null;
  eta_given: string | null;
  blocked_by: string | null;
}

export interface FollowupContext {
  ownerName: string;
  callHistory: Array<{
    outcome_state: OutcomeState;
    call_summary: string;
    completed_at: string;
  }>;
  batchedTasks?: Array<{
    id: string;
    title: string;
    context?: string;
    due_date_iso?: string;
    priority?: string;
  }>;
  hoursUntilDue: number;
  isOverdue: boolean;
}

export interface BatchGroup {
  userId: string;
  recipientPhone: string;
  recipientName: string;
  calls: Array<{ callId: string; task: any }>;
}
