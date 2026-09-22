import React from 'react';
import {
  Clock,
  UserCheck,
  Wrench,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  AlertCircle,
  Info,
  Trash2,
  Lightbulb,
  Droplet,
  Waves,
  Car,
  Landmark,
  FileQuestion,
} from 'lucide-react';
import { ComplaintStatus, ComplaintPriority, ComplaintCategory } from '../types';

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  switch (status) {
    case 'Reported':
      return (
        <span
          className={`inline-flex items-center rounded-full border border-blue-200 bg-blue-50 text-blue-800 ${sizeClasses[size]}`}
          title="Status: Reported"
        >
          <Clock className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          <span>Reported</span>
        </span>
      );
    case 'Assigned':
      return (
        <span
          className={`inline-flex items-center rounded-full border border-purple-200 bg-purple-50 text-purple-800 ${sizeClasses[size]}`}
          title="Status: Assigned"
        >
          <UserCheck className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          <span>Assigned</span>
        </span>
      );
    case 'In Progress':
      return (
        <span
          className={`inline-flex items-center rounded-full border border-amber-200 bg-amber-50 text-amber-900 ${sizeClasses[size]}`}
          title="Status: In Progress"
        >
          <Wrench className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          <span>In Progress</span>
        </span>
      );
    case 'Resolved':
      return (
        <span
          className={`inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 ${sizeClasses[size]}`}
          title="Status: Resolved"
        >
          <CheckCircle2 className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          <span>Resolved</span>
        </span>
      );
    case 'Rejected':
      return (
        <span
          className={`inline-flex items-center rounded-full border border-red-200 bg-red-50 text-red-800 ${sizeClasses[size]}`}
          title="Status: Rejected"
        >
          <XCircle className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          <span>Rejected</span>
        </span>
      );
    default:
      return <span>{status}</span>;
  }
};

interface PriorityBadgeProps {
  priority: ComplaintPriority;
  size?: 'sm' | 'md' | 'lg';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  switch (priority) {
    case 'Critical':
      return (
        <span
          className={`inline-flex items-center rounded-full border border-red-300 bg-red-100 text-red-900 ${sizeClasses[size]}`}
          title="Priority: Critical"
        >
          <Flame className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          <span>Critical</span>
        </span>
      );
    case 'High':
      return (
        <span
          className={`inline-flex items-center rounded-full border border-orange-200 bg-orange-50 text-orange-900 ${sizeClasses[size]}`}
          title="Priority: High"
        >
          <AlertTriangle className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          <span>High</span>
        </span>
      );
    case 'Medium':
      return (
        <span
          className={`inline-flex items-center rounded-full border border-amber-200 bg-amber-50 text-amber-800 ${sizeClasses[size]}`}
          title="Priority: Medium"
        >
          <AlertCircle className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          <span>Medium</span>
        </span>
      );
    case 'Low':
      return (
        <span
          className={`inline-flex items-center rounded-full border border-slate-200 bg-slate-100 text-slate-700 ${sizeClasses[size]}`}
          title="Priority: Low"
        >
          <Info className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          <span>Low</span>
        </span>
      );
    default:
      return <span>{priority}</span>;
  }
};

export const CategoryIcon: React.FC<{ category: ComplaintCategory; className?: string }> = ({
  category,
  className = 'w-4 h-4',
}) => {
  switch (category) {
    case 'Pothole':
    case 'Road Damage':
      return <AlertTriangle className={className} />;
    case 'Garbage':
      return <Trash2 className={className} />;
    case 'Streetlight':
      return <Lightbulb className={className} />;
    case 'Water Leakage':
      return <Droplet className={className} />;
    case 'Drainage':
      return <Waves className={className} />;
    case 'Traffic Signal':
      return <Car className={className} />;
    case 'Public Property Damage':
      return <Landmark className={className} />;
    default:
      return <FileQuestion className={className} />;
  }
};
