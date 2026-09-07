// =============================================================================
// CivicConnect TN — Voice Assistant 13-State Conversation Engine
// =============================================================================
// Strictly controls the dialog lifecycle so the assistant NEVER automatically jumps
// multiple states without citizen confirmation.

import { Priority } from '@/types/enums';

export enum VoiceState {
  WELCOME = 'WELCOME',
  LANGUAGE_SELECTION = 'LANGUAGE_SELECTION',
  MODE_SELECTION = 'MODE_SELECTION',
  NAME = 'NAME',
  PROBLEM = 'PROBLEM',
  PROBLEM_PROCESSING = 'PROBLEM_PROCESSING',
  PROBLEM_CONFIRMATION = 'PROBLEM_CONFIRMATION',
  LOCATION = 'LOCATION',
  LOCATION_CONFIRMATION = 'LOCATION_CONFIRMATION',
  MEDIA_OPTION = 'MEDIA_OPTION',
  FINAL_CONFIRMATION = 'FINAL_CONFIRMATION',
  SUBMITTING = 'SUBMITTING',
  SUCCESS = 'SUCCESS',
  // Track mode states
  TRACK_QUERY = 'TRACK_QUERY',
  TRACK_PROCESSING = 'TRACK_PROCESSING',
  TRACK_DISAMBIGUATION = 'TRACK_DISAMBIGUATION',
  TRACK_RESULT = 'TRACK_RESULT',
  ERROR = 'ERROR',
  END = 'END',
}

export type VoiceLanguage = 'ta' | 'en' | 'tanglish';
export type VoiceMode = 'register' | 'track';

export interface VoiceParsedProblem {
  title: string;
  description: string;
  categoryCode: string;
  categoryId: string | null;
  departmentCode: string;
  departmentId: string | null;
  priority: Priority;
  safetyRisk: boolean;
  confidence: number;
  urgencyScore: number;
  language: string;
  tamilSummary?: string;
  rawTranscript?: string;
}

export interface VoiceLocationData {
  latitude: number | null;
  longitude: number | null;
  address: string;
  landmark?: string;
  ward_id?: number | null;
  district?: string | null;
  isGpsAccurate: boolean;
}

export interface VoiceMediaData {
  url: string;
  media_type: 'image' | 'video' | 'audio';
  file_name: string;
}

export interface DisambiguationOption {
  trackingId: string;
  title: string;
  category: string;
  locationSummary: string;
  reportedTimeAgo: string;
}

export interface VoiceTrackResult {
  found: boolean;
  outcome?: 'MATCHED' | 'DISAMBIGUATION_REQUIRED' | 'NO_MATCH';
  tracking_id?: string;
  title?: string;
  status?: string;
  priority?: string;
  category?: string;
  address?: string;
  ward?: number;
  district?: string;
  sla_deadline?: string;
  sla_breached?: boolean;
  escalation_level?: number;
  created_at?: string;
  updated_at?: string;
  resolved_at?: string;
  statusDescription?: string;
  tamilResponse?: string;
  message?: string;
  nearbyCommunityCount?: number;
  clarificationQuestion?: {
    en: string;
    ta: string;
    options: DisambiguationOption[];
  };
  extractedEntities?: {
    referenceCode: string | null;
    name: string | null;
    issue: string | null;
    location: string | null;
    categoryKeyword: string | null;
  };
}

export interface VoiceConversationContext {
  state: VoiceState;
  previousState: VoiceState | null;
  mode: VoiceMode;
  language: VoiceLanguage;
  citizenName: string;
  rawAudioBlob: Blob | null;
  problem: VoiceParsedProblem | null;
  location: VoiceLocationData | null;
  media: VoiceMediaData[];
  submissionResult: {
    complaintId: string;
    trackingId: string;
    slaHours: number;
    createdAt: string;
  } | null;
  trackResult: VoiceTrackResult | null;
  errorMessage: string | null;
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  soundLevel: number;
}

export const INITIAL_VOICE_CONTEXT: VoiceConversationContext = {
  state: VoiceState.WELCOME,
  previousState: null,
  mode: 'register',
  language: 'en',
  citizenName: '',
  rawAudioBlob: null,
  problem: null,
  location: null,
  media: [],
  submissionResult: null,
  trackResult: null,
  errorMessage: null,
  isListening: false,
  isSpeaking: false,
  isProcessing: false,
  soundLevel: 0,
};

export interface PromptText {
  en: string;
  ta: string;
}

export const STATE_PROMPTS: Record<VoiceState, PromptText> = {
  [VoiceState.WELCOME]: {
    en: 'Hello! I am your CivicConnect Tamil Nadu Voice Assistant. I can help you register or track a civic complaint using your voice without typing.',
    ta: 'வணக்கம்! நான் உங்கள் சிவிக் கனெக்ட் குரல் உதவியாளர். தட்டச்சு செய்யாமல் குரல் மூலம் புகார் பதிவு செய்ய அல்லது நிலையை கண்காணிக்க உதவுகிறேன்.',
  },
  [VoiceState.LANGUAGE_SELECTION]: {
    en: 'Please select your preferred language. You can speak in Tamil, Tanglish, or English.',
    ta: 'உங்கள் விருப்ப மொழியை தேர்ந்தெடுக்கவும். நீங்கள் தமிழ், ஆங்கிலம் அல்லது தங்கிலீஷில் பேசலாம்.',
  },
  [VoiceState.MODE_SELECTION]: {
    en: 'What would you like to do? Register a new complaint, or track an existing complaint?',
    ta: 'நீங்கள் என்ன செய்ய விரும்புகிறீர்கள்? புதிய புகார் பதிவு செய்ய, அல்லது ஏற்கனவே உள்ள புகாரின் நிலையை கண்காணிக்க?',
  },
  [VoiceState.NAME]: {
    en: 'May I know your name, please?',
    ta: 'தயவுசெய்து உங்கள் பெயரை சொல்லுங்கள்.',
  },
  [VoiceState.PROBLEM]: {
    en: 'Please explain your civic issue in detail. For example: pothole on road, water supply leak, or street light issue.',
    ta: 'உங்கள் பிரச்சனையை தெளிவாக கூறுங்கள். உதாரணம்: ரோட்டில் குழி, குடிநீர் வரவில்லை அல்லது தெருவிளக்கு எரியவில்லை.',
  },
  [VoiceState.PROBLEM_PROCESSING]: {
    en: 'Analyzing your voice complaint with AI intelligence...',
    ta: 'உங்கள் குரல் பதிவை ஆய்வு செய்கிறோம்...',
  },
  [VoiceState.PROBLEM_CONFIRMATION]: {
    en: 'I understood your complaint. Is this summary correct?',
    ta: 'நீங்கள் கூறிய பிரச்சனையை புரிந்து கொண்டேன். இது சரியானதா?',
  },
  [VoiceState.LOCATION]: {
    en: 'We are detecting your location coordinates for accurate field team dispatch.',
    ta: 'துறை அலுவலர்கள் விரைந்து வர உங்கள் இருப்பிடத்தை பெறுகிறோம்.',
  },
  [VoiceState.LOCATION_CONFIRMATION]: {
    en: 'We found your location. Is this address correct?',
    ta: 'உங்கள் இருப்பிடம் கண்டறியப்பட்டது. இந்த முகவரி சரியானதா?',
  },
  [VoiceState.MEDIA_OPTION]: {
    en: 'Would you like to attach a photo or video of the issue?',
    ta: 'பிரச்சனையின் புகைப்படம் அல்லது வீடியோவை இணைக்க விரும்புகிறீர்களா?',
  },
  [VoiceState.FINAL_CONFIRMATION]: {
    en: 'Please review all details. Ready to submit this grievance to the Tamil Nadu Government?',
    ta: 'விவரங்களை சரிபார்க்கவும். இந்த புகாரை தமிழ்நாடு அரசுக்கு சமர்ப்பிக்கலாமா?',
  },
  [VoiceState.SUBMITTING]: {
    en: 'Registering your complaint securely in the CivicConnect system...',
    ta: 'உங்கள் புகாரை பாதுகாப்பாக பதிவு செய்கிறோம்...',
  },
  [VoiceState.SUCCESS]: {
    en: 'Your complaint has been submitted successfully to the respective department.',
    ta: 'உங்கள் புகார் சம்பந்தப்பட்ட துறைக்கு வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது.',
  },
  [VoiceState.TRACK_QUERY]: {
    en: 'Please tell me your name, what problem you reported, or your location.',
    ta: 'உங்கள் பெயர், தெரிவித்த பிரச்சனை அல்லது இடத்தை சொல்லுங்கள்.',
  },
  [VoiceState.TRACK_PROCESSING]: {
    en: 'Searching for your complaint across Tamil Nadu records...',
    ta: 'உங்கள் புகாரை தமிழ்நாடு பதிவுகளில் தேடுகிறோம்...',
  },
  [VoiceState.TRACK_DISAMBIGUATION]: {
    en: 'I found multiple matching complaints. Please choose the correct one.',
    ta: 'பல பொருத்தமான புகார்கள் உள்ளன. சரியான புகாரை தேர்ந்தெடுக்கவும்.',
  },
  [VoiceState.TRACK_RESULT]: {
    en: 'Here is the real-time status of your complaint.',
    ta: 'உங்கள் புகாரின் தற்போதைய நிலை இதோ.',
  },
  [VoiceState.ERROR]: {
    en: 'An issue occurred. Would you like to retry?',
    ta: 'சிக்கல் ஏற்பட்டது. மீண்டும் முயற்சிக்கலாமா?',
  },
  [VoiceState.END]: {
    en: 'Thank you for helping keep Tamil Nadu clean, safe, and progressive.',
    ta: 'தமிழ்நாட்டை தூய்மையாகவும் பாதுகாப்பாகவும் வைத்திருக்க உதவியதற்கு நன்றி.',
  },
};
