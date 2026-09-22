export type UserRole = 'citizen' | 'authority' | 'admin';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  role: UserRole;
  avatar_url?: string;
  assigned_ward?: string;
  department?: string;
  designation?: string;
  created_at: string;
}

export type ComplaintCategory =
  | 'Pothole'
  | 'Garbage'
  | 'Road Damage'
  | 'Streetlight'
  | 'Water Leakage'
  | 'Drainage'
  | 'Traffic Signal'
  | 'Public Safety'
  | 'Public Property Damage'
  | 'Other';

export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type ComplaintStatus =
  | 'Reported'
  | 'Submitted'
  | 'AI Reviewed'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Citizen Confirmation'
  | 'Closed'
  | 'Reopened'
  | 'Rejected';

export interface Department {
  id: string;
  name: string;
  code: string;
  contact_email?: string;
  active: boolean;
  created_at: string;
}

export interface Zone {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface Ward {
  id: string;
  ward_number: number;
  ward_name: string;
  zone_id: string;
  zone_name: string;
  office_address?: string;
  contact_phone?: string;
}

export interface SLARule {
  id: string;
  priority: ComplaintPriority;
  category?: ComplaintCategory;
  max_hours: number;
  escalation_hours: number;
  active: boolean;
}

export interface CitizenFeedback {
  id: string;
  complaint_id: string;
  user_id: string;
  was_resolved: boolean;
  rating?: number; // 1-5
  comment?: string;
  created_at: string;
}

export interface ComplaintComment {
  id: string;
  complaint_id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  comment: string;
  is_internal: boolean;
  created_at: string;
}

export interface Complaint {
  id: string; // e.g. CF-100001
  user_id: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  description: string;
  ai_summary: string;
  ai_reason: string;
  ai_detected_features: string[];
  latitude: number;
  longitude: number;
  location_text: string;
  ward_id?: string;
  ward_number?: number;
  ward_name?: string;
  zone_id?: string;
  zone_name?: string;
  status: ComplaintStatus;
  image_url?: string;
  resolution_image_url?: string;
  resolution_notes?: string;
  resolved_at?: string;
  closed_at?: string;
  sla_hours?: number;
  due_at?: string;
  escalation_level?: number; // 0 = Field Officer, 1 = Supervisor, 2 = Dept Head
  is_overdue?: boolean;
  remaining_hours?: number;
  citizen_feedback?: CitizenFeedback;
  is_reopened?: boolean;
  reopen_reason?: string;
  merged_into_id?: string;
  created_at: string;
  updated_at: string;
  assigned_to_department?: string;
  assigned_to_officer?: string;
}

export interface ComplaintImage {
  id: string;
  complaint_id: string;
  image_url: string;
  image_type: 'evidence' | 'resolution';
  uploaded_at: string;
}

export interface ComplaintStatusHistory {
  id: string;
  complaint_id: string;
  from_status: ComplaintStatus;
  to_status: ComplaintStatus;
  changed_by_user_id: string;
  changed_by_name: string;
  notes: string;
  created_at: string;
}

export interface ComplaintAssignment {
  id: string;
  complaint_id: string;
  assigned_by_user_id: string;
  assigned_by_name: string;
  assigned_to_department: string;
  assigned_to_officer: string;
  internal_note: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  complaint_id: string;
  title: string;
  message: string;
  read: boolean;
  type?: 'status_update' | 'assignment' | 'sla_warning' | 'resolution' | 'reopened' | 'system';
  created_at: string;
}

export interface AIAnalysisResult {
  category: ComplaintCategory;
  priority: ComplaintPriority;
  summary: string;
  reason: string;
  detected_features: string[];
  duplicate_keywords: string[];
  recommended_department?: string;
  is_fallback?: boolean;
}

export interface DuplicateCheckResult {
  is_duplicate: boolean;
  duplicate_complaint?: {
    id: string;
    category: ComplaintCategory;
    location_text: string;
    status: ComplaintStatus;
    created_at: string;
  };
}

export interface AnalyticsStats {
  total_reports: number;
  pending_review: number;
  assigned: number;
  in_progress: number;
  resolved: number;
  closed: number;
  reopened: number;
  rejected: number;
  overdue_count: number;
  high_or_critical: number;
  resolution_rate_percent: number | null;
  avg_resolution_hours: number | null;
  sla_compliance_rate_percent: number | null;
  by_category: { category: string; count: number }[];
  by_status: { status: string; count: number }[];
  by_priority: { priority: string; count: number }[];
  by_ward: { ward_name: string; count: number }[];
  by_department: { department: string; count: number }[];
  recent_trend: { date: string; count: number }[];
}

// Voice Assistant Types
export type VoiceIntent =
  | 'REPORT_ISSUE'
  | 'TRACK_COMPLAINT'
  | 'VIEW_MY_COMPLAINTS'
  | 'VIEW_NEARBY_ISSUES'
  | 'CHECK_STATUS'
  | 'REOPEN_COMPLAINT'
  | 'HELP'
  | 'CHANGE_LANGUAGE'
  | 'CANCEL'
  | 'UNKNOWN';

export interface VoiceAssistantEntities {
  category?: ComplaintCategory;
  location?: string;
  description?: string;
  priority?: ComplaintPriority;
  complaintId?: string;
}

export interface VoiceAssistantResponse {
  intent: VoiceIntent;
  confidence: number;
  replyText: string;
  spokenText: string;
  language: 'en' | 'hi' | 'kn';
  extractedEntities: VoiceAssistantEntities;
  missingFields: string[];
  readyToSubmit: boolean;
  suggestedAction?: 'NAVIGATE_REPORT' | 'NAVIGATE_TRACK' | 'NAVIGATE_DASHBOARD' | 'NAVIGATE_MAP' | 'NAVIGATE_HELP' | 'SUBMIT_COMPLAINT' | 'NONE';
  actionPayload?: any;
}

// AI Search Grounding Types (gemini-3.5-flash with googleSearch)
export interface SearchGroundingSource {
  title: string;
  uri: string;
}

export interface SearchGroundingResult {
  text: string;
  sources: SearchGroundingSource[];
  query: string;
  is_fallback?: boolean;
}

// AI Maps Grounding Types (gemini-3.5-flash with googleMaps)
export interface MapsGroundingPlace {
  title: string;
  uri: string;
  address?: string;
  reviewSnippet?: string;
}

export interface MapsGroundingResult {
  text: string;
  places: MapsGroundingPlace[];
  query: string;
  is_fallback?: boolean;
}

