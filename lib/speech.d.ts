// Minimal Web Speech API typings (not in lib.dom for all TS configs).
interface SpeechRecognitionResultLike {
  0: { transcript: string };
  isFinal: boolean;
}
interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<SpeechRecognitionResultLike>;
  resultIndex?: number;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
interface Window {
  SpeechRecognition?: { new (): SpeechRecognitionLike };
  webkitSpeechRecognition?: { new (): SpeechRecognitionLike };
}
