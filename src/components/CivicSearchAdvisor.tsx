import React, { useState } from 'react';
import { Search, Globe, ExternalLink, Loader2, Sparkles, BookOpen, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { SearchGroundingResult } from '../types';

interface CivicSearchAdvisorProps {
  initialQuery?: string;
  locationContext?: string;
  compact?: boolean;
}

const PRESET_TOPICS = [
  'Solid waste segregation rules and fines in Bengaluru',
  'Pothole repair timeline and municipal compensation policy',
  'Emergency helpline numbers for storm water drain overflow',
  'Process to report illegal construction or road digging',
];

export const CivicSearchAdvisor: React.FC<CivicSearchAdvisorProps> = ({
  initialQuery = '',
  locationContext = 'Bengaluru Municipal Area',
  compact = false,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchGroundingResult | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async (searchTerm?: string) => {
    const q = (searchTerm || query).trim();
    if (!q) return;

    setLoading(true);
    setError('');
    try {
      const res = await api.getCivicSearchGrounding(q, locationContext);
      setResult(res);
    } catch (err: any) {
      console.error('Grounding search failed:', err);
      setError(err.message || 'Unable to retrieve live search data. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-gray-900">City Pulse & Municipal Search Grounding</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Gemini 3.5 Flash + Google Search
              </span>
            </div>
            <p className="text-xs text-gray-500">Live verified information retrieved directly from official government & news sources</p>
          </div>
        </div>
      </div>

      {/* Search Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about municipal bylaws, fines, garbage schedules, flood alerts..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-gray-50/50"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-gray-300 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Grounding...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Search Grounding</span>
            </>
          )}
        </button>
      </form>

      {/* Suggested Quick Queries */}
      {!result && !loading && (
        <div className="mt-3">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
            Frequent Citizen Queries:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_TOPICS.map((topic, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setQuery(topic);
                  handleSearch(topic);
                }}
                className="text-left text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-800 transition-colors border border-gray-200"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grounding Results Display */}
      {result && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl text-xs leading-relaxed text-gray-800 whitespace-pre-line">
            {result.text}
          </div>

          {/* Sources and Citations */}
          {result.sources && result.sources.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Verified Google Search Grounding Sources ({result.sources.length})</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-between gap-2 text-xs text-blue-700 hover:underline transition-all group"
                  >
                    <span className="truncate font-medium">{src.title || src.uri}</span>
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 group-hover:text-blue-700" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
