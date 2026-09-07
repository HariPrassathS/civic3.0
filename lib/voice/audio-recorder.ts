// =============================================================================
// CivicConnect TN — Cross-Browser Audio Recorder with Full Lifecycle Management
// =============================================================================
// Handles microphone permissions, MediaRecorder lifecycle across Chrome, Safari,
// Firefox, Android, and iOS, audio format negotiation, and stream track cleanup.

export type AudioRecorderState = 'inactive' | 'recording' | 'paused' | 'processing' | 'error';

export interface AudioRecordingResult {
  blob: Blob;
  mimeType: string;
  durationMs: number;
  fileExtension: string;
}

export class AudioRecorder {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private startTime: number = 0;
  private state: AudioRecorderState = 'inactive';
  private mimeType: string = '';
  private fileExtension: string = 'webm';
  private onStateChange?: (state: AudioRecorderState) => void;
  private onVolumeChange?: (volume: number) => void;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  constructor(options?: {
    onStateChange?: (state: AudioRecorderState) => void;
    onVolumeChange?: (volume: number) => void;
  }) {
    this.onStateChange = options?.onStateChange;
    this.onVolumeChange = options?.onVolumeChange;
  }

  /**
   * Determine the best supported audio MIME type for the current browser/OS.
   */
  public static getSupportedMimeType(): { mimeType: string; extension: string } {
    if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
      return { mimeType: 'audio/webm', extension: 'webm' };
    }

    const types = [
      { mimeType: 'audio/webm;codecs=opus', extension: 'webm' },
      { mimeType: 'audio/webm', extension: 'webm' },
      { mimeType: 'audio/mp4', extension: 'mp4' },
      { mimeType: 'audio/aac', extension: 'aac' },
      { mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' },
      { mimeType: 'audio/wav', extension: 'wav' },
    ];

    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t.mimeType)) {
        return t;
      }
    }

    return { mimeType: '', extension: 'webm' };
  }

  /**
   * Check if microphone recording is supported in the current environment.
   */
  public static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof MediaRecorder !== 'undefined'
    );
  }

  /**
   * Request microphone permission and start recording.
   */
  public async start(): Promise<void> {
    if (this.state === 'recording') return;

    this.cleanup();

    if (!AudioRecorder.isSupported()) {
      this.updateState('error');
      throw new Error('Audio recording is not supported in this browser. Please use a modern browser.');
    }

    try {
      // 1. Request microphone access with echo cancellation and noise suppression
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });

      // 2. Negotiate supported audio format
      const { mimeType, extension } = AudioRecorder.getSupportedMimeType();
      this.mimeType = mimeType;
      this.fileExtension = extension;

      const recorderOptions: MediaRecorderOptions = {};
      if (mimeType) {
        recorderOptions.mimeType = mimeType;
      }

      this.mediaRecorder = new MediaRecorder(this.mediaStream, recorderOptions);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // 3. Setup AudioContext volume analysis for live UI waveform visualization
      this.setupAudioAnalysis(this.mediaStream);

      this.mediaRecorder.start(200); // 200ms timeslices for smooth chunking
      this.startTime = Date.now();
      this.updateState('recording');
    } catch (err: unknown) {
      this.cleanup();
      this.updateState('error');
      const errMessage =
        err instanceof Error
          ? err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
            ? 'Microphone permission denied. Please allow microphone access in your browser settings.'
            : err.message
          : 'Failed to access microphone.';
      throw new Error(errMessage);
    }
  }

  /**
   * Stop recording and return the accumulated audio Blob.
   */
  public async stop(): Promise<AudioRecordingResult> {
    if (!this.mediaRecorder || this.state !== 'recording') {
      throw new Error('Recorder is not actively recording.');
    }

    this.updateState('processing');
    const durationMs = Date.now() - this.startTime;

    return new Promise<AudioRecordingResult>((resolve, reject) => {
      const recorder = this.mediaRecorder;
      if (!recorder) {
        this.cleanup();
        this.updateState('inactive');
        return reject(new Error('Recorder was cancelled during stop.'));
      }

      recorder.onstop = () => {
        try {
          const finalMimeType = this.mimeType || recorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(this.audioChunks, { type: finalMimeType });

          const result: AudioRecordingResult = {
            blob: audioBlob,
            mimeType: finalMimeType,
            durationMs,
            fileExtension: this.fileExtension,
          };

          this.cleanup();
          this.updateState('inactive');
          resolve(result);
        } catch (error) {
          this.cleanup();
          this.updateState('error');
          reject(error);
        }
      };

      try {
        recorder.stop();
      } catch (err) {
        this.cleanup();
        this.updateState('error');
        reject(err);
      }
    });
  }

  /**
   * Setup AudioContext and AnalyserNode for real-time sound level streaming.
   */
  private setupAudioAnalysis(stream: MediaStream): void {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!this.analyser || this.state !== 'recording') return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 128) * 100));

        if (this.onVolumeChange) {
          this.onVolumeChange(normalized);
        }

        this.animFrameId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch {
      // Audio analysis is non-fatal enhancement
    }
  }

  /**
   * Completely release all hardware resources and media stream tracks.
   * GUARANTEED to stop all microphone recording.
   */
  public cleanup(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {
        // Ignore
      }
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore
        }
      });
      this.mediaStream = null;
    }

    this.mediaRecorder = null;
    this.audioChunks = [];
    if (this.onVolumeChange) {
      this.onVolumeChange(0);
    }
  }

  public getState(): AudioRecorderState {
    return this.state;
  }

  private updateState(newState: AudioRecorderState): void {
    this.state = newState;
    if (this.onStateChange) {
      this.onStateChange(newState);
    }
  }
}
