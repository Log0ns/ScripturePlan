import { useCallback, useRef } from 'react';

const SpeechRecognition =
  (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;

export function useAudio() {
  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);

  const speak = useCallback((text: string, maxMs = 60000): Promise<void> => {
    return new Promise(resolve => {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      let settled = false;
      const done = () => { if (!settled) { settled = true; clearTimeout(timer); resolve(); } };
      const timer = setTimeout(done, maxMs);
      utt.onend = done;
      utt.onerror = done;
      window.speechSynthesis.speak(utt);
    });
  }, []);

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
    recognitionRef.current?.abort();
    recognitionRef.current = null;
  }, []);

  const listen = useCallback((onResult: (transcript: string) => void): (() => void) => {
    if (!SpeechRecognition) return () => {};

    let intentionalStop = false;

    const start = () => {
      recognitionRef.current?.abort();
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (e: any) => {
        const transcript: string = Array.from(e.results as any[])
          .map((r: any) => r[0].transcript)
          .join(' ')
          .toLowerCase()
          .trim();
        onResult(transcript);
      };

      rec.onerror = () => {
        if (recognitionRef.current === rec) recognitionRef.current = null;
      };

      rec.onend = () => {
        if (recognitionRef.current === rec) recognitionRef.current = null;
        if (!intentionalStop && recognitionRef.current === null) {
          try { start(); } catch {}
        }
      };

      recognitionRef.current = rec;
      rec.start();
    };

    start();

    return () => {
      intentionalStop = true;
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  const supported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) &&
    'speechSynthesis' in window;

  return { speak, listen, stopListening, cancel, supported };
}
