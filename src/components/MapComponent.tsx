import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Complaint, ComplaintCategory, ComplaintStatus } from '../types';
import { StatusBadge, PriorityBadge, CategoryIcon } from './StatusBadge';
import { MapPin, List, Layers, ExternalLink, Filter } from 'lucide-react';

interface MapComponentProps {
  complaints: Complaint[];
  onSelectComplaint: (id: string) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({ complaints, onSelectComplaint }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [mapError, setMapError] = useState<boolean>(false);

  // Filter complaints
  const filtered = complaints.filter((c) => {
    if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
    if (selectedStatus !== 'All' && c.status !== selectedStatus) return false;
    return true;
  });

  const complaintsWithCoords = filtered.filter(
    (c) => typeof c.latitude === 'number' && typeof c.longitude === 'number' && !isNaN(c.latitude)
  );

  // Marker color helper based on status
  const getMarkerColor = (status: ComplaintStatus) => {
    switch (status) {
      case 'Reported':
        return '#2563EB'; // Blue
      case 'Assigned':
        return '#7C3AED'; // Purple
      case 'In Progress':
        return '#D97706'; // Amber
      case 'Resolved':
        return '#059669'; // Green
      case 'Rejected':
        return '#DC2626'; // Red
      default:
        return '#4B5563';
    }
  };

  useEffect(() => {
    if (viewMode !== 'map' || !mapContainerRef.current) return;

    try {
      if (!mapInstanceRef.current) {
        // Initialize Leaflet Map (centered around Bangalore default or first complaint)
        const initialLat = complaintsWithCoords[0]?.latitude || 12.9716;
        const initialLng = complaintsWithCoords[0]?.longitude || 77.5946;

        const map = L.map(mapContainerRef.current, {
          center: [initialLat, initialLng],
          zoom: 12,
          zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;

      // Clear existing markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      if (complaintsWithCoords.length > 0) {
        const bounds = L.latLngBounds([]);

        complaintsWithCoords.forEach((comp) => {
          const color = getMarkerColor(comp.status);
          const customHtml = `
            <div style="
              background-color: ${color};
              width: 28px;
              height: 28px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 11px;
              font-weight: bold;
              cursor: pointer;
            ">
              CF
            </div>
          `;

          const customIcon = L.divIcon({
            html: customHtml,
            className: 'civic-map-marker',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            popupAnchor: [0, -14],
          });

          const marker = L.marker([comp.latitude, comp.longitude], { icon: customIcon }).addTo(map);

          // Popup content
          const popupContent = document.createElement('div');
          popupContent.className = 'p-1 font-sans text-xs';
          popupContent.innerHTML = `
            <div style="font-weight: bold; font-size: 13px; color: #1E293B; margin-bottom: 4px;">
              ${comp.id} • ${comp.category}
            </div>
            <div style="color: #64748B; margin-bottom: 6px;">
              ${comp.location_text}
            </div>
            <div style="display: flex; gap: 4px; margin-bottom: 8px;">
              <span style="background: #F1F5F9; padding: 2px 6px; border-radius: 4px; font-weight: 600;">
                ${comp.priority} Priority
              </span>
              <span style="background: #E2E8F0; padding: 2px 6px; border-radius: 4px;">
                ${comp.status}
              </span>
            </div>
            <button id="view-btn-${comp.id}" style="
              width: 100%;
              background: #1565C0;
              color: white;
              border: none;
              padding: 5px 8px;
              border-radius: 4px;
              font-weight: bold;
              cursor: pointer;
            ">
              View Details →
            </button>
          `;

          marker.bindPopup(popupContent);

          marker.on('popupopen', () => {
            const btn = document.getElementById(`view-btn-${comp.id}`);
            if (btn) {
              btn.onclick = () => onSelectComplaint(comp.id);
            }
          });

          markersRef.current.push(marker);
          bounds.extend([comp.latitude, comp.longitude]);
        });

        if (markersRef.current.length > 0) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
      }
    } catch (err) {
      console.error('Error rendering Leaflet map:', err);
      setMapError(true);
    }

    return () => {
      // Keep map cached or clean up markers
    };
  }, [complaintsWithCoords, viewMode]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[650px]">
      {/* Controls & Filter Bar */}
      <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-700" />
          <h3 className="text-base font-bold text-gray-900">Geographic Complaint Map</h3>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
            {complaintsWithCoords.length} Issues Mapped
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Category Filter */}
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-md px-2 py-1">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-gray-800 font-medium focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Pothole">Pothole</option>
              <option value="Garbage">Garbage</option>
              <option value="Streetlight">Streetlight</option>
              <option value="Water Leakage">Water Leakage</option>
              <option value="Drainage">Drainage</option>
              <option value="Traffic Signal">Traffic Signal</option>
              <option value="Road Damage">Road Damage</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="bg-white border border-gray-300 rounded-md px-2 py-1">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-gray-800 font-medium focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex rounded-md border border-gray-300 bg-white p-0.5">
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${
                viewMode === 'map' ? 'bg-blue-700 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Map</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${
                viewMode === 'list' ? 'bg-blue-700 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Map Legend */}
      <div className="bg-white px-4 py-2 border-b border-gray-100 flex flex-wrap items-center gap-4 text-xs text-gray-600">
        <span className="font-semibold text-gray-700">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
          <span>Reported</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
          <span>Assigned</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
          <span>Resolved</span>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 relative overflow-hidden">
        {mapError || viewMode === 'list' ? (
          /* Clean Fallback List View */
          <div className="h-full overflow-y-auto divide-y divide-gray-100 p-4">
            {mapError && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center justify-between">
                <span>Interactive map tiles are currently loading fallback mode. List view displayed below.</span>
                <button
                  onClick={() => setMapError(false)}
                  className="font-bold underline ml-2"
                >
                  Retry Map
                </button>
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MapPin className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="font-semibold">No complaints match your selected filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filtered.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onSelectComplaint(c.id)}
                    className="p-3.5 border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer bg-white flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-xs text-blue-800">{c.id}</span>
                        <StatusBadge status={c.status} size="sm" />
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 font-semibold text-gray-900 text-sm">
                        <CategoryIcon category={c.category} className="w-4 h-4 text-blue-700" />
                        <span>{c.category}</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-600 line-clamp-2">{c.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <span className="truncate max-w-[200px]" title={c.location_text}>
                        📍 {c.location_text}
                      </span>
                      <PriorityBadge priority={c.priority} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Leaflet Map Stage */
          <div ref={mapContainerRef} className="w-full h-full z-10" />
        )}
      </div>
    </div>
  );
};
