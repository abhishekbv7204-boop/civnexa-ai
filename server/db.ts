import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  UserProfile,
  Complaint,
  ComplaintImage,
  ComplaintStatusHistory,
  ComplaintAssignment,
  NotificationItem,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  AnalyticsStats,
  Department,
  Zone,
  Ward,
  SLARule,
  CitizenFeedback,
  ComplaintComment,
} from '../src/types';
import { CATEGORY_DEPARTMENT_MAP } from './gemini';

interface DatabaseSchema {
  profiles: (UserProfile & { password_hash: string })[];
  departments: Department[];
  zones: Zone[];
  wards: Ward[];
  sla_rules: SLARule[];
  complaints: Complaint[];
  complaint_images: ComplaintImage[];
  complaint_status_history: ComplaintStatusHistory[];
  complaint_assignments: ComplaintAssignment[];
  complaint_comments: ComplaintComment[];
  citizen_feedback: CitizenFeedback[];
  notifications: NotificationItem[];
  audit_logs: Array<{
    id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    actor_id: string;
    actor_name: string;
    details: string;
    created_at: string;
  }>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'civicfix_data.json');

// Cryptographic hash for user credentials (SHA-256 with platform salt)
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_civicfix_salt_2026').digest('hex');
}

// Vector SVG field evidence visuals (embedded self-contained assets for fast, reliable preview)
const SAMPLE_IMAGE_POTHOLE = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#374151"/>
  <path d="M0,280 Q300,260 600,280 L600,400 L0,400 Z" fill="#1F2937"/>
  <ellipse cx="300" cy="240" rx="140" ry="60" fill="#111827"/>
  <ellipse cx="290" cy="245" rx="110" ry="45" fill="#030712"/>
  <path d="M180,240 Q250,220 320,230 Q400,225 420,245" stroke="#4B5563" stroke-width="4" fill="none"/>
  <line x1="0" y1="200" x2="600" y2="200" stroke="#FBBF24" stroke-width="6" stroke-dasharray="25,25"/>
  <rect x="20" y="20" width="220" height="34" rx="4" fill="#000000" opacity="0.6"/>
  <text x="30" y="42" fill="#FFFFFF" font-family="sans-serif" font-size="14" font-weight="bold">Field Evidence: Pothole</text>
</svg>`);

const SAMPLE_IMAGE_GARBAGE = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#4B5563"/>
  <rect x="0" y="260" width="600" height="140" fill="#374151"/>
  <rect x="40" y="180" width="220" height="110" rx="8" fill="#15803D" opacity="0.9"/>
  <text x="60" y="240" fill="#FFFFFF" font-family="sans-serif" font-size="16" font-weight="bold">MUNICIPAL BIN</text>
  <path d="M220,300 C240,240 320,230 360,260 C380,240 450,250 470,290 C490,320 380,340 240,330 Z" fill="#78716C"/>
  <circle cx="280" cy="280" r="25" fill="#A8A29E"/>
  <circle cx="340" cy="290" r="30" fill="#D97706"/>
  <circle cx="410" cy="285" r="28" fill="#57534E"/>
  <rect x="20" y="20" width="220" height="34" rx="4" fill="#000000" opacity="0.6"/>
  <text x="30" y="42" fill="#FFFFFF" font-family="sans-serif" font-size="14" font-weight="bold">Field Evidence: Waste Accumulation</text>
</svg>`);

const SAMPLE_IMAGE_STREETLIGHT = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#0F172A"/>
  <line x1="200" y1="400" x2="200" y2="100" stroke="#64748B" stroke-width="12"/>
  <path d="M200,100 Q200,50 260,50 L320,50" stroke="#64748B" stroke-width="12" fill="none"/>
  <polygon points="310,50 350,50 340,75 320,75" fill="#94A3B8"/>
  <circle cx="330" cy="78" r="8" fill="#64748B"/>
  <line x1="315" y1="65" x2="345" y2="90" stroke="#EF4444" stroke-width="3"/>
  <line x1="345" y1="65" x2="315" y2="90" stroke="#EF4444" stroke-width="3"/>
  <text x="360" y="82" fill="#EF4444" font-family="sans-serif" font-size="14" font-weight="bold">NON-FUNCTIONAL</text>
  <rect x="20" y="20" width="220" height="34" rx="4" fill="#000000" opacity="0.6"/>
  <text x="30" y="42" fill="#FFFFFF" font-family="sans-serif" font-size="14" font-weight="bold">Field Evidence: Streetlight Defect</text>
</svg>`);

const SAMPLE_IMAGE_WATER = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#334155"/>
  <path d="M0,260 Q300,240 600,260 L600,400 L0,400 Z" fill="#1E293B"/>
  <ellipse cx="300" cy="300" rx="200" ry="70" fill="#0284C7" opacity="0.7"/>
  <ellipse cx="300" cy="300" rx="140" ry="45" fill="#38BDF8" opacity="0.8"/>
  <ellipse cx="300" cy="295" rx="50" ry="15" fill="#E0F2FE"/>
  <path d="M290,290 C290,230 310,230 310,290" stroke="#BAE6FD" stroke-width="6" fill="none"/>
  <rect x="20" y="20" width="220" height="34" rx="4" fill="#000000" opacity="0.6"/>
  <text x="30" y="42" fill="#FFFFFF" font-family="sans-serif" font-size="14" font-weight="bold">Field Evidence: Water Main Leak</text>
</svg>`);

const SAMPLE_IMAGE_RESOLUTION = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#1E293B"/>
  <path d="M0,280 L600,280 L600,400 L0,400 Z" fill="#0F172A"/>
  <rect x="180" y="220" width="240" height="80" rx="8" fill="#334155"/>
  <line x1="0" y1="280" x2="600" y2="280" stroke="#10B981" stroke-width="6"/>
  <circle cx="300" cy="180" r="45" fill="#10B981"/>
  <path d="M285,180 L295,190 L320,165" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <rect x="20" y="20" width="240" height="34" rx="4" fill="#065F46" opacity="0.9"/>
  <text x="30" y="42" fill="#ECFDF5" font-family="sans-serif" font-size="14" font-weight="bold">Field Verification: Fixed & Restored</text>
</svg>`);

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept_pwd',
    name: 'Public Works & Urban Roads (PWD)',
    code: 'PWD',
    contact_email: 'roads.pwd@civicfix.org',
    active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'dept_swm',
    name: 'Solid Waste Management & Sanitation',
    code: 'SWM',
    contact_email: 'sanitation.swm@civicfix.org',
    active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'dept_water',
    name: 'Urban Water Supply & Sewerage Board',
    code: 'BWSSB',
    contact_email: 'waterboard@civicfix.org',
    active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'dept_elec',
    name: 'Street Lighting & Electrical Division',
    code: 'ELEC',
    contact_email: 'lighting@civicfix.org',
    active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'dept_drain',
    name: 'Storm Water Drains & Flood Management',
    code: 'SWD',
    contact_email: 'drains@civicfix.org',
    active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'dept_traffic',
    name: 'Traffic Engineering & Road Safety',
    code: 'TRAFFIC',
    contact_email: 'trafficsignals@civicfix.org',
    active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
];

export const INITIAL_ZONES: Zone[] = [
  { id: 'zone_east', name: 'East Zone', code: 'EZ', description: 'Covers Indiranagar, Whitefield, and surrounding commercial corridors' },
  { id: 'zone_south', name: 'South Zone', code: 'SZ', description: 'Covers Koramangala, Jayanagar, and HSR Layout areas' },
  { id: 'zone_west', name: 'West Zone', code: 'WZ', description: 'Covers Malleshwaram, Rajajinagar, and industrial belts' },
  { id: 'zone_north', name: 'North Zone', code: 'NZ', description: 'Covers Hebbal, Yelahanka, and northern transit highways' },
  { id: 'zone_central', name: 'Central Zone', code: 'CZ', description: 'Central Business District and historic civic quarters' },
];

export const INITIAL_WARDS: Ward[] = [
  { id: 'ward_101', ward_number: 101, ward_name: 'Indiranagar', zone_id: 'zone_east', zone_name: 'East Zone', office_address: '100ft Road Municipal Complex', contact_phone: '+91 80 2520 1001' },
  { id: 'ward_102', ward_number: 102, ward_name: 'Koramangala', zone_id: 'zone_south', zone_name: 'South Zone', office_address: '80ft Road Ward Sub-Office', contact_phone: '+91 80 2553 1002' },
  { id: 'ward_103', ward_number: 103, ward_name: 'Malleshwaram', zone_id: 'zone_west', zone_name: 'West Zone', office_address: 'Margosa Road Civic Centre', contact_phone: '+91 80 2334 1003' },
  { id: 'ward_104', ward_number: 104, ward_name: 'Jayanagar', zone_id: 'zone_south', zone_name: 'South Zone', office_address: '4th Block Community Complex', contact_phone: '+91 80 2665 1004' },
  { id: 'ward_105', ward_number: 105, ward_name: 'HSR Layout', zone_id: 'zone_south', zone_name: 'South Zone', office_address: 'Sector 2 Municipal Sub-Station', contact_phone: '+91 80 2572 1005' },
  { id: 'ward_106', ward_number: 106, ward_name: 'Central Business District', zone_id: 'zone_central', zone_name: 'Central Zone', office_address: 'MG Road Town Hall Annex', contact_phone: '+91 80 2221 1006' },
];

export const INITIAL_SLA_RULES: SLARule[] = [
  { id: 'sla_crit', priority: 'Critical', max_hours: 4, escalation_hours: 4, active: true },
  { id: 'sla_high', priority: 'High', max_hours: 24, escalation_hours: 24, active: true },
  { id: 'sla_med', priority: 'Medium', max_hours: 72, escalation_hours: 72, active: true },
  { id: 'sla_low', priority: 'Low', max_hours: 168, escalation_hours: 168, active: true },
];

const INITIAL_PROFILES = [
  {
    id: 'usr_citizen_1',
    full_name: 'Ramesh Kumar',
    email: 'citizen@civicfix.org',
    password_hash: hashPassword('Citizen@2026'),
    phone_number: '+91 98765 43210',
    role: 'citizen' as const,
    created_at: '2026-03-01T08:00:00Z',
  },
  {
    id: 'usr_citizen_2',
    full_name: 'Ramesh Kumar',
    email: 'citizen@example.com',
    password_hash: hashPassword('Password@123'),
    phone_number: '+91 98765 43210',
    role: 'citizen' as const,
    created_at: '2026-03-01T08:00:00Z',
  },
  {
    id: 'usr_authority_1',
    full_name: 'Priya Sharma',
    email: 'ward.officer@civicfix.org',
    password_hash: hashPassword('Officer@2026'),
    phone_number: '+91 94480 12345',
    role: 'authority' as const,
    department: 'Public Works & Urban Roads (PWD)',
    designation: 'Senior Ward Officer',
    created_at: '2026-01-15T09:00:00Z',
  },
  {
    id: 'usr_authority_2',
    full_name: 'Arun Patil',
    email: 'swm.inspector@civicfix.org',
    password_hash: hashPassword('Officer@2026'),
    phone_number: '+91 94480 67890',
    role: 'authority' as const,
    department: 'Solid Waste Management & Sanitation',
    designation: 'Chief Sanitation Inspector',
    created_at: '2026-01-16T10:00:00Z',
  },
  {
    id: 'usr_authority_3',
    full_name: 'Priya Sharma',
    email: 'authority@civicfix.org',
    password_hash: hashPassword('Authority@123'),
    phone_number: '+91 94480 12345',
    role: 'authority' as const,
    department: 'Public Works & Urban Roads (PWD)',
    designation: 'Senior Ward Officer',
    created_at: '2026-01-15T09:00:00Z',
  },
];

const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'CF-100001',
    user_id: 'usr_citizen_1',
    user_name: 'Ramesh Kumar',
    user_email: 'citizen@example.com',
    user_phone: '+91 98765 43210',
    category: 'Pothole',
    priority: 'High',
    description: 'Severe deep crater-like pothole located near 12th Main junction on 100 Feet Road. Two two-wheelers skidded during rain yesterday evening.',
    ai_summary: 'Severe road surface pothole (~1.2m diameter) obstructing active vehicular traffic lane and presenting two-wheeler collision risk.',
    ai_reason: 'High traffic corridor combined with wet road conditions creates severe hazard for commuter safety.',
    ai_detected_features: ['Asphalt disintegration', 'Exposed ballast rock', 'Approx 1.2m diameter', 'Primary arterial road'],
    latitude: 12.9784,
    longitude: 77.6408,
    location_text: 'Indiranagar 100ft Road near 12th Main, Bengaluru',
    ward_id: 'ward_101',
    ward_name: 'Indiranagar',
    zone_id: 'zone_east',
    zone_name: 'East Zone',
    status: 'Submitted',
    image_url: SAMPLE_IMAGE_POTHOLE,
    sla_hours: 24,
    due_at: '2026-09-20T10:30:00Z',
    escalation_level: 0,
    created_at: '2026-09-18T10:30:00Z',
    updated_at: '2026-09-18T10:30:00Z',
  },
  {
    id: 'CF-100002',
    user_id: 'usr_citizen_1',
    user_name: 'Ramesh Kumar',
    user_email: 'citizen@example.com',
    user_phone: '+91 98765 43210',
    category: 'Garbage',
    priority: 'Medium',
    description: 'Commercial waste and vegetable refuse dumped outside designated bin near water tank for over 4 days. Strong foul odor.',
    ai_summary: 'Uncollected municipal solid waste overflow around collection bin causing pedestrian obstruction and sanitation concern.',
    ai_reason: 'Medium priority public health hazard due to decomposition and stray animal scavenging.',
    ai_detected_features: ['Overflowing solid waste', 'Organic refuse', 'Public sidewalk encroachment', 'Fly breeding risk'],
    latitude: 12.9352,
    longitude: 77.6245,
    location_text: 'Koramangala 4th Block, 80ft Road, Bengaluru',
    ward_id: 'ward_102',
    ward_name: 'Koramangala',
    zone_id: 'zone_south',
    zone_name: 'South Zone',
    status: 'Assigned',
    image_url: SAMPLE_IMAGE_GARBAGE,
    sla_hours: 72,
    due_at: '2026-09-21T11:00:00Z',
    escalation_level: 0,
    created_at: '2026-09-17T09:15:00Z',
    updated_at: '2026-09-17T11:00:00Z',
    assigned_to_department: 'Solid Waste Management & Sanitation',
    assigned_to_officer: 'Arun Patil',
  },
  {
    id: 'CF-100003',
    user_id: 'usr_citizen_1',
    user_name: 'Ramesh Kumar',
    user_email: 'citizen@example.com',
    user_phone: '+91 98765 43210',
    category: 'Streetlight',
    priority: 'Low',
    description: 'Two consecutive street poles have been flickering and completely dark between 8pm and 5am on 8th Cross.',
    ai_summary: 'Defective LED illumination on street lighting poles causing nighttime visibility deficit.',
    ai_reason: 'Residential street with low evening pedestrian density; standard non-emergency electrical maintenance.',
    ai_detected_features: ['Electrical lighting pole', 'LED driver failure pattern', 'Dark corridor'],
    latitude: 13.0031,
    longitude: 77.5703,
    location_text: 'Malleshwaram 8th Cross, Bengaluru',
    ward_id: 'ward_103',
    ward_name: 'Malleshwaram',
    zone_id: 'zone_west',
    zone_name: 'West Zone',
    status: 'In Progress',
    image_url: SAMPLE_IMAGE_STREETLIGHT,
    sla_hours: 168,
    due_at: '2026-09-23T14:20:00Z',
    escalation_level: 0,
    created_at: '2026-09-15T19:40:00Z',
    updated_at: '2026-09-16T14:20:00Z',
    assigned_to_department: 'Street Lighting & Electrical Division',
    assigned_to_officer: 'Sunil Gowda (Junior Engineer)',
  },
  {
    id: 'CF-100004',
    user_id: 'usr_citizen_1',
    user_name: 'Ramesh Kumar',
    user_email: 'citizen@example.com',
    user_phone: '+91 98765 43210',
    category: 'Water Leakage',
    priority: 'Critical',
    description: 'Major drinking water supply distribution line cracked. Clean water gushing at high pressure into main street, eroding road foundation.',
    ai_summary: 'High-pressure potable water main breach creating continuous localized flooding and sub-base road erosion.',
    ai_reason: 'Critical loss of precious drinking water resources and imminent threat of road collapse under vehicular load.',
    ai_detected_features: ['Pressurized water jet', 'Sub-base soil saturation', 'Foundation erosion risk'],
    latitude: 12.9299,
    longitude: 77.5828,
    location_text: 'Jayanagar 4th Block, 11th Main Road, Bengaluru',
    ward_id: 'ward_104',
    ward_name: 'Jayanagar',
    zone_id: 'zone_south',
    zone_name: 'South Zone',
    status: 'Resolved',
    image_url: SAMPLE_IMAGE_WATER,
    resolution_image_url: SAMPLE_IMAGE_RESOLUTION,
    resolution_notes: 'Pipeline flange replacement and hydrostatic pressure testing completed. Trench backfilled and surfaced.',
    resolved_at: '2026-09-13T16:45:00Z',
    sla_hours: 4,
    due_at: '2026-09-12T12:00:00Z',
    escalation_level: 0,
    created_at: '2026-09-12T07:10:00Z',
    updated_at: '2026-09-13T16:45:00Z',
    assigned_to_department: 'Urban Water Supply & Sewerage Board',
    assigned_to_officer: 'M. S. Murthy',
  },
  {
    id: 'CF-100005',
    user_id: 'usr_citizen_1',
    user_name: 'Ramesh Kumar',
    user_email: 'citizen@example.com',
    user_phone: '+91 98765 43210',
    category: 'Drainage',
    priority: 'High',
    description: 'Storm water drain silt chamber blocked by plastic debris. Rainwater overflowing onto pedestrian walkway and school gate entrance.',
    ai_summary: 'Silt and debris block in roadside storm water drain causing wastewater backflow onto public school entrance.',
    ai_reason: 'High priority due to pedestrian walkway blockage directly impacting pedestrian and student access.',
    ai_detected_features: ['Silt blockage', 'Stagnant storm runoff', 'Walkway subversion'],
    latitude: 12.9116,
    longitude: 77.6389,
    location_text: 'HSR Layout Sector 2, 27th Main, Bengaluru',
    ward_id: 'ward_105',
    ward_name: 'HSR Layout',
    zone_id: 'zone_south',
    zone_name: 'South Zone',
    status: 'Submitted',
    image_url: SAMPLE_IMAGE_GARBAGE,
    sla_hours: 24,
    due_at: '2026-09-20T11:20:00Z',
    escalation_level: 0,
    created_at: '2026-09-19T11:20:00Z',
    updated_at: '2026-09-19T11:20:00Z',
  },
  {
    id: 'CF-100006',
    user_id: 'usr_citizen_1',
    user_name: 'Ramesh Kumar',
    user_email: 'citizen@example.com',
    user_phone: '+91 98765 43210',
    category: 'Traffic Signal',
    priority: 'High',
    description: 'Pedestrian countdown timer and traffic signal stuck on flashing amber for 2 days. Pedestrians unable to cross safely during rush hour.',
    ai_summary: 'Signal controller electronic failure at high-density pedestrian junction.',
    ai_reason: 'High safety hazard for crossing pedestrians on major commercial thoroughfare.',
    ai_detected_features: ['Traffic signal unit', 'Amber fault indicator', 'Crosswalk intersection'],
    latitude: 12.9756,
    longitude: 77.6094,
    location_text: 'MG Road - Brigade Road Junction, Bengaluru',
    ward_id: 'ward_106',
    ward_name: 'Central Business District',
    zone_id: 'zone_central',
    zone_name: 'Central Zone',
    status: 'Assigned',
    image_url: SAMPLE_IMAGE_STREETLIGHT,
    sla_hours: 24,
    due_at: '2026-09-19T16:00:00Z',
    escalation_level: 1, // Past due, escalated to supervisor
    created_at: '2026-09-18T14:00:00Z',
    updated_at: '2026-09-18T16:30:00Z',
    assigned_to_department: 'Traffic Engineering & Road Safety',
    assigned_to_officer: 'Inspector V. Rao',
  },
];

const INITIAL_STATUS_HISTORY: ComplaintStatusHistory[] = [
  {
    id: 'csh_1001',
    complaint_id: 'CF-100001',
    from_status: 'Submitted',
    to_status: 'Submitted',
    changed_by_user_id: 'usr_citizen_1',
    changed_by_name: 'Ramesh Kumar (Citizen)',
    notes: 'Citizen registered grievance report with location and photograph.',
    created_at: '2026-09-18T10:30:00Z',
  },
  {
    id: 'csh_1002',
    complaint_id: 'CF-100002',
    from_status: 'Submitted',
    to_status: 'Assigned',
    changed_by_user_id: 'usr_authority_1',
    changed_by_name: 'Priya Sharma (Ward Officer)',
    notes: 'Report verified via AI classification. Assigned to Solid Waste Management Division for immediate clearing.',
    created_at: '2026-09-17T11:00:00Z',
  },
  {
    id: 'csh_1003',
    complaint_id: 'CF-100003',
    from_status: 'Assigned',
    to_status: 'In Progress',
    changed_by_user_id: 'usr_authority_1',
    changed_by_name: 'Priya Sharma (Ward Officer)',
    notes: 'Lineman dispatched with replacement LED driver and aerial ladder vehicle.',
    created_at: '2026-09-16T14:20:00Z',
  },
  {
    id: 'csh_1004',
    complaint_id: 'CF-100004',
    from_status: 'Submitted',
    to_status: 'Assigned',
    changed_by_user_id: 'usr_authority_1',
    changed_by_name: 'Priya Sharma (Ward Officer)',
    notes: 'Emergency water valve isolation dispatched.',
    created_at: '2026-09-12T08:00:00Z',
  },
  {
    id: 'csh_1005',
    complaint_id: 'CF-100004',
    from_status: 'Assigned',
    to_status: 'In Progress',
    changed_by_user_id: 'usr_authority_1',
    changed_by_name: 'Priya Sharma (Ward Officer)',
    notes: 'Trench excavated, replacement high-density polyethylene collar installed.',
    created_at: '2026-09-12T12:30:00Z',
  },
  {
    id: 'csh_1006',
    complaint_id: 'CF-100004',
    from_status: 'In Progress',
    to_status: 'Resolved',
    changed_by_user_id: 'usr_authority_1',
    changed_by_name: 'Priya Sharma (Ward Officer)',
    notes: 'Pipeline welded, pressure tested successfully at 4.5 bar, and trench backfilled with bitumen cold mix.',
    created_at: '2026-09-13T16:45:00Z',
  },
  {
    id: 'csh_1007',
    complaint_id: 'CF-100005',
    from_status: 'Submitted',
    to_status: 'Submitted',
    changed_by_user_id: 'usr_citizen_1',
    changed_by_name: 'Ramesh Kumar (Citizen)',
    notes: 'Citizen registered drainage blockage issue near school gate.',
    created_at: '2026-09-19T11:20:00Z',
  },
  {
    id: 'csh_1008',
    complaint_id: 'CF-100006',
    from_status: 'Submitted',
    to_status: 'Assigned',
    changed_by_user_id: 'usr_authority_1',
    changed_by_name: 'Priya Sharma (Ward Officer)',
    notes: 'Ticket assigned to Traffic Engineering & Signals Cell.',
    created_at: '2026-09-18T16:30:00Z',
  },
];

const INITIAL_ASSIGNMENTS: ComplaintAssignment[] = [
  {
    id: 'asg_101',
    complaint_id: 'CF-100002',
    assigned_by_user_id: 'usr_authority_1',
    assigned_by_name: 'Priya Sharma',
    assigned_to_department: 'Solid Waste Management & Sanitation',
    assigned_to_officer: 'Arun Patil',
    internal_note: 'Deploy auto-tipper vehicle and 3 sanitation workers for priority clearance.',
    created_at: '2026-09-17T11:00:00Z',
  },
  {
    id: 'asg_102',
    complaint_id: 'CF-100003',
    assigned_by_user_id: 'usr_authority_1',
    assigned_by_name: 'Priya Sharma',
    assigned_to_department: 'Street Lighting & Electrical Division',
    assigned_to_officer: 'Sunil Gowda (Junior Engineer)',
    internal_note: 'Inspect junction box wiring on pole 8C-12.',
    created_at: '2026-09-16T10:00:00Z',
  },
  {
    id: 'asg_103',
    complaint_id: 'CF-100004',
    assigned_by_user_id: 'usr_authority_1',
    assigned_by_name: 'Priya Sharma',
    assigned_to_department: 'Urban Water Supply & Sewerage Board',
    assigned_to_officer: 'M. S. Murthy',
    internal_note: 'Emergency pipeline crew dispatched under ticket BWSSB-EM-882.',
    created_at: '2026-09-12T08:00:00Z',
  },
  {
    id: 'asg_104',
    complaint_id: 'CF-100006',
    assigned_by_user_id: 'usr_authority_1',
    assigned_by_name: 'Priya Sharma',
    assigned_to_department: 'Traffic Engineering & Road Safety',
    assigned_to_officer: 'Inspector V. Rao',
    internal_note: 'Check synchronization card and optic LED heads.',
    created_at: '2026-09-18T16:30:00Z',
  },
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    user_id: 'usr_citizen_1',
    complaint_id: 'CF-100004',
    title: 'Complaint Resolved — Action Required',
    message: 'Grievance CF-100004 (Water Leakage at Jayanagar 4th Block) has been marked resolved. Please inspect and confirm resolution.',
    read: false,
    type: 'resolution',
    created_at: '2026-09-13T16:45:00Z',
  },
  {
    id: 'notif_2',
    user_id: 'usr_citizen_1',
    complaint_id: 'CF-100003',
    title: 'Status Updated: In Progress',
    message: 'Grievance CF-100003 (Streetlight at Malleshwaram 8th Cross) is currently being worked on by Electrical Division.',
    read: false,
    type: 'status_update',
    created_at: '2026-09-16T14:20:00Z',
  },
  {
    id: 'notif_3',
    user_id: 'usr_citizen_1',
    complaint_id: 'CF-100002',
    title: 'Complaint Assigned',
    message: 'Grievance CF-100002 (Garbage at Koramangala 4th Block) has been assigned to Solid Waste Management.',
    read: true,
    type: 'assignment',
    created_at: '2026-09-17T11:00:00Z',
  },
  {
    id: 'notif_4',
    user_id: 'usr_citizen_1',
    complaint_id: 'CF-100001',
    title: 'Complaint Registered',
    message: 'Your report CF-100001 has been registered. AI triage recommended priority: High.',
    read: true,
    type: 'status_update',
    created_at: '2026-09-18T10:30:00Z',
  },
  {
    id: 'notif_5',
    user_id: 'usr_authority_1',
    complaint_id: 'CF-100006',
    title: 'SLA Escalation Alert',
    message: 'Ticket CF-100006 (Traffic Signal on MG Road) has exceeded target resolution window and has been escalated.',
    read: false,
    type: 'sla_warning',
    created_at: '2026-09-19T16:00:00Z',
  },
];

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.complaints && parsed.profiles) {
          let updated = false;

          // Migrate schema if tables are missing
          if (!parsed.departments) {
            parsed.departments = INITIAL_DEPARTMENTS;
            updated = true;
          }
          if (!parsed.zones) {
            parsed.zones = INITIAL_ZONES;
            updated = true;
          }
          if (!parsed.wards) {
            parsed.wards = INITIAL_WARDS;
            updated = true;
          }
          if (!parsed.sla_rules) {
            parsed.sla_rules = INITIAL_SLA_RULES;
            updated = true;
          }
          if (!parsed.citizen_feedback) {
            parsed.citizen_feedback = [];
            updated = true;
          }
          if (!parsed.complaint_comments) {
            parsed.complaint_comments = [];
            updated = true;
          }
          if (!parsed.audit_logs) {
            parsed.audit_logs = [];
            updated = true;
          }

          // Ensure standard profiles exist
          for (const initP of INITIAL_PROFILES) {
            const exists = parsed.profiles.some(
              (p: any) => p.email.toLowerCase() === initP.email.toLowerCase()
            );
            if (!exists) {
              parsed.profiles.push(initP);
              updated = true;
            }
          }

          if (updated) {
            this.saveData(parsed);
          }
          return parsed;
        }
      }
    } catch (err) {
      console.error('Error loading DB file, initializing fresh:', err);
    }

    const initialData: DatabaseSchema = {
      profiles: INITIAL_PROFILES,
      departments: INITIAL_DEPARTMENTS,
      zones: INITIAL_ZONES,
      wards: INITIAL_WARDS,
      sla_rules: INITIAL_SLA_RULES,
      complaints: INITIAL_COMPLAINTS,
      complaint_images: INITIAL_COMPLAINTS.map((c) => ({
        id: `img_${c.id}`,
        complaint_id: c.id,
        image_url: c.image_url || SAMPLE_IMAGE_POTHOLE,
        image_type: 'evidence' as const,
        uploaded_at: c.created_at,
      })),
      complaint_status_history: INITIAL_STATUS_HISTORY,
      complaint_assignments: INITIAL_ASSIGNMENTS,
      complaint_comments: [],
      citizen_feedback: [],
      notifications: INITIAL_NOTIFICATIONS,
      audit_logs: [],
    };

    this.saveData(initialData);
    return initialData;
  }

  private saveData(dataToSave?: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = dataToSave || this.data;
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database to disk:', err);
    }
  }

  // --- Profiles / Users ---
  public findProfileByEmail(email: string) {
    return this.data.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
  }

  public findProfileById(id: string) {
    return this.data.profiles.find((p) => p.id === id);
  }

  public createProfile(params: {
    full_name: string;
    email: string;
    password: string;
    phone_number?: string;
    role?: 'citizen' | 'authority';
    department?: string;
    designation?: string;
  }): UserProfile {
    const existing = this.findProfileByEmail(params.email);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const id = `usr_${params.role === 'authority' ? 'auth' : 'cit'}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newProfile = {
      id,
      full_name: params.full_name.trim(),
      email: params.email.trim().toLowerCase(),
      password_hash: hashPassword(params.password),
      phone_number: params.phone_number?.trim(),
      role: params.role || 'citizen',
      department: params.department?.trim(),
      designation: params.designation?.trim(),
      created_at: new Date().toISOString(),
    };

    this.data.profiles.push(newProfile);
    this.saveData();

    const { password_hash, ...profileWithoutHash } = newProfile;
    return profileWithoutHash;
  }

  public upsertGoogleProfile(params: {
    uid: string;
    email: string;
    full_name: string;
    photoURL?: string;
    role?: 'citizen' | 'authority' | 'admin';
  }): UserProfile {
    let profile = this.data.profiles.find(
      (p) => p.id === params.uid || p.email.toLowerCase() === params.email.toLowerCase()
    );

    if (profile) {
      if (params.full_name) profile.full_name = params.full_name;
      if (params.photoURL) (profile as any).avatar_url = params.photoURL;
      this.saveData();
      const { password_hash, ...safe } = profile;
      return safe as UserProfile;
    }

    const roleToAssign = params.role || (params.email.toLowerCase() === 'abhishekbv7204@gmail.com' ? 'admin' : 'citizen');

    const newProfile: any = {
      id: params.uid,
      full_name: params.full_name || params.email.split('@')[0],
      email: params.email.trim().toLowerCase(),
      password_hash: 'firebase_oauth_managed',
      avatar_url: params.photoURL,
      role: roleToAssign,
      created_at: new Date().toISOString(),
    };

    this.data.profiles.push(newProfile);
    this.saveData();
    const { password_hash, ...safe } = newProfile;
    return safe as UserProfile;
  }


  // --- Departments, Wards & Zones ---
  public getDepartments(): Department[] {
    return this.data.departments || INITIAL_DEPARTMENTS;
  }

  public createDepartment(params: { name: string; code: string; contact_email?: string }): Department {
    const dept: Department = {
      id: `dept_${Date.now()}`,
      name: params.name.trim(),
      code: params.code.trim().toUpperCase(),
      contact_email: params.contact_email?.trim(),
      active: true,
      created_at: new Date().toISOString(),
    };
    this.data.departments.push(dept);
    this.saveData();
    return dept;
  }

  public getZones(): Zone[] {
    return this.data.zones || INITIAL_ZONES;
  }

  public getWards(): Ward[] {
    return this.data.wards || INITIAL_WARDS;
  }

  public createWard(params: { ward_number: number; ward_name: string; zone_id: string; contact_phone?: string }): Ward {
    const zone = this.getZones().find((z) => z.id === params.zone_id);
    const ward: Ward = {
      id: `ward_${params.ward_number}`,
      ward_number: params.ward_number,
      ward_name: params.ward_name.trim(),
      zone_id: params.zone_id,
      zone_name: zone ? zone.name : 'Municipal Zone',
      contact_phone: params.contact_phone?.trim(),
    };
    this.data.wards.push(ward);
    this.saveData();
    return ward;
  }

  // --- SLA Rules & Computation ---
  public getSLARules(): SLARule[] {
    return this.data.sla_rules || INITIAL_SLA_RULES;
  }

  public updateSLARules(rules: SLARule[]): SLARule[] {
    this.data.sla_rules = rules;
    this.saveData();
    return this.data.sla_rules;
  }

  private calculateSLAHours(priority: ComplaintPriority, category?: ComplaintCategory): number {
    const rules = this.getSLARules();
    const rule = rules.find((r) => r.priority === priority);
    if (rule) return rule.max_hours;
    if (priority === 'Critical') return 4;
    if (priority === 'High') return 24;
    if (priority === 'Medium') return 72;
    return 168;
  }

  private enrichComplaintSLA(complaint: Complaint): Complaint {
    const now = Date.now();
    const dueTime = complaint.due_at ? new Date(complaint.due_at).getTime() : now;
    const diffHours = (dueTime - now) / (1000 * 60 * 60);

    const isResolvedOrClosed =
      complaint.status === 'Resolved' || complaint.status === 'Closed' || complaint.status === 'Rejected';

    const isOverdue = !isResolvedOrClosed && diffHours < 0;
    const remainingHours = Math.round(diffHours * 10) / 10;

    let escalationLevel = complaint.escalation_level || 0;
    if (isOverdue) {
      if (diffHours < -24) {
        escalationLevel = 2; // Dept Head
      } else {
        escalationLevel = 1; // Supervisor
      }
    }

    return {
      ...complaint,
      is_overdue: isOverdue,
      remaining_hours: remainingHours,
      escalation_level: escalationLevel,
    };
  }

  // --- Complaints ---
  public getComplaints(filter?: {
    userId?: string;
    status?: ComplaintStatus;
    category?: ComplaintCategory;
    priority?: ComplaintPriority;
    department?: string;
    ward_id?: string;
    zone_id?: string;
    overdueOnly?: boolean;
    search?: string;
  }): Complaint[] {
    let list = this.data.complaints.map((c) => this.enrichComplaintSLA(c));

    if (filter?.userId) {
      list = list.filter((c) => c.user_id === filter.userId);
    }
    if (filter?.status) {
      if (filter.status === 'Reported' || filter.status === 'Submitted') {
        list = list.filter((c) => c.status === 'Reported' || c.status === 'Submitted');
      } else {
        list = list.filter((c) => c.status === filter.status);
      }
    }
    if (filter?.category) {
      list = list.filter((c) => c.category === filter.category);
    }
    if (filter?.priority) {
      list = list.filter((c) => c.priority === filter.priority);
    }
    if (filter?.department) {
      list = list.filter((c) => c.assigned_to_department?.toLowerCase().includes(filter.department!.toLowerCase()));
    }
    if (filter?.ward_id) {
      list = list.filter((c) => c.ward_id === filter.ward_id);
    }
    if (filter?.zone_id) {
      list = list.filter((c) => c.zone_id === filter.zone_id);
    }
    if (filter?.overdueOnly) {
      list = list.filter((c) => Boolean(c.is_overdue));
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.location_text.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          (c.assigned_to_department && c.assigned_to_department.toLowerCase().includes(q)) ||
          (c.ward_name && c.ward_name.toLowerCase().includes(q))
      );
    }

    // Default newest first
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getComplaintById(id: string): {
    complaint: Complaint;
    images: ComplaintImage[];
    history: ComplaintStatusHistory[];
    assignments: ComplaintAssignment[];
    comments: ComplaintComment[];
  } | null {
    const raw = this.data.complaints.find((c) => c.id.toUpperCase() === id.toUpperCase());
    if (!raw) return null;

    const complaint = this.enrichComplaintSLA(raw);
    const images = this.data.complaint_images.filter((img) => img.complaint_id === raw.id);
    const history = this.data.complaint_status_history
      .filter((h) => h.complaint_id === raw.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const assignments = this.data.complaint_assignments
      .filter((a) => a.complaint_id === raw.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const comments = (this.data.complaint_comments || [])
      .filter((cm) => cm.complaint_id === raw.id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return { complaint, images, history, assignments, comments };
  }

  public createComplaint(params: {
    userId: string;
    userName?: string;
    userEmail?: string;
    userPhone?: string;
    category: ComplaintCategory;
    priority: ComplaintPriority;
    description: string;
    ai_summary: string;
    ai_reason: string;
    ai_detected_features: string[];
    latitude: number;
    longitude: number;
    location_text: string;
    image_url?: string;
    ward_id?: string;
  }): Complaint {
    // Generate sequential reference ID (e.g. CF-100007)
    const existingCount = this.data.complaints.length;
    const nextNumber = 100000 + existingCount + 1;
    const complaintId = `CF-${nextNumber}`;
    const now = new Date().toISOString();

    // Ward & Zone mapping
    let ward_name = undefined;
    let zone_id = undefined;
    let zone_name = undefined;

    if (params.ward_id) {
      const w = this.getWards().find((wd) => wd.id === params.ward_id);
      if (w) {
        ward_name = w.ward_name;
        zone_id = w.zone_id;
        zone_name = w.zone_name;
      }
    } else {
      // Pick first ward as sensible default if not selected
      const defaultWard = this.getWards()[0];
      if (defaultWard) {
        params.ward_id = defaultWard.id;
        ward_name = defaultWard.ward_name;
        zone_id = defaultWard.zone_id;
        zone_name = defaultWard.zone_name;
      }
    }

    // SLA calculation
    const sla_hours = this.calculateSLAHours(params.priority, params.category);
    const due_at = new Date(Date.now() + sla_hours * 60 * 60 * 1000).toISOString();

    // Auto-recommend department
    const recommendedDept = CATEGORY_DEPARTMENT_MAP[params.category] || 'Public Works & Urban Roads (PWD)';

    const newComplaint: Complaint = {
      id: complaintId,
      user_id: params.userId,
      user_name: params.userName || 'Citizen',
      user_email: params.userEmail,
      user_phone: params.userPhone,
      category: params.category,
      priority: params.priority,
      description: params.description.trim(),
      ai_summary: params.ai_summary,
      ai_reason: params.ai_reason,
      ai_detected_features: params.ai_detected_features,
      latitude: params.latitude,
      longitude: params.longitude,
      location_text: params.location_text.trim(),
      ward_id: params.ward_id,
      ward_name,
      zone_id,
      zone_name,
      status: 'Submitted',
      image_url: params.image_url || SAMPLE_IMAGE_POTHOLE,
      sla_hours,
      due_at,
      escalation_level: 0,
      assigned_to_department: recommendedDept,
      created_at: now,
      updated_at: now,
    };

    this.data.complaints.unshift(newComplaint);

    // Initial evidence image
    if (params.image_url) {
      this.data.complaint_images.push({
        id: `img_${complaintId}_01`,
        complaint_id: complaintId,
        image_url: params.image_url,
        image_type: 'evidence',
        uploaded_at: now,
      });
    }

    // Initial status history
    this.data.complaint_status_history.push({
      id: `csh_${Date.now()}`,
      complaint_id: complaintId,
      from_status: 'Submitted',
      to_status: 'Submitted',
      changed_by_user_id: params.userId,
      changed_by_name: params.userName ? `${params.userName} (Citizen)` : 'Citizen',
      notes: `Grievance submitted with location coordinates. Initial AI triage categorized as ${params.category} (${params.priority} Priority). Recommended routing: ${recommendedDept}.`,
      created_at: now,
    });

    // Create confirmation notification for citizen
    this.createNotification({
      userId: params.userId,
      complaintId,
      title: 'Complaint Registered',
      message: `Your grievance ${complaintId} (${params.category}) has been submitted. Resolution window: ${sla_hours} hours.`,
      type: 'status_update',
    });

    // Notify authority officers
    const authorities = this.data.profiles.filter((p) => p.role === 'authority');
    for (const auth of authorities) {
      this.createNotification({
        userId: auth.id,
        complaintId,
        title: `New ${params.priority} Priority Complaint`,
        message: `New report ${complaintId} in ${ward_name || 'ward'} awaiting action. Category: ${params.category}.`,
        type: 'status_update',
      });
    }

    this.saveData();
    return this.enrichComplaintSLA(newComplaint);
  }

  public updateComplaintStatus(params: {
    complaintId: string;
    status: ComplaintStatus;
    userId: string;
    userName: string;
    notes?: string;
  }): Complaint {
    const complaint = this.data.complaints.find((c) => c.id.toUpperCase() === params.complaintId.toUpperCase());
    if (!complaint) {
      throw new Error(`Complaint ${params.complaintId} not found.`);
    }

    const oldStatus = complaint.status;
    const now = new Date().toISOString();
    complaint.status = params.status;
    complaint.updated_at = now;

    if (params.status === 'Closed') {
      complaint.closed_at = now;
    }

    // Record status history
    this.data.complaint_status_history.push({
      id: `csh_${Date.now()}`,
      complaint_id: complaint.id,
      from_status: oldStatus,
      to_status: params.status,
      changed_by_user_id: params.userId,
      changed_by_name: params.userName,
      notes: params.notes || `Status changed from ${oldStatus} to ${params.status}`,
      created_at: now,
    });

    // Notify citizen
    this.createNotification({
      userId: complaint.user_id,
      complaintId: complaint.id,
      title: `Status Updated: ${params.status}`,
      message: `Your grievance ${complaint.id} status is now "${params.status}". ${params.notes || ''}`,
      type: 'status_update',
    });

    this.saveData();
    return this.enrichComplaintSLA(complaint);
  }

  public assignComplaint(params: {
    complaintId: string;
    assignedByUserId: string;
    assignedByName: string;
    department: string;
    officer: string;
    internalNote?: string;
  }): Complaint {
    const complaint = this.data.complaints.find((c) => c.id.toUpperCase() === params.complaintId.toUpperCase());
    if (!complaint) {
      throw new Error(`Complaint ${params.complaintId} not found.`);
    }

    const now = new Date().toISOString();
    const oldStatus = complaint.status;
    complaint.assigned_to_department = params.department;
    complaint.assigned_to_officer = params.officer;
    if (complaint.status === 'Submitted' || complaint.status === 'Reported') {
      complaint.status = 'Assigned';
    }
    complaint.updated_at = now;

    // Create assignment record
    this.data.complaint_assignments.push({
      id: `asg_${Date.now()}`,
      complaint_id: complaint.id,
      assigned_by_user_id: params.assignedByUserId,
      assigned_by_name: params.assignedByName,
      assigned_to_department: params.department,
      assigned_to_officer: params.officer,
      internal_note: params.internalNote || '',
      created_at: now,
    });

    // Record status history if changed
    if (oldStatus !== complaint.status) {
      this.data.complaint_status_history.push({
        id: `csh_${Date.now()}`,
        complaint_id: complaint.id,
        from_status: oldStatus,
        to_status: complaint.status,
        changed_by_user_id: params.assignedByUserId,
        changed_by_name: params.assignedByName,
        notes: `Assigned to ${params.department} (Officer: ${params.officer}). ${params.internalNote || ''}`,
        created_at: now,
      });
    }

    // Notify citizen
    this.createNotification({
      userId: complaint.user_id,
      complaintId: complaint.id,
      title: 'Complaint Assigned',
      message: `Your complaint ${complaint.id} has been assigned to ${params.department} (Officer: ${params.officer}).`,
      type: 'assignment',
    });

    this.saveData();
    return this.enrichComplaintSLA(complaint);
  }

  public resolveComplaint(params: {
    complaintId: string;
    userId: string;
    userName: string;
    resolutionNotes: string;
    resolutionImageUrl?: string;
  }): Complaint {
    const complaint = this.data.complaints.find((c) => c.id.toUpperCase() === params.complaintId.toUpperCase());
    if (!complaint) {
      throw new Error(`Complaint ${params.complaintId} not found.`);
    }

    const now = new Date().toISOString();
    const oldStatus = complaint.status;
    complaint.status = 'Resolved';
    complaint.resolution_notes = params.resolutionNotes.trim();
    complaint.resolution_image_url = params.resolutionImageUrl || SAMPLE_IMAGE_RESOLUTION;
    complaint.resolved_at = now;
    complaint.updated_at = now;

    // Add resolution image
    this.data.complaint_images.push({
      id: `img_res_${complaint.id}_${Date.now()}`,
      complaint_id: complaint.id,
      image_url: complaint.resolution_image_url,
      image_type: 'resolution',
      uploaded_at: now,
    });

    // Record status history
    this.data.complaint_status_history.push({
      id: `csh_${Date.now()}`,
      complaint_id: complaint.id,
      from_status: oldStatus,
      to_status: 'Resolved',
      changed_by_user_id: params.userId,
      changed_by_name: params.userName,
      notes: `Field work completed: ${params.resolutionNotes.trim()}`,
      created_at: now,
    });

    // Notify citizen to inspect and confirm
    this.createNotification({
      userId: complaint.user_id,
      complaintId: complaint.id,
      title: 'Action Needed: Confirm Resolution',
      message: `Work completed on complaint ${complaint.id}. Please review resolution evidence and confirm if resolved or reopen if issue persists.`,
      type: 'resolution',
    });

    this.saveData();
    return this.enrichComplaintSLA(complaint);
  }

  // Citizen Confirmation & Feedback Flow
  public recordCitizenFeedback(params: {
    complaintId: string;
    userId: string;
    wasResolved: boolean;
    rating?: number;
    comment?: string;
  }): Complaint {
    const complaint = this.data.complaints.find((c) => c.id.toUpperCase() === params.complaintId.toUpperCase());
    if (!complaint) {
      throw new Error(`Complaint ${params.complaintId} not found.`);
    }

    const now = new Date().toISOString();
    const feedback: CitizenFeedback = {
      id: `fb_${Date.now()}`,
      complaint_id: complaint.id,
      user_id: params.userId,
      was_resolved: params.wasResolved,
      rating: params.rating,
      comment: params.comment,
      created_at: now,
    };

    this.data.citizen_feedback.push(feedback);
    complaint.citizen_feedback = feedback;

    if (params.wasResolved) {
      // Move to Closed
      const oldStatus = complaint.status;
      complaint.status = 'Closed';
      complaint.closed_at = now;
      complaint.updated_at = now;

      this.data.complaint_status_history.push({
        id: `csh_${Date.now()}`,
        complaint_id: complaint.id,
        from_status: oldStatus,
        to_status: 'Closed',
        changed_by_user_id: params.userId,
        changed_by_name: `${complaint.user_name || 'Citizen'} (Citizen)`,
        notes: `Citizen verified resolution. Rating: ${params.rating || 5}/5. Feedback: "${params.comment || 'Satisfied'}"`,
        created_at: now,
      });

      this.createNotification({
        userId: params.userId,
        complaintId: complaint.id,
        title: 'Complaint Closed',
        message: `Thank you for confirming resolution for ticket ${complaint.id}. Your feedback helps improve civic services.`,
        type: 'status_update',
      });
    } else {
      // Reopen complaint
      const oldStatus = complaint.status;
      complaint.status = 'Reopened';
      complaint.is_reopened = true;
      complaint.reopen_reason = params.comment || 'Citizen indicated issue is not resolved.';
      complaint.updated_at = now;

      this.data.complaint_status_history.push({
        id: `csh_${Date.now()}`,
        complaint_id: complaint.id,
        from_status: oldStatus,
        to_status: 'Reopened',
        changed_by_user_id: params.userId,
        changed_by_name: `${complaint.user_name || 'Citizen'} (Citizen)`,
        notes: `CITIZEN REOPENED TICKET: Issue was not resolved. Reason: "${params.comment || 'Field issue persists'}"`,
        created_at: now,
      });

      // Alert authorities
      const authorities = this.data.profiles.filter((p) => p.role === 'authority');
      for (const auth of authorities) {
        this.createNotification({
          userId: auth.id,
          complaintId: complaint.id,
          title: 'Ticket Reopened by Citizen',
          message: `Citizen reopened ${complaint.id}. Reason: "${params.comment || 'Work incomplete'}"`,
          type: 'reopened',
        });
      }
    }

    this.saveData();
    return this.enrichComplaintSLA(complaint);
  }

  // Internal and Public Comments
  public addComplaintComment(params: {
    complaintId: string;
    userId: string;
    userName: string;
    userRole: 'citizen' | 'authority' | 'admin';
    comment: string;
    isInternal: boolean;
  }): ComplaintComment {
    const newComment: ComplaintComment = {
      id: `cm_${Date.now()}`,
      complaint_id: params.complaintId,
      user_id: params.userId,
      user_name: params.userName,
      user_role: params.userRole,
      comment: params.comment.trim(),
      is_internal: params.isInternal,
      created_at: new Date().toISOString(),
    };

    if (!this.data.complaint_comments) {
      this.data.complaint_comments = [];
    }
    this.data.complaint_comments.push(newComment);
    this.saveData();
    return newComment;
  }

  public getComplaintComments(complaintId: string, role: string): ComplaintComment[] {
    const all = (this.data.complaint_comments || []).filter(
      (c) => c.complaint_id.toUpperCase() === complaintId.toUpperCase()
    );
    if (role === 'authority' || role === 'admin') {
      return all;
    }
    // Citizens only see public comments
    return all.filter((c) => !c.is_internal);
  }

  public escalateComplaint(params: { complaintId: string; userId: string; userName: string; reason: string }): Complaint {
    const complaint = this.data.complaints.find((c) => c.id.toUpperCase() === params.complaintId.toUpperCase());
    if (!complaint) {
      throw new Error(`Complaint ${params.complaintId} not found.`);
    }

    const currentLevel = complaint.escalation_level || 0;
    const nextLevel = Math.min(currentLevel + 1, 2);
    complaint.escalation_level = nextLevel;
    complaint.updated_at = new Date().toISOString();

    const targetRole = nextLevel === 2 ? 'Department Head' : 'Supervising Officer';

    this.data.complaint_status_history.push({
      id: `csh_${Date.now()}`,
      complaint_id: complaint.id,
      from_status: complaint.status,
      to_status: complaint.status,
      changed_by_user_id: params.userId,
      changed_by_name: params.userName,
      notes: `TICKET ESCALATED to Level ${nextLevel} (${targetRole}). Reason: ${params.reason}`,
      created_at: new Date().toISOString(),
    });

    this.saveData();
    return this.enrichComplaintSLA(complaint);
  }

  public mergeComplaints(params: {
    sourceComplaintId: string;
    targetComplaintId: string;
    officerId: string;
    officerName: string;
    notes?: string;
  }): { source: Complaint; target: Complaint } {
    const source = this.data.complaints.find((c) => c.id.toUpperCase() === params.sourceComplaintId.toUpperCase());
    const target = this.data.complaints.find((c) => c.id.toUpperCase() === params.targetComplaintId.toUpperCase());

    if (!source || !target) {
      throw new Error('Both source and target complaints must exist.');
    }

    const now = new Date().toISOString();
    source.status = 'Closed';
    source.merged_into_id = target.id;
    source.updated_at = now;

    this.data.complaint_status_history.push({
      id: `csh_${Date.now()}`,
      complaint_id: source.id,
      from_status: source.status,
      to_status: 'Closed',
      changed_by_user_id: params.officerId,
      changed_by_name: params.officerName,
      notes: `Ticket merged into duplicate parent ticket ${target.id}. ${params.notes || ''}`,
      created_at: now,
    });

    this.data.complaint_status_history.push({
      id: `csh_${Date.now() + 1}`,
      complaint_id: target.id,
      from_status: target.status,
      to_status: target.status,
      changed_by_user_id: params.officerId,
      changed_by_name: params.officerName,
      notes: `Duplicate ticket ${source.id} merged into this case file.`,
      created_at: now,
    });

    this.saveData();
    return {
      source: this.enrichComplaintSLA(source),
      target: this.enrichComplaintSLA(target),
    };
  }

  public updateComplaintPriority(complaintId: string, priority: ComplaintPriority, officerName: string): Complaint {
    const complaint = this.data.complaints.find((c) => c.id.toUpperCase() === complaintId.toUpperCase());
    if (!complaint) {
      throw new Error(`Complaint ${complaintId} not found.`);
    }

    const old = complaint.priority;
    complaint.priority = priority;
    complaint.sla_hours = this.calculateSLAHours(priority, complaint.category);
    complaint.due_at = new Date(new Date(complaint.created_at).getTime() + complaint.sla_hours * 3600 * 1000).toISOString();
    complaint.updated_at = new Date().toISOString();

    this.data.complaint_status_history.push({
      id: `csh_${Date.now()}`,
      complaint_id: complaint.id,
      from_status: complaint.status,
      to_status: complaint.status,
      changed_by_user_id: 'officer',
      changed_by_name: officerName,
      notes: `Priority reassessed from ${old} to ${priority}. New SLA deadline calculated.`,
      created_at: new Date().toISOString(),
    });

    this.saveData();
    return this.enrichComplaintSLA(complaint);
  }

  // --- Duplicate Detection ---
  public checkDuplicate(params: {
    category: ComplaintCategory;
    latitude?: number;
    longitude?: number;
    description: string;
  }): { is_duplicate: boolean; duplicate_complaint?: any } {
    const descWords = params.description.toLowerCase().split(/\s+/).filter((w) => w.length > 3);

    for (const c of this.data.complaints) {
      // Must be same category and active
      if (c.category !== params.category) continue;
      if (c.status === 'Resolved' || c.status === 'Closed' || c.status === 'Rejected') continue;

      let isNearby = false;
      if (params.latitude && params.longitude && c.latitude && c.longitude) {
        const dLat = Math.abs(c.latitude - params.latitude);
        const dLon = Math.abs(c.longitude - params.longitude);
        if (dLat < 0.005 && dLon < 0.005) {
          isNearby = true;
        }
      }

      // Check text similarity
      const otherWords = c.description.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      const commonWords = descWords.filter((w) => otherWords.includes(w));
      const hasWordOverlap = commonWords.length >= 2;

      if (isNearby || (hasWordOverlap && isNearby !== false)) {
        return {
          is_duplicate: true,
          duplicate_complaint: {
            id: c.id,
            category: c.category,
            location_text: c.location_text,
            status: c.status,
            created_at: c.created_at,
          },
        };
      }
    }

    return { is_duplicate: false };
  }

  // --- Notifications ---
  public getNotifications(userId: string) {
    return (this.data.notifications || [])
      .filter((n) => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public createNotification(params: {
    userId: string;
    complaintId: string;
    title: string;
    message: string;
    type?: NotificationItem['type'];
  }): NotificationItem {
    const item: NotificationItem = {
      id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      user_id: params.userId,
      complaint_id: params.complaintId,
      title: params.title,
      message: params.message,
      read: false,
      type: params.type || 'status_update',
      created_at: new Date().toISOString(),
    };

    if (!this.data.notifications) {
      this.data.notifications = [];
    }
    this.data.notifications.unshift(item);
    this.saveData();
    return item;
  }

  public markNotificationAsRead(id: string, userId: string) {
    const n = this.data.notifications.find((notif) => notif.id === id && notif.user_id === userId);
    if (n) {
      n.read = true;
      this.saveData();
    }
    return n;
  }

  public markAllNotificationsAsRead(userId: string) {
    this.data.notifications.forEach((n) => {
      if (n.user_id === userId) {
        n.read = true;
      }
    });
    this.saveData();
  }

  // --- Analytics Stats ---
  public getAnalytics(): AnalyticsStats {
    const all = this.data.complaints.map((c) => this.enrichComplaintSLA(c));
    const total = all.length;
    const pending_review = all.filter((c) => c.status === 'Reported' || c.status === 'Submitted').length;
    const assigned = all.filter((c) => c.status === 'Assigned').length;
    const in_progress = all.filter((c) => c.status === 'In Progress').length;
    const resolved = all.filter((c) => c.status === 'Resolved').length;
    const closed = all.filter((c) => c.status === 'Closed').length;
    const reopened = all.filter((c) => c.status === 'Reopened').length;
    const rejected = all.filter((c) => c.status === 'Rejected').length;
    const overdue_count = all.filter((c) => Boolean(c.is_overdue)).length;
    const high_or_critical = all.filter((c) => c.priority === 'High' || c.priority === 'Critical').length;

    const resolution_rate = total > 0 ? Math.round(((resolved + closed) / total) * 100) : null;

    // Calculate SLA compliance rate
    const resolvedItems = all.filter((c) => c.status === 'Resolved' || c.status === 'Closed');
    let onTimeResolutions = 0;
    let totalResolutionHours = 0;

    for (const c of resolvedItems) {
      const created = new Date(c.created_at).getTime();
      const resolvedAt = c.resolved_at ? new Date(c.resolved_at).getTime() : new Date(c.updated_at).getTime();
      const diffHours = (resolvedAt - created) / (1000 * 60 * 60);
      if (diffHours >= 0) {
        totalResolutionHours += diffHours;
      }
      const due = c.due_at ? new Date(c.due_at).getTime() : created + (c.sla_hours || 48) * 3600 * 1000;
      if (resolvedAt <= due) {
        onTimeResolutions++;
      }
    }

    const sla_compliance_rate_percent =
      resolvedItems.length > 0 ? Math.round((onTimeResolutions / resolvedItems.length) * 100) : null;

    const avg_resolution_hours =
      resolvedItems.length > 0 ? Math.round((totalResolutionHours / resolvedItems.length) * 10) / 10 : null;

    // Counts by category
    const categories: ComplaintCategory[] = [
      'Pothole',
      'Garbage',
      'Road Damage',
      'Streetlight',
      'Water Leakage',
      'Drainage',
      'Traffic Signal',
      'Public Safety',
      'Public Property Damage',
      'Other',
    ];
    const by_category = categories.map((cat) => ({
      category: cat,
      count: all.filter((c) => c.category === cat).length,
    }));

    // Counts by status
    const statuses: ComplaintStatus[] = [
      'Submitted',
      'Assigned',
      'In Progress',
      'Resolved',
      'Closed',
      'Reopened',
      'Rejected',
    ];
    const by_status = statuses.map((st) => ({
      status: st,
      count: all.filter((c) => (st === 'Submitted' ? c.status === 'Reported' || c.status === 'Submitted' : c.status === st)).length,
    }));

    // Counts by priority
    const priorities: ComplaintPriority[] = ['Low', 'Medium', 'High', 'Critical'];
    const by_priority = priorities.map((p) => ({
      priority: p,
      count: all.filter((c) => c.priority === p).length,
    }));

    // Counts by Ward
    const wards = this.getWards();
    const by_ward = wards.map((w) => ({
      ward_name: w.ward_name,
      count: all.filter((c) => c.ward_id === w.id || c.ward_name === w.ward_name).length,
    }));

    // Counts by Department
    const depts = this.getDepartments();
    const by_department = depts.map((d) => ({
      department: d.name,
      count: all.filter((c) => c.assigned_to_department?.toLowerCase() === d.name.toLowerCase()).length,
    }));

    // Recent reports over time
    const dateCounts: Record<string, number> = {};
    for (const c of all) {
      const d = c.created_at.split('T')[0];
      dateCounts[d] = (dateCounts[d] || 0) + 1;
    }
    const recent_trend = Object.entries(dateCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      total_reports: total,
      pending_review,
      assigned,
      in_progress,
      resolved,
      closed,
      reopened,
      rejected,
      overdue_count,
      high_or_critical,
      resolution_rate_percent: resolution_rate,
      avg_resolution_hours,
      sla_compliance_rate_percent,
      by_category,
      by_status,
      by_priority,
      by_ward,
      by_department,
      recent_trend,
    };
  }
}

export const db = new DatabaseManager();
