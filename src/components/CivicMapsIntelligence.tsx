import React, { useState } from 'react';
import { MapPin, Navigation, ExternalLink, Loader2, Sparkles, Building2, Star } from 'lucide-react';
import { api } from '../services/api';
import { MapsGroundingResult } from '../types';

interface CivicMapsIntelligenceProps {
  initialQuery?: string;
  latitude?: number;
  longitude?: number;
  onSelectPlace?: (title: string, uri: string) => void;
  compact?: boolean;
}

const PRESET_PLACES = [
  'BBMP Ward Office & Citizen Help Desk',
  'Traffic Management Center & Police Station',
  'Public Works Department (PWD) Roads Division',
  'Emergency Municipal Hospital & Health Center',
];

export const CivicMapsIntelligence: React.FC<CivicMapsIntelligenceProps> = ({
  initialQuery = 'Municipal Ward Office',
  latitude,
  longitude,
  onSelectPlace,
  compact = false,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MapsGroundingResult | null>(null);
  const [error, setError] = useState('');

  const handleLookup = async (searchQuery?: string) => {
    const q = (searchQuery || query).trim();
    if (!q) return;

    setLoading(true);
    setError('');
    try {
      const res = await api.getMapsGrounding(q, latitude, longitude);
      setResult(res);
    } catch (err: any) {
      console.error('Maps grounding failed:', err);
      setError(err.message || 'Unable to retrieve Google Maps location data. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-gray-900">Nearby Civic Facilities & Maps Intelligence</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Gemini 3.5 Flash + Google Maps
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Live Google Maps Grounding resolving nearby ward offices, PWD depots, and emergency centers
            </p>
          </div>
        </div>
      </div>

      {/* Input row */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleLookup();
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search nearby ward office, utility depot, police station..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-gray-50/50"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-300 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Locating...</span>
            </>
          ) : (
            <>
              <Navigation className="w-3.5 h-3.5" />
              <span>Ground on Maps</span>
            </>
          )}
        </button>
      </form>

      {/* Quick Location Pills */}
      {!result && !loading && (
        <div className="mt-3">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
            Quick Facility Lookups:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_PLACES.map((place, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setQuery(place);
                  handleLookup(place);
                }}
                className="text-left text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 transition-colors border border-gray-200"
              >
                {place}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl text-xs leading-relaxed text-gray-800 whitespace-pre-line">
            {result.text}
          </div>

          {/* Places with verified Google Maps URLs */}
          {result.places && result.places.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Google Maps Places ({result.places.length})</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {result.places.map((place, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-gray-200 bg-white hover:border-emerald-300 shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="text-xs font-bold text-gray-900 leading-snug">{place.title}</h4>
                      </div>
                      {place.address && (
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{place.address}</p>
                      )}
                      {place.reviewSnippet && (
                        <p className="text-[11px] text-gray-600 italic mt-1.5 bg-gray-50 p-1.5 rounded border border-gray-100 line-clamp-2">
                          "{place.reviewSnippet}"
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                      <a
                        href={place.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 hover:underline"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Open in Google Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      {onSelectPlace && (
                        <button
                          type="button"
                          onClick={() => onSelectPlace(place.title, place.uri)}
                          className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 hover:bg-emerald-100"
                        >
                          Use Location
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
