import React, { useState, useEffect } from 'react';
import { MapComponent } from '../components/MapComponent';
import { Complaint } from '../types';
import { api } from '../services/api';
import { MapPin, RefreshCw, PlusCircle, Search, Info } from 'lucide-react';
import { CivicMapsIntelligence } from '../components/CivicMapsIntelligence';

interface CivicMapPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const CivicMapPage: React.FC<CivicMapPageProps> = ({ onNavigate }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await api.getComplaints({ public_map: true });
      setComplaints(res.complaints);
    } catch (err) {
      console.error('Failed to load map complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-700" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Live Municipal Geo-Triage
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            Community Civic Grievance Map
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Interactive geographic visualization of reported potholes, garbage accumulation, water leaks, and lighting defects.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('report')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1565C0] text-white font-bold text-xs hover:bg-blue-800 transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report at New Location</span>
          </button>

          <button
            onClick={fetchComplaints}
            className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            title="Refresh Map Points"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Privacy Notice Strip */}
      <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
        <Info className="w-4 h-4 text-blue-700 flex-shrink-0" />
        <span>
          <strong className="font-semibold">Privacy Protected:</strong> Citizen personal contact details (phone numbers and emails) are strictly redacted from the public map.
        </span>
      </div>

      {/* Interactive Map Component */}
      {loading ? (
        <div className="h-[600px] bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center text-xs text-gray-500">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-700 mb-2" />
          <span>Plotting geo-tagged grievances...</span>
        </div>
      ) : (
        <MapComponent
          complaints={complaints}
          onSelectComplaint={(id) => onNavigate('track', id)}
        />
      )}

      {/* Google Maps Grounding Civic Facility Finder */}
      <div className="pt-2">
        <CivicMapsIntelligence
          initialQuery="BBMP Ward Office & Municipal Help Desk Bengaluru"
          latitude={12.9716}
          longitude={77.5946}
          onSelectPlace={(placeTitle) => {
            onNavigate('report');
          }}
        />
      </div>
    </div>
  );
};
