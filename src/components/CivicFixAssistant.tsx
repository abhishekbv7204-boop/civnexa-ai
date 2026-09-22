import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  MapPin,
  FileText,
  Tag,
  Search,
} from 'lucide-react';
import { SupportedLanguage, translations } from '../i18n';
import { VoiceAssistantResponse } from '../types';

interface CivicFixAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  lang: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onNavigate: (view: string, param?: string) => void;
  onApplyReportDraft?: (draft: { category?: string; location?: string; description?: string }) => void;
}

export const CivicFixAssistant: React.FC<CivicFixAssistantProps> = ({
  isOpen,
  onClose,
  lang,
  onLanguageChange,
  onNavigate,
  onApplyReportDraft,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [manualText, setManualText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [lastResponse, setLastResponse] = useState<VoiceAssistantResponse | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const t = translations[lang];

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      // Set recognition language based on selected language
      recognition.lang = lang === 'kn' ? 'kn-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access denied. You can type your request below.');
        } else if (event.error !== 'no-speech') {
          setErrorMessage('Could not catch your voice. Please try speaking again or type.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('SpeechRecognition initialization failed:', e);
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [lang]);

  // Update speech synthesis speech voice
  const speakText = (text: string) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'kn' ? 'kn-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) return;
    setTranscript('');
    setErrorMessage(null);
    try {
      recognitionRef.current.lang = lang === 'kn' ? 'kn-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
      recognitionRef.current.start();
    } catch {
      try {
        recognitionRef.current.abort();
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Could not start recognition:', err);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
  };

  // Submit recognized transcript or typed input to server assistant
  const handleProcessInput = async (inputText: string) => {
    const query = inputText.trim();
    if (!query) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: query,
          language: lang,
          userContext: {
            pendingReport: lastResponse?.extractedEntities,
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Assistant service unavailable');
      }

      const data: VoiceAssistantResponse = await res.json();
      setLastResponse(data);
      setTranscript('');
      setManualText('');

      // Voice response
      if (data.spokenText) {
        speakText(data.spokenText);
      }

      // Handle direct navigation requests
      if (data.suggestedAction === 'NAVIGATE_DASHBOARD') {
        setTimeout(() => {
          onNavigate('dashboard');
          onClose();
        }, 1500);
      } else if (data.suggestedAction === 'NAVIGATE_MAP') {
        setTimeout(() => {
          onNavigate('map');
          onClose();
        }, 1500);
      } else if (data.suggestedAction === 'NAVIGATE_HELP') {
        setTimeout(() => {
          onNavigate('help');
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyDraft = () => {
    if (!lastResponse?.extractedEntities) return;
    const { category, location, description } = lastResponse.extractedEntities;

    if (onApplyReportDraft) {
      onApplyReportDraft({
        category,
        location,
        description,
      });
    }

    onNavigate('report');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-title"
      >
        {/* Assistant Header */}
        <div className="bg-[#0D47A1] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 id="assistant-title" className="text-base font-bold leading-tight">
                {t.voiceAssistant.title}
              </h3>
              <p className="text-xs text-blue-200">
                {lang === 'kn' ? 'ಕನ್ನಡ' : lang === 'hi' ? 'हिंदी' : 'English'} • Multilingual Voice Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="flex bg-blue-950/60 rounded p-0.5 border border-blue-800 text-xs">
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  lang === 'en' ? 'bg-white text-blue-900 font-bold' : 'text-blue-200 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => onLanguageChange('hi')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  lang === 'hi' ? 'bg-white text-blue-900 font-bold' : 'text-blue-200 hover:text-white'
                }`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => onLanguageChange('kn')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  lang === 'kn' ? 'bg-white text-blue-900 font-bold' : 'text-blue-200 hover:text-white'
                }`}
              >
                ಕನ್ನಡ
              </button>
            </div>

            {/* Audio Toggle */}
            <button
              onClick={() => setSpeechEnabled(!speechEnabled)}
              title={speechEnabled ? 'Mute voice' : 'Enable voice'}
              className="p-1.5 rounded text-blue-200 hover:text-white hover:bg-blue-800/80 transition-colors"
            >
              {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded text-blue-200 hover:text-white hover:bg-blue-800/80 transition-colors"
              aria-label="Close assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Microphone Central Interaction */}
          <div className="flex flex-col items-center justify-center py-4 bg-slate-50 rounded-xl border border-slate-200">
            {speechSupported ? (
              <div className="relative">
                {isListening && (
                  <div className="absolute -inset-3 rounded-full bg-blue-500/20 animate-ping"></div>
                )}
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  disabled={isProcessing}
                  className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-md ${
                    isListening
                      ? 'bg-red-600 text-white shadow-red-200 scale-105'
                      : isProcessing
                      ? 'bg-amber-500 text-white cursor-wait'
                      : 'bg-[#0D47A1] text-white hover:bg-blue-800 hover:scale-105'
                  }`}
                  aria-label={isListening ? t.voiceAssistant.stopSpeaking : t.voiceAssistant.startSpeaking}
                >
                  {isProcessing ? (
                    <RefreshCw className="w-7 h-7 animate-spin" />
                  ) : isListening ? (
                    <MicOff className="w-7 h-7" />
                  ) : (
                    <Mic className="w-7 h-7" />
                  )}
                </button>
              </div>
            ) : null}

            <p className="mt-3 text-sm font-medium text-slate-700 text-center">
              {isListening
                ? t.voiceAssistant.listening
                : isProcessing
                ? t.voiceAssistant.processing
                : t.voiceAssistant.startSpeaking}
            </p>

            {/* Live speech preview */}
            {transcript && (
              <div className="mt-3 px-4 py-2 bg-white rounded-lg border border-blue-200 max-w-sm w-full text-center">
                <p className="text-sm text-slate-800 italic">"{transcript}"</p>
                <button
                  onClick={() => handleProcessInput(transcript)}
                  className="mt-2 text-xs font-semibold text-blue-700 hover:text-blue-900 underline"
                >
                  Process this speech →
                </button>
              </div>
            )}
          </div>

          {/* Error notice if any */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Assistant Conversation Response Card */}
          {lastResponse && (
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  AI
                </div>
                <div className="flex-1 text-sm text-slate-800 leading-relaxed font-medium">
                  {lastResponse.replyText}
                </div>
              </div>

              {/* Extracted Issue Details */}
              {lastResponse.extractedEntities && (lastResponse.extractedEntities.category || lastResponse.extractedEntities.location) && (
                <div className="mt-2 p-3 bg-white rounded-lg border border-blue-100 space-y-1.5 text-xs text-slate-600">
                  <div className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Captured Details</span>
                  </div>

                  {lastResponse.extractedEntities.category && (
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <span>Category: <strong>{lastResponse.extractedEntities.category}</strong></span>
                    </div>
                  )}

                  {lastResponse.extractedEntities.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Location: <strong>{lastResponse.extractedEntities.location}</strong></span>
                    </div>
                  )}

                  {lastResponse.extractedEntities.description && (
                    <div className="flex items-start gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                      <span className="line-clamp-2">"{lastResponse.extractedEntities.description}"</span>
                    </div>
                  )}
                </div>
              )}

              {/* Missing Fields Prompt */}
              {lastResponse.missingFields && lastResponse.missingFields.length > 0 && (
                <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    Missing: {lastResponse.missingFields.join(', ')}. Speak or type it to complete your report.
                  </span>
                </div>
              )}

              {/* Direct Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {lastResponse.extractedEntities?.complaintId && (
                  <button
                    onClick={() => {
                      onNavigate('track', lastResponse.extractedEntities.complaintId);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>View Case File ({lastResponse.extractedEntities.complaintId})</span>
                  </button>
                )}

                {lastResponse.intent === 'REPORT_ISSUE' && (
                  <button
                    onClick={handleApplyDraft}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span>Proceed to Full Report Form</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quick Voice Suggestions */}
          {!lastResponse && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Try saying:
              </span>
              <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-700">
                <button
                  onClick={() => handleProcessInput('There is a large pothole on 100ft road Indiranagar')}
                  className="p-2 text-left bg-slate-50 hover:bg-blue-50 rounded border border-slate-200 transition-colors"
                >
                  💬 "There is a large pothole on 100ft road Indiranagar"
                </button>
                <button
                  onClick={() => handleProcessInput('Track complaint CF-100001')}
                  className="p-2 text-left bg-slate-50 hover:bg-blue-50 rounded border border-slate-200 transition-colors"
                >
                  💬 "Track complaint CF-100001"
                </button>
                <button
                  onClick={() => handleProcessInput('Show my active complaints')}
                  className="p-2 text-left bg-slate-50 hover:bg-blue-50 rounded border border-slate-200 transition-colors"
                >
                  💬 "Show my active complaints"
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Text Fallback Input Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleProcessInput(manualText);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder={t.voiceAssistant.placeholder}
              disabled={isProcessing}
              className="flex-1 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!manualText.trim() || isProcessing}
              className="px-4 py-2 bg-[#0D47A1] text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
            >
              <span>{t.voiceAssistant.send}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
