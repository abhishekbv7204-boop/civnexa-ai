import React, { useState, useEffect } from 'react';
import {
  Camera,
  Upload,
  X,
  MapPin,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  Info,
  ShieldCheck,
  HelpCircle,
  Building2,
} from 'lucide-react';
import { api } from '../services/api';
import { ComplaintCategory, ComplaintPriority, AIAnalysisResult, DuplicateCheckResult, Ward } from '../types';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { saveComplaintToFirestore } from '../services/firebase';
import { CivicMapsIntelligence } from '../components/CivicMapsIntelligence';
import { CivicSearchAdvisor } from '../components/CivicSearchAdvisor';

interface ReportIssuePageProps {
  onNavigate: (view: string, param?: string) => void;
  initialDraft?: { category?: string; location?: string; description?: string };
}

// 4 high-quality civic sample photos (compressed SVG / data URIs) for 1-click test reports
const SAMPLE_PHOTOS = [
  {
    name: 'Pothole on Main Road',
    category: 'Pothole',
    desc: 'Deep dangerous pothole approx 2 feet wide on the center lane near bus stop, vehicles swerving to avoid it.',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Overflowing Garbage Bin',
    category: 'Garbage',
    desc: 'Municipal solid waste bin overflowing onto the pedestrian footpath for past 3 days with foul smell.',
    url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Broken Streetlight Pole',
    category: 'Streetlight',
    desc: 'Streetlight fixture dark and flickering for over a week, creating safety hazard for walking at night.',
    url: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Water Pipe Burst',
    category: 'Water Leakage',
    desc: 'Potable supply line leaking heavily into the roadside drain, clean drinking water being wasted.',
    url: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80',
  },
];

const PRESET_LANDMARKS = [
  { name: 'MG Road Metro Station, Ward 111', lat: 12.9756, lng: 77.6066 },
  { name: '100ft Road, Indiranagar, Ward 80', lat: 12.9784, lng: 77.6408 },
  { name: 'Sony World Junction, Koramangala 4th Block', lat: 12.9344, lng: 77.6277 },
  { name: '8th Cross, Malleshwaram, Ward 65', lat: 13.0031, lng: 77.5701 },
  { name: '4th Block Complex, Jayanagar, Ward 153', lat: 12.9298, lng: 77.5833 },
  { name: 'ITPL Main Road, Whitefield', lat: 12.9866, lng: 77.7314 },
];

export const ReportIssuePage: React.FC<ReportIssuePageProps> = ({ onNavigate, initialDraft }) => {
  // Step state: 1 (Issue), 2 (Location), 3 (AI Analysis), 4 (Review), 5 (Success)
  const [step, setStep] = useState<number>(1);

  // Wards & Municipal jurisdiction
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedWardId, setSelectedWardId] = useState<string>('');

  // Step 1: Issue
  const [description, setDescription] = useState('');
  const [manualCategory, setManualCategory] = useState<string>('');
  const [imageDataUrl, setImageDataUrl] = useState<string>('');
  const [photoError, setPhotoError] = useState<string>('');

  // Step 2: Location
  const [locationText, setLocationText] = useState('');
  const [latitude, setLatitude] = useState<number>(12.9716);
  const [longitude, setLongitude] = useState<number>(77.5946);
  const [locationMode, setLocationMode] = useState<'gps' | 'manual'>('manual');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMessage, setGeoMessage] = useState<string>('');

  useEffect(() => {
    api.getWards().then((res) => {
      setWards(res.wards);
    }).catch((err) => console.warn('Failed to load wards', err));
  }, []);

  useEffect(() => {
    if (initialDraft) {
      if (initialDraft.description) setDescription(initialDraft.description);
      if (initialDraft.category) setManualCategory(initialDraft.category);
      if (initialDraft.location) setLocationText(initialDraft.location);
      if (initialDraft.description && initialDraft.location) {
        setStep(2);
      }
    }
  }, [initialDraft]);

  // Step 3: AI Analysis & Duplicate Check
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateCheckResult | null>(null);
  const [aiError, setAiError] = useState<string>('');

  // Step 4: Submitting
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  // Step 5: Result
  const [createdComplaintId, setCreatedComplaintId] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // File Upload Handlers
  const handleFileChange = (file: File) => {
    setPhotoError('');
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setPhotoError('Please upload a valid image file (JPG, PNG, or WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setPhotoError('File size exceeds 10MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageDataUrl(e.target?.result as string);
    };
    reader.onerror = () => {
      setPhotoError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Preset sample selection
  const selectSamplePhoto = (sample: typeof SAMPLE_PHOTOS[0]) => {
    setImageDataUrl(sample.url);
    if (!description) {
      setDescription(sample.desc);
    }
    if (!manualCategory) {
      setManualCategory(sample.category);
    }
  };

  // Geolocation Handler
  const handleUseCurrentLocation = () => {
    setGeoLoading(true);
    setGeoMessage('');
    if (!navigator.geolocation) {
      setGeoMessage('Geolocation is not supported by your browser. Please enter location manually.');
      setGeoLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocationText(`GPS Pin: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} (Current Location)`);
        setGeoMessage('Location accurately acquired via device GPS.');
        setGeoLoading(false);
        setLocationMode('gps');
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setGeoMessage('Location permission was not granted. You can enter the location manually.');
        setGeoLoading(false);
        setLocationMode('manual');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Run AI Analysis & Duplicate Check
  const runAiAnalysis = async () => {
    setStep(3);
    setAnalyzing(true);
    setAiError('');
    setDuplicateWarning(null);

    try {
      // 1. Call Gemini Analysis
      const analysis = await api.analyzeIssue({
        description,
        imageBase64: imageDataUrl,
        locationText,
        manualCategory: manualCategory || undefined,
      });
      setAiResult(analysis);

      // 2. Call Duplicate Check
      try {
        const dupCheck = await api.checkDuplicate({
          category: analysis.category,
          latitude,
          longitude,
          description,
        });
        if (dupCheck.is_duplicate) {
          setDuplicateWarning(dupCheck);
        }
      } catch (dupErr) {
        console.warn('Duplicate check failed:', dupErr);
      }
    } catch (err: any) {
      console.error('AI Analysis failed:', err);
      setAiError(
        'AI analysis is temporarily unavailable. Your report can still be submitted and reviewed manually by municipal officers.'
      );
      // Fallback
      setAiResult({
        category: (manualCategory as ComplaintCategory) || 'Other',
        priority: 'Medium',
        summary: description.slice(0, 100) + '...',
        reason: 'Automated AI triage offline. Handed over for manual officer review.',
        detected_features: ['Citizen uploaded photo', 'Field inspection required'],
        duplicate_keywords: [manualCategory || 'civic'],
        is_fallback: true,
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Final Submit Handler
  const handleSubmitComplaint = async () => {
    if (!aiResult) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await api.createComplaint({
        category: aiResult.category,
        priority: aiResult.priority,
        description,
        ai_summary: aiResult.summary,
        ai_reason: aiResult.reason,
        ai_detected_features: aiResult.detected_features,
        latitude,
        longitude,
        location_text: locationText,
        ward_id: selectedWardId || undefined,
        image_url: imageDataUrl || undefined,
      });

      setCreatedComplaintId(res.complaint.id);

      // Persist complaint to Cloud Firestore
      saveComplaintToFirestore(res.complaint).catch((err) =>
        console.warn('Failed to mirror complaint to Firestore:', err)
      );

      setStep(5);
    } catch (err: any) {
      console.error('Submit error:', err);
      setSubmitError(err.message || 'Submission failed. Please check your network and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(createdComplaintId);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const resetForm = () => {
    setStep(1);
    setDescription('');
    setManualCategory('');
    setImageDataUrl('');
    setLocationText('');
    setAiResult(null);
    setDuplicateWarning(null);
    setCreatedComplaintId('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Title & Breadcrumb */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Report a Civic Grievance
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Submit details for rapid municipal triage and AI-assisted prioritization.
        </p>

        {/* Step Indicator Progress Bar */}
        <div className="mt-6 flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-0 h-1 bg-[#1565C0] -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: `${((step - 1) / 4) * 100}%` }}
          />

          {[
            { num: 1, label: 'Problem & Photo' },
            { num: 2, label: 'Location' },
            { num: 3, label: 'AI Triage' },
            { num: 4, label: 'Review' },
            { num: 5, label: 'Complete' },
          ].map((s) => (
            <div key={s.num} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors shadow-xs ${
                  step === s.num
                    ? 'bg-[#1565C0] text-white ring-4 ring-blue-100'
                    : step > s.num
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border-2 border-gray-300 text-gray-500'
                }`}
              >
                {step > s.num ? <Check className="w-4 h-4 stroke-[3]" /> : s.num}
              </div>
              <span className="hidden sm:inline-block text-[11px] font-semibold text-gray-700 mt-1.5 whitespace-nowrap">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Multi-Step Container Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
        {/* ================= STEP 1: UPLOAD PHOTO & DESCRIPTION ================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Step 1: Photo & Issue Description</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Clear photos help field crews locate the defect quickly.
              </p>
            </div>

            {/* Photo Upload Area */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Upload Photo of the Issue <span className="text-red-500">*</span>
              </label>

              {imageDataUrl ? (
                /* Photo Preview & Remove */
                <div className="relative rounded-xl border border-gray-300 overflow-hidden bg-gray-900 flex items-center justify-center max-h-72">
                  <img
                    src={imageDataUrl}
                    alt="Problem Preview"
                    className="w-full h-full max-h-72 object-contain"
                  />
                  <button
                    onClick={() => setImageDataUrl('')}
                    className="absolute top-3 right-3 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-md transition-colors"
                    title="Remove Photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded">
                    Photo attached
                  </div>
                </div>
              ) : (
                /* Drag and Drop Zone */
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 sm:p-8 text-center hover:border-blue-500 bg-gray-50/50 hover:bg-blue-50/30 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                >
                  <input
                    id="file-upload-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  />

                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 mx-auto flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6" />
                  </div>

                  <p className="text-sm font-semibold text-gray-800">
                    Click to browse or drag and drop your photo here
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG, WebP (up to 10MB)</p>
                </div>
              )}

              {photoError && <p className="text-xs text-red-600 font-medium mt-1.5">{photoError}</p>}

              {/* Sample Photo Presets for quick evaluation */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs font-semibold text-gray-600">Quick Test Samples (1-Click):</span>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SAMPLE_PHOTOS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectSamplePhoto(sample)}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 text-xs text-left truncate transition-colors text-gray-700 font-medium"
                      title={sample.name}
                    >
                      📷 {sample.category}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Description Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Describe the Issue in Detail <span className="text-red-500">*</span>
                </label>
                <span
                  className={`text-xs ${
                    description.length > 900 ? 'text-amber-600 font-bold' : 'text-gray-400'
                  }`}
                >
                  {description.length}/1000 characters
                </span>
              </div>

              <textarea
                rows={4}
                maxLength={1000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Example: Deep pothole on the right lane near the bus stop. Water has collected inside making it invisible at night. Two two-wheelers nearly skidded today."
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-shadow"
              />
            </div>

            {/* Optional Manual Category Hint */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Category Hint (Optional — AI will verify)
              </label>
              <select
                value={manualCategory}
                onChange={(e) => setManualCategory(e.target.value)}
                className="w-full sm:w-72 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:border-blue-600 focus:outline-none"
              >
                <option value="">Let Gemini AI Determine Automatically</option>
                <option value="Pothole">Pothole</option>
                <option value="Garbage">Garbage / Solid Waste</option>
                <option value="Road Damage">Road & Footpath Damage</option>
                <option value="Streetlight">Streetlight Non-Functional</option>
                <option value="Water Leakage">Water Pipeline Leakage</option>
                <option value="Drainage">Drainage Overflow / Sewage</option>
                <option value="Traffic Signal">Traffic Signal Defect</option>
                <option value="Public Property Damage">Public Property Damage</option>
                <option value="Other">Other Civic Grievance</option>
              </select>
            </div>

            {/* Navigation Button */}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                disabled={!description.trim() || description.trim().length < 10}
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-lg bg-[#1565C0] text-white font-semibold text-sm hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Continue to Location</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: LOCATION SELECTION ================= */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Step 2: Pinpoint Issue Location</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Accurate location ensures the correct ward team receives the ticket immediately.
              </p>
            </div>

            {/* GPS vs Manual Selector Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={handleUseCurrentLocation}
                className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  locationMode === 'gps'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-700 text-white flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Use My Current Location</h4>
                    <p className="text-xs text-gray-500">Detect GPS coordinates via browser</p>
                  </div>
                </div>

                {geoLoading && (
                  <p className="mt-3 text-xs text-blue-700 flex items-center gap-1 font-medium">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Fetching precise GPS location...
                  </p>
                )}
              </div>

              <div
                onClick={() => setLocationMode('manual')}
                className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  locationMode === 'manual'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-700 text-white flex items-center justify-center">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Enter Location Manually</h4>
                    <p className="text-xs text-gray-500">Type street address or select a landmark</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification / Fallback Banner */}
            {geoMessage && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>{geoMessage}</span>
              </div>
            )}

            {/* Location Input Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Administrative Ward & Zone</span>
                  <span className="text-gray-400 font-normal lowercase">(helps automated routing)</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedWardId}
                    onChange={(e) => {
                      setSelectedWardId(e.target.value);
                      const selected = wards.find((w) => w.id === e.target.value);
                      if (selected && !locationText) {
                        setLocationText(`Ward ${selected.ward_number} - ${selected.ward_name}`);
                      }
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                  >
                    <option value="">Select Ward (Optional - Auto-detected from address)</option>
                    {wards.map((w) => (
                      <option key={w.id} value={w.id}>
                        Ward {w.ward_number}: {w.ward_name} ({w.zone_name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Location Address / Landmark Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="e.g. Near HDFC Bank, 100ft Road, Indiranagar, Ward 80, Bangalore"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Latitude Coordinates
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-mono text-gray-800 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Longitude Coordinates
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-mono text-gray-800 bg-gray-50"
                  />
                </div>
              </div>

              {/* Landmark Presets */}
              <div className="pt-2">
                <span className="text-xs font-semibold text-gray-600">Quick Landmark Presets:</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PRESET_LANDMARKS.map((lm, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setLocationText(lm.name);
                        setLatitude(lm.lat);
                        setLongitude(lm.lng);
                        setLocationMode('manual');
                      }}
                      className="px-2.5 py-1 rounded-md border border-gray-200 bg-gray-50 hover:bg-blue-50 text-xs text-gray-700 font-medium transition-colors"
                    >
                      📍 {lm.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Google Maps Grounding Facility Finder */}
              <div className="pt-4 border-t border-gray-100">
                <CivicMapsIntelligence
                  initialQuery={locationText ? `BBMP Ward Office near ${locationText}` : 'BBMP Ward Office'}
                  latitude={latitude}
                  longitude={longitude}
                  compact={true}
                  onSelectPlace={(placeTitle) => {
                    setLocationText(placeTitle);
                  }}
                />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={!locationText.trim()}
                onClick={runAiAnalysis}
                className="px-6 py-2.5 rounded-lg bg-[#1565C0] text-white font-semibold text-sm hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Proceed to AI Triage</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: AI ANALYSIS & DUPLICATE CHECK ================= */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-700" />
                <span>Step 3: Intelligent Civic Assistant Triage</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Automated multi-modal analysis powered by Gemini 3.8 Flash.
              </p>
            </div>

            {analyzing ? (
              /* Loading State */
              <div className="py-14 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-blue-600 border-t-transparent animate-spin mx-auto" />
                <div>
                  <h4 className="text-base font-bold text-gray-900">
                    Gemini AI is analyzing issue details...
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    Inspecting photo features, estimating public hazard urgency, and checking ward duplicate records.
                  </p>
                </div>
              </div>
            ) : (
              /* Analysis Completed */
              <div className="space-y-5">
                {/* Fallback Warning Notice if AI was unreachable */}
                {aiError && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Notice:
                    </p>
                    <p>{aiError}</p>
                  </div>
                )}

                {/* Duplicate Report Alert */}
                {duplicateWarning && (
                  <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/80 space-y-3">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <span>Possible Duplicate Report Detected</span>
                    </div>

                    <p className="text-xs text-amber-800 leading-relaxed">
                      A similar issue has already been reported nearby. Please check if this matches your grievance before filing a duplicate ticket:
                    </p>

                    <div className="p-3 bg-white rounded-lg border border-amber-200 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-blue-800 font-mono">
                          {duplicateWarning.duplicate_complaint?.id}
                        </span>
                        <StatusBadge
                          status={duplicateWarning.duplicate_complaint?.status || 'Reported'}
                          size="sm"
                        />
                      </div>
                      <p className="text-gray-700">
                        {duplicateWarning.duplicate_complaint?.category} • {duplicateWarning.duplicate_complaint?.location_text}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => onNavigate('track', duplicateWarning.duplicate_complaint?.id)}
                        className="px-3.5 py-1.5 rounded-md bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700"
                      >
                        Track Existing Complaint
                      </button>
                      <span className="text-xs text-gray-500">or continue filing a new report below.</span>
                    </div>
                  </div>
                )}

                {/* AI Results Display Card */}
                {aiResult && (
                  <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                          AI-Generated Recommendation
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">
                          Gemini 3.8 Flash
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-500">
                        Subject to municipal officer validation
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-gray-500 font-medium">Assigned Category:</span>
                        <div className="text-base font-bold text-gray-900 mt-0.5">
                          {aiResult.category}
                        </div>
                      </div>

                      <div>
                        <span className="text-xs text-gray-500 font-medium">Recommended Priority:</span>
                        <div className="mt-1">
                          <PriorityBadge priority={aiResult.priority} size="md" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-gray-500 font-medium">Issue Summary:</span>
                      <p className="text-xs text-gray-800 font-medium mt-0.5 leading-relaxed">
                        {aiResult.summary}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs text-gray-500 font-medium">Triage Reasoning:</span>
                      <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">
                        {aiResult.reason}
                      </p>
                    </div>

                    {aiResult.detected_features && aiResult.detected_features.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-500 font-medium">Detected Visual Features:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {aiResult.detected_features.map((feat, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-white border border-blue-200 rounded text-[11px] text-blue-900 font-medium"
                            >
                              • {feat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Location</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="px-6 py-2.5 rounded-lg bg-[#1565C0] text-white font-semibold text-sm hover:bg-blue-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Proceed to Review</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 4: REVIEW & CONFIRM ================= */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Step 4: Final Review & Submission</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Verify all information before official municipal registration.
              </p>
            </div>

            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                {submitError}
              </div>
            )}

            <div className="border border-gray-200 rounded-xl divide-y divide-gray-200 overflow-hidden">
              {/* Photo & Description Preview */}
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start bg-gray-50/50">
                {imageDataUrl && (
                  <img
                    src={imageDataUrl}
                    alt="Complaint photo"
                    className="w-32 h-28 object-cover rounded-lg border border-gray-300 flex-shrink-0"
                  />
                )}
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Problem Description
                  </span>
                  <p className="text-xs sm:text-sm text-gray-800 font-medium leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>

              {/* Location Summary */}
              <div className="p-4 sm:p-5 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Reported Location
                  </span>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{locationText}</p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    Coordinates: {latitude.toFixed(5)}, {longitude.toFixed(5)}
                  </p>
                </div>
              </div>

              {/* AI Triage Summary */}
              <div className="p-4 sm:p-5 space-y-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Classification & Priority
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-sm font-bold text-gray-900">
                    Category: <span className="text-blue-700">{aiResult?.category}</span>
                  </div>
                  <PriorityBadge priority={aiResult?.priority || 'Medium'} size="sm" />
                </div>
                <p className="text-xs text-gray-600 italic">"{aiResult?.summary}"</p>
              </div>
            </div>

            {/* Submission Disclaimer */}
            <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-700 mt-0.5 flex-shrink-0" />
              <span>
                By submitting, you certify that this civic grievance is filed in good faith. Your complaint will receive a unique tracking reference number.
              </span>
            </div>

            {/* Live Google Search Grounding for Municipal Bylaws */}
            {aiResult && (
              <div className="pt-2">
                <CivicSearchAdvisor
                  initialQuery={`${aiResult.category} repair SLA and citizen reporting guidelines in Bengaluru`}
                  locationContext={locationText}
                  compact={true}
                />
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitComplaint}
                className="px-8 py-2.5 rounded-lg bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-800 disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Registering Complaint...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Complaint</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 5: SUBMISSION SUCCESS ================= */}
        {step === 5 && (
          <div className="py-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Registration Successful
              </span>
              <h2 className="text-2xl font-extrabold text-gray-900 mt-1">
                Your Complaint Has Been Logged
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 max-w-md mx-auto">
                Your issue has been routed to the appropriate municipal division. Use your tracking reference number to follow resolution updates.
              </p>
            </div>

            {/* Complaint Reference ID Box */}
            <div className="max-w-xs mx-auto p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Complaint Reference ID
              </span>
              <div className="text-2xl font-mono font-extrabold text-blue-800 tracking-wider">
                {createdComplaintId}
              </div>
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-white border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy ID</span>
                  </>
                )}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => onNavigate('track', createdComplaintId)}
                className="px-6 py-2.5 rounded-lg bg-[#1565C0] text-white font-semibold text-sm hover:bg-blue-800 transition-colors"
              >
                Track This Complaint
              </button>

              <button
                onClick={() => onNavigate('citizen-dashboard')}
                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                View My Complaints
              </button>

              <button
                onClick={resetForm}
                className="px-6 py-2.5 rounded-lg bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition-colors"
              >
                Report Another Issue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
