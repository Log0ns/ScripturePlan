import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { TimeOfDay, ThemeMemory, StudySort } from '../types';
import { BIBLE_BOOKS } from '../constants';
import { reviewCard } from '../hooks/sm2';
import { useAudio } from '../hooks/useAudio';

type Card = { bookIndex: number; chapter: number; memory: ThemeMemory; failed?: boolean };

type Props = {
  cards: Card[];
  themes: Record<number, Record<number, string>>;
  timeOfDay: TimeOfDay;
  sort?: StudySort;
  audioEnabled?: boolean;
  onUpdateMemory: (bookIndex: number, chapter: number, memory: ThemeMemory) => void;
  onGetNewlyDue?: () => Card[];
  onClose: () => void;
};

const GRADES: { label: string; grade: 1 | 2 | 3 | 4 | 5; color: string }[] = [
  { label: 'Again', grade: 1, color: 'bg-red-500/20 text-red-400 hover:bg-red-500/30' },
  { label: 'Hard',  grade: 2, color: 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' },
  { label: 'Good',  grade: 3, color: 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' },
  { label: 'Easy',  grade: 5, color: 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30' },
];

type AudioPhase = 'speaking-prompt' | 'waiting-ready' | 'speaking-theme' | 'done';

export default function StudySession({ cards: initialCards, themes: initialThemes, timeOfDay, sort = 'book-order', audioEnabled = false, onUpdateMemory, onGetNewlyDue, onClose }: Props) {
  const [queue, setQueue] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [themes] = useState(initialThemes);
  const initialized = useRef(false);
  const [audioPhase, setAudioPhase] = useState<AudioPhase>('done');
  const [readyForGrade, setReadyForGrade] = useState(false);
  const handleRevealRef = useRef<() => void>(() => {});
  const handleGradeRef = useRef<(g: 1 | 2 | 3 | 4 | 5) => void>(() => {});
  const [listeningForGrade, setListeningForGrade] = useState(false);
  const audioUnlockedRef = useRef(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const readyListenStopRef = useRef<(() => void) | null>(null);
  const gradeListenStopRef = useRef<(() => void) | null>(null);
  const { speak, listen, cancel } = useAudio();

  // Android: resume TTS when page becomes visible again
  useEffect(() => {
    if (!audioEnabled) return;
    const onVisible = () => { if (document.visibilityState === 'visible') window.speechSynthesis.resume(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [audioEnabled]);

  useEffect(() => {
    if (!initialized.current && initialCards.length > 0) {
      initialized.current = true;
      setQueue(initialCards);
    }
  }, [initialCards]);

  const previewInterval = (memory: ThemeMemory, grade: 1 | 2 | 3 | 4 | 5): string => {
    const result = reviewCard(memory, grade);
    if (result.status === 'learning') {
      const mins = Math.round((new Date(result.dueDate).getTime() - Date.now()) / 60000);
      return mins < 60 ? `${Math.max(1, mins)}m` : `${Math.round(mins / 60)}h`;
    }
    return `${result.interval}d`;
  };

  const speakPrompt = useCallback((bi: number, ch: number) => {
    const bookName = BIBLE_BOOKS[bi].name;
    setAudioPhase('speaking-prompt');
    speak(`${bookName}, Chapter ${ch}`).then(() => setAudioPhase('waiting-ready'));
  }, [speak]);

  // When card changes: if already unlocked speak immediately, else wait for tap
  const cardKey = queue[0] ? `${queue[0].bookIndex}:${queue[0].chapter}` : null;
  useEffect(() => {
    if (!audioEnabled || !cardKey) return;
    readyListenStopRef.current?.(); readyListenStopRef.current = null;
    gradeListenStopRef.current?.(); gradeListenStopRef.current = null;
    cancel();
    setFlipped(false);
    setReadyForGrade(false);
    if (audioUnlockedRef.current) {
      const [bi, ch] = cardKey.split(':').map(Number);
      speakPrompt(bi, ch);
    } else {
      setAudioPhase('waiting-ready'); // iOS: show "tap to hear" until first gesture
    }
    return () => { cancel(); readyListenStopRef.current?.(); readyListenStopRef.current = null; };
  }, [audioEnabled, cardKey]);

  const handleReveal = useCallback(() => {
    const c = queue[0];
    if (!c) return;

    // iOS: first tap unlocks TTS and speaks the prompt — don't reveal yet
    if (audioEnabled && !audioUnlockedRef.current) {
      audioUnlockedRef.current = true;
      setAudioUnlocked(true);
      speakPrompt(c.bookIndex, c.chapter);
      return;
    }

    readyListenStopRef.current?.(); readyListenStopRef.current = null;
    setFlipped(true);

    if (!audioEnabled) {
      setReadyForGrade(true);
      return;
    }

    const theme = initialThemes[c.bookIndex]?.[c.chapter] ?? '';
    setAudioPhase('speaking-theme');
    speak(theme || 'No theme recorded').then(() => {
      setAudioPhase('done');
      setReadyForGrade(true);
    });
  }, [audioEnabled, queue, initialThemes, speak, speakPrompt]);

  handleRevealRef.current = handleReveal;

  // Fix #3: separate ref for ready-listener
  useEffect(() => {
    if (!audioEnabled || audioPhase !== 'waiting-ready') return;
    const stop = listen((transcript) => {
      if (transcript.includes('ready')) handleRevealRef.current();
    });
    readyListenStopRef.current = stop;
    return () => { stop(); readyListenStopRef.current = null; };
  }, [audioEnabled, audioPhase]);

  // Fix #3: separate ref for grade-listener; Fix #2: only starts after readyForGrade
  useEffect(() => {
    if (!audioEnabled || !readyForGrade) return;
    setListeningForGrade(true);
    const VOICE_GRADES: [string, 1 | 2 | 3 | 4 | 5][] = [
      ['again', 1], ['hard', 2], ['good', 3], ['easy', 5],
    ];
    // Small delay so residual TTS audio doesn't accidentally trigger a grade
    const timer = setTimeout(() => {
      const stop = listen((transcript) => {
        for (const [word, grade] of VOICE_GRADES) {
          if (transcript.includes(word)) { handleGradeRef.current(grade); return; }
        }
      });
      gradeListenStopRef.current = stop;
    }, 600);
    return () => {
      clearTimeout(timer);
      gradeListenStopRef.current?.();
      gradeListenStopRef.current = null;
      setListeningForGrade(false);
    };
  }, [audioEnabled, readyForGrade]);

  const isNight = timeOfDay === 'night';
  const nowDisplay = new Date().toISOString();
  const nextCard = queue[0];
  const card = nextCard && nextCard.memory.dueDate <= nowDisplay ? nextCard : null;

  if (!card) return null;

  const handleGrade = (grade: 1 | 2 | 3 | 4 | 5) => {
    cancel();
    readyListenStopRef.current?.(); readyListenStopRef.current = null;
    gradeListenStopRef.current?.(); gradeListenStopRef.current = null;
    setAudioPhase('done');
    setReadyForGrade(false);
    setListeningForGrade(false);
    const updated = reviewCard(card.memory, grade);
    onUpdateMemory(card.bookIndex, card.chapter, updated);

    const passed = grade >= 3;

    const rest = queue.slice(1);
    const failedCard = passed ? null : { ...card, memory: updated, failed: true as const };
    const next: Card[] = failedCard ? [...rest, failedCard] : rest;

    const now = new Date().toISOString();
    if (sort === 'most-due-first') {
      next.sort((a, b) => {
        if (a.failed && !b.failed) return 1;
        if (!a.failed && b.failed) return -1;
        const aDue = a.memory.dueDate <= now;
        const bDue = b.memory.dueDate <= now;
        if (aDue && !bDue) return -1;
        if (!aDue && bDue) return 1;
        return a.memory.dueDate < b.memory.dueDate ? -1 : a.memory.dueDate > b.memory.dueDate ? 1 : 0;
      });
    } else {
      const due    = next.filter(c => !c.failed && c.memory.dueDate <= now);
      const notDue = next.filter(c => !c.failed && c.memory.dueDate > now);
      const failed = next.filter(c => c.failed);
      next.splice(0, next.length, ...due, ...notDue, ...failed);
    }

    // Pick up any cards that became due mid-session
    if (onGetNewlyDue) {
      const seenKeys = new Set(next.map(c => `${c.bookIndex}:${c.chapter}`));
      seenKeys.add(`${card.bookIndex}:${card.chapter}`);
      const fresh = onGetNewlyDue().filter(c => !seenKeys.has(`${c.bookIndex}:${c.chapter}`));
      if (fresh.length > 0) {
        const failedStart = next.findIndex(c => c.failed);
        if (sort === 'most-due-first' || failedStart === -1) next.push(...fresh);
        else next.splice(failedStart, 0, ...fresh);
      }
    }

    if (next.length === 0 || next.every(c => c.memory.dueDate > now && !c.failed)) {
      onClose();
    } else {
      setQueue(next);
      setFlipped(false);
      setReadyForGrade(false);
    }
  };

  handleGradeRef.current = handleGrade;

  const panelClass = isNight
    ? 'bg-slate-900/95 text-slate-100'
    : 'bg-white/95 text-slate-800';


  const cardClass = isNight
    ? 'bg-slate-800 border border-slate-700'
    : 'bg-white border border-slate-200';


  const bookName = BIBLE_BOOKS[card.bookIndex].name;
  const theme = themes[card.bookIndex]?.[card.chapter] ?? '';
  const remaining = queue.filter(c => !c.failed && c.memory.dueDate <= nowDisplay).length;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col px-6 pb-8 ${panelClass}`} style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <span className={`text-xs font-medium ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>
          {remaining} remaining
        </span>
        <button onClick={onClose}>
          <X className={`w-5 h-5 ${isNight ? 'text-slate-400' : 'text-slate-500'}`} />
        </button>
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div
          className={`w-full max-w-sm rounded-2xl p-8 text-center cursor-pointer select-none ${cardClass}`}
          onClick={() => { if (!flipped) handleReveal(); }}
        >
          <div className={`text-2xl font-bold mb-1 ${isNight ? 'text-slate-100' : 'text-slate-800'}`}>
            {bookName}
          </div>
          <div className={`text-lg ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>
            Chapter {card.chapter}
          </div>

          {flipped ? (
            <div className={`mt-6 pt-6 border-t text-sm leading-relaxed ${isNight ? 'border-slate-700 text-slate-200' : 'border-slate-200 text-slate-700'}`}>
              {theme || <span className={isNight ? 'text-slate-500' : 'text-slate-400'}>No theme recorded</span>}
            </div>
          ) : audioPhase === 'speaking-prompt' ? (
            <div className={`mt-6 text-xs animate-pulse ${isNight ? 'text-slate-500' : 'text-slate-400'}`}>…</div>
          ) : (
            <div className={`mt-6 text-xs ${isNight ? 'text-slate-500' : 'text-slate-400'}`}>
              {audioEnabled && !audioUnlocked ? 'tap to hear' : 'tap to reveal'}
            </div>
          )}
        </div>

        {/* Grade buttons — only shown after TTS finishes (readyForGrade) */}
        {(audioEnabled ? readyForGrade : flipped) && (
          <div className="flex flex-col items-center gap-3 w-full max-w-sm">
            {audioEnabled && listeningForGrade && (
              <div className={`flex items-center gap-1.5 text-xs ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                listening…
              </div>
            )}
            <div className={`grid grid-cols-4 w-full ${audioEnabled ? 'gap-3' : 'gap-2'}`}>
              {GRADES.map(({ label, grade, color }) => (
                <button
                  key={label}
                  onClick={() => handleGrade(grade)}
                  className={`rounded-xl font-medium transition-colors flex flex-col items-center leading-tight ${color} ${
                    audioEnabled ? 'py-5 text-base' : 'py-2 text-sm'
                  }`}
                >
                  <span>{label}</span>
                  <span className="text-xs opacity-60">{previewInterval(card.memory, grade)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
