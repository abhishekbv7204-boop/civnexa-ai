import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  Building2,
  User,
  Shield,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Send,
  MessageSquare,
  FileCheck,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { api } from '../services/api';
import {
  Complaint,
  ComplaintStatusHistory,
  ComplaintAssignment,
  ComplaintImage,
  ComplaintStatus,
  ComplaintPriority,
  ComplaintComment,
  Department,
} from '../types';
import { StatusBadge, PriorityBadge, CategoryIcon } from '../components/StatusBadge';

interface AuthorityComplaintDetailProps {
  complaintId: string;
  onBack: () => void;
  onNavigate: (view: string, param?: string) => void;
}

export const AuthorityComplaintDetail: React.FC<AuthorityComplaintDetailProps> = ({
  complaintId,
  onBack,
  onNavigate,
}) => {
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [images, setImages] = useState<ComplaintImage[]>([]);
  const [history, setHistory] = useState<ComplaintStatusHistory[]>([]);
  const [assignments, setAssignments] = useState<ComplaintAssignment[]>([]);
  const [comments, setComments] = useState<ComplaintComment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Status Form
  const [statusVal, setStatusVal] = useState<ComplaintStatus>('In Progress');
  const [statusNotes, setStatusNotes] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionImageUrl, setResolutionImageUrl] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  // Priority Form
  const [priorityVal, setPriorityVal] = useState<ComplaintPriority>('Medium');
  const [priorityNotes, setPriorityNotes] = useState('');
  const [priorityLoading, setPriorityLoading] = useState(false);

  // Assignment Form
  const [deptVal, setDeptVal] = useState('Road Infrastructure Division');
  const [officerVal, setOfficerVal] = useState('');
  const [assignNoteVal, setAssignNoteVal] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // Official Comment Form
  const [officialComment, setOfficialComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // Escalation Loading
  const [escalating, setEscalating] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const [res, deptRes] = await Promise.all([
        api.getComplaintById(complaintId),
        api.getDepartments().catch(() => ({ departments: [] })),
      ]);

      setComplaint(res.complaint);
      setImages(res.images);
      setHistory(res.status_history);
      setAssignments(res.assignments);
      setComments(res.comments || []);
      setDepartments(deptRes.departments || []);

      setStatusVal(res.complaint.status);
      setPriorityVal(res.complaint.priority);
      if (res.complaint.assigned_to_department) {
        setDeptVal(res.complaint.assigned_to_department);
      }
      if (res.complaint.assigned_to_officer) {
        setOfficerVal(res.complaint.assigned_to_officer);
      }
      if (res.complaint.resolution_notes) {
        setResolutionNotes(res.complaint.resolution_notes);
      }
      if (res.complaint.resolution_image_url) {
        setResolutionImageUrl(res.complaint.resolution_image_url);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load case details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [complaintId]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    setStatusLoading(true);
    try {
      await api.updateComplaintStatus(
        complaint.id,
        statusVal,
        statusNotes,
        statusVal === 'Resolved' ? resolutionNotes : undefined,
        statusVal === 'Resolved' ? resolutionImageUrl : undefined
      );
      setStatusNotes('');
      await fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleUpdatePriority = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    setPriorityLoading(true);
    try {
      await api.updateComplaintPriority(complaint.id, priorityVal, priorityNotes);
      setPriorityNotes('');
      await fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Priority update failed');
    } finally {
      setPriorityLoading(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    setAssignLoading(true);
    try {
      await api.assignComplaint(
        complaint.id,
        deptVal,
        officerVal || 'Field Team Leader',
        assignNoteVal
      );
      setAssignNoteVal('');
      await fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Assignment failed');
    } finally {
      setAssignLoading(false);
    }
  };

  const handlePostOfficialComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !officialComment.trim()) return;
    setCommentLoading(true);
    try {
      const res = await api.addComment(complaint.id, officialComment.trim(), false);
      setComments((prev) => [...prev, res.comment]);
      setOfficialComment('');
    } catch (err: any) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleTriggerEscalation = async () => {
    if (!complaint) return;
    if (!window.confirm(`Trigger formal SLA escalation to Level ${(complaint.escalation_level || 0) + 1} for this grievance?`)) return;
    setEscalating(true);
    try {
      await api.escalateComplaint(complaint.id, 'Formal SLA escalation invoked by supervising municipal authority.');
      await fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Escalation failed');
    } finally {
      setEscalating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-gray-700">Loading municipal case file...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
          {error || 'Complaint not found.'}
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg hover:bg-gray-300 cursor-pointer"
        >
          Return to Console
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Button and Case ID Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Back to Console"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-extrabold text-blue-900">{complaint.id}</span>
              <StatusBadge status={complaint.status} size="md" />
              <PriorityBadge priority={complaint.priority} size="md" />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Logged on {new Date(complaint.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {complaint.is_overdue && (
            <span className="px-2.5 py-1 bg-red-100 text-red-900 border border-red-200 rounded-md font-bold flex items-center gap-1.5 animate-pulse">
              <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
              SLA Overdue (Escalation L{complaint.escalation_level})
            </span>
          )}
          {complaint.status === 'Reopened' && (
            <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-md font-bold flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
              Reopened by Citizen
            </span>
          )}
          <span className="px-2.5 py-1 bg-purple-50 text-purple-900 border border-purple-200 rounded-md font-semibold flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Authorized Official Case View
          </span>
        </div>
      </div>

      {/* Main Grid: Details on Left, Authority Actions on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols) - Case Facts, Photo, Citizen, AI, Comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo & Problem Description */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <CategoryIcon category={complaint.category} className="w-4 h-4 text-blue-700" />
                <span>Grievance Description: {complaint.category}</span>
              </h3>
              {complaint.ward_name && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                  Ward {complaint.ward_number}: {complaint.ward_name} ({complaint.zone_name})
                </span>
              )}
            </div>

            {complaint.image_url && (
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-900 max-h-96 flex items-center justify-center">
                <img
                  src={complaint.image_url}
                  alt={complaint.category}
                  className="w-full h-full max-h-96 object-contain"
                />
              </div>
            )}

            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-500">Citizen Report:</span>
              <p className="text-sm text-gray-800 leading-relaxed font-medium">
                {complaint.description}
              </p>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-start gap-2 text-xs text-gray-600">
              <MapPin className="w-4 h-4 text-blue-700 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold text-gray-900">Location: </span>
                <span>{complaint.location_text}</span>
                <span className="block text-[11px] text-gray-400 font-mono mt-0.5">
                  Lat: {complaint.latitude.toFixed(5)}, Long: {complaint.longitude.toFixed(5)}
                </span>
              </div>
            </div>
          </div>

          {/* Resolution Evidence Box (if Resolved or Closed) */}
          {(complaint.resolution_notes || complaint.resolution_image_url) && (
            <div className="bg-emerald-50/70 border border-emerald-300 rounded-2xl p-6 space-y-3 shadow-xs">
              <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-700" />
                <span>Recorded Resolution Evidence</span>
              </h3>
              {complaint.resolution_notes && (
                <p className="text-xs text-emerald-900 font-medium leading-relaxed">
                  "{complaint.resolution_notes}"
                </p>
              )}
              {complaint.resolution_image_url && (
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-emerald-800 block mb-1">
                    Completion Photo Proof:
                  </span>
                  <img
                    src={complaint.resolution_image_url}
                    alt="Resolution evidence"
                    className="max-h-64 rounded-xl border border-emerald-200 object-cover"
                  />
                </div>
              )}
            </div>
          )}

          {/* Citizen Contact Details (Authority View Only) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-blue-700" />
              <span>Reporting Citizen Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500 block">Name:</span>
                <span className="font-bold text-gray-900">{complaint.user_name}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-gray-500 block">Phone:</span>
                  <span className="font-bold text-gray-900">{complaint.user_phone || 'N/A'}</span>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <div className="truncate">
                  <span className="text-gray-500 block">Email:</span>
                  <span className="font-bold text-gray-900 truncate block">
                    {complaint.user_email || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Gemini AI Triage Findings */}
          <div className="bg-blue-50/50 rounded-2xl border border-blue-200 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  Gemini Automated Triage Recommendation
                </span>
              </div>
              <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                Verified
              </span>
            </div>

            <p className="text-xs text-gray-800 font-medium leading-relaxed">
              {complaint.ai_summary}
            </p>

            <p className="text-xs text-gray-600 leading-relaxed">
              <span className="font-semibold text-gray-700">Reasoning: </span>
              {complaint.ai_reason}
            </p>

            {complaint.ai_detected_features && complaint.ai_detected_features.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-semibold text-gray-600">Visual Features Detected:</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {complaint.ai_detected_features.map((feat, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-white border border-blue-200 rounded text-[11px] text-blue-900 font-medium"
                    >
                      • {feat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Official Comments & Public Thread */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-700" />
                <span>Case Inquiries & Public Audit Comments ({comments.length})</span>
              </h3>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center italic">
                  No public notes or citizen inquiries logged yet.
                </p>
              ) : (
                comments.map((cm) => (
                  <div
                    key={cm.id}
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      cm.user_role === 'authority'
                        ? 'bg-purple-50/70 border-purple-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-gray-900 flex items-center gap-1.5">
                        {cm.user_name}
                        {cm.user_role === 'authority' && (
                          <span className="px-1.5 py-0.2 rounded bg-purple-200 text-purple-900 font-semibold text-[10px]">
                            Official Authority
                          </span>
                        )}
                      </span>
                      <span className="text-gray-400">
                        {new Date(cm.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-gray-800 leading-relaxed font-normal">{cm.comment}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handlePostOfficialComment} className="pt-2 border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={officialComment}
                onChange={(e) => setOfficialComment(e.target.value)}
                placeholder="Post official supervisory remark or instructions for citizen..."
                className="flex-1 text-xs px-3.5 py-2.5 rounded-lg border border-gray-300 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
              />
              <button
                type="submit"
                disabled={commentLoading || !officialComment.trim()}
                className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post Note</span>
              </button>
            </form>
          </div>

          {/* Status History Audit Trail */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-700" />
              <span>Full Status History & Audit Notes</span>
            </h3>

            <div className="space-y-3 divide-y divide-gray-100">
              {history.map((h) => (
                <div key={h.id} className="pt-3 first:pt-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={h.to_status} size="sm" />
                    <span className="text-[10px] text-gray-400">
                      {new Date(h.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-800 font-medium mt-1">{h.notes}</p>
                  <p className="text-[11px] text-gray-500">Authorized Officer: {h.changed_by_name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Case Management Action Panels */}
        <div className="space-y-6">
          {/* SLA Tracking & Escalation Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-700" />
                <span>SLA Management</span>
              </span>
              <span className="text-xs font-mono font-bold text-gray-600">{complaint.sla_hours}h SLA</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Target Due Date:</span>
                <span className="font-semibold text-gray-800">
                  {new Date(complaint.due_at || complaint.created_at).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Current Status:</span>
                {complaint.is_overdue ? (
                  <span className="font-bold text-red-600 flex items-center gap-1">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    Breached
                  </span>
                ) : (
                  <span className="font-bold text-emerald-600">
                    {Math.max(0, complaint.remaining_hours || 0)}h remaining
                  </span>
                )}
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Escalation Tier:</span>
                <span className="font-bold text-purple-900">
                  Level {complaint.escalation_level}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={escalating}
              onClick={handleTriggerEscalation}
              className="w-full py-2 px-3 rounded-lg border border-red-300 bg-red-50 hover:bg-red-100 text-red-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <span>{escalating ? 'Escalating...' : `Escalate to Level ${(complaint.escalation_level || 0) + 1}`}</span>
            </button>
          </div>

          {/* Action 1: Change Status */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Update Case Status
            </h3>

            <form onSubmit={handleUpdateStatus} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">New Workflow Status</label>
                <select
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value as ComplaintStatus)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                >
                  <option value="Reported">Reported</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Officer Action Remarks <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Record on-ground observations or instructions..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Conditional Resolution Fields when status is Resolved */}
              {statusVal === 'Resolved' && (
                <div className="space-y-2 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <div>
                    <label className="block font-bold text-emerald-900 mb-1">
                      Field Resolution Summary <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="e.g. Cold asphalt mixture applied and steam rolled. Pothole leveled flush with road."
                      className="w-full rounded-lg border border-emerald-300 px-3 py-2 text-xs text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-emerald-900 mb-1">
                      Resolution Photo Evidence URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={resolutionImageUrl}
                      onChange={(e) => setResolutionImageUrl(e.target.value)}
                      placeholder="https://... or photo proof link"
                      className="w-full rounded-lg border border-emerald-300 px-3 py-1.5 text-xs text-gray-900 bg-white"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={statusLoading}
                className="w-full py-2.5 rounded-lg bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                {statusLoading ? 'Updating Status...' : 'Apply Status Change'}
              </button>
            </form>
          </div>

          {/* Action 2: Change Priority */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Adjust Hazard Priority
            </h3>

            <form onSubmit={handleUpdatePriority} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Priority Level</label>
                <select
                  value={priorityVal}
                  onChange={(e) => setPriorityVal(e.target.value as ComplaintPriority)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                >
                  <option value="Low">Low (Routine maintenance)</option>
                  <option value="Medium">Medium (Standard municipal turnaround)</option>
                  <option value="High">High (Active thoroughfare risk)</option>
                  <option value="Critical">Critical (Immediate safety hazard)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Reason for adjustment</label>
                <input
                  type="text"
                  value={priorityNotes}
                  onChange={(e) => setPriorityNotes(e.target.value)}
                  placeholder="e.g. Near school crosswalk, increased priority"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={priorityLoading}
                className="w-full py-2.5 rounded-lg bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {priorityLoading ? 'Saving...' : 'Update Priority Level'}
              </button>
            </form>
          </div>

          {/* Action 3: Department Assignment */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-700" />
              <span>Department Routing</span>
            </h3>

            <form onSubmit={handleAssign} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Department</label>
                <select
                  value={deptVal}
                  onChange={(e) => setDeptVal(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                >
                  {departments.length > 0 ? (
                    departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Road Infrastructure Division">Road Infrastructure Division</option>
                      <option value="Solid Waste Management Division">Solid Waste Management Division</option>
                      <option value="Electrical & Street Lighting Wing">Electrical & Street Lighting Wing</option>
                      <option value="Water Supply & Sewerage Board">Water Supply & Sewerage Board</option>
                      <option value="Storm Water Drain Wing">Storm Water Drain Wing</option>
                      <option value="Traffic Management Cell">Traffic Management Cell</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Assigned Officer</label>
                <input
                  type="text"
                  value={officerVal}
                  onChange={(e) => setOfficerVal(e.target.value)}
                  placeholder="Officer name or crew designation"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Internal Instructions</label>
                <textarea
                  rows={2}
                  value={assignNoteVal}
                  onChange={(e) => setAssignNoteVal(e.target.value)}
                  placeholder="Field guidance or equipment notes..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={assignLoading}
                className="w-full py-2.5 rounded-lg bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                {assignLoading ? 'Dispatching...' : 'Dispatch to Department'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
