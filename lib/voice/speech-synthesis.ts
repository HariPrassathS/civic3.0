// =============================================================================
// CivicConnect TN — Web Speech Synthesis (Text-to-Speech) Service
// =============================================================================
// Provides spoken feedback in Tamil (ta-IN) and English (en-IN/en-US) with
// pitch, rate, speech cancellation, and accessibility mute controls.

export type VoiceLanguage = 'ta' | 'en' | 'tanglish';

export class SpeechSynthesisService {
  private isMuted: boolean = false;
  private currentLanguage: VoiceLanguage = 'ta';
  private onSpeakingStateChange?: (speaking: boolean) => void;

  constructor(options?: {
    isMuted?: boolean;
    language?: VoiceLanguage;
    onSpeakingStateChange?: (speaking: boolean) => void;
  }) {
    if (options?.isMuted !== undefined) this.isMuted = options.isMuted;
    if (options?.language) this.currentLanguage = options.language;
    this.onSpeakingStateChange = options?.onSpeakingStateChange;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.cancel();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setLanguage(language: VoiceLanguage): void {
    this.currentLanguage = language;
  }

  public getLanguage(): VoiceLanguage {
    return this.currentLanguage;
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  }

  /**
   * Speak a sentence in the specified or active language.
   */
  public speak(
    text: string,
    options?: {
      language?: VoiceLanguage;
      rate?: number;
      pitch?: number;
      onEnd?: () => void;
      onError?: (error: unknown) => void;
    }
  ): Promise<void> {
    if (this.isMuted || !this.isSupported() || !text.trim()) {
      options?.onEnd?.();
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.cancel();

      const lang = options?.language || this.currentLanguage;
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.rate = options?.rate || 0.95; // Slightly slower for clear government announcements
      utterance.pitch = options?.pitch || 1.0;
      utterance.volume = 1.0;

      // Select matching voice
      const voices = window.speechSynthesis.getVoices();
      if (lang === 'ta') {
        utterance.lang = 'ta-IN';
        const tamilVoice = voices.find(
          (v) => v.lang.startsWith('ta') || v.name.toLowerCase().includes('tamil')
        );
        if (tamilVoice) utterance.voice = tamilVoice;
      } else {
        utterance.lang = 'en-IN';
        const indianEngVoice = voices.find(
          (v) => v.lang === 'en-IN' || v.name.toLowerCase().includes('india')
        );
        if (indianEngVoice) {
          utterance.voice = indianEngVoice;
        } else {
          const engVoice = voices.find((v) => v.lang.startsWith('en'));
          if (engVoice) utterance.voice = engVoice;
        }
      }

      if (this.onSpeakingStateChange) {
        this.onSpeakingStateChange(true);
      }

      utterance.onend = () => {
        if (this.onSpeakingStateChange) {
          this.onSpeakingStateChange(false);
        }
        options?.onEnd?.();
        resolve();
      };

      utterance.onerror = (e) => {
        if (this.onSpeakingStateChange) {
          this.onSpeakingStateChange(false);
        }
        options?.onError?.(e);
        resolve();
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        if (this.onSpeakingStateChange) {
          this.onSpeakingStateChange(false);
        }
        options?.onError?.(err);
        resolve();
      }
    });
  }

  /**
   * Immediately cancel any active speech.
   */
  public cancel(): void {
    if (this.isSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
    if (this.onSpeakingStateChange) {
      this.onSpeakingStateChange(false);
    }
  }
}
