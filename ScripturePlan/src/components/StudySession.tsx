import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { TimeOfDay, ThemeMemory, StudySort } from '../types';
import { BIBLE_BOOKS } from '../constants';
import { reviewCard } from '../hooks/sm2';
import { sortCards } from '../hooks/useThemeMemory';
import { useAudio } from '../hooks/useAudio';

type PromptMode = 'reference' | 'theme' | 'verse';
type Card = { bookIndex: number; chapter: number; memory: ThemeMemory; promptMode?: PromptMode; verseText?: string; verseNum?: number };
type BibleData = Record<string, Record<string, { verse: number; text: string }[]>>;

function randomPromptMode(theme: string, hasVerses: boolean): PromptMode {
  const pool: PromptMode[] = ['reference', 'reference', 'reference'];
  if (theme) pool.push('theme');
  if (hasVerses) pool.push('verse');
  return pool[Math.floor(Math.random() * pool.length)];
}

type Props = {
  cards: Card[];
  themes: Record<number, Record<number, string>>;
  timeOfDay: TimeOfDay;
  sort?: StudySort;
  audioEnabled?: boolean;
  onUpdateMemory: (bookIndex: number, chapter: number, memory: ThemeMemory) => void;
  onUpdateVerseScore: (bookIndex: number, chapter: number, delta: number) => void;
  onClose: () => void;
};

const GRADES: { label: string; grade: 1 | 2 | 3 | 4 | 5; color: string }[] = [
  { label: 'Again', grade: 1, color: 'bg-red-500/20 text-red-400 hover:bg-red-500/30' },
  { label: 'Hard',  grade: 2, color: 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' },
  { label: 'Good',  grade: 3, color: 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' },
  { label: 'Easy',  grade: 5, color: 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30' },
];

type AudioPhase = 'speaking-prompt' | 'waiting-ready' | 'speaking-theme' | 'done';

export default function StudySession({ cards: initialCards, themes: initialThemes, timeOfDay, sort = 'book-order', audioEnabled = false, onUpdateMemory, onUpdateVerseScore, onClose }: Props) {
  const [queue, setQueue] = useState<Card[]>([]);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
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
  const dragRef = useRef(false);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const { speak, listen, cancel } = useAudio();

  const bibleRef = useRef<BibleData | null>(null);
  const [bibleLoaded, setBibleLoaded] = useState(false);
  useEffect(() => {
    fetch('/bible.json').then(r => r.json()).then(d => { bibleRef.current = d; setBibleLoaded(true); }).catch(() => setBibleLoaded(true));
  }, []);

  const assignPrompt = useCallback((c: Card): Card => {
    const theme = initialThemes[c.bookIndex]?.[c.chapter] ?? '';
    const bookName = BIBLE_BOOKS[c.bookIndex].name;
    const verses = bibleRef.current?.[bookName]?.[String(c.chapter)] ?? [];
    const noVerse = sort !== 'random-books-random';
    const mode = randomPromptMode(theme, !noVerse && verses.length > 0);
    if (mode === 'verse' && verses.length > 0) {
      const v = verses[Math.floor(Math.random() * verses.length)];
      return { ...c, promptMode: mode, verseText: v.text, verseNum: v.verse };
    }
    return { ...c, promptMode: mode };
  }, [initialThemes]);

  useEffect(() => {
    if (!audioEnabled) return;
    let wakeLock: any = null;
    const acquire = () => {
      if ('wakeLock' in navigator) {
        (navigator as any).wakeLock.request('screen')
          .then((wl: any) => { wakeLock = wl; })
          .catch(() => {});
      }
    };
    acquire();
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        window.speechSynthesis.resume();
        acquire();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      wakeLock?.release().catch(() => {});
    };
  }, [audioEnabled]);

  useEffect(() => {
    if (!bibleLoaded || initialized.current || initialCards.length === 0) return;
    initialized.current = true;
    const first = assignPrompt(initialCards[0]);
    setQueue([first, ...initialCards.slice(1)]);
    setCurrentCard(first);
  }, [bibleLoaded, initialCards]);

  const previewInterval = (memory: ThemeMemory, grade: 1 | 2 | 3 | 4 | 5): string => {
    const result = reviewCard(memory, grade);
    if (result.status === 'learning') {
      const mins = Math.round((new Date(result.dueDate).getTime() - Date.now()) / 60000);
      return mins < 60 ? `${Math.max(1, mins)}m` : `${Math.round(mins / 60)}h`;
    }
    return `${result.interval}d`;
  };

  const speakPrompt = useCallback((c: Card) => {
    const bookName = BIBLE_BOOKS[c.bookIndex].name;
    const theme = initialThemes[c.bookIndex]?.[c.chapter] ?? '';
    let text: string;
    if (c.promptMode === 'theme') text = theme || 'No theme recorded';
    else if (c.promptMode === 'verse') text = c.verseText ?? `${bookName}, Chapter ${c.chapter}`;
    else text = `${bookName}, Chapter ${c.chapter}`;
    setAudioPhase('speaking-prompt');
    speak(text).then(() => setAudioPhase('waiting-ready'));
  }, [speak, initialThemes]);

  // When card changes: if already unlocked speak immediately, else wait for tap
  const cardKey = currentCard ? `${currentCard.bookIndex}:${currentCard.chapter}:${currentCard.promptMode}` : null;
  useEffect(() => {
    if (!audioEnabled || !cardKey) return;
    readyListenStopRef.current?.(); readyListenStopRef.current = null;
    gradeListenStopRef.current?.(); gradeListenStopRef.current = null;
    cancel();
    setFlipped(false);
    setReadyForGrade(false);
    if (audioUnlockedRef.current && currentCard) {
      speakPrompt(currentCard);
    } else {
      setAudioPhase('waiting-ready');
    }
    return () => { cancel(); readyListenStopRef.current?.(); readyListenStopRef.current = null; };
  }, [audioEnabled, cardKey]);

  const handleReveal = useCallback(() => {
    const c = currentCard;
    if (!c) return;

    // iOS: first tap unlocks TTS and speaks the prompt — don't reveal yet
    if (audioEnabled && !audioUnlockedRef.current) {
      audioUnlockedRef.current = true;
      setAudioUnlocked(true);
      speakPrompt(c);
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
    // For theme/verse prompt modes, speak the reference as the answer
    const answerText = (c.promptMode === 'theme' || c.promptMode === 'verse')
      ? `${BIBLE_BOOKS[c.bookIndex].name}, Chapter ${c.chapter}${theme ? '. ' + theme : ''}`
      : (theme || 'No theme recorded');
    speak(answerText).then(() => {
      setAudioPhase('done');
      setReadyForGrade(true);
    });
  }, [audioEnabled, currentCard, initialThemes, speak, speakPrompt]);

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
    const promptMode = currentCard?.promptMode ?? 'reference';
    const VOICE_GRADES: [string, 1 | 2 | 3 | 4 | 5][] = promptMode === 'verse'
      ? [['wrong', 1], ['right', 5]]
      : [['again', 1], ['hard', 2], ['good', 3], ['easy', 5]];
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
  }, [audioEnabled, readyForGrade, currentCard?.promptMode]);

  const [now, setNow] = useState(() => new Date().toISOString());
  useEffect(() => {
    const interval = currentCard ? 10_000 : 1_000;
    const t = setInterval(() => setNow(new Date().toISOString()), interval);
    return () => clearInterval(t);
  }, [currentCard !== null]);

  const isNight = timeOfDay === 'night';

  // When waiting: surface the next card as soon as it becomes due
  useEffect(() => {
    if (currentCard !== null || queue.length === 0) return;
    const nextDueIdx = queue.findIndex(c => c.memory.dueDate <= now);
    if (nextDueIdx >= 0) {
      const next = [...queue];
      const due = assignPrompt(next[nextDueIdx]);
      next[nextDueIdx] = due;
      next.splice(nextDueIdx, 1);
      next.unshift(due);
      setQueue(next);
      setCurrentCard(due);
    }
  }, [now, currentCard, queue.length]);

  const card = currentCard;
  const mode = card?.promptMode ?? 'reference';

  const handleGrade = (grade: 1 | 2 | 3 | 4 | 5) => {
    cancel();
    readyListenStopRef.current?.(); readyListenStopRef.current = null;
    gradeListenStopRef.current?.(); gradeListenStopRef.current = null;
    setAudioPhase('done');
    setReadyForGrade(false);
    setListeningForGrade(false);

    // Verse mode: only update score counter, never affect SRS or re-queue
    if (card.promptMode === 'verse') {
      onUpdateVerseScore(card.bookIndex, card.chapter, grade >= 3 ? 1 : -1);
      const rest = queue.slice(1);
      if (rest.length === 0) { onClose(); return; }
      const rawNext = rest[0];
      const nextWithPrompt = rawNext && !rawNext.promptMode ? assignPrompt(rawNext) : rawNext;
      if (nextWithPrompt !== rawNext) rest[0] = nextWithPrompt;
      const nowTs = new Date().toISOString();
      setQueue(rest);
      setCurrentCard(rawNext.memory.dueDate <= nowTs ? nextWithPrompt : null);
      setFlipped(false);
      setReadyForGrade(false);
      return;
    }

    const updated = reviewCard(card.memory, grade);
    onUpdateMemory(card.bookIndex, card.chapter, updated);

    const passed = grade >= 3;
    const rest = queue.slice(1);
    const next: Card[] = passed ? rest : [...rest, { bookIndex: card.bookIndex, chapter: card.chapter, memory: updated }];
    if (sort !== 'random-books-random') {
      const sorted = sortCards(next, sort);
      sorted.forEach((c, i) => { next[i] = c; });
    }

    if (next.length === 0) {
      onClose();
      return;
    }

    const nowTs = new Date().toISOString();
    const rawNext = next[0];
    const nextWithPrompt = rawNext && !rawNext.promptMode ? assignPrompt(rawNext) : rawNext;
    if (nextWithPrompt && nextWithPrompt !== rawNext) next[0] = nextWithPrompt;
    const nextCard = rawNext && rawNext.memory.dueDate <= nowTs ? nextWithPrompt : null;

    setQueue(next);
    setCurrentCard(nextCard);
    setFlipped(false);
    setReadyForGrade(false);
  };

  handleGradeRef.current = handleGrade;

  const panelClass = isNight
    ? 'bg-slate-900/95 text-slate-100'
    : 'bg-white/95 text-slate-800';


  const cardClass = isNight
    ? 'bg-slate-800 border border-slate-700'
    : 'bg-white border border-slate-200';


  if (!card) {
    // Waiting for failed card(s) to become due
    const nextDueMs = queue.length > 0
      ? Math.min(...queue.map(c => new Date(c.memory.dueDate).getTime()))
      : null;
    const secsLeft = nextDueMs ? Math.max(0, Math.ceil((nextDueMs - Date.now()) / 1000)) : null;
    return (
      <div className={`fixed inset-0 z-50 flex flex-col px-6 pb-8 ${panelClass}`} style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
        <div className="flex items-center justify-between mb-6">
          <span className={`text-xs font-medium ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>0 remaining</span>
          <button onClick={onClose}><X className={`w-5 h-5 ${isNight ? 'text-slate-400' : 'text-slate-500'}`} /></button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <div className={`text-sm ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>next card in</div>
          <div className={`text-3xl font-bold tabular-nums ${isNight ? 'text-slate-200' : 'text-slate-700'}`}>
            {secsLeft !== null ? `${secsLeft}s` : '…'}
          </div>
        </div>
      </div>
    );
  }


  const bookName = BIBLE_BOOKS[card.bookIndex].name;
  const theme = themes[card.bookIndex]?.[card.chapter] ?? '';
  const remaining = queue.length;

  // Prompt face content
  const promptFace = mode === 'theme' ? (
    <>
      <div className={`text-sm leading-relaxed ${isNight ? 'text-slate-200' : 'text-slate-700'}`}>{theme || 'No theme recorded'}</div>
      <div className={`mt-3 text-xs ${isNight ? 'text-slate-500' : 'text-slate-400'}`}>What chapter is this?</div>
    </>
  ) : mode === 'verse' ? (
    <>
      <div className={`text-xs mb-2 ${isNight ? 'text-slate-500' : 'text-slate-400'}`}>v.{card.verseNum}</div>
      <div className={`text-xs leading-relaxed italic ${isNight ? 'text-slate-200' : 'text-slate-700'}`}>"{card.verseText}"</div>
      <div className={`mt-3 text-xs ${isNight ? 'text-slate-500' : 'text-slate-400'}`}>What chapter is this?</div>
    </>
  ) : (
    <>
      <div className={`text-2xl font-bold mb-1 ${isNight ? 'text-slate-100' : 'text-slate-800'}`}>{bookName}</div>
      <div className={`text-lg ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>Chapter {card.chapter}</div>
    </>
  );

  // Answer face content
  const answerFace = mode === 'reference' ? (
    <>
      {promptFace}
      <div className={`mt-6 pt-6 border-t text-sm leading-relaxed ${isNight ? 'border-slate-700 text-slate-200' : 'border-slate-200 text-slate-700'}`}>
        {theme || <span className={isNight ? 'text-slate-500' : 'text-slate-400'}>No theme recorded</span>}
      </div>
    </>
  ) : (
    <>
      {promptFace}
      <div className={`mt-6 pt-6 border-t ${isNight ? 'border-slate-700' : 'border-slate-200'}`}>
        <div className={`text-lg font-bold ${isNight ? 'text-slate-100' : 'text-slate-800'}`}>{bookName} {card.chapter}</div>
        {theme && <div className={`mt-2 text-sm leading-relaxed ${isNight ? 'text-slate-300' : 'text-slate-600'}`}>{theme}</div>}
      </div>
    </>
  );

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
          className={`w-full max-w-sm rounded-2xl p-8 text-center cursor-pointer select-none ${cardClass} ${mode === 'verse' ? 'max-h-72 overflow-y-auto' : ''}`}
          onPointerDown={(e) => { dragRef.current = false; pointerDownPos.current = { x: e.clientX, y: e.clientY }; }}
          onPointerMove={(e) => {
            if (!pointerDownPos.current) return;
            const dx = e.clientX - pointerDownPos.current.x;
            const dy = e.clientY - pointerDownPos.current.y;
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragRef.current = true;
          }}
          onPointerUp={() => { pointerDownPos.current = null; }}
          onClick={() => {
            if (flipped || dragRef.current) return;
            handleReveal();
          }}
        >
          {flipped ? answerFace : (
            <>
              {promptFace}
              {audioPhase === 'speaking-prompt' ? (
                <div className={`mt-4 text-xs animate-pulse ${isNight ? 'text-slate-500' : 'text-slate-400'}`}>…</div>
              ) : (
                <div className={`mt-4 text-xs ${isNight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {audioEnabled && !audioUnlocked ? 'tap to hear' : 'tap to reveal'}
                </div>
              )}
            </>
          )}
        </div>

        {/* Grade buttons */}
        {(audioEnabled ? readyForGrade : flipped) && (
          <div className="flex flex-col items-center gap-3 w-full max-w-sm">
            {audioEnabled && listeningForGrade && (
              <div className={`flex items-center gap-1.5 text-xs ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                listening…
              </div>
            )}
            {mode === 'verse' ? (
              <div className="grid grid-cols-2 w-full gap-3">
                <button onClick={() => handleGrade(1)} className={`rounded-xl font-medium transition-colors py-4 text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30`}>Wrong</button>
                <button onClick={() => handleGrade(5)} className={`rounded-xl font-medium transition-colors py-4 text-sm bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30`}>Right</button>
              </div>
            ) : (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
