import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Clock,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Search,
  ExternalLink,
  MapPin,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Complaint } from '../types';
import { StatusBadge, PriorityBadge, CategoryIcon } from '../components/StatusBadge';

interface CitizenDashboardProps {
  onNavigate: (view: string, param?: string) => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchMyComplaints = async () => {
    try {
      setLoading(true);
      const res = await api.getComplaints({ my_only: true });
      setComplaints(res.complaints);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  const total = complaints.length;
  const active = complaints.filter((c) => c.status === 'Reported' || c.status === 'Assigned').length;
  const inProgress = complaints.filter((c) => c.status === 'In Progress').length;
  const resolved = complaints.filter((c) => c.status === 'Resolved').length;

  const filteredComplaints = complaints.filter((c) => {
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        c.id.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.location_text.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-100 shadow-xs flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xl flex-shrink-0 border border-blue-200">
              {user?.full_name?.charAt(0) || 'C'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                Citizen Grievance Portal
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Firestore Cloud Synced</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
              Welcome, {user?.full_name || 'Citizen'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {user?.email ? `${user.email} • ` : ''}Track and manage your submitted civic complaints across municipal divisions.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('report')}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1565C0] text-white font-bold text-sm hover:bg-blue-800 transition-colors shadow-xs cursor-pointer flex-shrink-0"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Report New Grievance</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Reports</span>
            <FolderOpen className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl font-extrabold text-gray-900">{total}</div>
          <p className="text-[11px] text-gray-500 mt-1">Grievances filed by you</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-blue-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Queue</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-blue-700">{active}</div>
          <p className="text-[11px] text-gray-500 mt-1">Reported & Assigned</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">In Progress</span>
            <Wrench className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600">{inProgress}</div>
          <p className="text-[11px] text-gray-500 mt-1">Field crew operating</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Resolved</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{resolved}</div>
          <p className="text-[11px] text-gray-500 mt-1">Successfully closed</p>
        </div>
      </div>

      {/* Complaints Table & Filter Strip */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-50/50">
          <h2 className="text-base font-bold text-gray-900">Your Filed Grievances</h2>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search complaints..."
                className="pl-9 pr-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 w-48 sm:w-64"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="All">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>

            <button
              onClick={fetchMyComplaints}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Complaints Table */}
        {loading ? (
          <div className="py-16 text-center text-gray-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            Loading your grievance records...
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="py-16 text-center text-gray-500 space-y-3">
            <FolderOpen className="w-10 h-10 mx-auto text-gray-300" />
            <p className="text-sm font-semibold text-gray-700">No grievances found</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              You haven't reported any issues matching this filter yet.
            </p>
            <button
              onClick={() => onNavigate('report')}
              className="px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800"
            >
              Report a Civic Issue Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Complaint ID</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reported On</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredComplaints.map((c) => (
                  <tr key={c.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-800">{c.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                        <CategoryIcon category={c.category} className="w-3.5 h-3.5 text-blue-700" />
                        <span>{c.category}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate" title={c.location_text}>
                      📍 {c.location_text}
                    </td>
                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={c.priority} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onNavigate('track', c.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold transition-colors"
                      >
                        <span>Track</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
