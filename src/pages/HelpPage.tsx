import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Phone,
  Mail,
  Send,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { CivicSearchAdvisor } from '../components/CivicSearchAdvisor';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'What types of civic issues can be reported on CivicFix AI?',
    answer:
      'You can report common municipal problems including road potholes, illegal garbage dumping, non-functioning streetlights, potable water pipeline leaks, overflowing drainage/sewage, damaged traffic signals, broken pedestrian footpaths, and damaged public amenities.',
  },
  {
    question: 'How does AI triage and prioritization work?',
    answer:
      'When you upload a photograph and description, CivicFix AI uses Google Gemini 3.8 Flash to analyze visual evidence and context. It automatically estimates the grievance category (e.g. Pothole vs. Drainage), detects specific hazard features, checks for nearby duplicate reports, and assigns a recommended priority (Critical, High, Medium, Low). All AI suggestions are clearly labeled as recommendations and reviewed by authorized municipal ward officers before on-ground dispatch.',
  },
  {
    question: 'How long does it typically take to resolve a complaint?',
    answer:
      'Standard turnaround times depend on priority and department: Critical hazards (such as active potable water main bursts or open roadway manholes) are prioritized for emergency action within 4 to 12 hours. High-priority road and traffic signal defects are typically addressed within 24 to 48 hours. Routine street lighting and minor pavement repairs average 3 to 5 working days.',
  },
  {
    question: 'What should I do in an emergency situation?',
    answer:
      'CivicFix AI is designed for civic and municipal infrastructure complaints, NOT for life-threatening emergencies. In case of active fire, medical trauma, building collapse, or crime in progress, please dial national emergency numbers immediately (All Emergencies: 112, Ambulance: 108, Fire: 101).',
  },
  {
    question: 'Can I report anonymously or as a guest?',
    answer:
      'Yes. You can report civic problems as a guest reporter without creating an account. However, registering a free citizen account allows you to receive automated notifications when an officer updates your ticket, view all your past reports in one dashboard, and verify when on-ground repairs are marked resolved.',
  },
  {
    question: 'What happens if a duplicate complaint is detected?',
    answer:
      'CivicFix AI compares reported GPS coordinates and keyword descriptions against active tickets in the area. If a matching complaint is found, the system alerts you and provides a link to track the existing case. This avoids ticket duplication and helps municipal crews focus on solving the issue faster. You can still choose to file a separate report if you believe your case is distinct.',
  },
  {
    question: 'How do I escalate an unresolved complaint?',
    answer:
      'If a complaint exceeds the estimated resolution timeframe without status updates, the system automatically flags the ticket in the Authority Operations Console as an aging case. Citizens can also reopen resolved tickets or contact the ward grievance cell with their unique Complaint Reference ID (e.g. CF-100001).',
  },
];

export const HelpPage: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');

  const toggleFaq = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSent(true);
    setFeedbackText('');
    setFeedbackEmail('');
    setTimeout(() => setFeedbackSent(false), 5000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
          Support & Public Guidance
        </span>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
          Frequently Asked Questions & Live City Guidance
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Everything you need to know about reporting, tracking, and resolving municipal grievances with CivicFix AI.
        </p>
      </div>

      {/* Live AI Search Grounding Component */}
      <CivicSearchAdvisor
        initialQuery="BBMP garbage collection guidelines and fines Bengaluru"
        locationContext="Bengaluru Urban District"
      />

      {/* Emergency Alert Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="leading-relaxed">
          <span className="font-bold text-amber-950">Immediate Life-Threatening Emergencies: </span>
          Do not file a web ticket for active fires, medical collapse, gas leaks, or crime in progress. Immediately dial national emergency helplines: <strong className="font-bold text-amber-950">112</strong> (Unified Emergency), <strong className="font-bold text-amber-950">108</strong> (Ambulance), or <strong className="font-bold text-amber-950">101</strong> (Fire).
        </div>
      </div>

      {/* Accordion List */}
      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-200 shadow-xs overflow-hidden">
        {FAQS.map((faq, idx) => (
          <div key={idx} className="transition-colors">
            <button
              onClick={() => toggleFaq(idx)}
              className="w-full py-4 px-6 text-left flex items-center justify-between gap-4 hover:bg-gray-50/80 transition-colors"
            >
              <span className="text-sm font-bold text-gray-900">{faq.question}</span>
              {openIdx === idx ? (
                <ChevronUp className="w-4 h-4 text-blue-700 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </button>

            {openIdx === idx && (
              <div className="px-6 pb-5 pt-1 text-xs text-gray-600 leading-relaxed bg-blue-50/20">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact & Civic Support Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-semibold">
              <Mail className="w-3.5 h-3.5" />
              <span>Project Team & Feedback</span>
            </div>

            <h3 className="text-xl font-bold text-gray-900">
              Need assistance or want to share feedback?
            </h3>

            <p className="text-xs text-gray-600 leading-relaxed">
              CivicFix AI is an open civic technology initiative built for community empowerment and transparent public issue resolution. If you have questions about deployment, data privacy, or suggestions for civic AI improvements, send us a message.
            </p>

            <div className="space-y-2 text-xs text-gray-700 pt-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>support@civicfix.org</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-gray-400" />
                <span>Independent Civic Technology Platform • Apache-2.0</span>
              </div>
            </div>
          </div>

          {/* Feedback Form */}
          <form onSubmit={handleFeedbackSubmit} className="space-y-3 bg-gray-50/80 p-5 rounded-xl border border-gray-200 text-xs">
            {feedbackSent && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">Thank you! Your feedback has been received.</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Your Email (Optional)</label>
              <input
                type="email"
                value={feedbackEmail}
                onChange={(e) => setFeedbackEmail(e.target.value)}
                placeholder="citizen@example.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Feedback or Query <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share your suggestions, report a software bug, or ask a question..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#1565C0] text-white font-bold text-xs hover:bg-blue-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Message</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
