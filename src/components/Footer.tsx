import React from 'react';
import { CivicLogo } from './CivicLogo';
import { ShieldCheck, ExternalLink, AlertOctagon, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      {/* High Visibility Disclaimer Banner */}
      <div className="bg-amber-950/80 border-b border-amber-800/80 px-4 py-3 text-amber-200 text-xs">
        <div className="max-w-7xl mx-auto flex items-start gap-2.5">
          <AlertOctagon className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="leading-relaxed">
            <span className="font-bold text-amber-300">Independent Civic Technology Platform:</span>{' '}
            CivicFix AI is an independent community grievance management platform designed for transparent civic problem tracking and automated resolution workflows.
            It is <span className="underline font-semibold">not an official government service</span> or government agency portal.
            AI classifications and priority recommendations are automated assistance tools and must be validated by authorized personnel.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-4">
            <CivicLogo textColor="text-white" size={32} />
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              CivicFix AI empowers citizens to report everyday civic problems—like potholes, garbage dumps, street lighting failures, and water leaks—with photo validation and location tracking. AI organizes reports so municipal teams can respond with transparency and accountability.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Independent Civic Technology Platform • Report. Track. Resolve.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('report')}
                  className="hover:text-blue-400 transition-colors text-left"
                >
                  Report an Issue
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('track')}
                  className="hover:text-blue-400 transition-colors text-left"
                >
                  Track Complaint Status
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('map')}
                  className="hover:text-blue-400 transition-colors text-left"
                >
                  Interactive Civic Map
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('analytics')}
                  className="hover:text-blue-400 transition-colors text-left"
                >
                  Resolution Analytics
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('help')}
                  className="hover:text-blue-400 transition-colors text-left"
                >
                  Help & FAQs
                </button>
              </li>
            </ul>
          </div>

          {/* Emergency & Technology Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Emergency Helplines</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              For urgent emergency services, contact national emergency numbers:
            </p>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>All Emergencies:</span>
                <span className="text-white font-bold">112</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>Ambulance:</span>
                <span className="text-white font-bold">108</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>Fire Control:</span>
                <span className="text-white font-bold">101</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CivicFix AI. Built with open-source technologies.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('help')} className="hover:text-slate-300">
              Privacy & Data Policy
            </button>
            <span>•</span>
            <button onClick={() => onNavigate('help')} className="hover:text-slate-300">
              Terms of Use
            </button>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-400">
              Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for Better Communities
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
