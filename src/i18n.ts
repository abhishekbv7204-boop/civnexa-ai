export type SupportedLanguage = 'en' | 'hi' | 'kn';

export interface Translations {
  appName: string;
  tagline: string;
  subTagline: string;
  independentNotice: string;
  voiceAssistant: {
    title: string;
    listening: string;
    understanding: string;
    processing: string;
    speak: string;
    typePrompt: string;
    startSpeaking: string;
    stopSpeaking: string;
    placeholder: string;
    send: string;
    clear: string;
    confirmSubmit: string;
    readySubmit: string;
    yesSubmit: string;
    noEdit: string;
    trackAction: string;
  };
  nav: {
    home: string;
    reportIssue: string;
    trackComplaint: string;
    map: string;
    howItWorks: string;
    analytics: string;
    help: string;
    login: string;
    register: string;
    dashboard: string;
    authorityConsole: string;
    logout: string;
  };
  actions: {
    reportNow: string;
    trackNow: string;
    submit: string;
    cancel: string;
    back: string;
    continue: string;
    viewDetails: string;
    clearFilters: string;
    copyId: string;
    copied: string;
    useLocation: string;
    manualLocation: string;
  };
  statuses: {
    Reported: string;
    Submitted: string;
    'AI Reviewed': string;
    Assigned: string;
    'In Progress': string;
    Resolved: string;
    'Citizen Confirmation': string;
    Closed: string;
    Reopened: string;
    Rejected: string;
  };
  priorities: {
    Low: string;
    Medium: string;
    High: string;
    Critical: string;
  };
}

export const translations: Record<SupportedLanguage, Translations> = {
  en: {
    appName: 'CivicFix AI',
    tagline: 'Report. Track. Resolve.',
    subTagline: 'AI-powered civic issue management for better communities.',
    independentNotice: 'CivicFix AI is an independent civic technology platform.',
    voiceAssistant: {
      title: 'CivicFix Assistant',
      listening: 'Listening to your voice...',
      understanding: 'Understanding request...',
      processing: 'Processing with CivicFix AI...',
      speak: 'Speak',
      typePrompt: 'Type your message...',
      startSpeaking: 'Tap microphone to speak',
      stopSpeaking: 'Stop recording',
      placeholder: 'e.g. "There is a deep pothole on Main Road near Bus Stand"',
      send: 'Send',
      clear: 'Clear',
      confirmSubmit: 'Your complaint details are ready. Would you like to submit now?',
      readySubmit: 'Ready to submit',
      yesSubmit: 'Submit Complaint',
      noEdit: 'Edit Details',
      trackAction: 'Track Complaint',
    },
    nav: {
      home: 'Home',
      reportIssue: 'Report Issue',
      trackComplaint: 'Track Complaint',
      map: 'Civic Map',
      howItWorks: 'How It Works',
      analytics: 'Analytics',
      help: 'Help & FAQ',
      login: 'Login',
      register: 'Register',
      dashboard: 'Citizen Dashboard',
      authorityConsole: 'Authority Console',
      logout: 'Logout',
    },
    actions: {
      reportNow: 'Report an Issue',
      trackNow: 'Track Complaint',
      submit: 'Submit Complaint',
      cancel: 'Cancel',
      back: 'Back',
      continue: 'Continue',
      viewDetails: 'View Details',
      clearFilters: 'Clear Filters',
      copyId: 'Copy ID',
      copied: 'Copied!',
      useLocation: 'Use My Current Location',
      manualLocation: 'Enter Location Manually',
    },
    statuses: {
      Reported: 'Submitted',
      Submitted: 'Submitted',
      'AI Reviewed': 'AI Reviewed',
      Assigned: 'Assigned',
      'In Progress': 'In Progress',
      Resolved: 'Resolved',
      'Citizen Confirmation': 'Citizen Confirmation',
      Closed: 'Closed',
      Reopened: 'Reopened',
      Rejected: 'Rejected',
    },
    priorities: {
      Low: 'Low',
      Medium: 'Medium',
      High: 'High',
      Critical: 'Critical',
    },
  },

  hi: {
    appName: 'CivicFix AI',
    tagline: 'रिपोर्ट करें. ट्रैक करें. समाधान पाएं.',
    subTagline: 'बेहतर समुदाय के लिए एआई-संचालित नागरिक समस्या समाधान प्रणाली।',
    independentNotice: 'CivicFix AI एक स्वतंत्र नागरिक प्रौद्योगिकी मंच है।',
    voiceAssistant: {
      title: 'CivicFix असिस्टेंट',
      listening: 'आपकी आवाज़ सुन रहे हैं...',
      understanding: 'समझ रहे हैं...',
      processing: 'प्रक्रिया जारी है...',
      speak: 'बोलें',
      typePrompt: 'संदेश लिखें...',
      startSpeaking: 'बोलने के लिए माइक दबाएं',
      stopSpeaking: 'रिकॉर्डिंग रोकें',
      placeholder: 'उदा. "बस स्टैंड के पास मुख्य सड़क पर गड्ढा है"',
      send: 'भेजें',
      clear: 'हटाएं',
      confirmSubmit: 'आपकी शिकायत का विवरण तैयार है। क्या आप इसे सबमिट करना चाहते हैं?',
      readySubmit: 'सबमिट के लिए तैयार',
      yesSubmit: 'शिकायत सबमिट करें',
      noEdit: 'विवरण बदलें',
      trackAction: 'स्थिति ट्रैक करें',
    },
    nav: {
      home: 'होम',
      reportIssue: 'समस्या दर्ज करें',
      trackComplaint: 'शिकायत ट्रैक करें',
      map: 'नागरिक मैप',
      howItWorks: 'यह कैसे काम करता है',
      analytics: 'विश्लेषण',
      help: 'सहायता और अक्सर पूछे जाने वाले सवाल',
      login: 'लॉगिन',
      register: 'रजिस्टर करें',
      dashboard: 'नागरिक डैशबोर्ड',
      authorityConsole: 'अधिकारी कंसोल',
      logout: 'लॉगआउट',
    },
    actions: {
      reportNow: 'समस्या दर्ज करें',
      trackNow: 'शिकायत ट्रैक करें',
      submit: 'शिकायत सबमिट करें',
      cancel: 'रद्द करें',
      back: 'वापस',
      continue: 'आगे बढ़ें',
      viewDetails: 'विवरण देखें',
      clearFilters: 'फ़िल्टर हटाएं',
      copyId: 'आईडी कॉपी करें',
      copied: 'कॉपी हो गया!',
      useLocation: 'मेरा वर्तमान स्थान उपयोग करें',
      manualLocation: 'स्थान मैन्युअल दर्ज करें',
    },
    statuses: {
      Reported: 'दर्ज (Submitted)',
      Submitted: 'दर्ज (Submitted)',
      'AI Reviewed': 'एआई समीक्षा (AI Reviewed)',
      Assigned: 'सौंपा गया (Assigned)',
      'In Progress': 'प्रगति पर (In Progress)',
      Resolved: 'हल हुआ (Resolved)',
      'Citizen Confirmation': 'नागरिक पुष्टि (Citizen Confirmation)',
      Closed: 'बंद किया गया (Closed)',
      Reopened: 'पुनः खोला गया (Reopened)',
      Rejected: 'अस्वीकृत (Rejected)',
    },
    priorities: {
      Low: 'कम (Low)',
      Medium: 'मध्यम (Medium)',
      High: 'उच्च (High)',
      Critical: 'अति-गंभीर (Critical)',
    },
  },

  kn: {
    appName: 'ಸಿವಿಕ್‌ಫಿಕ್ಸ್ AI (CivicFix AI)',
    tagline: 'ವರದಿ ಮಾಡಿ. ಪರಿಶೀಲಿಸಿ. ಪರಿಹರಿಸಿ.',
    subTagline: 'ಉತ್ತಮ ಸಮಾಜಕ್ಕಾಗಿ ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ಆಧಾರಿತ ನಾಗರಿಕ ಸಮಸ್ಯೆ ನಿರ್ವಹಣೆ.',
    independentNotice: 'CivicFix AI ಒಂದು ಸ್ವತಂತ್ರ ನಾಗರಿಕ ತಂತ್ರಜ್ಞಾನ ವೇದಿಕೆಯಾಗಿದೆ.',
    voiceAssistant: {
      title: 'ಸಿವಿಕ್‌ಫಿಕ್ಸ್ ಅಸಿಸ್ಟೆಂಟ್',
      listening: 'ನಿಮ್ಮ ಧ್ವನಿಯನ್ನು ಆಲಿಸಲಾಗುತ್ತಿದೆ...',
      understanding: 'ಗ್ರಹಿಸಲಾಗುತ್ತಿದೆ...',
      processing: 'ಸಂಸ್ಕರಿಸಲಾಗುತ್ತಿದೆ...',
      speak: 'ಮಾತನಾಡಿ',
      typePrompt: 'ಸಂದೇಶ ಬರೆಯಿರಿ...',
      startSpeaking: 'ಮಾತನಾಡಲು ಮೈಕ್ರೋಫೋನ್ ಒತ್ತಿ',
      stopSpeaking: 'ಧ್ವನಿಮುದ್ರಣ ನಿಲ್ಲಿಸಿ',
      placeholder: 'ಉದಾ: "ಬಸ್ ನಿಲ್ದಾಣದ ಬಳಿ ಮುಖ್ಯ ರಸ್ತೆಯಲ್ಲಿ ದೊಡ್ಡ ಗುಂಡಿ ಇದೆ"',
      send: 'ಕಳುಹಿಸಿ',
      clear: 'ಅಳಿಸಿ',
      confirmSubmit: 'ನಿಮ್ಮ ದೂರಿನ ವಿವರಗಳು ಸಿದ್ಧವಾಗಿವೆ. ಈಗ ಸಲ್ಲಿಸಲು ಬಯಸುವಿರಾ?',
      readySubmit: 'ಸಲ್ಲಿಸಲು ಸಿದ್ಧವಾಗಿದೆ',
      yesSubmit: 'ದೂರು ಸಲ್ಲಿಸಿ',
      noEdit: 'ವಿವರಗಳನ್ನು ತಿದ್ದಿ',
      trackAction: 'ದೂರನ್ನು ಪರಿಶೀಲಿಸಿ',
    },
    nav: {
      home: 'ಮುಖಪುಟ',
      reportIssue: 'ಸಮಸ್ಯೆ ವರದಿ',
      trackComplaint: 'ದೂರು ಪರಿಶೀಲನೆ',
      map: 'ನಾಗರಿಕ ನಕ್ಷೆ',
      howItWorks: 'ಇದು ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ',
      analytics: 'ವಿಶ್ಲೇಷಣೆ',
      help: 'ಸಹಾಯ & ಪ್ರಶೋತ್ತರ',
      login: 'ಲಾಗಿನ್',
      register: 'ನೋಂದಣಿ',
      dashboard: 'ನಾಗರಿಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
      authorityConsole: 'ಅಧಿಕಾರಿಗಳ ಕನ್ಸೋಲ್',
      logout: 'ಲಾಗ್‌ಔಟ್',
    },
    actions: {
      reportNow: 'ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ',
      trackNow: 'ದೂರನ್ನು ಪರಿಶೀಲಿಸಿ',
      submit: 'ದೂರನ್ನು ಸಲ್ಲಿಸಿ',
      cancel: 'ರದ್ದುಮಾಡಿ',
      back: 'ಹಿಂದೆ',
      continue: 'ಮುಂದುವರಿಯಿರಿ',
      viewDetails: 'ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
      clearFilters: 'ಫಿಲ್ಟರ್‌ಗಳನ್ನು ತೆರವುಗೊಳಿಸಿ',
      copyId: 'ಐಡಿ ನಕಲಿಸಿ',
      copied: 'ನಕಲಿಸಲಾಗಿದೆ!',
      useLocation: 'ನನ್ನ ಪ್ರಸ್ತುತ ಸ್ಥಳ ಬಳಸಿ',
      manualLocation: 'ಸ್ಥಳವನ್ನು ಹಸ್ತಚಾಲಿತವಾಗಿ ನಮೂದಿಸಿ',
    },
    statuses: {
      Reported: 'ದಾಖಲಾಗಿದೆ (Submitted)',
      Submitted: 'ದಾಖಲಾಗಿದೆ (Submitted)',
      'AI Reviewed': 'ಎಐ ಪರಿಶೀಲನೆ (AI Reviewed)',
      Assigned: 'ನಿಯೋಜಿಸಲಾಗಿದೆ (Assigned)',
      'In Progress': 'ಪ್ರಗತಿಯಲ್ಲಿದೆ (In Progress)',
      Resolved: 'ಪರಿಹರಿಸಲಾಗಿದೆ (Resolved)',
      'Citizen Confirmation': 'ನಾಗರಿಕ ದೃಢೀಕರಣ (Citizen Confirmation)',
      Closed: 'ಮುಕ್ತಾಯಗೊಂಡಿದೆ (Closed)',
      Reopened: 'ಮರುತೆರೆಯಲಾಗಿದೆ (Reopened)',
      Rejected: 'ತಿರಸ್ಕರಿಸಲಾಗಿದೆ (Rejected)',
    },
    priorities: {
      Low: 'ಕಡಿಮೆ (Low)',
      Medium: 'ಮಧ್ಯಮ (Medium)',
      High: 'ಹೆಚ್ಚು (High)',
      Critical: 'ತುರ್ತು (Critical)',
    },
  },
};
