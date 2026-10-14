import OpenAI from 'openai';
import { config } from '../config.js';
import { findClosestLocationMatch, CHENNAI_LOCATIONS } from './locationService.js';
import { calculateDistanceKm, estimateDurationMins, calculateFare } from './fareService.js';

let openaiClient = null;
if (config.openaiApiKey) {
  try {
    openaiClient = new OpenAI({ apiKey: config.openaiApiKey });
    console.log('🤖 OpenAI API initialized for voice intent understanding.');
  } catch (err) {
    console.warn('⚠️ OpenAI client init failed:', err.message);
  }
}

const SYSTEM_PROMPT = `
You are VELO AI, an intelligent, polite, and rapid voice booking assistant for an urban bike taxi platform (like Rapido / Ola) in Chennai, India.
You converse with customers in English or Tamil (or Tanglish).

CORE OPERATING RULES:
1. Always return a strictly valid JSON object adhering to the schema below.
2. NEVER assume or treat uncertain speech ("maybe", "how much is it", "thinking about it") as booking consent.
3. Booking confirmation REQUIRES explicit verbal confirmation ("yes", "book it", "confirm", "proceed", "yes please", "ஆம்", "புக் பண்ணுங்க", "சரி").
4. If the destination is ambiguous (e.g. "railway station", "airport", "beach"), ask for clarification (e.g. "Do you mean Chennai Central or Egmore Station?").
5. When both pickup and destination are determined, provide the estimated fare and ask for confirmation before booking.
6. Support commands:
   - Change destination: update destination and recalculate fare
   - Repeat fare: clearly repeat the estimated fare and distance
   - Cancel request: cancel pending booking
   - Check status: provide current ride tracking information
7. Never hallucinate driver names or phone numbers before a ride is accepted by dispatch.

RESPONSE JSON SCHEMA:
{
  "reply": "Spoken assistant reply in the user's selected language (concise, suitable for text-to-speech)",
  "intent": "book_ride" | "clarify" | "set_pickup" | "set_destination" | "confirm_booking" | "cancel_request" | "check_fare" | "check_status" | "general_query",
  "language": "en" | "ta",
  "pickup": string | null,
  "destination": string | null,
  "missingFields": ["pickup"] | ["destination"] | ["pickup", "destination"] | [],
  "isConfirmed": boolean,
  "action": "none" | "calculate_fare" | "create_booking" | "cancel_booking",
  "audioSpeechText": "Exact text suitable for Web Speech Synthesis"
}
`;

// Fallback Rule-Based Conversational Engine (Works without OpenAI key)
export function processFallbackIntent(message, language = 'en', draft = {}) {
  const msg = (message || '').toLowerCase().trim();
  const currentPickup = draft.pickup || null;
  const currentDestination = draft.destination || null;
  const currentFare = draft.estimatedFare || null;

  const isTamil = language === 'ta' || /[\u0B80-\u0BFF]/.test(message);
  const lang = isTamil ? 'ta' : 'en';

  // 1. Check for cancellation
  if (
    msg.includes('cancel') ||
    msg.includes('stop booking') ||
    msg.includes('ரத்து') ||
    msg.includes('வேண்டாம்')
  ) {
    return {
      reply: isTamil
        ? 'உங்கள் பைக் சவாரி கோரிக்கை ரத்து செய்யப்பட்டது. உங்களுக்கு வேறு ஏதேனும் உதவி தேவையா?'
        : 'Your ride request has been cancelled. How else can I assist you?',
      intent: 'cancel_request',
      language: lang,
      pickup: null,
      destination: null,
      missingFields: [],
      isConfirmed: false,
      action: 'cancel_booking',
      audioSpeechText: isTamil
        ? 'உங்கள் பைக் சவாரி கோரிக்கை ரத்து செய்யப்பட்டது.'
        : 'Your ride request has been cancelled.'
    };
  }

  // 2. Check for ride status
  if (
    msg.includes('status') ||
    msg.includes('where is my driver') ||
    msg.includes('where is my ride') ||
    msg.includes('டிரைவர் எங்கே') ||
    msg.includes('நிலைமை')
  ) {
    return {
      reply: isTamil
        ? 'உங்கள் தற்போதைய பயண நிலையை சரிபார்க்கிறேன். திரையில் நேரலை மேப் காட்டப்படுகிறது.'
        : "Checking your current ride status. Live driver location is updated on your screen.",
      intent: 'check_status',
      language: lang,
      pickup: currentPickup,
      destination: currentDestination,
      missingFields: [],
      isConfirmed: draft.status === 'accepted' || draft.status === 'in_progress',
      action: 'none',
      audioSpeechText: isTamil
        ? 'உங்கள் பயண நிலையை சரிபார்க்கிறேன்.'
        : 'Checking your current ride status.'
    };
  }

  // 3. Repeat fare
  if (
    msg.includes('repeat fare') ||
    msg.includes('how much') ||
    msg.includes('fare again') ||
    msg.includes('cost') ||
    msg.includes('கட்டணம் எவ்வளவு') ||
    msg.includes('மீண்டும் சொல்')
  ) {
    if (currentFare) {
      return {
        reply: isTamil
          ? `கணக்கிடப்பட்ட கட்டணம் ₹${currentFare}. பைக் சவாரியை உறுதிசெய்ய 'புக் செய்' என்று கூறவும்.`
          : `The estimated fare is ₹${currentFare}. Say 'Book it' or 'Yes' to confirm your ride.`,
        intent: 'check_fare',
        language: lang,
        pickup: currentPickup,
        destination: currentDestination,
        missingFields: [],
        isConfirmed: false,
        action: 'none',
        audioSpeechText: isTamil
          ? `கட்டணம் ₹${currentFare}. உறுதிசெய்ய புக் செய் என கூறவும்.`
          : `The estimated fare is ₹${currentFare}. Say yes to confirm.`
      };
    }
  }

  // 4. Ambiguity Disambiguation (e.g. "railway station")
  if (
    (msg.includes('railway station') || msg.includes('train station') || msg.includes('ரயில் நிலையம்')) &&
    !msg.includes('central') &&
    !msg.includes('egmore')
  ) {
    return {
      reply: isTamil
        ? 'நிச்சயமாக! எந்த ரயில் நிலையம் செல்ல விரும்புகிறீர்கள்? சென்னை சென்ட்ரல் அல்லது எழும்பூரா?'
        : 'Sure! Which railway station do you mean? Chennai Central or Egmore Station?',
      intent: 'clarify',
      language: lang,
      pickup: currentPickup || 'Current Location',
      destination: null,
      missingFields: ['destination'],
      isConfirmed: false,
      action: 'none',
      audioSpeechText: isTamil
        ? 'எந்த ரயில் நிலையம் செல்ல வேண்டும்? சென்னை சென்ட்ரல் அல்லது எழும்பூரா?'
        : 'Which railway station do you mean? Chennai Central or Egmore Station?'
    };
  }

  // 5. Look for Destination in message
  let detectedDestination = null;
  const closestLoc = findClosestLocationMatch(msg);
  if (closestLoc) {
    detectedDestination = closestLoc.name;
  } else {
    // Regex extract after 'to', 'towards', 'drop at'
    const toMatch = msg.match(/(?:to|towards|drop at|reach|செல்ல|போக)\s+([a-zA-Z0-9\s.,]+)/i);
    if (toMatch && toMatch[1]) {
      detectedDestination = toMatch[1].trim();
    }
  }

  const finalDestination = detectedDestination || currentDestination;
  const finalPickup = currentPickup || 'Current Location';

  // 6. Explicit Confirmation detection
  const isExplicitYes =
    /\b(yes|book|book it|confirm|proceed|ok book|sure book|ஆம்|புக் செய்|சரி புக் பண்ணு)\b/i.test(
      msg
    );

  if (isExplicitYes && finalDestination) {
    return {
      reply: isTamil
        ? `உங்கள் பைக் சவாரி கோரிக்கை உறுதி செய்யப்பட்டது! அருகிலுள்ள ஓட்டுநரை தேடுகிறோம்.`
        : `Your bike ride request is confirmed! Searching for the nearest top-rated captain.`,
      intent: 'confirm_booking',
      language: lang,
      pickup: finalPickup,
      destination: finalDestination,
      missingFields: [],
      isConfirmed: true,
      action: 'create_booking',
      audioSpeechText: isTamil
        ? 'உங்கள் பைக் சவாரி கோரிக்கை உறுதி செய்யப்பட்டது.'
        : 'Your ride request is confirmed. Searching for a driver.'
    };
  }

  // 7. Destination found, asking for confirmation
  if (finalDestination) {
    const fare = currentFare || 75;
    return {
      reply: isTamil
        ? `நான் உங்கள் புறப்படும் இடத்தை குறித்துக்கொண்டேன். ${finalDestination} செல்வதற்கான உத்தேச கட்டணம் ₹${fare}. சவாரியை புக் செய்யவா?`
        : `I have your pickup location. The destination is ${finalDestination} and estimated fare is ₹${fare}. Shall I book your ride?`,
      intent: 'book_ride',
      language: lang,
      pickup: finalPickup,
      destination: finalDestination,
      missingFields: [],
      isConfirmed: false,
      action: 'calculate_fare',
      audioSpeechText: isTamil
        ? `இலக்கு ${finalDestination}. கட்டணம் ₹${fare}. புக் செய்யவா?`
        : `Destination is ${finalDestination}. Estimated fare is ₹${fare}. Shall I book your ride?`
    };
  }

  // 8. Missing destination fallback
  return {
    reply: isTamil
      ? 'வணக்கம்! எங்கு செல்ல வேண்டும் என்று சொல்லுங்கள். உதாரணம்: சென்னை சென்ட்ரல்.'
      : 'Hello! Where would you like to ride today? For example, say "Book a bike to Chennai Central".',
    intent: 'clarify',
    language: lang,
    pickup: finalPickup,
    destination: null,
    missingFields: ['destination'],
    isConfirmed: false,
    action: 'none',
    audioSpeechText: isTamil
      ? 'எங்கு செல்ல வேண்டும் என்று சொல்லுங்கள்.'
      : 'Where would you like to ride today?'
  };
}

// Master AI intent processor
export async function processAiIntent({ message, language = 'en', conversationHistory = [], currentDraft = {} }) {
  if (!openaiClient) {
    return processFallbackIntent(message, language, currentDraft);
  }

  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.slice(-4),
      {
        role: 'user',
        content: `User query: "${message}". Current Draft State: ${JSON.stringify(currentDraft)}. Language Preference: ${language}.`
      }
    ];

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.2
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    return parsed;
  } catch (err) {
    console.error('Error invoking OpenAI chat completion:', err.message);
    return processFallbackIntent(message, language, currentDraft);
  }
}
