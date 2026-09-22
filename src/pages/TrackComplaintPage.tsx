import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  Wrench,
  XCircle,
  MapPin,
  Calendar,
  AlertTriangle,
  Building2,
  User,
  Shield,
  FileText,
  ArrowRight,
  RefreshCw,
  Star,
  MessageSquare,
  Send,
  AlertOctagon,
  ThumbsUp,
  RotateCcw,
  Check,
} from 'lucide-react';
import { api } from '../services/api';
import {
  Complaint,
  ComplaintStatusHistory,
  ComplaintAssignment,
  ComplaintImage,
  ComplaintComment,
} from '../types';
import { StatusBadge, PriorityBadge, CategoryIcon } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

interface TrackComplaintPageProps {
  initialComplaintId?: string;
  onNavigate: (view: string, param?: string) => void;
}

export const TrackComplaintPage: React.FC<TrackComplaintPageProps> = ({
  initialComplaintId,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [complaintIdInput, setComplaintIdInput] = useState<string>(initialComplaintId || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [images, setImages] = useState<ComplaintImage[]>([]);
  const [history, setHistory] = useState<ComplaintStatusHistory[]>([]);
  const [assignments, setAssignments] = useState<ComplaintAssignment[]>([]);
  const [comments, setComments] = useState<ComplaintComment[]>([]);

  // User's own complaints for quick selection
  const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);

  // Citizen Confirmation & Reopening state
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [reopenReason, setReopenReason] = useState<string>('');
  const [showReopenBox, setShowReopenBox] = useState<boolean>(false);
  const [feedbackLoading, setFeedbackLoading] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  // Comment state
  const [commentText, setCommentText] = useState<string>('');
  const [commentLoading, setCommentLoading] = useState<boolean>(false);

  const handleSearch = async (idToSearch?: string) => {
    const targetId = (idToSearch || complaintIdInput).trim();
    if (!targetId) {
      setError('Please enter a Complaint ID to track');
      return;
    }

    setLoading(true);
    setError('');
    setComplaint(null);
    setFeedbackMsg('');
    setShowReopenBox(false);

    try {
      const res = await api.getComplaintById(targetId);
      setComplaint(res.complaint);
      setImages(res.images);
      setHistory(res.status_history);
      setAssignments(res.assignments);
      setComments(res.comments || []);
    } catch (err: any) {
      setError(err.message || `No grievance found with reference ID "${targetId}".`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialComplaintId) {
      setComplaintIdInput(initialComplaintId);
      handleSearch(initialComplaintId);
    }
  }, [initialComplaintId]);

  useEffect(() => {
    if (user) {
      api.getComplaints({ my_only: true }).then((res) => {
        setMyComplaints(res.complaints);
      }).catch(() => {});
    }
  }, [user]);

  // Citizen confirms resolution
  const handleConfirmResolution = async () => {
    if (!complaint) return;
    setFeedbackLoading(true);
    setFeedbackMsg('');
    try {
      const updated = await api.recordCitizenFeedback(
        complaint.id,
        true,
        feedbackRating,
        feedbackComment || 'Citizen confirmed resolution.'
      );
      setComplaint(updated);
      setFeedbackMsg('Thank you! Resolution confirmed and grievance closed.');
      // Refresh details to update history and comments
      handleSearch(complaint.id);
    } catch (err: any) {
      setFeedbackMsg(err.message || 'Failed to submit feedback');
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Citizen reopens ticket
  const handleReopenTicket = async () => {
    if (!complaint || !reopenReason.trim()) return;
    setFeedbackLoading(true);
    setFeedbackMsg('');
    try {
      const updated = await api.recordCitizenFeedback(
        complaint.id,
        false,
        undefined,
        reopenReason
      );
      setComplaint(updated);
      setFeedbackMsg('Case has been reopened. Municipal team has been re-notified for follow-up.');
      setShowReopenBox(false);
      setReopenReason('');
      handleSearch(complaint.id);
    } catch (err: any) {
      setFeedbackMsg(err.message || 'Failed to reopen case');
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Add Comment / Public inquiry
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !commentText.trim()) return;
    setCommentLoading(true);
    try {
      const res = await api.addComment(complaint.id, commentText.trim(), false);
      setComments((prev) => [...prev, res.comment]);
      setCommentText('');
    } catch (err: any) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setCommentLoading(false);
    }
  };

  // Timeline Step Helper
  const getTimelineSteps = () => {
    if (complaint?.status === 'Rejected') {
      return [
        { label: 'Reported', active: true, done: true },
        { label: 'Rejected', active: true, done: true, isRejected: true },
      ];
    }

    const steps = ['Reported', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
    const statusOrder: Record<string, number> = {
      Reported: 0,
      Assigned: 1,
      'In Progress': 2,
      Resolved: 3,
      Closed: 4,
      Reopened: 2,
    };
    const currentIdx = complaint ? statusOrder[complaint.status] ?? 0 : 0;

    return steps.map((s, idx) => ({
      label: s,
      active: idx <= currentIdx,
      done: idx <= currentIdx,
      isCurrent: idx === currentIdx,
      isRejected: false,
    }));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Track Grievance Resolution Status
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Enter your unique complaint tracking ID (e.g. <span className="font-mono font-bold text-blue-700">CF-100001</span>) to view real-time department assignments, SLA targets, and field updates.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-3 pt-2"
        >
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={complaintIdInput}
              onChange={(e) => setComplaintIdInput(e.target.value)}
              placeholder="e.g. CF-100001"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 text-sm font-mono uppercase tracking-wider text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-7 py-3 rounded-xl bg-[#1565C0] text-white font-bold text-sm hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <span>Track Issue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Quick Select: User's Recent Grievances */}
      {user && myComplaints.length > 0 && !complaint && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Your Recently Logged Issues
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {myComplaints.slice(0, 6).map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setComplaintIdInput(c.id);
                  handleSearch(c.id);
                }}
                className="p-3 border border-gray-200 rounded-lg hover:border-blue-400 cursor-pointer transition-colors bg-gray-50/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-800">{c.id}</span>
                  <StatusBadge status={c.status} size="sm" />
                </div>
                <p className="text-xs font-semibold text-gray-900 mt-1 line-clamp-1">{c.category}</p>
                <p className="text-[11px] text-gray-500 truncate mt-0.5">{c.location_text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complaint Detail Card */}
      {complaint && (
        <div className="space-y-6">
          {/* Status Banner & Timeline */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Case Tracking Reference
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <h2 className="text-2xl font-mono font-extrabold text-gray-900">{complaint.id}</h2>
                  <StatusBadge status={complaint.status} size="lg" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {complaint.is_overdue && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 animate-pulse">
                    <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
                    SLA Escalated (Level {complaint.escalation_level})
                  </span>
                )}
                {complaint.status === 'Reopened' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                    Reopened by Citizen
                  </span>
                )}
                <PriorityBadge priority={complaint.priority} size="md" />
                <span className="text-xs text-gray-500">
                  Logged: {new Date(complaint.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Visual Lifecycle Stepper */}
            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-6">
                Resolution Milestones
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 relative">
                {getTimelineSteps().map((st, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center relative">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-colors mb-2 shadow-xs ${
                        st.isRejected
                          ? 'bg-red-600 text-white'
                          : st.done
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 border border-gray-300 text-gray-400'
                      }`}
                    >
                      {st.isRejected ? (
                        <XCircle className="w-5 h-5" />
                      ) : st.done ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        st.done ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      {st.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CITIZEN CONFIRMATION / REOPEN CARD (Shown when Resolved) */}
          {complaint.status === 'Resolved' && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-emerald-950">
                    Field Team Marked This Grievance As Resolved
                  </h3>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    Please inspect the work or review the field resolution evidence below. As the citizen, you have the final authority to confirm resolution or reopen the ticket if the problem persists.
                  </p>
                </div>
              </div>

              {/* Resolution Evidence Box */}
              {(complaint.resolution_notes || complaint.resolution_image_url) && (
                <div className="bg-white/90 border border-emerald-200 rounded-xl p-4 space-y-3">
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block">
                    Officer Resolution Notes:
                  </span>
                  {complaint.resolution_notes && (
                    <p className="text-xs text-gray-800 font-medium leading-relaxed">
                      "{complaint.resolution_notes}"
                    </p>
                  )}
                  {complaint.resolution_image_url && (
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 block mb-1">
                        Completion Photo Proof:
                      </span>
                      <img
                        src={complaint.resolution_image_url}
                        alt="Resolution evidence"
                        className="max-h-60 rounded-lg border border-gray-200 object-cover"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons & Feedback Form */}
              {!showReopenBox ? (
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 space-y-2 bg-white/80 p-4 rounded-xl border border-emerald-200">
                      <span className="text-xs font-bold text-gray-800 block">
                        Rate Municipal Resolution Quality:
                      </span>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFeedbackRating(star)}
                            className="cursor-pointer p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= feedbackRating
                                  ? 'text-amber-500 fill-amber-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-semibold text-gray-600 ml-2">
                          {feedbackRating === 5 ? 'Excellent' : feedbackRating >= 4 ? 'Good' : feedbackRating >= 3 ? 'Satisfactory' : 'Needs Improvement'}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder="Optional feedback comments for the field crew..."
                        className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg bg-white outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div className="flex flex-col justify-end gap-2 sm:w-64">
                      <button
                        type="button"
                        disabled={feedbackLoading}
                        onClick={handleConfirmResolution}
                        className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        {feedbackLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        <span>Confirm & Close Ticket</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowReopenBox(true)}
                        className="w-full py-2 px-4 rounded-xl border border-amber-600 text-amber-900 bg-white hover:bg-amber-50 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                        <span>Issue Not Resolved? Reopen</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span>Explain Why Issue Is Not Resolved</span>
                  </h4>
                  <textarea
                    rows={3}
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    placeholder="e.g. Road was patched but rain washed gravel away within 24 hours, deep pothole has reopened..."
                    className="w-full text-xs p-3 border border-amber-300 rounded-lg bg-white outline-none focus:ring-1 focus:ring-amber-600"
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowReopenBox(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={feedbackLoading || !reopenReason.trim()}
                      onClick={handleReopenTicket}
                      className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      {feedbackLoading ? 'Reopening Case...' : 'Submit Reopen Request'}
                    </button>
                  </div>
                </div>
              )}

              {feedbackMsg && (
                <p className="text-xs font-semibold text-emerald-900 bg-white/70 p-2.5 rounded-lg border border-emerald-200">
                  {feedbackMsg}
                </p>
              )}
            </div>
          )}

          {/* TICKET CLOSED CONFIRMATION BANNER */}
          {complaint.status === 'Closed' && (
            <div className="bg-slate-50 border border-gray-200 rounded-2xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Case Verified & Officially Closed</h4>
                  <p className="text-xs text-gray-600">
                    Citizen satisfaction recorded and case archived in municipal civic registry.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                Archived Closed
              </span>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: Description, Photo, AI Triage */}
            <div className="md:col-span-2 space-y-6">
              {/* Photo & Description */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Report Details
                </h3>

                {complaint.image_url && (
                  <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-900 max-h-80 flex items-center justify-center">
                    <img
                      src={complaint.image_url}
                      alt={complaint.category}
                      className="w-full h-full max-h-80 object-contain"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-500">Citizen Description:</span>
                  <p className="text-sm text-gray-800 leading-relaxed font-medium">
                    {complaint.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-start gap-2 text-xs text-gray-600">
                  <MapPin className="w-4 h-4 text-blue-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-gray-900">Location: </span>
                    <span>{complaint.location_text}</span>
                    {complaint.ward_name && (
                      <span className="block text-[11px] font-semibold text-blue-700 mt-0.5">
                        Ward: {complaint.ward_name} ({complaint.zone_name})
                      </span>
                    )}
                    <span className="block text-[11px] text-gray-400 font-mono mt-0.5">
                      GPS: {complaint.latitude.toFixed(4)}, {complaint.longitude.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Triage & Features */}
              <div className="bg-blue-50/40 rounded-2xl border border-blue-200 p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                    AI-Assisted Assessment
                  </span>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
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
                    <span className="text-xs font-semibold text-gray-600">Detected Features:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {complaint.ai_detected_features.map((feat, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-white border border-blue-200 rounded text-[11px] text-blue-900 font-medium"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* CASE COMMENTS & PUBLIC UPDATES THREAD */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-700" />
                    <span>Case Inquiries & Citizen Updates ({comments.length})</span>
                  </h3>
                  <span className="text-xs text-gray-400">Public record</span>
                </div>

                {/* Comments List */}
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <p className="text-xs text-gray-500 py-3 text-center italic">
                      No notes or inquiries posted yet.
                    </p>
                  ) : (
                    comments.map((cm) => (
                      <div
                        key={cm.id}
                        className={`p-3 rounded-xl border text-xs space-y-1 ${
                          cm.user_role === 'authority'
                            ? 'bg-purple-50/60 border-purple-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-gray-900 flex items-center gap-1.5">
                            {cm.user_name}
                            {cm.user_role === 'authority' && (
                              <span className="px-1.5 py-0.2 rounded bg-purple-200 text-purple-900 font-semibold text-[10px]">
                                Official Response
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

                {/* Add Comment Input */}
                <form onSubmit={handleAddComment} className="pt-2 border-t border-gray-100 flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Post a question or status update for this case..."
                    className="flex-1 text-xs px-3.5 py-2.5 rounded-lg border border-gray-300 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                  <button
                    type="submit"
                    disabled={commentLoading || !commentText.trim()}
                    className="px-4 py-2.5 bg-[#1565C0] hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right Col: SLA Targets, Assignments & Audit Log */}
            <div className="space-y-6">
              {/* SLA Target & Resolution Clock */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-700" />
                  <span>SLA Service Commitment</span>
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-gray-500">Target SLA:</span>
                    <span className="font-bold text-gray-900">{complaint.sla_hours} hours</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-gray-500">Resolution Due:</span>
                    <span className="font-semibold text-gray-800">
                      {new Date(complaint.due_at || complaint.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500">SLA Status:</span>
                    {complaint.is_overdue ? (
                      <span className="font-bold text-red-600 flex items-center gap-1">
                        <AlertOctagon className="w-3.5 h-3.5" />
                        Breached (Level {complaint.escalation_level})
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        On Track ({Math.max(0, complaint.remaining_hours || 0)}h left)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Department Assignment Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-700" />
                  <span>Assigned Authority</span>
                </h3>

                {complaint.assigned_to_department ? (
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-gray-500">Department:</span>
                      <p className="font-bold text-gray-900 text-sm">{complaint.assigned_to_department}</p>
                    </div>

                    <div>
                      <span className="text-gray-500">Field Officer:</span>
                      <p className="font-semibold text-gray-800">
                        {complaint.assigned_to_officer || 'Ward Inspection Crew'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
                    Awaiting department allocation by central municipal control room.
                  </div>
                )}
              </div>

              {/* Status History Timeline Audit */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-700" />
                  <span>Status History Log</span>
                </h3>

                <div className="space-y-4 divide-y divide-gray-100">
                  {history.map((h) => (
                    <div key={h.id} className="pt-3 first:pt-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <StatusBadge status={h.to_status} size="sm" />
                        <span className="text-[10px] text-gray-400">
                          {new Date(h.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 font-medium mt-1">{h.notes}</p>
                      <p className="text-[10px] text-gray-500">By: {h.changed_by_name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
