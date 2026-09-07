// =============================================================================
// CivicConnect TN — Database Entity Types
// =============================================================================
// These types represent the shape of rows in each PostgreSQL table.
// They will eventually be replaced by auto-generated Supabase types,
// but serve as the authoritative contract during development.

import type {
  UserRole,
  ComplaintStatus,
  Priority,
  ComplaintSource,
  MediaType,
  MediaPhase,
  UpdateType,
  InsightType,
  NotificationType,
  NotificationChannel,
} from './enums';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// -----------------------------------------------------------------------------
// profiles
// -----------------------------------------------------------------------------
export interface Profile {
  id: string;
  firebase_uid: string;
  email: string;
  display_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  department_id: string | null;
  ward_id: number | null;
  district: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// departments
// -----------------------------------------------------------------------------
export interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

// -----------------------------------------------------------------------------
// categories
// -----------------------------------------------------------------------------
export interface Category {
  id: string;
  department_id: string;
  name: string;
  code: string;
  description: string | null;
  default_priority: Priority;
  is_active: boolean;
  created_at: string;
}

// -----------------------------------------------------------------------------
// complaints
// -----------------------------------------------------------------------------
export interface Complaint {
  id: string;
  tracking_id: string;
  citizen_id: string;
  category_id: string | null;
  department_id: string | null;
  status: ComplaintStatus;
  priority: Priority;
  title: string;
  description: string;
  location: Json | null; // PostGIS geography — serialized as GeoJSON on read
  address: string | null;
  ward: number | null;
  district: string | null;
  source: ComplaintSource;
  language: string;
  is_public: boolean;
  sla_deadline: string | null;
  sla_breached: boolean;
  escalation_level: number;
  ai_category_confidence: number | null;
  ai_priority_confidence: number | null;
  ai_sentiment: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// complaint_media
// -----------------------------------------------------------------------------
export interface ComplaintMedia {
  id: string;
  complaint_id: string;
  media_type: MediaType;
  storage_path: string;
  url: string;
  phase: MediaPhase;
  uploaded_by: string | null;
  ai_analysis: Json | null;
  created_at: string;
}

// -----------------------------------------------------------------------------
// complaint_assignments
// -----------------------------------------------------------------------------
export interface ComplaintAssignment {
  id: string;
  complaint_id: string;
  assigned_to: string;
  assigned_by: string;
  role_at_assignment: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

// -----------------------------------------------------------------------------
// complaint_updates
// -----------------------------------------------------------------------------
export interface ComplaintUpdate {
  id: string;
  complaint_id: string;
  updated_by: string;
  previous_status: string | null;
  new_status: string | null;
  update_type: UpdateType;
  notes: string | null;
  metadata: Json | null;
  created_at: string;
}

// -----------------------------------------------------------------------------
// sla_configs
// -----------------------------------------------------------------------------
export interface SlaConfig {
  id: string;
  category_id: string | null;
  department_id: string | null;
  priority: Priority;
  resolution_hours: number;
  warning_threshold_pct: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// escalation_configs
// -----------------------------------------------------------------------------
export interface EscalationConfig {
  id: string;
  level: number;
  target_role: UserRole;
  department_id: string | null;
  hours_after_breach: number;
  is_active: boolean;
  created_at: string;
}

// -----------------------------------------------------------------------------
// escalation_logs
// -----------------------------------------------------------------------------
export interface EscalationLog {
  id: string;
  complaint_id: string;
  escalation_level: number;
  escalated_to_role: string;
  escalated_to_user: string | null;
  new_deadline: string;
  reason: string | null;
  created_at: string;
}

// -----------------------------------------------------------------------------
// ai_insights
// -----------------------------------------------------------------------------
export interface AiInsight {
  id: string;
  complaint_id: string | null;
  insight_type: InsightType;
  result: Json;
  confidence: number | null;
  model: string | null;
  created_at: string;
}

// -----------------------------------------------------------------------------
// upvotes
// -----------------------------------------------------------------------------
export interface Upvote {
  id: string;
  complaint_id: string;
  user_id: string;
  created_at: string;
}

// -----------------------------------------------------------------------------
// comments
// -----------------------------------------------------------------------------
export interface Comment {
  id: string;
  complaint_id: string;
  user_id: string;
  content: string;
  is_official: boolean;
  is_hidden: boolean;
  created_at: string;
}

// -----------------------------------------------------------------------------
// notifications
// -----------------------------------------------------------------------------
export interface Notification {
  id: string;
  user_id: string;
  complaint_id: string | null;
  type: NotificationType;
  title: string;
  body: string | null;
  channel: NotificationChannel;
  is_read: boolean;
  metadata: Json | null;
  created_at: string;
}

// -----------------------------------------------------------------------------
// audit_logs
// -----------------------------------------------------------------------------
export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: Json | null;
  new_value: Json | null;
  ip_address: string | null;
  created_at: string;
}

// -----------------------------------------------------------------------------
// Supabase Database Schema Definition
// -----------------------------------------------------------------------------
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile & Record<string, unknown>;
        Insert: Partial<Profile> & Record<string, unknown>;
        Update: Partial<Profile> & Record<string, unknown>;
        Relationships: [];
      };
      departments: {
        Row: Department & Record<string, unknown>;
        Insert: Partial<Department> & Record<string, unknown>;
        Update: Partial<Department> & Record<string, unknown>;
        Relationships: [];
      };
      categories: {
        Row: Category & Record<string, unknown>;
        Insert: Partial<Category> & Record<string, unknown>;
        Update: Partial<Category> & Record<string, unknown>;
        Relationships: [];
      };
      complaints: {
        Row: Complaint & Record<string, unknown>;
        Insert: Partial<Complaint> & Record<string, unknown>;
        Update: Partial<Complaint> & Record<string, unknown>;
        Relationships: [];
      };
      complaint_media: {
        Row: ComplaintMedia & Record<string, unknown>;
        Insert: Partial<ComplaintMedia> & Record<string, unknown>;
        Update: Partial<ComplaintMedia> & Record<string, unknown>;
        Relationships: [];
      };
      complaint_assignments: {
        Row: ComplaintAssignment & Record<string, unknown>;
        Insert: Partial<ComplaintAssignment> & Record<string, unknown>;
        Update: Partial<ComplaintAssignment> & Record<string, unknown>;
        Relationships: [];
      };
      complaint_updates: {
        Row: ComplaintUpdate & Record<string, unknown>;
        Insert: Partial<ComplaintUpdate> & Record<string, unknown>;
        Update: Partial<ComplaintUpdate> & Record<string, unknown>;
        Relationships: [];
      };
      sla_configs: {
        Row: SlaConfig & Record<string, unknown>;
        Insert: Partial<SlaConfig> & Record<string, unknown>;
        Update: Partial<SlaConfig> & Record<string, unknown>;
        Relationships: [];
      };
      escalation_configs: {
        Row: EscalationConfig & Record<string, unknown>;
        Insert: Partial<EscalationConfig> & Record<string, unknown>;
        Update: Partial<EscalationConfig> & Record<string, unknown>;
        Relationships: [];
      };
      escalation_logs: {
        Row: EscalationLog & Record<string, unknown>;
        Insert: Partial<EscalationLog> & Record<string, unknown>;
        Update: Partial<EscalationLog> & Record<string, unknown>;
        Relationships: [];
      };
      ai_insights: {
        Row: AiInsight & Record<string, unknown>;
        Insert: Partial<AiInsight> & Record<string, unknown>;
        Update: Partial<AiInsight> & Record<string, unknown>;
        Relationships: [];
      };
      upvotes: {
        Row: Upvote & Record<string, unknown>;
        Insert: Partial<Upvote> & Record<string, unknown>;
        Update: Partial<Upvote> & Record<string, unknown>;
        Relationships: [];
      };
      comments: {
        Row: Comment & Record<string, unknown>;
        Insert: Partial<Comment> & Record<string, unknown>;
        Update: Partial<Comment> & Record<string, unknown>;
        Relationships: [];
      };
      notifications: {
        Row: Notification & Record<string, unknown>;
        Insert: Partial<Notification> & Record<string, unknown>;
        Update: Partial<Notification> & Record<string, unknown>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLog & Record<string, unknown>;
        Insert: Partial<AuditLog> & Record<string, unknown>;
        Update: Partial<AuditLog> & Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
