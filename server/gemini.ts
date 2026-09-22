import { GoogleGenAI, Type } from '@google/genai';
import {
  AIAnalysisResult,
  ComplaintCategory,
  ComplaintPriority,
  VoiceAssistantResponse,
  VoiceIntent,
  SearchGroundingResult,
  MapsGroundingResult,
  SearchGroundingSource,
  MapsGroundingPlace,
} from '../src/types';

const VALID_CATEGORIES: ComplaintCategory[] = [
  'Pothole',
  'Garbage',
  'Road Damage',
  'Streetlight',
  'Water Leakage',
  'Drainage',
  'Traffic Signal',
  'Public Safety',
  'Public Property Damage',
  'Other',
];

const VALID_PRIORITIES: ComplaintPriority[] = ['Low', 'Medium', 'High', 'Critical'];

// Department mapping based on category
export const CATEGORY_DEPARTMENT_MAP: Record<ComplaintCategory, string> = {
  Pothole: 'Public Works & Urban Roads (PWD)',
  'Road Damage': 'Public Works & Urban Roads (PWD)',
  Garbage: 'Solid Waste Management & Sanitation',
  Streetlight: 'Street Lighting & Electrical Division',
  'Water Leakage': 'Urban Water Supply & Sewerage Board',
  Drainage: 'Storm Water Drains & Flood Management',
  'Traffic Signal': 'Traffic Engineering & Road Safety',
  'Public Safety': 'Public Works & Urban Roads (PWD)',
  'Public Property Damage': 'Public Works & Urban Roads (PWD)',
  Other: 'Public Works & Urban Roads (PWD)',
};

// Lazy singleton for GoogleGenAI
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Rule-based heuristic fallback if Gemini API is unreachable, quota is exhausted, or key is missing
export function generateFallbackAnalysis(description: string, manualCategory?: string): AIAnalysisResult {
  const lower = description.toLowerCase();

  let category: ComplaintCategory = 'Other';
  let priority: ComplaintPriority = 'Medium';
  const detected_features: string[] = [];
  const duplicate_keywords: string[] = [];

  if (manualCategory && VALID_CATEGORIES.includes(manualCategory as ComplaintCategory)) {
    category = manualCategory as ComplaintCategory;
  } else if (lower.includes('pothole') || lower.includes('crater') || lower.includes('tar') || lower.includes('asphalt') || lower.includes('ಗುಂಡಿ')) {
    category = 'Pothole';
    priority = 'High';
    detected_features.push('Road surface depression', 'Potential vehicular impact');
    duplicate_keywords.push('pothole', 'road', 'crater', 'asphalt');
  } else if (lower.includes('garbage') || lower.includes('trash') || lower.includes('waste') || lower.includes('dump') || lower.includes('debris') || lower.includes('ಕಸ')) {
    category = 'Garbage';
    priority = 'Medium';
    detected_features.push('Solid waste accumulation', 'Public hygiene concern');
    duplicate_keywords.push('garbage', 'waste', 'trash', 'dump');
  } else if (lower.includes('water') || lower.includes('pipe') || lower.includes('leak') || lower.includes('gushing') || lower.includes('burst') || lower.includes('ನೀರು')) {
    category = 'Water Leakage';
    priority = 'Critical';
    detected_features.push('Potable water loss', 'Soil saturation risk');
    duplicate_keywords.push('water', 'pipe', 'leakage', 'burst');
  } else if (lower.includes('light') || lower.includes('lamp') || lower.includes('dark') || lower.includes('pole') || lower.includes('bulb') || lower.includes('ದೀಪ')) {
    category = 'Streetlight';
    priority = 'Low';
    detected_features.push('Illumination failure', 'Nighttime visibility impairment');
    duplicate_keywords.push('streetlight', 'lamp', 'darkness', 'pole');
  } else if (lower.includes('drain') || lower.includes('sewage') || lower.includes('gutter') || lower.includes('manhole') || lower.includes('silt') || lower.includes('ಚರಂಡಿ')) {
    category = 'Drainage';
    priority = 'High';
    detected_features.push('Drainage flow obstruction', 'Runoff backflow');
    duplicate_keywords.push('drainage', 'sewage', 'manhole', 'overflow');
  } else if (lower.includes('signal') || lower.includes('traffic') || lower.includes('pedestrian') || lower.includes('zebra')) {
    category = 'Traffic Signal';
    priority = 'High';
    detected_features.push('Traffic control device malfunction', 'Intersection hazard');
    duplicate_keywords.push('traffic', 'signal', 'light', 'junction');
  } else if (lower.includes('damage') || lower.includes('footpath') || lower.includes('divider') || lower.includes('pavement')) {
    category = 'Road Damage';
    priority = 'Medium';
    detected_features.push('Civic infrastructure wear', 'Pedestrian pathway defect');
    duplicate_keywords.push('footpath', 'road', 'pavement', 'damage');
  } else {
    category = 'Other';
    priority = 'Medium';
    detected_features.push('General public amenity concern');
    duplicate_keywords.push('civic', 'issue', 'repair');
  }

  // Detect urgent keywords for priority boosting
  if (
    lower.includes('critical') ||
    lower.includes('emergency') ||
    lower.includes('accident') ||
    lower.includes('swerved') ||
    lower.includes('injury') ||
    lower.includes('hospital')
  ) {
    priority = 'Critical';
  }

  return {
    category,
    priority,
    summary: `Citizen reported ${category.toLowerCase()} issue requiring municipal field inspection.`,
    reason: `Automated baseline triage determined priority as ${priority} based on keyword parameters. Awaiting authorized officer verification.`,
    detected_features: detected_features.length > 0 ? detected_features : ['Visual inspection required', 'Location coordinates noted'],
    duplicate_keywords: duplicate_keywords.length > 0 ? duplicate_keywords : [category.toLowerCase()],
    recommended_department: CATEGORY_DEPARTMENT_MAP[category],
    is_fallback: true,
  };
}

export async function analyzeCivicIssue(params: {
  description: string;
  imageBase64?: string;
  imageMimeType?: string;
  locationText?: string;
  manualCategory?: string;
}): Promise<AIAnalysisResult> {
  const client = getAIClient();

  if (!client) {
    console.warn('GEMINI_API_KEY not configured or empty, applying robust fallback triage.');
    return generateFallbackAnalysis(params.description, params.manualCategory);
  }

  try {
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    // Attach image if valid base64 provided
    if (params.imageBase64 && params.imageBase64.includes('base64,')) {
      const match = params.imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const data = match[2];
        parts.push({
          inlineData: {
            mimeType,
            data,
          },
        });
      }
    }

    const promptText = `
You are the AI triage assistant for "CivicFix AI", an independent municipal civic grievance management platform.
Analyze this civic grievance reported by a citizen.

Description: "${params.description}"
Reported Location: "${params.locationText || 'Not specified'}"
User Selected Category Hint: "${params.manualCategory || 'None'}"

Evaluate the image and description carefully and output a JSON object adhering to this schema:
{
  "category": "Pothole" | "Garbage" | "Road Damage" | "Streetlight" | "Water Leakage" | "Drainage" | "Traffic Signal" | "Public Safety" | "Public Property Damage" | "Other",
  "priority": "Low" | "Medium" | "High" | "Critical",
  "summary": "Concise 1-2 sentence professional summary of the issue.",
  "reason": "Clear explanation of why this priority and category were assigned, referencing public safety, sanitation, or traffic impact.",
  "detected_features": ["3 to 5 specific visual or contextual features detected (e.g. 'approx 1.5m wide crater', 'exposed aggregate', 'pedestrian crosswalk')"],
  "duplicate_keywords": ["4 to 6 search keywords representing this issue for duplicate matching"]
}

Priority Guidelines:
- Critical: Active danger to life, major potable water pipe burst, open unbarricaded manhole on roadway, collapsed bridge/divider.
- High: Deep potholes on arterial roads, non-functioning traffic signals, overflowing sewage/drainage onto schools or pathways.
- Medium: Accumulated municipal garbage, moderate footpath cracks, overgrown public verges.
- Low: Non-functioning streetlights on low-traffic residential lanes, minor graffiti, cosmetic surface peeling.
`;

    parts.push({ text: promptText });

    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: 'The classified civic category',
            },
            priority: {
              type: Type.STRING,
              description: 'The urgency priority level: Low, Medium, High, or Critical',
            },
            summary: {
              type: Type.STRING,
              description: '1 to 2 sentence summary',
            },
            reason: {
              type: Type.STRING,
              description: 'Reasoning for priority and category',
            },
            detected_features: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Detected visual or contextual features',
            },
            duplicate_keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Keywords for duplicate checking',
            },
          },
          required: ['category', 'priority', 'summary', 'reason', 'detected_features', 'duplicate_keywords'],
        },
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error('Empty response from Gemini model');
    }

    const parsed = JSON.parse(text);

    // Validate category
    let category: ComplaintCategory = 'Other';
    if (VALID_CATEGORIES.includes(parsed.category as ComplaintCategory)) {
      category = parsed.category as ComplaintCategory;
    } else if (params.manualCategory && VALID_CATEGORIES.includes(params.manualCategory as ComplaintCategory)) {
      category = params.manualCategory as ComplaintCategory;
    }

    // Validate priority
    let priority: ComplaintPriority = 'Medium';
    if (VALID_PRIORITIES.includes(parsed.priority as ComplaintPriority)) {
      priority = parsed.priority as ComplaintPriority;
    }

    return {
      category,
      priority,
      summary: parsed.summary || 'Civic issue analyzed by automated triage model.',
      reason: parsed.reason || 'Assessed based on municipal safety and infrastructure maintenance priorities.',
      detected_features: Array.isArray(parsed.detected_features) ? parsed.detected_features : ['Visual inspection noted'],
      duplicate_keywords: Array.isArray(parsed.duplicate_keywords) ? parsed.duplicate_keywords : [category.toLowerCase()],
      recommended_department: CATEGORY_DEPARTMENT_MAP[category],
      is_fallback: false,
    };
  } catch (err) {
    console.error('Gemini AI analysis failed, falling back to rule-based analysis:', err);
    return generateFallbackAnalysis(params.description, params.manualCategory);
  }
}

// ================= AI VOICE ASSISTANT ENGINE =================

export async function processVoiceAssistant(params: {
  userInput: string;
  language: 'en' | 'hi' | 'kn';
  userContext?: {
    userName?: string;
    pendingReport?: {
      category?: string;
      location?: string;
      description?: string;
    };
  };
}): Promise<VoiceAssistantResponse> {
  const { userInput, language, userContext } = params;
  const client = getAIClient();

  // Reference number extraction check (e.g. "CF-100001" or "cf 100001" or numbers)
  const cfMatch = userInput.match(/(CF[-\s]?\d{5,8})/i);
  const complaintId = cfMatch ? cfMatch[1].replace(/\s+/, '-').toUpperCase() : undefined;

  // Fallback rule engine if Gemini API is missing or fails
  const buildFallback = (): VoiceAssistantResponse => {
    const lower = userInput.toLowerCase();

    // Intent detection
    let intent: VoiceIntent = 'UNKNOWN';
    let suggestedAction: VoiceAssistantResponse['suggestedAction'] = 'NONE';
    let replyText = '';
    let spokenText = '';
    const missingFields: string[] = [];

    if (complaintId || lower.includes('track') || lower.includes('status') || lower.includes('ಸ್ಥಿತಿ') || lower.includes('ट्रैक')) {
      intent = 'TRACK_COMPLAINT';
      suggestedAction = 'NAVIGATE_TRACK';
      if (complaintId) {
        replyText =
          language === 'kn'
            ? `ದೂರು ${complaintId} ಗಾಗಿ ಸ್ಥಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ.`
            : language === 'hi'
            ? `शिकायत ${complaintId} की स्थिति जांची जा रही है।`
            : `Checking status for complaint ${complaintId}.`;
        spokenText = replyText;
      } else {
        replyText =
          language === 'kn'
            ? 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ದೂರು ಉಲ್ಲೇಖ ಸಂಖ್ಯೆಯನ್ನು (ಉದಾ: CF-100001) ತಿಳಿಸಿ.'
            : language === 'hi'
            ? 'कृपया अपनी शिकायत संदर्भ संख्या (जैसे: CF-100001) बताएं।'
            : 'Please state your complaint reference number, such as CF-100001.';
        spokenText = replyText;
      }
    } else if (lower.includes('my complaints') || lower.includes('dashboard') || lower.includes('ನನ್ನ ದೂರುಗಳು') || lower.includes('मेरी शिकायतें')) {
      intent = 'VIEW_MY_COMPLAINTS';
      suggestedAction = 'NAVIGATE_DASHBOARD';
      replyText =
        language === 'kn'
          ? 'ನಿಮ್ಮ ಸಕ್ರಿಯ ದೂರುಗಳನ್ನು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ತೋರಿಸಲಾಗುತ್ತಿದೆ.'
          : language === 'hi'
          ? 'आपकी सक्रिय शिकायतें डैशबोर्ड पर दिखाई जा रही हैं।'
          : 'Showing your filed complaints on your citizen dashboard.';
      spokenText = replyText;
    } else if (lower.includes('nearby') || lower.includes('map') || lower.includes('ನಕ್ಷೆ') || lower.includes('नक्शा')) {
      intent = 'VIEW_NEARBY_ISSUES';
      suggestedAction = 'NAVIGATE_MAP';
      replyText =
        language === 'kn'
          ? 'ನಾಗರಿಕ ನಕ್ಷೆಯನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ.'
          : language === 'hi'
          ? 'नागरिक मैप खोला जा रहा है।'
          : 'Opening the interactive civic map with nearby reported issues.';
      spokenText = replyText;
    } else if (
      lower.includes('report') ||
      lower.includes('pothole') ||
      lower.includes('garbage') ||
      lower.includes('drain') ||
      lower.includes('water') ||
      lower.includes('light') ||
      lower.includes('ಗುಂಡಿ') ||
      lower.includes('ಕಸ') ||
      lower.includes('ಚರಂಡಿ') ||
      lower.includes('गड्ढा') ||
      lower.includes('कचरा')
    ) {
      intent = 'REPORT_ISSUE';
      suggestedAction = 'NAVIGATE_REPORT';

      // Category detection
      let cat: ComplaintCategory = 'Other';
      if (lower.includes('pothole') || lower.includes('ಗುಂಡಿ') || lower.includes('गड्ढा')) cat = 'Pothole';
      else if (lower.includes('garbage') || lower.includes('waste') || lower.includes('ಕಸ') || lower.includes('कचरा')) cat = 'Garbage';
      else if (lower.includes('water') || lower.includes('leak') || lower.includes('ನೀರು') || lower.includes('पानी')) cat = 'Water Leakage';
      else if (lower.includes('light') || lower.includes('lamp') || lower.includes('ದೀಪ') || lower.includes('बत्ती')) cat = 'Streetlight';
      else if (lower.includes('drain') || lower.includes('sewage') || lower.includes('ಚರಂಡಿ') || lower.includes('नाली')) cat = 'Drainage';

      missingFields.push('location');
      replyText =
        language === 'kn'
          ? `ನಾನು ${cat} ಸಮಸ್ಯೆಯನ್ನು ದಾಖಲಿಸಿಕೊಂಡಿದ್ದೇನೆ. ಇದು ಎಲ್ಲಿ ಇದೆ ಎಂದು ದಯವಿಟ್ಟು ತಿಳಿಸಿ?`
          : language === 'hi'
          ? `मैंने ${cat} की समस्या नोट कर ली है। कृपया बताएं कि यह कहाँ स्थित है?`
          : `I understood you want to report a ${cat} issue. Can you please tell me the exact location?`;
      spokenText = replyText;

      return {
        intent,
        confidence: 0.88,
        replyText,
        spokenText,
        language,
        extractedEntities: {
          category: cat,
          description: userInput,
        },
        missingFields: ['location'],
        readyToSubmit: false,
        suggestedAction,
      };
    } else if (lower.includes('help') || lower.includes('ಸಹಾಯ') || lower.includes('मदद')) {
      intent = 'HELP';
      suggestedAction = 'NAVIGATE_HELP';
      replyText =
        language === 'kn'
          ? 'ನಾನು ಸಿವಿಕ್‌ಫಿಕ್ಸ್ ಅಸಿಸ್ಟೆಂಟ್. ನೀವು ಹೊಸ ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಲು ಅಥವಾ ಹಳೆಯ ದೂರನ್ನು ಪರಿಶೀಲಿಸಲು ನನ್ನೊಂದಿಗೆ ಮಾತನಾಡಬಹುದು.'
          : language === 'hi'
          ? 'मैं सिविकफिक्स सहायक हूँ। आप नई समस्या दर्ज करने या पुरानी शिकायत ट्रैक करने के लिए मुझसे बात कर सकते हैं।'
          : 'I am CivicFix Assistant. You can tell me to report a civic issue, track an existing complaint, or show nearby problems.';
      spokenText = replyText;
    } else {
      replyText =
        language === 'kn'
          ? 'ನಾನು ನಿಮ್ಮ ಮಾತನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಗ್ರಹಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಸಮಸ್ಯೆಯನ್ನು ತಿಳಿಸಿ, ಉದಾಹರಣೆಗೆ "ರಸ್ತೆಯಲ್ಲಿ ಗುಂಡಿ ಇದೆ".'
          : language === 'hi'
          ? 'मुझे आपकी बात पूरी तरह समझ नहीं आई। कृपया दोबारा कहें, जैसे "सड़क पर गड्ढा है"।'
          : "I didn't quite catch that. You can say 'Report a pothole on Main Road' or 'Track complaint CF-100001'.";
      spokenText = replyText;
    }

    return {
      intent,
      confidence: 0.75,
      replyText,
      spokenText,
      language,
      extractedEntities: {
        complaintId,
        description: userInput,
      },
      missingFields,
      readyToSubmit: false,
      suggestedAction,
    };
  };

  if (!client) {
    return buildFallback();
  }

  try {
    const prompt = `
You are the multilingual conversational civic voice assistant "CivicFix Assistant" for CivicFix AI (an independent municipal issue reporting and tracking platform).
The citizen is speaking or typing in: ${language === 'kn' ? 'Kannada (ಕನ್ನಡ)' : language === 'hi' ? 'Hindi (हिंदी)' : 'English'}.
User Input: "${userInput}"
Existing Pending Context: ${JSON.stringify(userContext?.pendingReport || {})}

Analyze the user's input and extract their structured intent and civic entities.
Valid Intents:
- REPORT_ISSUE: User wants to report a civic issue (e.g. pothole, garbage, streetlight, water leak, drainage, broken road).
- TRACK_COMPLAINT: User wants to check the status of a specific complaint (e.g. "CF-100001" or "track my report").
- VIEW_MY_COMPLAINTS: User wants to see list of their filed issues ("show my complaints", "my tickets").
- VIEW_NEARBY_ISSUES: User wants to view civic map or nearby reports.
- REOPEN_COMPLAINT: User wants to reopen an unresolved complaint.
- HELP: User asks for instructions or help.
- CHANGE_LANGUAGE: User wants to switch to English, Hindi, or Kannada.
- CANCEL: User cancels current voice flow.
- UNKNOWN: None of the above.

Categories must be one of:
["Pothole", "Garbage", "Road Damage", "Streetlight", "Water Leakage", "Drainage", "Traffic Signal", "Public Safety", "Public Property Damage", "Other"]

Rules:
1. Translate any regional Kannada or Hindi terms accurately into standard English category and entity values for system use.
2. Return 'replyText' in the SAME LANGUAGE as the citizen spoke (${language === 'kn' ? 'Kannada' : language === 'hi' ? 'Hindi' : 'English'}).
3. Return 'spokenText' as a natural, concise 1-2 sentence spoken reply suitable for browser Text-to-Speech (keep it friendly, under 30 words).
4. If the user mentions an issue but leaves out the location, list "location" under 'missingFields' and ask them politely for the location in 'replyText'.
5. If both category/description and location are known, set 'readyToSubmit' to true and ask if they would like to submit or add a photo.
6. If the user provided a ticket ID like "CF-100001", set intent to TRACK_COMPLAINT and complaintId to "CF-100001".
`;

    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: {
              type: Type.STRING,
              description: 'One of REPORT_ISSUE, TRACK_COMPLAINT, VIEW_MY_COMPLAINTS, VIEW_NEARBY_ISSUES, REOPEN_COMPLAINT, HELP, CHANGE_LANGUAGE, CANCEL, UNKNOWN',
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Confidence between 0 and 1',
            },
            replyText: {
              type: Type.STRING,
              description: 'Friendly response in the selected language',
            },
            spokenText: {
              type: Type.STRING,
              description: 'Short spoken response for text-to-speech',
            },
            category: {
              type: Type.STRING,
              description: 'Classified category if applicable',
            },
            location: {
              type: Type.STRING,
              description: 'Extracted location if mentioned',
            },
            description: {
              type: Type.STRING,
              description: 'Extracted description of the issue',
            },
            priority: {
              type: Type.STRING,
              description: 'Low, Medium, High, or Critical',
            },
            complaintId: {
              type: Type.STRING,
              description: 'Ticket reference like CF-100001 if mentioned',
            },
            missingFields: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of missing fields like location or description',
            },
            readyToSubmit: {
              type: Type.BOOLEAN,
              description: 'True if sufficient details are present to review and submit',
            },
            suggestedAction: {
              type: Type.STRING,
              description: 'NAVIGATE_REPORT, NAVIGATE_TRACK, NAVIGATE_DASHBOARD, NAVIGATE_MAP, NAVIGATE_HELP, SUBMIT_COMPLAINT, or NONE',
            },
          },
          required: ['intent', 'confidence', 'replyText', 'spokenText', 'missingFields', 'readyToSubmit'],
        },
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return buildFallback();
    }

    const parsed = JSON.parse(text);

    let finalCategory: ComplaintCategory | undefined = undefined;
    if (parsed.category && VALID_CATEGORIES.includes(parsed.category as ComplaintCategory)) {
      finalCategory = parsed.category as ComplaintCategory;
    }

    let finalPriority: ComplaintPriority | undefined = undefined;
    if (parsed.priority && VALID_PRIORITIES.includes(parsed.priority as ComplaintPriority)) {
      finalPriority = parsed.priority as ComplaintPriority;
    }

    return {
      intent: (parsed.intent as VoiceIntent) || 'UNKNOWN',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
      replyText: parsed.replyText || 'I processed your request.',
      spokenText: parsed.spokenText || parsed.replyText || 'I processed your request.',
      language,
      extractedEntities: {
        category: finalCategory,
        location: parsed.location || undefined,
        description: parsed.description || userInput,
        priority: finalPriority,
        complaintId: parsed.complaintId || complaintId,
      },
      missingFields: Array.isArray(parsed.missingFields) ? parsed.missingFields : [],
      readyToSubmit: Boolean(parsed.readyToSubmit),
      suggestedAction: parsed.suggestedAction || 'NONE',
    };
  } catch (err) {
    console.warn('Gemini voice assistant parsing failed, using fallback:', err);
    return buildFallback();
  }
}

// ================= GOOGLE SEARCH GROUNDING (gemini-3.5-flash) =================

export async function performCivicSearchGrounding(params: {
  query: string;
  locationOrCity?: string;
}): Promise<SearchGroundingResult> {
  const { query, locationOrCity } = params;
  const client = getAIClient();

  const fallbackResult: SearchGroundingResult = {
    query,
    text: `Municipal Advisory for "${query}": Citizens are advised to file grievances through the official municipal portal or CivicFix AI. Emergency civic hotlines include BBMP Control Room (080-22221188 / 22975595) or national helpline 112 for immediate hazards. Ensure clear landmark coordinates and photographic evidence are attached for expedited SLA processing.`,
    sources: [
      {
        title: 'Municipal Citizen Charter & Grievance Guidelines',
        uri: 'https://bbmp.gov.in',
      },
      {
        title: 'National Urban Municipal Services Portal',
        uri: 'https://mohua.gov.in',
      },
    ],
    is_fallback: true,
  };

  if (!client) {
    return fallbackResult;
  }

  const prompt = `
You are the Civic Intelligence & Public Affairs Advisor for CivicFix AI.
Provide up-to-date, highly accurate, and actionable civic information using Google Search.
Citizen's Question: "${query}"
City / Locality Context: "${locationOrCity || 'Bengaluru / Urban Municipality'}"

Instructions:
1. Provide a direct, professional, concise summary answering the question regarding municipal rules, civic bylaws, road construction advisories, garbage segregation rules, complaint escalation processes, or emergency contacts.
2. Outline specific citizen guidelines, applicable fines or timings where relevant.
3. Be clear, accurate, and objective.
`;

  // We request gemini-3.5-flash first as instructed, with fallback to gemini-3.8-flash if model name differs
  const candidateModels = ['gemini-3.5-flash', 'gemini-3.8-flash'];

  for (const model of candidateModels) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || 'No information retrieved from search grounding.';
      const sources: SearchGroundingSource[] = [];

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (Array.isArray(chunks)) {
        for (const chunk of chunks) {
          if (chunk.web && chunk.web.uri) {
            sources.push({
              title: chunk.web.title || 'Official Civic Reference',
              uri: chunk.web.uri,
            });
          }
        }
      }

      // Deduplicate sources by URI
      const uniqueSources = Array.from(
        new Map(sources.map((s) => [s.uri, s])).values()
      );

      return {
        text,
        sources: uniqueSources.length > 0 ? uniqueSources : fallbackResult.sources,
        query,
        is_fallback: false,
      };
    } catch (err: any) {
      console.warn(`Search grounding failed with model ${model}:`, err?.message || err);
      // If last model failed, fall back to rule-based fallback
      if (model === candidateModels[candidateModels.length - 1]) {
        return fallbackResult;
      }
    }
  }

  return fallbackResult;
}

// ================= GOOGLE MAPS GROUNDING (gemini-3.5-flash) =================

export async function performMapsGrounding(params: {
  query: string;
  latitude?: number;
  longitude?: number;
}): Promise<MapsGroundingResult> {
  const { query, latitude, longitude } = params;
  const client = getAIClient();

  const fallbackResult: MapsGroundingResult = {
    query,
    text: `Civic infrastructure in this sector includes the Zonal Municipal Office, Ward Engineer Office, and Emergency Response Station. For verified on-ground assistance, visit the nearest ward office with your CivicFix AI complaint reference number.`,
    places: [
      {
        title: 'BBMP Ward Office & Citizen Service Centre',
        uri: 'https://maps.google.com/?q=BBMP+Ward+Office',
        address: 'Municipal Ward Jurisdiction, Bengaluru',
        reviewSnippet: 'Provides official citizen grievance verification and ward engineer counters.',
      },
      {
        title: 'Traffic & Urban Public Works Division',
        uri: 'https://maps.google.com/?q=Traffic+Management+Center',
        address: 'Public Works & Roads Maintenance Depot',
        reviewSnippet: 'Municipal jurisdiction for road repairs, streetlights, and storm water drains.',
      },
    ],
    is_fallback: true,
  };

  if (!client) {
    return fallbackResult;
  }

  const prompt = `
Find nearby municipal, civic, or public utility places for this query: "${query}".
Help citizens find the exact ward offices, municipal departments, police stations, hospital emergency desks, or public works offices relevant to their location.
Provide a clear, helpful overview of the relevant civic facilities, their typical operational hours, and which department handles what.
`;

  const candidateModels = ['gemini-3.5-flash', 'gemini-3.8-flash'];

  for (const model of candidateModels) {
    try {
      const config: any = {
        tools: [{ googleMaps: {} }],
      };

      if (typeof latitude === 'number' && typeof longitude === 'number') {
        config.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude,
              longitude,
            },
          },
        };
      }

      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config,
      });

      const text = response.text || 'No place details retrieved.';
      const places: MapsGroundingPlace[] = [];

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (Array.isArray(chunks)) {
        for (const chunk of chunks) {
          if (chunk.maps && chunk.maps.uri) {
            let reviewSnippet: string | undefined = undefined;
            const placeSources = chunk.maps.placeAnswerSources as any;
            if (
              placeSources &&
              Array.isArray(placeSources.reviewSnippets) &&
              placeSources.reviewSnippets.length > 0
            ) {
              const firstSnippet = placeSources.reviewSnippets[0];
              reviewSnippet = typeof firstSnippet === 'string' ? firstSnippet : (firstSnippet?.text || firstSnippet?.snippet || undefined);
            }

            const mapsAny = chunk.maps as any;
            places.push({
              title: mapsAny.title || 'Municipal Landmark / Facility',
              uri: mapsAny.uri,
              address: mapsAny.address || mapsAny.formattedAddress || undefined,
              reviewSnippet,
            });
          }
        }
      }

      // Deduplicate places by URI
      const uniquePlaces = Array.from(
        new Map(places.map((p) => [p.uri, p])).values()
      );

      return {
        text,
        places: uniquePlaces.length > 0 ? uniquePlaces : fallbackResult.places,
        query,
        is_fallback: false,
      };
    } catch (err: any) {
      console.warn(`Maps grounding failed with model ${model}:`, err?.message || err);
      if (model === candidateModels[candidateModels.length - 1]) {
        return fallbackResult;
      }
    }
  }

  return fallbackResult;
}

