import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { ReportIssuePage } from './pages/ReportIssuePage';
import { TrackComplaintPage } from './pages/TrackComplaintPage';
import { CivicMapPage } from './pages/CivicMapPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { HelpPage } from './pages/HelpPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { AuthorityDashboard } from './pages/AuthorityDashboard';
import { AuthorityComplaintDetail } from './pages/AuthorityComplaintDetail';
import { CivicFixAssistant } from './components/CivicFixAssistant';
import { SupportedLanguage } from './i18n';
import { api } from './services/api';
import { Complaint, AnalyticsStats } from './types';
import { Mic } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, isAuthority } = useAuth();
  const [currentView, setCurrentView] = useState<string>('landing');
  const [viewParam, setViewParam] = useState<string | undefined>(undefined);
  const [lang, setLang] = useState<SupportedLanguage>('en');

  // Voice Assistant and Report drafting state
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [reportDraft, setReportDraft] = useState<{ category?: string; location?: string; description?: string } | undefined>(undefined);

  // Global cached landing stats & recent complaints
  const [landingStats, setLandingStats] = useState<AnalyticsStats | null>(null);
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);

  const loadLandingData = async () => {
    try {
      const [statsRes, complaintsRes] = await Promise.allSettled([
        api.getAnalytics(),
        api.getComplaints({ public_map: true }),
      ]);

      if (statsRes.status === 'fulfilled') {
        setLandingStats(statsRes.value);
      }
      if (complaintsRes.status === 'fulfilled') {
        setRecentComplaints(complaintsRes.value.complaints);
      }
    } catch (e) {
      console.warn('Failed to load landing metrics:', e);
    }
  };

  useEffect(() => {
    loadLandingData();
  }, []);

  const handleNavigate = (view: string, param?: string) => {
    setCurrentView(view);
    setViewParam(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route protection
  useEffect(() => {
    if (currentView === 'citizen-dashboard' && !isAuthenticated) {
      setCurrentView('login');
    }
    if ((currentView === 'authority-dashboard' || currentView === 'authority-case') && !isAuthority) {
      setCurrentView('login');
    }
  }, [currentView, isAuthenticated, isAuthority]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA] font-sans antialiased text-[#1F2937] selection:bg-blue-100 selection:text-blue-900">
      {/* Top Header */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        lang={lang}
        onLanguageChange={setLang}
        onOpenAssistant={() => setIsAssistantOpen(true)}
      />

      {/* Main Dynamic View Content */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onNavigate={handleNavigate}
            stats={landingStats}
            recentComplaints={recentComplaints}
            lang={lang}
          />
        )}

        {currentView === 'report' && (
          <ReportIssuePage
            onNavigate={handleNavigate}
            initialDraft={reportDraft}
          />
        )}

        {currentView === 'track' && (
          <TrackComplaintPage
            initialComplaintId={viewParam}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'map' && (
          <CivicMapPage onNavigate={handleNavigate} />
        )}

        {currentView === 'analytics' && (
          <AnalyticsPage />
        )}

        {currentView === 'help' && (
          <HelpPage />
        )}

        {currentView === 'login' && (
          <LoginPage onNavigate={handleNavigate} />
        )}

        {currentView === 'register' && (
          <RegisterPage onNavigate={handleNavigate} />
        )}

        {currentView === 'citizen-dashboard' && (
          <CitizenDashboard onNavigate={handleNavigate} />
        )}

        {currentView === 'authority-dashboard' && (
          <AuthorityDashboard
            onNavigate={handleNavigate}
            onOpenCase={(id) => handleNavigate('authority-case', id)}
          />
        )}

        {currentView === 'authority-case' && (
          <AuthorityComplaintDetail
            complaintId={viewParam || 'CF-100001'}
            onBack={() => handleNavigate('authority-dashboard')}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Floating Multilingual Voice Assistant Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsAssistantOpen(true)}
          className="group relative flex items-center justify-center p-3.5 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl hover:from-amber-400 hover:to-amber-300 transition-all active:scale-95 cursor-pointer border border-amber-300/80 gap-2"
          title="Open Multilingual Civic AI Voice Assistant (English, Hindi, Kannada)"
          aria-label="Multilingual Voice Assistant"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-900 opacity-40"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-900"></span>
          </span>
          <Mic className="w-5 h-5 text-slate-950" />
          <span className="hidden sm:inline font-extrabold tracking-tight">Voice Assistant</span>
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-950/15 text-slate-950">
            {lang.toUpperCase()}
          </span>
        </button>
      </div>

      {/* Voice Assistant Modal Component */}
      <CivicFixAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        lang={lang}
        onLanguageChange={setLang}
        onNavigate={handleNavigate}
        onApplyReportDraft={(draft) => {
          setReportDraft(draft);
          handleNavigate('report');
        }}
      />

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
