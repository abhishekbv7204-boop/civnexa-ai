import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db, hashPassword } from './server/db';
import {
  analyzeCivicIssue,
  processVoiceAssistant,
  performCivicSearchGrounding,
  performMapsGrounding,
} from './server/gemini';
import { UserProfile, ComplaintCategory, ComplaintPriority, ComplaintStatus } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'civicfix_secret_salt_2026';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: UserProfile;
    }
  }
}

// Middleware: JSON body with up to 15MB for photo uploads
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Helper to create and verify tokens
function generateToken(userId: string): string {
  const timestamp = Date.now();
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`${userId}:${timestamp}`)
    .digest('hex')
    .substring(0, 16);
  return Buffer.from(`${userId}:${timestamp}:${signature}`).toString('base64');
}

function verifyToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId, timestampStr, signature] = decoded.split(':');
    const expectedSig = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(`${userId}:${timestampStr}`)
      .digest('hex')
      .substring(0, 16);
    if (signature === expectedSig) {
      return userId;
    }
    return null;
  } catch {
    return null;
  }
}

// Authentication Middleware
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const userId = verifyToken(token);
    if (userId) {
      const profile = db.findProfileById(userId);
      if (profile) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password_hash, ...safeUser } = profile as any;
        req.user = safeUser;
      }
    }
  }
  next();
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

function requireAuthority(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'authority' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Authorized municipal personnel only' });
  }
  next();
}

app.use(authMiddleware);

// ================= API ROUTES =================

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    gemini_configured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Auth: Register Citizen
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { full_name, email, password, phone_number } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Full name, email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const user = db.createProfile({
      full_name,
      email,
      password,
      phone_number,
      role: 'citizen',
    });

    const token = generateToken(user.id);
    res.status(201).json({ user, token });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

// Auth: Login (Citizen or Authority)
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const profile = db.findProfileByEmail(email);
    if (!profile) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const hashedInput = hashPassword(password);
    if (hashedInput !== profile.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Role check if specified
    if (role && profile.role !== role && profile.role !== 'admin') {
      return res.status(403).json({
        error: `This account is registered as a ${profile.role}. Please select the ${profile.role === 'authority' ? 'Authority' : 'Citizen'} tab to sign in.`,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...safeUser } = profile;
    const token = generateToken(profile.id);

    res.json({ user: safeUser, token });
  } catch (err: any) {
    res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
});

// Auth: Get Current Profile
app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

// Auth: Sync Firebase Google Sign-In Profile
app.post('/api/auth/google-sync', (req: Request, res: Response) => {
  try {
    const { uid, email, displayName, photoURL, role } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ error: 'UID and email are required for Google Auth synchronization' });
    }

    const user = db.upsertGoogleProfile({
      uid,
      email,
      full_name: displayName,
      photoURL,
      role,
    });

    const token = generateToken(user.id);
    res.json({ user, token });
  } catch (err: any) {
    console.error('Error synchronizing Google Auth profile:', err);
    res.status(500).json({ error: 'Failed to synchronize authenticated Google user.' });
  }
});

// Gemini AI: Google Search Grounding (gemini-3.5-flash with googleSearch tool)
app.post('/api/gemini/search-grounding', async (req: Request, res: Response) => {
  try {
    const { query, locationOrCity } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ error: 'A search query string is required' });
    }

    const result = await performCivicSearchGrounding({
      query: query.trim(),
      locationOrCity: locationOrCity || 'Bengaluru Municipal Area',
    });

    res.json(result);
  } catch (err: any) {
    console.error('Error in /api/gemini/search-grounding:', err);
    res.status(500).json({
      error: 'Google Search Grounding encountered an error. Please try again.',
    });
  }
});

// Gemini AI: Google Maps Grounding (gemini-3.5-flash with googleMaps tool)
app.post('/api/gemini/maps-grounding', async (req: Request, res: Response) => {
  try {
    const { query, latitude, longitude } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ error: 'A location or municipal facility query string is required' });
    }

    const result = await performMapsGrounding({
      query: query.trim(),
      latitude: typeof latitude === 'number' ? latitude : undefined,
      longitude: typeof longitude === 'number' ? longitude : undefined,
    });

    res.json(result);
  } catch (err: any) {
    console.error('Error in /api/gemini/maps-grounding:', err);
    res.status(500).json({
      error: 'Google Maps Grounding encountered an error. Please try again.',
    });
  }
});


// Gemini AI: Analyze Civic Issue
app.post('/api/gemini/analyze-issue', async (req: Request, res: Response) => {
  try {
    const { description, imageBase64, locationText, manualCategory } = req.body;

    if (!description || description.trim().length === 0) {
      return res.status(400).json({ error: 'Issue description is required for AI analysis' });
    }

    const result = await analyzeCivicIssue({
      description,
      imageBase64,
      locationText,
      manualCategory,
    });

    res.json(result);
  } catch (err: any) {
    console.error('Error in /api/gemini/analyze-issue:', err);
    res.status(500).json({
      error: 'AI analysis service encountered an error. You can continue manually.',
    });
  }
});

// Voice Assistant: Conversational multilingual endpoint (English, Hindi, Kannada)
app.post('/api/assistant/chat', async (req: Request, res: Response) => {
  try {
    const { text, language, userContext } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Speech or text input is required.' });
    }

    const assistantResult = await processVoiceAssistant({
      userInput: text.trim(),
      language: language || 'en',
      userContext: {
        userName: req.user?.full_name,
        pendingReport: userContext?.pendingReport,
      },
    });

    // If intent is TRACK_COMPLAINT and complaintId is detected, enhance with live database status!
    if (assistantResult.intent === 'TRACK_COMPLAINT' && assistantResult.extractedEntities.complaintId) {
      const details = db.getComplaintById(assistantResult.extractedEntities.complaintId);
      if (details) {
        const c = details.complaint;
        const lang = language || 'en';
        let statusText = '';
        let spokenText = '';

        if (lang === 'kn') {
          statusText = `ದೂರು ${c.id} (${c.category}) ಸದ್ಯಕ್ಕೆ "${c.status}" ಸ್ಥಿತಿಯಲ್ಲಿದೆ. ಇಲಾಖೆ: ${c.assigned_to_department || 'ನಿಯೋಜಿಸಲಾಗುತ್ತಿದೆ'}.`;
          spokenText = `ನಿಮ್ಮ ದೂರು ${c.id} ಸದ್ಯಕ್ಕೆ ${c.status} ಸ್ಥಿತಿಯಲ್ಲಿದೆ.`;
        } else if (lang === 'hi') {
          statusText = `शिकायत ${c.id} (${c.category}) वर्तमान में "${c.status}" स्थिति में है। विभाग: ${c.assigned_to_department || 'प्रक्रिया जारी'}।`;
          spokenText = `आपकी शिकायत ${c.id} वर्तमान में ${c.status} स्थिति में है।`;
        } else {
          statusText = `Complaint ${c.id} (${c.category}) is currently "${c.status}". Handled by: ${c.assigned_to_department || 'Under triage'}.`;
          spokenText = `Complaint ${c.id} is currently ${c.status}.`;
        }

        assistantResult.replyText = statusText;
        assistantResult.spokenText = spokenText;
        assistantResult.suggestedAction = 'NAVIGATE_TRACK';
        assistantResult.actionPayload = { complaintId: c.id };
      } else {
        const notFoundText =
          language === 'kn'
            ? `ದೂರು ${assistantResult.extractedEntities.complaintId} ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಸಂಖ್ಯೆಯನ್ನು ಪರಿಶೀಲಿಸಿ.`
            : language === 'hi'
            ? `शिकायत ${assistantResult.extractedEntities.complaintId} नहीं मिली। कृपया संदर्भ संख्या जांचें।`
            : `Complaint ${assistantResult.extractedEntities.complaintId} was not found. Please verify the ID.`;
        assistantResult.replyText = notFoundText;
        assistantResult.spokenText = notFoundText;
      }
    }

    res.json(assistantResult);
  } catch (err: any) {
    console.error('Error in /api/assistant/chat:', err);
    res.status(500).json({ error: 'Assistant processing failed.' });
  }
});

// Municipal Data: Departments
app.get('/api/departments', (req: Request, res: Response) => {
  res.json({ departments: db.getDepartments() });
});

app.post('/api/departments', requireAuthority, (req: Request, res: Response) => {
  try {
    const { name, code, contact_email } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }
    const dept = db.createDepartment({ name, code, contact_email });
    res.status(201).json({ department: dept });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Municipal Data: Zones & Wards
app.get('/api/zones', (req: Request, res: Response) => {
  res.json({ zones: db.getZones() });
});

app.get('/api/wards', (req: Request, res: Response) => {
  res.json({ wards: db.getWards(), zones: db.getZones() });
});

app.post('/api/wards', requireAuthority, (req: Request, res: Response) => {
  try {
    const { ward_number, ward_name, zone_id, contact_phone } = req.body;
    if (!ward_number || !ward_name || !zone_id) {
      return res.status(400).json({ error: 'Ward number, name, and zone are required' });
    }
    const ward = db.createWard({
      ward_number: Number(ward_number),
      ward_name,
      zone_id,
      contact_phone,
    });
    res.status(201).json({ ward });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// SLA Rules
app.get('/api/sla-rules', (req: Request, res: Response) => {
  res.json({ rules: db.getSLARules() });
});

app.put('/api/sla-rules', requireAuthority, (req: Request, res: Response) => {
  try {
    const { rules } = req.body;
    if (!Array.isArray(rules)) {
      return res.status(400).json({ error: 'Rules array is required' });
    }
    const updated = db.updateSLARules(rules);
    res.json({ rules: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Duplicate Detection
app.post('/api/complaints/check-duplicate', (req: Request, res: Response) => {
  try {
    const { category, latitude, longitude, description } = req.body;
    if (!category || !description) {
      return res.status(400).json({ error: 'Category and description are required for duplicate check' });
    }

    const check = db.checkDuplicate({
      category: category as ComplaintCategory,
      latitude: Number(latitude) || 0,
      longitude: Number(longitude) || 0,
      description,
    });

    res.json(check);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to verify duplicate records' });
  }
});

// Complaints: List / Filter
app.get('/api/complaints', (req: Request, res: Response) => {
  try {
    const { category, priority, status, search, ward_id, zone_id, department, overdue_only, my_only, public_map } = req.query;

    let filterUserId: string | undefined = undefined;

    // Filter by user if citizen requests their dashboard
    if (req.user && req.user.role === 'citizen') {
      if (my_only === 'true' || !public_map) {
        filterUserId = req.user.id;
      }
    } else if (!req.user && my_only === 'true') {
      return res.status(401).json({ error: 'Sign in to view your complaints' });
    }

    const complaints = db.getComplaints({
      userId: filterUserId,
      category: category as ComplaintCategory,
      priority: priority as ComplaintPriority,
      status: status as ComplaintStatus,
      department: department as string,
      ward_id: ward_id as string,
      zone_id: zone_id as string,
      overdueOnly: overdue_only === 'true',
      search: search as string,
    });

    // Privacy protection: strip citizen contact information for public map view
    const sanitized = complaints.map((c) => {
      if (req.user?.role === 'authority' || req.user?.role === 'admin' || req.user?.id === c.user_id) {
        return c;
      }
      return {
        ...c,
        user_email: undefined,
        user_phone: undefined,
      };
    });

    res.json({ complaints: sanitized });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve complaints' });
  }
});

// Complaints: Create (Citizen)
app.post('/api/complaints', (req: Request, res: Response) => {
  try {
    const {
      category,
      priority,
      description,
      ai_summary,
      ai_reason,
      ai_detected_features,
      latitude,
      longitude,
      location_text,
      image_url,
      ward_id,
    } = req.body;

    if (!category || !description || !location_text) {
      return res.status(400).json({ error: 'Category, description, and location are required' });
    }

    const userId = req.user?.id || 'usr_citizen_guest';
    const userName = req.user?.full_name || 'Citizen Reporter';
    const userEmail = req.user?.email || 'citizen@civicfix.org';
    const userPhone = req.user?.phone_number || '';

    const newComplaint = db.createComplaint({
      userId,
      userName,
      userEmail,
      userPhone,
      category: category as ComplaintCategory,
      priority: (priority as ComplaintPriority) || 'Medium',
      description,
      ai_summary: ai_summary || `${category} reported at ${location_text}`,
      ai_reason: ai_reason || 'Initial citizen grievance registration.',
      ai_detected_features: ai_detected_features || [],
      latitude: Number(latitude) || 12.9716,
      longitude: Number(longitude) || 77.5946,
      location_text,
      image_url,
      ward_id,
    });

    res.status(201).json({ complaint: newComplaint });
  } catch (err: any) {
    console.error('Error creating complaint:', err);
    res.status(500).json({ error: 'Failed to submit complaint. Please try again.' });
  }
});

// Complaints: Get by ID
app.get('/api/complaints/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = db.getComplaintById(id);

    if (!data) {
      return res.status(404).json({ error: `Complaint #${id} was not found.` });
    }

    let safeComplaint = data.complaint;
    if (req.user?.role !== 'authority' && req.user?.role !== 'admin' && req.user?.id !== safeComplaint.user_id) {
      safeComplaint = {
        ...safeComplaint,
        user_phone: undefined,
        user_email: undefined,
      };
    }

    res.json({
      complaint: safeComplaint,
      images: data.images,
      status_history: data.history,
      assignments: req.user?.role === 'authority' || req.user?.role === 'admin' ? data.assignments : [],
      comments: data.comments.filter((c) => {
        if (req.user?.role === 'authority' || req.user?.role === 'admin') return true;
        return !c.is_internal;
      }),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load complaint details' });
  }
});

// Authority: Update Status
app.patch('/api/complaints/:id/status', requireAuthority, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'New status is required' });
    }

    const updated = db.updateComplaintStatus({
      complaintId: id,
      status: status as ComplaintStatus,
      userId: req.user!.id,
      userName: `${req.user!.full_name} (${req.user!.designation || 'Authority'})`,
      notes: notes || `Status changed to ${status}`,
    });

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update complaint status' });
  }
});

// Authority: Resolve Complaint with Photo Evidence
app.post('/api/complaints/:id/resolve', requireAuthority, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resolution_notes, resolution_image_url } = req.body;

    if (!resolution_notes) {
      return res.status(400).json({ error: 'Resolution field notes are required.' });
    }

    const updated = db.resolveComplaint({
      complaintId: id,
      userId: req.user!.id,
      userName: `${req.user!.full_name} (${req.user!.designation || 'Authority'})`,
      resolutionNotes: resolution_notes,
      resolutionImageUrl: resolution_image_url,
    });

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to resolve complaint' });
  }
});

// Citizen: Confirm Resolution or Reopen Complaint
app.post('/api/complaints/:id/feedback', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { was_resolved, rating, comment } = req.body;

    if (was_resolved === undefined) {
      return res.status(400).json({ error: 'was_resolved status is required.' });
    }

    const userId = req.user?.id || 'citizen_anon';
    const updated = db.recordCitizenFeedback({
      complaintId: id,
      userId,
      wasResolved: Boolean(was_resolved),
      rating: rating ? Number(rating) : undefined,
      comment,
    });

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to record feedback' });
  }
});

// Case Comments: Add
app.post('/api/complaints/:id/comments', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { comment, is_internal } = req.body;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const isAuthorityUser = req.user?.role === 'authority' || req.user?.role === 'admin';
    const finalIsInternal = isAuthorityUser ? Boolean(is_internal) : false;

    const newComment = db.addComplaintComment({
      complaintId: id,
      userId: req.user?.id || 'citizen_anon',
      userName: req.user?.full_name || 'Citizen',
      userRole: (req.user?.role as any) || 'citizen',
      comment,
      isInternal: finalIsInternal,
    });

    res.status(201).json({ comment: newComment });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Authority: Escalate Complaint
app.post('/api/complaints/:id/escalate', requireAuthority, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const updated = db.escalateComplaint({
      complaintId: id,
      userId: req.user!.id,
      userName: `${req.user!.full_name} (${req.user!.designation || 'Authority'})`,
      reason: reason || 'SLA timeline exceeded field resolution capacity.',
    });

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Authority: Merge Duplicate Complaint
app.post('/api/complaints/:id/merge', requireAuthority, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { target_complaint_id, notes } = req.body;

    if (!target_complaint_id) {
      return res.status(400).json({ error: 'Target complaint ID is required to merge.' });
    }

    const result = db.mergeComplaints({
      sourceComplaintId: id,
      targetComplaintId: target_complaint_id,
      officerId: req.user!.id,
      officerName: req.user!.full_name,
      notes,
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Authority: Update Priority
app.patch('/api/complaints/:id/priority', requireAuthority, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (!priority) {
      return res.status(400).json({ error: 'Priority is required' });
    }

    const updated = db.updateComplaintPriority(
      id,
      priority as ComplaintPriority,
      `${req.user!.full_name} (${req.user!.designation || 'Authority'})`
    );

    res.json({ complaint: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update priority' });
  }
});

// Authority: Assign Complaint
app.post('/api/complaints/:id/assign', requireAuthority, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { department, officer, internal_note } = req.body;

    if (!department || !officer) {
      return res.status(400).json({ error: 'Department and officer name are required' });
    }

    const result = db.assignComplaint({
      complaintId: id,
      assignedByUserId: req.user!.id,
      assignedByName: req.user!.full_name,
      department,
      officer,
      internalNote: internal_note || '',
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to assign complaint' });
  }
});

// In-App Notifications
app.get('/api/notifications', requireAuth, (req: Request, res: Response) => {
  try {
    const notifications = db.getNotifications(req.user!.id);
    res.json({ notifications });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.patch('/api/notifications/:id/read', requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = db.markNotificationAsRead(id, req.user!.id);
    res.json({ notification: item });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

app.post('/api/notifications/read-all', requireAuth, (req: Request, res: Response) => {
  try {
    db.markAllNotificationsAsRead(req.user!.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

// Analytics (Computed from real DB)
app.get('/api/analytics', (req: Request, res: Response) => {
  try {
    const stats = db.getAnalytics();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to compute analytics' });
  }
});

// ================= VITE / STATIC SERVING =================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CivicFix AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot failure:', err);
});
