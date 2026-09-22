import {
  UserProfile,
  UserRole,
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  ComplaintStatusHistory,
  ComplaintAssignment,
  ComplaintImage,
  ComplaintComment,
  NotificationItem,
  AIAnalysisResult,
  DuplicateCheckResult,
  AnalyticsStats,
  Department,
  Zone,
  Ward,
  SLARule,
  VoiceAssistantResponse,
  SearchGroundingResult,
  MapsGroundingResult,
} from '../types';

const TOKEN_KEY = 'civicfix_auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

export const api = {
  // Auth
  async login(email: string, password: string, role?: UserRole) {
    const res = await request<{ user: UserProfile; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
    setAuthToken(res.token);
    return res;
  },

  async register(full_name: string, email: string, password: string, phone_number?: string) {
    const res = await request<{ user: UserProfile; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ full_name, email, password, phone_number }),
    });
    setAuthToken(res.token);
    return res;
  },

  async syncGoogleUser(params: {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role?: UserRole;
  }) {
    const res = await request<{ user: UserProfile; token: string }>('/api/auth/google-sync', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    setAuthToken(res.token);
    return res;
  },

  async getMe() {
    return request<{ user: UserProfile }>('/api/auth/me');
  },

  logout() {
    setAuthToken(null);
  },

  // AI & Assistant
  async analyzeIssue(params: {
    description: string;
    imageBase64?: string;
    locationText?: string;
    manualCategory?: string;
  }) {
    return request<AIAnalysisResult>('/api/gemini/analyze-issue', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async getCivicSearchGrounding(query: string, locationOrCity?: string) {
    return request<SearchGroundingResult>('/api/gemini/search-grounding', {
      method: 'POST',
      body: JSON.stringify({ query, locationOrCity }),
    });
  },

  async getMapsGrounding(query: string, latitude?: number, longitude?: number) {
    return request<MapsGroundingResult>('/api/gemini/maps-grounding', {
      method: 'POST',
      body: JSON.stringify({ query, latitude, longitude }),
    });
  },

  async sendVoiceChat(params: {
    text: string;
    language?: string;
    userContext?: any;
  }) {
    return request<VoiceAssistantResponse>('/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async checkDuplicate(params: {
    category: ComplaintCategory;
    latitude: number;
    longitude: number;
    description: string;
  }) {
    return request<DuplicateCheckResult>('/api/complaints/check-duplicate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Municipal Data: Departments, Wards & Zones
  async getDepartments() {
    return request<{ departments: Department[] }>('/api/departments');
  },

  async createDepartment(data: { name: string; code: string; contact_email?: string }) {
    return request<{ department: Department }>('/api/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getZones() {
    return request<{ zones: Zone[] }>('/api/zones');
  },

  async getWards() {
    return request<{ wards: Ward[]; zones: Zone[] }>('/api/wards');
  },

  async createWard(data: { ward_number: number; ward_name: string; zone_id: string; contact_phone?: string }) {
    return request<{ ward: Ward }>('/api/wards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // SLA Management
  async getSLARules() {
    return request<{ rules: SLARule[] }>('/api/sla-rules');
  },

  async updateSLARules(rules: SLARule[]) {
    return request<{ rules: SLARule[] }>('/api/sla-rules', {
      method: 'PUT',
      body: JSON.stringify({ rules }),
    });
  },

  // Complaints
  async getComplaints(filter?: {
    category?: string;
    priority?: string;
    status?: string;
    search?: string;
    ward_id?: string;
    zone_id?: string;
    department?: string;
    overdue_only?: boolean;
    my_only?: boolean;
    public_map?: boolean;
  }) {
    const params = new URLSearchParams();
    if (filter?.category) params.append('category', filter.category);
    if (filter?.priority) params.append('priority', filter.priority);
    if (filter?.status) params.append('status', filter.status);
    if (filter?.search) params.append('search', filter.search);
    if (filter?.ward_id) params.append('ward_id', filter.ward_id);
    if (filter?.zone_id) params.append('zone_id', filter.zone_id);
    if (filter?.department) params.append('department', filter.department);
    if (filter?.overdue_only) params.append('overdue_only', 'true');
    if (filter?.my_only) params.append('my_only', 'true');
    if (filter?.public_map) params.append('public_map', 'true');

    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{ complaints: Complaint[] }>(`/api/complaints${query}`);
  },

  async getComplaintById(id: string) {
    return request<{
      complaint: Complaint;
      images: ComplaintImage[];
      status_history: ComplaintStatusHistory[];
      assignments: ComplaintAssignment[];
      comments: ComplaintComment[];
    }>(`/api/complaints/${id}`);
  },

  async createComplaint(data: {
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
    image_url?: string;
  }) {
    return request<{ complaint: Complaint }>('/api/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Authority actions
  async updateComplaintStatus(
    id: string,
    status: ComplaintStatus,
    notes: string,
    resolution_notes?: string,
    resolution_image_url?: string
  ) {
    return request<Complaint>(`/api/complaints/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes, resolution_notes, resolution_image_url }),
    });
  },

  async resolveComplaint(id: string, resolution_notes: string, resolution_image_url?: string) {
    return request<Complaint>(`/api/complaints/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution_notes, resolution_image_url }),
    });
  },

  async recordCitizenFeedback(id: string, was_resolved: boolean, rating?: number, comment?: string) {
    return request<Complaint>(`/api/complaints/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ was_resolved, rating, comment }),
    });
  },

  async escalateComplaint(id: string, reason?: string) {
    return request<Complaint>(`/api/complaints/${id}/escalate`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async mergeComplaints(sourceId: string, targetId: string, notes?: string) {
    return request<{ source: Complaint; target: Complaint }>(`/api/complaints/${sourceId}/merge`, {
      method: 'POST',
      body: JSON.stringify({ target_complaint_id: targetId, notes }),
    });
  },

  async updateComplaintPriority(id: string, priority: ComplaintPriority, notes?: string) {
    return request<{ complaint: Complaint }>(`/api/complaints/${id}/priority`, {
      method: 'PATCH',
      body: JSON.stringify({ priority, notes }),
    });
  },

  async assignComplaint(id: string, department: string, officer: string, internal_note?: string) {
    return request<Complaint>(`/api/complaints/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ department, officer, internal_note }),
    });
  },

  // Case Comments
  async addComment(complaintId: string, comment: string, is_internal: boolean = false) {
    return request<{ comment: ComplaintComment }>(`/api/complaints/${complaintId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment, is_internal }),
    });
  },

  // Notifications
  async getNotifications() {
    return request<{ notifications: NotificationItem[] }>('/api/notifications');
  },

  async markNotificationRead(id: string) {
    return request<{ notification: NotificationItem }>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  async markAllNotificationsRead() {
    return request<{ success: boolean }>('/api/notifications/read-all', {
      method: 'POST',
    });
  },

  // Analytics
  async getAnalytics() {
    return request<AnalyticsStats>('/api/analytics');
  },
};
