import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Filter,
  RefreshCw,
  FolderOpen,
  Clock,
  UserCheck,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  SlidersHorizontal,
  X,
  ChevronRight,
  AlertOctagon,
  RotateCcw,
  Building2,
  MapPin,
  FileCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { Complaint, ComplaintCategory, ComplaintPriority, ComplaintStatus, Ward, Department } from '../types';
import { StatusBadge, PriorityBadge, CategoryIcon } from '../components/StatusBadge';

interface AuthorityDashboardProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenCase: (complaintId: string) => void;
}

export const AuthorityDashboard: React.FC<AuthorityDashboardProps> = ({
  onNavigate,
  onOpenCase,
}) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [wardFilter, setWardFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'priority' | 'sla'>('date_desc');
  const [quickPill, setQuickPill] = useState<'all' | 'overdue' | 'reopened' | 'unassigned' | 'critical'>('all');

  // Quick Action Modal for Status Update
  const [statusModalComplaint, setStatusModalComplaint] = useState<Complaint | null>(null);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('In Progress');
  const [statusNotes, setStatusNotes] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionImageUrl, setResolutionImageUrl] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Quick Action Modal for Assignment
  const [assignModalComplaint, setAssignModalComplaint] = useState<Complaint | null>(null);
  const [assignDepartment, setAssignDepartment] = useState('Road Infrastructure Division');
  const [assignOfficer, setAssignOfficer] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [assignUpdating, setAssignUpdating] = useState(false);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const [res, wardRes, deptRes] = await Promise.all([
        api.getComplaints({}),
        api.getWards().catch(() => ({ wards: [], zones: [] })),
        api.getDepartments().catch(() => ({ departments: [] })),
      ]);
      setComplaints(res.complaints);
      setWards(wardRes.wards || []);
      setDepartments(deptRes.departments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Compute metrics
  const total = complaints.length;
  const pendingReview = complaints.filter((c) => c.status === 'Reported').length;
  const inProgress = complaints.filter((c) => c.status === 'In Progress' || c.status === 'Assigned').length;
  const resolved = complaints.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;
  const overdueCount = complaints.filter((c) => c.is_overdue).length;
  const reopenedCount = complaints.filter((c) => c.status === 'Reopened').length;
  const criticalCount = complaints.filter((c) => c.priority === 'Critical' || c.priority === 'High').length;

  // Filter & Sort
  const filtered = complaints
    .filter((c) => {
      // Quick pill constraints
      if (quickPill === 'overdue' && !c.is_overdue) return false;
      if (quickPill === 'reopened' && c.status !== 'Reopened') return false;
      if (quickPill === 'unassigned' && c.status !== 'Reported') return false;
      if (quickPill === 'critical' && c.priority !== 'Critical' && c.priority !== 'High') return false;

      // Select filters
      if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
      if (priorityFilter !== 'All' && c.priority !== priorityFilter) return false;
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (wardFilter !== 'All' && c.ward_id !== wardFilter) return false;

      if (search) {
        const q = search.toLowerCase();
        return (
          c.id.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.location_text.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          (c.ward_name && c.ward_name.toLowerCase().includes(q)) ||
          (c.zone_name && c.zone_name.toLowerCase().includes(q)) ||
          (c.user_name && c.user_name.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'priority') {
        const order: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        return (order[b.priority] || 0) - (order[a.priority] || 0);
      }
      if (sortBy === 'sla') {
        return (a.remaining_hours || 0) - (b.remaining_hours || 0);
      }
      return 0;
    });

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('All');
    setPriorityFilter('All');
    setStatusFilter('All');
    setWardFilter('All');
    setSortBy('date_desc');
    setQuickPill('all');
  };

  // Submit Quick Status Update
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalComplaint) return;
    setStatusUpdating(true);

    try {
      await api.updateComplaintStatus(
        statusModalComplaint.id,
        newStatus,
        statusNotes,
        newStatus === 'Resolved' ? resolutionNotes : undefined,
        newStatus === 'Resolved' ? resolutionImageUrl : undefined
      );
      setStatusModalComplaint(null);
      setStatusNotes('');
      setResolutionNotes('');
      setResolutionImageUrl('');
      fetchComplaints();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    } finally {
      setStatusUpdating(false);
    }
  };

  // Submit Quick Assignment
  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalComplaint) return;
    setAssignUpdating(true);

    try {
      await api.assignComplaint(
        assignModalComplaint.id,
        assignDepartment,
        assignOfficer || 'Field Inspection Crew',
        assignNote
      );
      setAssignModalComplaint(null);
      setAssignOfficer('');
      setAssignNote('');
      fetchComplaints();
    } catch (err: any) {
      alert(err.message || 'Assignment failed');
    } finally {
      setAssignUpdating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-purple-600 rounded-lg text-white">
              <Shield className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
              Municipal Administration Console
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Civic Grievance Triage & Resolution Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Live municipal case registry with automated SLA tracking, cross-department routing, and citizen resolution auditing across all wards.
          </p>
        </div>

        <button
          onClick={fetchComplaints}
          disabled={loading}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* KPI Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => setQuickPill('all')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            quickPill === 'all'
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200'
              : 'bg-white border-gray-200 hover:border-blue-300'
          }`}
        >
          <span className="text-xs font-semibold text-gray-500 block">Total In Registry</span>
          <span className="text-2xl font-extrabold text-gray-900 mt-0.5 block">{total}</span>
        </div>

        <div
          onClick={() => setQuickPill('overdue')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            quickPill === 'overdue'
              ? 'bg-red-50 border-red-400 ring-2 ring-red-200'
              : 'bg-white border-gray-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-700">Overdue SLA</span>
            <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
          </div>
          <span className="text-2xl font-extrabold text-red-600 mt-0.5 block">{overdueCount}</span>
        </div>

        <div
          onClick={() => setQuickPill('reopened')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            quickPill === 'reopened'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200'
              : 'bg-white border-gray-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">Reopened</span>
            <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <span className="text-2xl font-extrabold text-amber-700 mt-0.5 block">{reopenedCount}</span>
        </div>

        <div
          onClick={() => setQuickPill('unassigned')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            quickPill === 'unassigned'
              ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-200'
              : 'bg-white border-gray-200 hover:border-purple-300'
          }`}
        >
          <span className="text-xs font-semibold text-purple-700 block">Awaiting Dispatch</span>
          <span className="text-2xl font-extrabold text-purple-800 mt-0.5 block">{pendingReview}</span>
        </div>

        <div
          onClick={() => setQuickPill('critical')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            quickPill === 'critical'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-200'
              : 'bg-white border-gray-200 hover:border-rose-300'
          }`}
        >
          <span className="text-xs font-semibold text-rose-700 block">High / Critical</span>
          <span className="text-2xl font-extrabold text-rose-800 mt-0.5 block">{criticalCount}</span>
        </div>

        <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
          <span className="text-xs font-semibold text-emerald-800 block">Resolved / Closed</span>
          <span className="text-2xl font-extrabold text-emerald-700 mt-0.5 block">{resolved}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, keyword, address, citizen name, or ward..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Ward Selector */}
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-800 bg-white font-medium outline-none focus:border-blue-600"
            >
              <option value="All">All Municipal Wards</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>
                  Ward {w.ward_number}: {w.ward_name} ({w.zone_name})
                </option>
              ))}
            </select>

            {/* Category */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-800 bg-white font-medium outline-none focus:border-blue-600"
            >
              <option value="All">All Categories</option>
              <option value="Pothole">Potholes</option>
              <option value="Garbage">Garbage / Waste</option>
              <option value="Streetlight">Streetlights</option>
              <option value="Water Leakage">Water Supply</option>
              <option value="Drainage">Drainage</option>
              <option value="Traffic Signal">Traffic / Roads</option>
              <option value="Footpath Encroachment">Footpaths</option>
              <option value="Tree Fall">Tree Hazards</option>
            </select>

            {/* Priority */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-800 bg-white font-medium outline-none focus:border-blue-600"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-800 bg-white font-medium outline-none focus:border-blue-600"
            >
              <option value="All">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
              <option value="Reopened">Reopened</option>
              <option value="Rejected">Rejected</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-800 bg-white font-medium outline-none focus:border-blue-600"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="priority">Highest Priority First</option>
              <option value="sla">SLA Urgent First</option>
            </select>

            {(search || categoryFilter !== 'All' || priorityFilter !== 'All' || statusFilter !== 'All' || wardFilter !== 'All' || quickPill !== 'all') && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Status Indicator */}
        {quickPill !== 'all' && (
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-gray-500">Active Quick View:</span>
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-white flex items-center gap-1.5 capitalize">
              {quickPill === 'overdue' && <AlertOctagon className="w-3 h-3 text-red-400" />}
              {quickPill === 'reopened' && <RotateCcw className="w-3 h-3 text-amber-400" />}
              <span>{quickPill} Cases Only</span>
              <button onClick={() => setQuickPill('all')} className="ml-1 hover:text-red-300">
                ×
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Main Complaints Table / Registry */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Grievances Queue ({filtered.length} items)
          </span>
          <span className="text-xs text-gray-400">
            Click row or Open Case to inspect comprehensive details
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FolderOpen className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-sm font-semibold text-gray-700">No grievances match the selected criteria</p>
            <p className="text-xs text-gray-400">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5">Reference ID</th>
                  <th className="px-4 py-3.5">Category & Location</th>
                  <th className="px-4 py-3.5">Ward / Zone</th>
                  <th className="px-4 py-3.5">SLA Target</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Assigned To</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                    onClick={() => onOpenCase(c.id)}
                  >
                    {/* ID & Priority */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-blue-900 group-hover:underline">
                          {c.id}
                        </span>
                        <div className="mt-1 flex items-center gap-1">
                          <PriorityBadge priority={c.priority} size="sm" />
                          {c.is_overdue && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <AlertOctagon className="w-2.5 h-2.5" />
                              L{c.escalation_level}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category & Location */}
                    <td className="px-4 py-4 max-w-xs">
                      <div className="flex items-start gap-2">
                        <CategoryIcon category={c.category} className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
                        <div className="truncate">
                          <span className="font-bold text-gray-900 block truncate">{c.category}</span>
                          <span className="text-gray-500 text-[11px] block truncate mt-0.5">{c.location_text}</span>
                        </div>
                      </div>
                    </td>

                    {/* Ward / Zone */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {c.ward_name ? (
                        <div className="text-[11px]">
                          <span className="font-bold text-gray-800 block">Ward {c.ward_number}</span>
                          <span className="text-gray-500 block">{c.ward_name}</span>
                          <span className="text-[10px] text-blue-700 font-semibold">{c.zone_name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Central City</span>
                      )}
                    </td>

                    {/* SLA Target */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-[11px]">
                        {c.is_overdue ? (
                          <span className="font-bold text-red-600 flex items-center gap-1">
                            <AlertOctagon className="w-3 h-3 text-red-600" />
                            Overdue
                          </span>
                        ) : (
                          <span className="font-bold text-emerald-700 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            {Math.max(0, c.remaining_hours || 0)}h left
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          Total: {c.sla_hours}h SLA
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={c.status} size="sm" />
                        {c.status === 'Reopened' && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded w-fit">
                            Citizen Reopened
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Assigned Department */}
                    <td className="px-4 py-4 max-w-[180px] truncate text-gray-600">
                      {c.assigned_to_department ? (
                        <div>
                          <span className="font-semibold text-gray-900 block truncate text-[11px]">
                            {c.assigned_to_department}
                          </span>
                          <span className="text-[10px] text-gray-400 block truncate">
                            {c.assigned_to_officer || 'Field Team'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">Unassigned</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setAssignModalComplaint(c);
                          setAssignDepartment(c.assigned_to_department || 'Road Infrastructure Division');
                          setAssignOfficer(c.assigned_to_officer || '');
                        }}
                        className="px-2.5 py-1 rounded bg-purple-50 text-purple-900 hover:bg-purple-100 font-semibold text-[11px] border border-purple-200 cursor-pointer"
                        title="Assign Department"
                      >
                        Assign
                      </button>

                      <button
                        onClick={() => {
                          setStatusModalComplaint(c);
                          setNewStatus(c.status);
                        }}
                        className="px-2.5 py-1 rounded bg-blue-50 text-blue-900 hover:bg-blue-100 font-semibold text-[11px] border border-blue-200 cursor-pointer"
                        title="Update Status"
                      >
                        Status
                      </button>

                      <button
                        onClick={() => onOpenCase(c.id)}
                        className="px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-[11px] cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>Case File</span>
                        <ChevronRight className="w-3 h-3 text-gray-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QUICK STATUS UPDATE MODAL */}
      {statusModalComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Quick Status Update
                </span>
                <h3 className="text-lg font-mono font-extrabold text-blue-900">
                  {statusModalComplaint.id}
                </h3>
              </div>
              <button
                onClick={() => setStatusModalComplaint(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Change Workflow Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-900 font-semibold outline-none focus:border-blue-600 bg-white"
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
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Officer Action Remarks <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Record on-ground observations, dispatch notes, or resolution confirmation..."
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-900 outline-none focus:border-blue-600"
                />
              </div>

              {/* Conditional Resolution Evidence when set to Resolved */}
              {newStatus === 'Resolved' && (
                <div className="space-y-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div>
                    <label className="block font-bold text-emerald-950 uppercase tracking-wider mb-1">
                      Field Resolution Summary <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="e.g. Broken water pipe replaced and valve resealed. Water flow restored."
                      className="w-full rounded-lg border border-emerald-300 p-2 text-xs text-gray-900 bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-emerald-950 uppercase tracking-wider mb-1">
                      Resolution Photo Evidence URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={resolutionImageUrl}
                      onChange={(e) => setResolutionImageUrl(e.target.value)}
                      placeholder="https://... or photo proof link"
                      className="w-full rounded-lg border border-emerald-300 px-3 py-1.5 text-xs text-gray-900 bg-white outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStatusModalComplaint(null)}
                  className="px-4 py-2 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={statusUpdating}
                  className="px-5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold cursor-pointer"
                >
                  {statusUpdating ? 'Updating...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ASSIGNMENT MODAL */}
      {assignModalComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Dispatch & Assign Department
                </span>
                <h3 className="text-lg font-mono font-extrabold text-blue-900">
                  {assignModalComplaint.id}
                </h3>
              </div>
              <button
                onClick={() => setAssignModalComplaint(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssign} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Responsible Municipal Department
                </label>
                <select
                  value={assignDepartment}
                  onChange={(e) => setAssignDepartment(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-900 font-semibold outline-none focus:border-blue-600 bg-white"
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
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Designated Officer or Field Crew
                </label>
                <input
                  type="text"
                  value={assignOfficer}
                  onChange={(e) => setAssignOfficer(e.target.value)}
                  placeholder="e.g. Ward 111 Junior Engineer / Rapid Response Unit 4"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-900 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Internal Instructions or Equipment Directives
                </label>
                <textarea
                  rows={2}
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  placeholder="Field team instructions, required heavy equipment, or priority notes..."
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-900 outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAssignModalComplaint(null)}
                  className="px-4 py-2 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignUpdating}
                  className="px-5 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold cursor-pointer"
                >
                  {assignUpdating ? 'Dispatching...' : 'Dispatch Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
