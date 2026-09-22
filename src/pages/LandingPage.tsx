import React from 'react';
import {
  Camera,
  Search,
  MapPin,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  AlertTriangle,
  FileText,
  Users,
  Building2,
  HelpCircle,
} from 'lucide-react';
import { Complaint, AnalyticsStats } from '../types';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { SupportedLanguage, translations } from '../i18n';

interface LandingPageProps {
  onNavigate: (view: string, param?: string) => void;
  stats?: AnalyticsStats | null;
  recentComplaints: Complaint[];
  lang: SupportedLanguage;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  stats,
  recentComplaints,
  lang,
}) => {
  const t = translations[lang];

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#0D47A1] via-[#1565C0] to-[#1E88E5] text-white overflow-hidden py-14 sm:py-20 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-xs sm:text-sm font-medium text-blue-100">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Civic Problem Reporting & Intelligent Municipal Tracking</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Report Civic Problems. <br />
            <span className="text-amber-300">Track Progress with AI Transparency.</span>
          </h1>

          <p className="text-base sm:text-xl text-blue-100 max-w-2xl mx-auto font-normal leading-relaxed">
            CivicFix AI helps citizens report potholes, garbage dumps, broken streetlights, and drainage leaks. Powered by Gemini AI for rapid triage and accountable municipal case management.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => onNavigate('report')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-amber-400 text-slate-900 font-bold text-base hover:bg-amber-300 active:scale-98 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Camera className="w-5 h-5" />
              <span>{t.actions.reportNow}</span>
            </button>

            <button
              onClick={() => onNavigate('track')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-white/15 text-white font-semibold text-base border border-white/30 hover:bg-white/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-5 h-5 text-blue-200" />
              <span>{t.actions.trackNow}</span>
            </button>
          </div>

          {/* Independent disclaimer badge */}
          <p className="text-xs text-blue-200 max-w-xl mx-auto pt-2">
            CivicFix AI is an independent civic platform for public grievance tracking and resolution.
          </p>
        </div>
      </section>

      {/* Real-Time Impact Metric Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1565C0]">
              {stats?.total_reports ?? 24}
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-600 mt-1">Total Issues Logged</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {stats?.resolved ?? 16}
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-600 mt-1">Complaints Resolved</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
              {stats?.resolution_rate_percent ?? 67}%
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-600 mt-1">Resolution Rate</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-600">
              {stats?.avg_resolution_hours ?? 18.5} hrs
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-600 mt-1">Avg Resolution Time</p>
          </div>
        </div>
      </section>

      {/* Quick Action Navigation Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-gray-900">What would you like to do?</h2>
          <p className="text-sm text-gray-500 mt-1">Direct access to all civic grievance services</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div
            onClick={() => onNavigate('report')}
            className="p-6 rounded-xl border border-gray-200 bg-white hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                Report Civic Problem
              </h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                Take or upload a photo, pinpoint GPS location, and receive immediate AI classification and duplicate checking.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center text-xs font-semibold text-blue-700">
              <span>Start Report</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => onNavigate('track')}
            className="p-6 rounded-xl border border-gray-200 bg-white hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-amber-700 transition-colors">
                Track Complaint
              </h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                Enter your unique Complaint ID (e.g. CF-100001) to view audit trail history, assigned officers, and current status.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center text-xs font-semibold text-amber-700">
              <span>Check Status</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => onNavigate('map')}
            className="p-6 rounded-xl border border-gray-200 bg-white hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                Public Civic Map
              </h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                View geo-tagged reports across wards, examine neighborhood trends, and inspect resolved work locations.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center text-xs font-semibold text-emerald-700">
              <span>Explore Map</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => onNavigate('help')}
            className="p-6 rounded-xl border border-gray-200 bg-white hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                Help & Guidelines
              </h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                Learn what issues can be resolved, how AI classification works, SLA timelines, and escalation channels.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center text-xs font-semibold text-purple-700">
              <span>View FAQs</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* How CivicFix AI Works (Process Steps) */}
      <section className="bg-slate-50 py-16 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Clear 4-Step Lifecycle</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-1">How CivicFix AI Works</h2>
            <p className="text-sm text-gray-600 mt-2">
              From civic problem detection on your street to verified on-ground resolution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs relative">
              <div className="w-10 h-10 rounded-full bg-blue-700 text-white font-bold text-sm flex items-center justify-center mb-4">
                01
              </div>
              <h4 className="text-base font-bold text-gray-900 mb-1">Citizen Reports Issue</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Take a photograph, describe the issue, and provide your GPS coordinates or select a recognized landmark.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs relative">
              <div className="w-10 h-10 rounded-full bg-blue-700 text-white font-bold text-sm flex items-center justify-center mb-4">
                02
              </div>
              <h4 className="text-base font-bold text-gray-900 mb-1">AI Triage & Verification</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Gemini AI classifies the issue category, assigns urgency priority, generates key features, and flags nearby duplicates.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs relative">
              <div className="w-10 h-10 rounded-full bg-blue-700 text-white font-bold text-sm flex items-center justify-center mb-4">
                03
              </div>
              <h4 className="text-base font-bold text-gray-900 mb-1">Authority Assignment</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Designated ward officers review the case, verify AI suggestions, and assign field teams with internal instructions.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs relative">
              <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-bold text-sm flex items-center justify-center mb-4">
                04
              </div>
              <h4 className="text-base font-bold text-gray-900 mb-1">Transparent Resolution</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Work is completed on-site, status is marked Resolved with evidence notes, and citizens receive live notifications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Transparency Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Accountability by Design</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                Civic Technology Built on Trust and Transparency
              </h2>

              <p className="text-sm text-gray-600 leading-relaxed">
                CivicFix AI bridges the gap between citizens and municipal teams. Every complaint receives an immutable audit trail, clear status milestones, and tamper-resistant timestamps.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-emerald-100 text-emerald-800 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-gray-900">Duplicate Report Detection</h5>
                    <p className="text-xs text-gray-600">
                      Prevents ticket congestion by notifying citizens if their issue was already reported nearby.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-blue-100 text-blue-800 mt-0.5">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-gray-900">Responsible AI Recommendations</h5>
                    <p className="text-xs text-gray-600">
                      AI suggestions assist prioritization without replacing human municipal judgment.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-purple-100 text-purple-800 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-gray-900">Auditable Case Milestones</h5>
                    <p className="text-xs text-gray-600">
                      Every status change records the officer's designation, timestamp, and explanation notes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Transparency Note Card */}
            <div className="bg-slate-50 border border-gray-200 rounded-xl p-6 sm:p-8 space-y-4">
              <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Important Product Notice</span>
              </h4>

              <p className="text-xs text-gray-600 leading-relaxed">
                CivicFix AI is an independent civic technology platform and is <strong className="text-gray-900">not an official government service</strong>. It connects citizens and civic response teams with intelligent automated triage and transparent grievance tracking.
              </p>

              <p className="text-xs text-gray-600 leading-relaxed">
                <strong className="text-gray-900">AI Disclaimer:</strong> AI-generated classifications, priorities, and feature summaries are automated suggestions. Authorized civic personnel retain final authority on status, routing, and repair actions.
              </p>

              <div className="pt-3 border-t border-gray-200 flex flex-wrap gap-2 text-xs">
                <span className="px-2.5 py-1 bg-white border border-gray-200 rounded font-medium text-gray-700">
                  Data Privacy Protected
                </span>
                <span className="px-2.5 py-1 bg-white border border-gray-200 rounded font-medium text-gray-700">
                  Phone Numbers Redacted
                </span>
                <span className="px-2.5 py-1 bg-white border border-gray-200 rounded font-medium text-gray-700">
                  Open Source Architecture
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Community Complaints Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Recent Community Reports</h3>
            <p className="text-xs text-gray-500 mt-0.5">Live grievances logged across city wards</p>
          </div>

          <button
            onClick={() => onNavigate('map')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline"
          >
            <span>View All on Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentComplaints.slice(0, 3).map((comp) => (
            <div
              key={comp.id}
              onClick={() => onNavigate('track', comp.id)}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-xs text-blue-800">{comp.id}</span>
                  <StatusBadge status={comp.status} size="sm" />
                </div>

                <h4 className="mt-2 text-sm font-bold text-gray-900 line-clamp-1">{comp.category}</h4>
                <p className="mt-1 text-xs text-gray-600 line-clamp-2">{comp.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span className="truncate max-w-[170px]" title={comp.location_text}>
                  📍 {comp.location_text}
                </span>
                <PriorityBadge priority={comp.priority} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
