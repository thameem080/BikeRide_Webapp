import { Language } from '../types';

export type SpeechState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

// Check browser recognition support
export const isSpeechRecognitionSupported = (): boolean => {
  return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
};

// Check browser speech synthesis support
export const isSpeechSynthesisSupported = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

// Request microphone permission explicitly
export async function requestMicrophonePermission(): Promise<{ granted: boolean; error?: string }> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { granted: false, error: 'Media devices API not supported in this browser' };
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop tracks immediately after granting permission
    stream.getTracks().forEach((track) => track.stop());
    return { granted: true };
  } catch (err: any) {
    console.warn('Microphone permission check error:', err);
    return { granted: false, error: err.name === 'NotAllowedError' ? 'Microphone permission denied' : err.message };
  }
}

// Speak text using SpeechSynthesis
export function speakText(
  text: string,
  language: Language = 'en',
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): () => void {
  if (!isSpeechSynthesisSupported()) {
    onEnd?.();
    return () => {};
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
  utterance.rate = language === 'ta' ? 0.95 : 1.0;
  utterance.pitch = 1.0;

  // Try to pick a natural regional voice if available
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find((v) =>
    language === 'ta' ? v.lang.includes('ta') : v.lang.includes('en-IN') || v.lang.includes('en-GB')
  );
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.onstart = () => {
    onStart?.();
  };

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = (e) => {
    console.warn('SpeechSynthesis error:', e);
    onError?.(e);
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);

  // Return cancel function
  return () => {
    window.speechSynthesis.cancel();
  };
}

// Voice Recognition Controller Class
export class VoiceRecognitionManager {
  private recognition: any = null;
  private isRunning: boolean = false;
  private language: Language = 'en';

  constructor(
    language: Language = 'en',
    onResult?: (transcript: string, isFinal: boolean) => void,
    onStateChange?: (state: SpeechState, error?: string) => void
  ) {
    this.language = language;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not available in this browser');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = language === 'ta' ? 'ta-IN' : 'en-IN';

    rec.onstart = () => {
      this.isRunning = true;
      onStateChange?.('listening');
    };

    rec.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        onResult?.(finalTranscript, true);
      } else if (interimTranscript) {
        onResult?.(interimTranscript, false);
      }
    };

    rec.onerror = (event: any) => {
      this.isRunning = false;
      console.warn('SpeechRecognition error:', event.error);
      const friendlyMsg =
        event.error === 'not-allowed'
          ? 'Microphone permission denied'
          : event.error === 'no-speech'
          ? 'No speech detected'
          : `Speech error: ${event.error}`;
      onStateChange?.('error', friendlyMsg);
    };

    rec.onend = () => {
      this.isRunning = false;
      onStateChange?.('idle');
    };

    this.recognition = rec;
  }

  setLanguage(lang: Language) {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
    }
  }

  start() {
    if (this.recognition && !this.isRunning) {
      try {
        this.recognition.start();
      } catch (e) {
        console.warn('Recognition start error:', e);
      }
    }
  }

  stop() {
    if (this.recognition && this.isRunning) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Recognition stop error:', e);
      }
    }
  }

  isActive() {
    return this.isRunning;
  }
}
