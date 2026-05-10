import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for browser/client-side operations (uses RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Database types
export interface Task {
  id: string;
  user_id: string;
  title: string;
  transcript?: string;
  context?: string;
  received_from?: string[];
  assigned_to?: string[];
  participants?: string[];
  due_date?: string;
  due_date_iso?: string;
  time_sensitivity?: 'hard' | 'soft' | 'flexible';
  task_domain?: 'work' | 'personal';
  entity_type?: string;
  entity_name?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: 'open' | 'done' | 'blocked';
  blocked_by?: string;
  parent_task_id?: string;
  is_private?: boolean;
  carried_over?: boolean;
  carry_over_count?: number;
  is_recurring?: boolean;
  recurrence?: string;
  capture_method?: 'voice' | 'text';
  last_modified_at?: string;
  archived?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Brain {
  user_id: string;
  summary: any;
  last_updated?: string;
}

export interface Soul {
  user_id: string;
  document: any;
  version?: number;
  last_updated?: string;
}

export interface Person {
  id: string;
  user_id: string;
  name: string;
  role?: string;
  relationship?: string;
  sensitivity?: 'normal' | 'careful' | 'critical';
  task_count?: number;
  open_task_count?: number;
  last_mentioned?: string;
  phone_number?: string;
  aliases?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Entity {
  id: string;
  user_id: string;
  entity_name: string;
  entity_type: string;
  task_count?: number;
  open_task_count?: number;
  last_mentioned?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TaskHistory {
  id: string;
  task_id: string;
  user_id: string;
  changed_at?: string;
  change_type: 'created' | 'correction' | 'circumstance_change' | 'enrichment' | 'status_update' | 'carry_over';
  field_changed: string;
  old_value?: string;
  new_value?: string;
  reason?: string;
  source?: 'voice' | 'text' | 'system';
}

export interface Nudge {
  id: string;
  user_id: string;
  message: string;
  nudge_type?: string;
  read?: boolean;
  acted_on?: boolean;
  created_at?: string;
}

export interface SubscriptionMap {
  user_id: string;
  razorpay_subscription_id: string;
  plan_type?: 'monthly' | 'annual';
  created_at?: string;
}
