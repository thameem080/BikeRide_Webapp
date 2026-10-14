import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Radio
} from 'lucide-react';
import {
  SpeechState,
  requestMicrophonePermission,
  speakText,
  VoiceRecognitionManager,
  isSpeechRecognitionSupported
} from '../services/speechService';
import { Language, AiVoiceResponse, LocationPoint, FareBreakdown } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  isConfirmationPrompt?: boolean;
}

interface VoiceAssistantProps {
  language: Language;
  pickup: LocationPoint | null;
  destination: LocationPoint | null;
  fareBreakdown: FareBreakdown | null;
  onAiAction: (aiResult: AiVoiceResponse) => void;
  onClearRoute: () => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  language,
  pickup,
  destination,
  fareBreakdown,
  onAiAction,
  onClearRoute
}) => {
  const [speechState, setSpeechState] = useState<SpeechState>('idle');
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text:
        language === 'ta'
          ? 'வணக்கம்! நான் VELO AI. எங்கு செல்ல வேண்டும்? மைக் பட்டனை அழுத்தி பேசவும் அல்லது தட்டச்சு செய்யவும்.'
          : "Hello! I'm VELO AI. Where would you like to ride today? Tap the mic or type below.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const recognitionManagerRef = useRef<VoiceRecognitionManager | null>(null);
  const cancelSpeechRef = useRef<(() => void) | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript]);

  // Update welcome message if language switches
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 'welcome') {
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text:
            language === 'ta'
              ? 'வணக்கம்! நான் VELO AI. எங்கு செல்ல வேண்டும்? மைக் பட்டனை அழுத்தி பேசவும் அல்லது தட்டச்சு செய்யவும்.'
              : "Hello! I'm VELO AI. Where would you like to ride today? Tap the mic or type below.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [language]);

  // Handle final voice transcript from speech recognition
  const handleVoiceInput = async (spokenText: string) => {
    if (!spokenText.trim()) return;

    setInterimTranscript('');
    setSpeechState('processing');

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: spokenText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      // Call backend AI voice engine
      const history = messages.slice(-4).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const draftState = {
        pickup: pickup?.name,
        destination: destination?.name,
        estimatedFare: fareBreakdown?.estimatedTotal
      };

      const res = await fetch('/api/ai/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: spokenText,
          language,
          conversationHistory: history,
          currentDraft: draftState
        })
      });

      if (!res.ok) throw new Error('AI service error');
      const data = await res.json();
      const aiResult: AiVoiceResponse = data.data;

      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: aiResult.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isConfirmationPrompt: aiResult.intent === 'book_ride' && !aiResult.isConfirmed
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Inform parent page to update route, fare, or trigger booking
      onAiAction(aiResult);

      // Play synthesized voice reply if not muted
      if (!isMuted && aiResult.audioSpeechText) {
        setSpeechState('speaking');
        cancelSpeechRef.current = speakText(
          aiResult.audioSpeechText,
          language,
          () => setSpeechState('speaking'),
          () => setSpeechState('idle'),
          () => setSpeechState('idle')
        );
      } else {
        setSpeechState('idle');
      }
    } catch (err: any) {
      console.error('AI voice turn failed:', err);
      setSpeechState('error');
      setErrorMessage(err.message || 'Voice processing error');
      setTimeout(() => setSpeechState('idle'), 3000);
    }
  };

  // Initialize Speech Recognition
  const toggleListening = async () => {
    // If speaking, clicking mic stops speech
    if (speechState === 'speaking') {
      cancelSpeechRef.current?.();
      setSpeechState('idle');
      return;
    }

    // If currently listening, stop
    if (speechState === 'listening') {
      recognitionManagerRef.current?.stop();
      setSpeechState('idle');
      return;
    }

    // Check / Request mic permission first
    const perm = await requestMicrophonePermission();
    if (!perm.granted) {
      setMicPermission('denied');
      setErrorMessage(perm.error || 'Microphone access is required for voice commands.');
      setSpeechState('error');
      return;
    }
    setMicPermission('granted');
    setErrorMessage(null);

    if (!isSpeechRecognitionSupported()) {
      setErrorMessage('Speech recognition is not supported in this browser. Please use text typing below.');
      return;
    }

    if (!recognitionManagerRef.current) {
      recognitionManagerRef.current = new VoiceRecognitionManager(
        language,
        (text, isFinal) => {
          if (isFinal) {
            handleVoiceInput(text);
          } else {
            setInterimTranscript(text);
          }
        },
        (state, err) => {
          setSpeechState(state);
          if (err) setErrorMessage(err);
        }
      );
    } else {
      recognitionManagerRef.current.setLanguage(language);
    }

    recognitionManagerRef.current.start();
  };

  // Manual text submit
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    handleVoiceInput(text);
  };

  // Preset suggested voice prompts
  const sampleCommands =
    language === 'ta'
      ? [
          'சென்னை சென்ட்ரல் ரயில் நிலையத்திற்கு புக் செய்',
          'மெரினா கடற்கரை போகணும்',
          'தி. நகர் பாண்டி பஜார்',
          'கட்டணம் எவ்வளவு?',
          'சவாரியை உறுதி செய்'
        ]
      : [
          'Book a bike to Chennai Central',
          'Take me to Marina Beach',
          'Drop at T. Nagar Pondy Bazaar',
          'What is the fare estimate?',
          'Yes, confirm my booking'
        ];

  return (
    <div className="flex flex-col rounded-3xl border border-velo-border/60 bg-forest-900/90 shadow-2xl backdrop-blur-2xl transition-all overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-velo-border/40 px-5 py-3.5 bg-forest-950/60">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-forest-800 border border-velo-lime/40">
            <Radio className="h-4 w-4 text-velo-lime animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              VELO Voice Assistant
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-velo-lime/10 text-velo-lime border border-velo-lime/30 uppercase">
                {language === 'ta' ? 'தமிழ்' : 'English'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {speechState === 'listening'
                ? language === 'ta' ? 'கேட்கிறது... பேசவும்' : 'Listening... Speak now'
                : speechState === 'processing'
                ? language === 'ta' ? 'புரிந்து கொள்கிறது...' : 'Interpreting voice intent...'
                : speechState === 'speaking'
                ? language === 'ta' ? 'பதிலளிக்கிறது...' : 'Speaking reply...'
                : language === 'ta' ? 'தயாராக உள்ளது' : 'Ready for voice commands'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute voice' : 'Mute voice'}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-velo-border/40 bg-forest-800 text-slate-300 hover:text-white"
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-slate-400" /> : <Volume2 className="h-4 w-4 text-velo-lime" />}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-velo-border/40 bg-forest-800 text-slate-300 hover:text-white"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-5 flex flex-col gap-4">
          {/* Main Visualizer & Mic Button Section */}
          <div className="relative flex flex-col items-center justify-center py-6 px-4 rounded-2xl bg-gradient-to-b from-forest-950/70 to-forest-900/40 border border-velo-border/30">
            {/* Pulsing Voice Rings */}
            {speechState === 'listening' && (
              <div className="pointer-events-none absolute h-32 w-32 rounded-full border border-velo-lime voice-ripple"></div>
            )}
            {speechState === 'speaking' && (
              <div className="pointer-events-none absolute h-28 w-28 rounded-full border border-emerald-400 voice-ripple"></div>
            )}

            {/* Audio Wave Visualizer Bars */}
            <div className="flex items-center gap-1.5 h-10 mb-4">
              {[4, 8, 16, 26, 18, 30, 20, 12, 6].map((h, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    speechState === 'listening'
                      ? 'bg-velo-lime animate-wave'
                      : speechState === 'speaking'
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-forest-700 h-2'
                  }`}
                  style={{
                    height: speechState === 'listening' || speechState === 'speaking' ? `${h}px` : '4px',
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>

            {/* Primary Glowing Mic Button */}
            <button
              onClick={toggleListening}
              className={`group relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 transform active:scale-95 ${
                speechState === 'listening'
                  ? 'bg-gradient-to-tr from-velo-lime to-emerald-400 text-forest-950 shadow-lime-glow-lg ring-8 ring-velo-lime/20'
                  : speechState === 'processing'
                  ? 'bg-amber-400 text-forest-950 shadow-lg ring-4 ring-amber-400/20 animate-spin'
                  : speechState === 'speaking'
                  ? 'bg-emerald-500 text-white shadow-lime-glow ring-6 ring-emerald-500/20'
                  : speechState === 'error'
                  ? 'bg-rose-500 text-white ring-4 ring-rose-500/30'
                  : 'bg-forest-800 text-velo-lime hover:bg-forest-700 hover:text-white border-2 border-velo-lime/50 shadow-lime-glow'
              }`}
              title="Click to Speak"
            >
              {speechState === 'listening' ? (
                <Mic className="h-9 w-9 animate-bounce" />
              ) : speechState === 'processing' ? (
                <Sparkles className="h-9 w-9" />
              ) : speechState === 'speaking' ? (
                <Volume2 className="h-9 w-9" />
              ) : speechState === 'error' ? (
                <MicOff className="h-8 w-8" />
              ) : (
                <Mic className="h-9 w-9 transition-transform group-hover:scale-110" />
              )}
            </button>

            {/* Live speech feedback pill */}
            <div className="mt-4 text-center">
              <p className="text-xs font-semibold text-slate-200">
                {speechState === 'listening'
                  ? interimTranscript || (language === 'ta' ? 'நீங்கள் பேசுவதைக் கேட்கிறேன்...' : 'Listening... Say your destination')
                  : speechState === 'processing'
                  ? language === 'ta' ? 'கோரிக்கையை பகுப்பாய்வு செய்கிறேன்...' : 'Processing your request...'
                  : speechState === 'speaking'
                  ? language === 'ta' ? 'பதிலளிக்கிறது (நிறுத்த மைக் அழுத்தவும்)' : 'Speaking (tap to pause)'
                  : speechState === 'error'
                  ? errorMessage || 'Error occurred. Tap to retry.'
                  : language === 'ta' ? 'பேச மைக் பட்டனை தட்டவும்' : 'Tap microphone to speak'}
              </p>
              {micPermission === 'denied' && (
                <p className="mt-1 text-[11px] text-rose-400 font-medium">
                  Microphone blocked in browser. Please enable permissions in site settings.
                </p>
              )}
            </div>
          </div>

          {/* Quick Voice Command Chips */}
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-velo-lime" />
              {language === 'ta' ? 'மாதிரி குரல் கட்டளைகள்' : 'Suggested Voice Commands'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sampleCommands.map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => handleVoiceInput(cmd)}
                  className="rounded-xl border border-velo-border/40 bg-forest-950/60 px-2.5 py-1.5 text-xs text-slate-300 transition-all hover:border-velo-lime hover:text-white hover:bg-forest-850 active:scale-95 text-left"
                >
                  &ldquo;{cmd}&rdquo;
                </button>
              ))}
            </div>
          </div>

          {/* Transcript / Conversation History Feed */}
          <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-velo-surface2 text-white border border-velo-border-active'
                      : m.isConfirmationPrompt
                      ? 'bg-forest-850 text-slate-100 border border-velo-lime/60 shadow-lime-glow'
                      : 'bg-forest-950 text-slate-200 border border-velo-border/40'
                  }`}
                >
                  <p>{m.text}</p>
                  {m.isConfirmationPrompt && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleVoiceInput(language === 'ta' ? 'ஆம், புக் செய்' : 'Yes, book it')}
                        className="rounded-lg bg-velo-lime px-3 py-1 font-bold text-forest-950 text-[11px] hover:bg-velo-lime-hover shadow-sm"
                      >
                        ✓ {language === 'ta' ? 'ஆம், புக் செய்' : 'Confirm Ride'}
                      </button>
                      <button
                        onClick={() => handleVoiceInput(language === 'ta' ? 'வேண்டாம்' : 'Cancel')}
                        className="rounded-lg bg-forest-800 px-3 py-1 text-slate-300 text-[11px] hover:bg-forest-700"
                      >
                        ✗ {language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 mt-0.5 px-1 font-mono">
                  {m.timestamp}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Text Input Fallback */}
          <form onSubmit={handleTextSubmit} className="relative flex items-center mt-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                language === 'ta'
                  ? 'அல்லது உங்கள் இலக்கை தட்டச்சு செய்யவும்...'
                  : 'Or type your destination or command here...'
              }
              className="w-full rounded-2xl border border-velo-border/60 bg-forest-950/80 px-4 py-2.5 pr-11 text-xs text-white placeholder-slate-500 focus:border-velo-lime focus:outline-none focus:ring-1 focus:ring-velo-lime transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-velo-lime text-forest-950 transition-all hover:bg-velo-lime-hover disabled:opacity-40 disabled:hover:bg-velo-lime"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
