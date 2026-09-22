import React, { useState } from 'react';
import {
  Menu,
  X,
  PlusCircle,
  Search,
  MapPin,
  HelpCircle,
  BarChart3,
  Shield,
  User,
  LogOut,
  LayoutDashboard,
  Globe,
  Info,
  Mic,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CivicLogo } from './CivicLogo';
import { NotificationDropdown } from './NotificationDropdown';
import { SupportedLanguage, translations } from '../i18n';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  lang: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onOpenAssistant?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  lang,
  onLanguageChange,
  onOpenAssistant,
}) => {
  const { user, isAuthenticated, isAuthority, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[lang];

  const handleNav = (view: string, param?: string) => {
    onNavigate(view, param);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      {/* Top Secondary Information Bar (Public Service Portal Style) */}
      <div className="bg-[#0D47A1] text-white text-xs px-4 py-1.5 font-medium border-b border-blue-900">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="hidden sm:inline">Civic issue reporting and tracking platform</span>
            <span className="hidden sm:inline text-blue-300">•</span>
            <span className="text-blue-100 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-blue-200" />
              {t.independentNotice}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center gap-1.5 bg-blue-950/60 px-2 py-0.5 rounded text-[11px] border border-blue-800">
              <Globe className="w-3 h-3 text-blue-300" />
              <button
                onClick={() => onLanguageChange('en')}
                className={`transition-colors ${
                  lang === 'en' ? 'font-bold text-white underline underline-offset-2' : 'text-blue-200 hover:text-white'
                }`}
              >
                English
              </button>
              <span className="text-blue-400">|</span>
              <button
                onClick={() => onLanguageChange('hi')}
                className={`transition-colors ${
                  lang === 'hi' ? 'font-bold text-white underline underline-offset-2' : 'text-blue-200 hover:text-white'
                }`}
              >
                हिन्दी
              </button>
              <span className="text-blue-400">|</span>
              <button
                onClick={() => onLanguageChange('kn')}
                className={`transition-colors ${
                  lang === 'kn' ? 'font-bold text-white underline underline-offset-2' : 'text-blue-200 hover:text-white'
                }`}
              >
                ಕನ್ನಡ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <div
            onClick={() => handleNav('landing')}
            className="cursor-pointer flex items-center"
            title="CivicFix AI - Home"
          >
            <CivicLogo size={36} />
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            <button
              onClick={() => handleNav('landing')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                currentView === 'landing'
                  ? 'text-blue-700 bg-blue-50 font-semibold'
                  : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50'
              }`}
            >
              {t.nav.home}
            </button>

            <button
              onClick={() => handleNav('report')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-semibold bg-[#1565C0] text-white hover:bg-blue-800 transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              {t.nav.reportIssue}
            </button>

            <button
              onClick={() => handleNav('track')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                currentView === 'track'
                  ? 'text-blue-700 bg-blue-50 font-semibold'
                  : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50'
              }`}
            >
              <Search className="w-4 h-4 text-gray-500" />
              {t.nav.trackComplaint}
            </button>

            <button
              onClick={() => handleNav('map')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                currentView === 'map'
                  ? 'text-blue-700 bg-blue-50 font-semibold'
                  : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50'
              }`}
            >
              <MapPin className="w-4 h-4 text-gray-500" />
              {t.nav.map}
            </button>

            <button
              onClick={() => handleNav('analytics')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                currentView === 'analytics'
                  ? 'text-blue-700 bg-blue-50 font-semibold'
                  : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-gray-500" />
              {t.nav.analytics}
            </button>

            <button
              onClick={() => handleNav('help')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                currentView === 'help'
                  ? 'text-blue-700 bg-blue-50 font-semibold'
                  : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-gray-500" />
              {t.nav.help}
            </button>

            {onOpenAssistant && (
              <button
                type="button"
                onClick={onOpenAssistant}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-900 shadow-xs transition-all active:scale-95 cursor-pointer ml-1"
                title="Open Multilingual Voice Assistant"
              >
                <Mic className="w-3.5 h-3.5 text-slate-900" />
                <span>Voice AI</span>
              </button>
            )}
          </nav>

          {/* Right: Auth Controls & Profile */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <NotificationDropdown onSelectComplaint={(id) => handleNav('track', id)} />

                {isAuthority ? (
                  <button
                    onClick={() => handleNav('authority-dashboard')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold border ${
                      currentView === 'authority-dashboard' || currentView === 'authority-case'
                        ? 'bg-purple-700 text-white border-purple-800'
                        : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Authority Console</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleNav('citizen-dashboard')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold border ${
                      currentView === 'citizen-dashboard'
                        ? 'bg-blue-700 text-white border-blue-800'
                        : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>My Dashboard</span>
                  </button>
                )}

                <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                  {user?.avatar_url && (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover border border-gray-200 shadow-xs"
                    />
                  )}
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-bold text-gray-900 leading-tight">
                      {user?.full_name}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">
                      {user?.role}
                    </span>
                  </div>

                  <button
                    onClick={logout}
                    className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNav('login')}
                  className="px-3.5 py-1.5 rounded-md text-sm font-semibold text-gray-700 hover:text-blue-700 hover:bg-gray-100 transition-colors"
                >
                  {t.nav.login}
                </button>
                <button
                  onClick={() => handleNav('register')}
                  className="px-3.5 py-1.5 rounded-md text-sm font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-xs"
                >
                  {t.nav.register}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Right Controls: Report button + Notification + Hamburger */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => handleNav('report')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold bg-[#1565C0] text-white hover:bg-blue-800 shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Report</span>
            </button>

            {isAuthenticated && (
              <NotificationDropdown onSelectComplaint={(id) => handleNav('track', id)} />
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700 hover:text-blue-700 hover:bg-gray-100 rounded-md"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <div className="space-y-1">
            <button
              onClick={() => handleNav('landing')}
              className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-800 hover:bg-blue-50"
            >
              {t.nav.home}
            </button>
            <button
              onClick={() => handleNav('report')}
              className="w-full text-left px-3 py-2 rounded-md text-sm font-bold text-blue-700 bg-blue-50 flex items-center justify-between"
            >
              <span>{t.nav.reportIssue}</span>
              <PlusCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleNav('track')}
              className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-800 hover:bg-blue-50"
            >
              {t.nav.trackComplaint}
            </button>
            <button
              onClick={() => handleNav('map')}
              className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-800 hover:bg-blue-50"
            >
              {t.nav.map}
            </button>
            <button
              onClick={() => handleNav('analytics')}
              className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-800 hover:bg-blue-50"
            >
              {t.nav.analytics}
            </button>
            <button
              onClick={() => handleNav('help')}
              className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-800 hover:bg-blue-50"
            >
              {t.nav.help}
            </button>

            {onOpenAssistant && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAssistant();
                }}
                className="w-full mt-2 py-2 px-3 rounded-lg text-sm font-bold bg-amber-400 text-slate-900 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Mic className="w-4 h-4 text-slate-900" />
                <span>Open Voice Assistant (Hindi / Kannada / English)</span>
              </button>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 space-y-2">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="px-3 py-2 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{user?.full_name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role} Account</p>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                    {user?.role}
                  </span>
                </div>

                {isAuthority ? (
                  <button
                    onClick={() => handleNav('authority-dashboard')}
                    className="w-full py-2.5 px-4 rounded-md text-sm font-semibold bg-purple-700 text-white flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Go to Authority Console</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleNav('citizen-dashboard')}
                    className="w-full py-2.5 px-4 rounded-md text-sm font-semibold bg-blue-700 text-white flex items-center justify-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>My Dashboard & Reports</span>
                  </button>
                )}

                <button
                  onClick={logout}
                  className="w-full py-2 px-4 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleNav('login')}
                  className="w-full py-2 rounded-md text-sm font-semibold text-center border border-gray-300 text-gray-800 hover:bg-gray-50"
                >
                  {t.nav.login}
                </button>
                <button
                  onClick={() => handleNav('register')}
                  className="w-full py-2 rounded-md text-sm font-semibold text-center bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs"
                >
                  {t.nav.register}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
