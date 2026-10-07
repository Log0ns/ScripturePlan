import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, ChevronLeft, ArrowLeft, Mic, MicOff, BookOpenCheck } from 'lucide-react';
import { TimeOfDay, Themes, ThemeMemoryStore } from '../types';
import { BIBLE_BOOKS, getFilledStyle } from '../constants';
import { memorizationPercent, isDue as isMemDue, nextDueLabel } from '../hooks/useThemeMemory';

const MAX_CHARS = 350;

type Props = {
  themes: Themes;
  timeOfDay: TimeOfDay;
  onChange: (bookIndex: number, chapter: number, value: string) => void;
  initialView?: View;
  memoryStore?: ThemeMemoryStore;
  onStudy?: (scope: number | 'OT' | 'NT') => void;
  onResetMemory?: (bookIndex: number, chapter: number) => void;
};

type View =
  | { kind: 'list' }
  | { kind: 'chapters'; bookIndex: number }
  | { kind: 'editor'; bookIndex: number; chapter: number };

// SpeechRecognition browser compat
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const hasVTT = !!SpeechRecognition;

// Mature glow — gold ring shown when a chapter/book reaches mature status
const MATURE_GLOW: Record<TimeOfDay, string> = {
  morning:   '0 0 0 2px rgba(251,191,36,0.9), 0 0 12px 3px rgba(251,191,36,0.45)',
  afternoon: '0 0 0 2px rgba(251,191,36,0.9), 0 0 12px 3px rgba(251,191,36,0.45)',
  evening:   '0 0 0 2px rgba(251,191,36,0.9), 0 0 12px 3px rgba(251,191,36,0.45)',
  night:     '0 0 0 2px rgba(251,191,36,1),   0 0 16px 4px rgba(251,191,36,0.6)',
};

// Base color shown on any tile with theme content (soft)
const BASE_COLORS: Record<TimeOfDay, string> = {
  morning:   'rgba(252,211,77,0.18)',
  afternoon: 'rgba(103,232,249,0.18)',
  evening:   'rgba(251,113,133,0.18)',
  night:     'rgba(251,191,36,0.12)',
};

// Stronger fill color representing SRS progress
const FILL_COLORS: Record<TimeOfDay, string> = {
  morning:   'rgba(252,211,77,0.65)',
  afternoon: 'rgba(103,232,249,0.65)',
  evening:   'rgba(251,113,133,0.65)',
  night:     'rgba(251,191,36,0.45)',
};

export default function ThemesTab({ themes, timeOfDay, onChange, initialView, memoryStore, onStudy, onResetMemory }: Props) {
  const [view, setView] = useState<View>(initialView ?? { kind: 'list' });
  const [otOpen, setOtOpen] = useState(() => {
    try { return localStorage.getItem('themes-ot-open') === 'true'; } catch { return false; }
  });
  const [ntOpen, setNtOpen] = useState(() => {
    try { return localStorage.getItem('themes-nt-open') === 'true'; } catch { return false; }
  });
  const [draft, setDraft] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const isNight = timeOfDay === 'night';
  const otBooks = BIBLE_BOOKS.map((b, i) => ({ ...b, i })).filter(b => b.testament === 'OT');
  const ntBooks = BIBLE_BOOKS.map((b, i) => ({ ...b, i })).filter(b => b.testament === 'NT');

  // Sync view when initialView changes (e.g. tapping a second reading tile)
  useEffect(() => {
    if (initialView) setView(initialView);
  }, [initialView]);

  // Load draft when entering editor
  useEffect(() => {
    if (view.kind === 'editor') {
      setDraft(themes[view.bookIndex]?.[view.chapter] ?? '');
    }
  }, [view]);

  // Save draft on every change
  const handleDraftChange = (val: string) => {
    if (val.length > MAX_CHARS) return;
    setDraft(val);
    if (view.kind === 'editor') onChange(view.bookIndex, view.chapter, val);
  };

  const draftRef = useRef(draft);
  draftRef.current = draft;
  const listeningRef = useRef(false);

  // VTT
  const startRecognition = () => {
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join('');
      handleDraftChange((draftRef.current + ' ' + transcript).trim().slice(0, MAX_CHARS));
    };
    rec.onend = () => {
      // Auto-restart if user hasn't manually stopped (browser kills on silence)
      if (listeningRef.current) {
        try { rec.start(); } catch {}
      } else {
        setListening(false);
      }
    };
    rec.start();
    recognitionRef.current = rec;
  };

  const toggleListening = () => {
    if (!hasVTT) return;
    if (listeningRef.current) {
      listeningRef.current = false;
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    listeningRef.current = true;
    setListening(true);
    startRecognition();
  };

  // Stop listening when leaving editor
  const goBack = () => {
    if (listeningRef.current) { listeningRef.current = false; recognitionRef.current?.stop(); setListening(false); }
    if (view.kind === 'editor') setView({ kind: 'chapters', bookIndex: view.bookIndex });
    else if (view.kind === 'chapters') setView({ kind: 'list' });
  };

  const bookComplete = (bookIndex: number) => {
    const book = BIBLE_BOOKS[bookIndex];
    for (let ch = 1; ch <= book.chapters; ch++) {
      if (!themes[bookIndex]?.[ch]) return false;
    }
    return true;
  };

  const chapterFilled = (bookIndex: number, chapter: number) =>
    !!(themes[bookIndex]?.[chapter]);

  const filledCount = (bookIndex: number) => {
    const book = BIBLE_BOOKS[bookIndex];
    let count = 0;
    for (let ch = 1; ch <= book.chapters; ch++) {
      if (themes[bookIndex]?.[ch]) count++;
    }
    return count;
  };

  const labelClass = `text-xs font-bold uppercase tracking-widest ${isNight ? 'text-slate-400' : 'text-slate-500'}`;
  const rowBase = `w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors`;
  const rowStyle = isNight ? 'bg-slate-800/60 hover:bg-slate-700/60' : 'bg-white/60 hover:bg-white/90';
  const filled = getFilledStyle(timeOfDay);

  // --- Editor view ---
  if (view.kind === 'editor') {
    const book = BIBLE_BOOKS[view.bookIndex];
    const isFirst = view.bookIndex === 0 && view.chapter === 1;
    const isLast = view.bookIndex === BIBLE_BOOKS.length - 1 && view.chapter === BIBLE_BOOKS[view.bookIndex].chapters;

    const goChapter = (delta: 1 | -1) => {
      let { bookIndex, chapter } = view;
      if (delta === 1) {
        if (chapter < BIBLE_BOOKS[bookIndex].chapters) chapter++;
        else { bookIndex++; chapter = 1; }
      } else {
        if (chapter > 1) chapter--;
        else { bookIndex--; chapter = BIBLE_BOOKS[bookIndex].chapters; }
      }
      setView({ kind: 'editor', bookIndex, chapter });
    };

    return (
      <div>
        <button onClick={goBack} className={`flex items-center gap-1 mb-4 ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-medium">{book.name} {view.chapter}</span>
        </button>

        <div className={`flex items-center justify-between mb-2`}>
          <div className={`text-sm font-medium ${isNight ? 'text-slate-200' : 'text-slate-700'}`}>
            {book.name} — Chapter {view.chapter}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => goChapter(-1)} disabled={isFirst} className={`p-1 rounded-lg transition-colors ${isFirst ? 'opacity-30' : isNight ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
              <ChevronLeft className={`w-4 h-4 ${isNight ? 'text-slate-400' : 'text-slate-500'}`} />
            </button>
            <button onClick={() => goChapter(1)} disabled={isLast} className={`p-1 rounded-lg transition-colors ${isLast ? 'opacity-30' : isNight ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
              <ChevronRight className={`w-4 h-4 ${isNight ? 'text-slate-400' : 'text-slate-500'}`} />
            </button>
          </div>
        </div>

        <div className="relative">
          <textarea
            className={`w-full rounded-xl p-3 text-sm resize-none focus:outline-none
              ${isNight
                ? 'bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500'
                : 'bg-white border border-slate-200 text-slate-800 placeholder-slate-400'}
            `}
            rows={10}
            placeholder="What is the main theme of this chapter?"
            value={draft}
            onChange={e => handleDraftChange(e.target.value)}
          />
          <div className={`text-xs mt-1 text-right ${draft.length >= MAX_CHARS ? 'text-red-400' : isNight ? 'text-slate-500' : 'text-slate-400'}`}>
            {draft.length} / {MAX_CHARS}
          </div>
        </div>

        {hasVTT && (
          <button
            onClick={toggleListening}
            className={`mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors
              ${listening
                ? 'bg-red-500/20 text-red-400'
                : isNight ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}
            `}
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {listening ? 'Stop recording' : 'Dictate'}
          </button>
        )}

        {onResetMemory && memoryStore?.[view.bookIndex]?.[view.chapter] && (
          <button
            onClick={() => onResetMemory(view.bookIndex, view.chapter)}
            className={`mt-2 text-xs px-3 py-1.5 rounded-lg transition-colors ${
              isNight ? 'text-slate-500 hover:text-red-400 hover:bg-slate-800' : 'text-slate-400 hover:text-red-500 hover:bg-slate-100'
            }`}
          >
            Reset memorization
          </button>
        )}
      </div>
    );
  }

  // --- Chapter list view ---
  if (view.kind === 'chapters') {
    const book = BIBLE_BOOKS[view.bookIndex];
    const chaptersFilled = filledCount(view.bookIndex);
    return (
      <div>
        <button onClick={goBack} className={`flex items-center gap-1 mb-4 ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-medium">Books</span>
        </button>

        <div className={`text-sm font-medium mb-1 ${isNight ? 'text-slate-200' : 'text-slate-700'}`}>{book.name}</div>
        <div className={`text-xs mb-4 ${isNight ? 'text-slate-500' : 'text-slate-400'}`}>
          {chaptersFilled} / {book.chapters} chapters
        </div>

        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: book.chapters }, (_, i) => i + 1).map(ch => {
            const isFilled = chapterFilled(view.bookIndex, ch);
            const mem = memoryStore?.[view.bookIndex]?.[ch];
            const pct = memorizationPercent(mem);
            const label = nextDueLabel(mem);
            const base = BASE_COLORS[timeOfDay];
            const fillColor = FILL_COLORS[timeOfDay];
            const isMature = mem?.status === 'mature';
            const isOverdue = label === 'due';
            const bgStyle = isFilled
              ? {
                  background: isOverdue
                    ? `linear-gradient(to top, ${fillColor} ${pct}%, rgba(239,68,68,0.18) ${pct}%)`
                    : `linear-gradient(to top, ${fillColor} ${pct}%, ${base} ${pct}%)`,
                  ...(isMature ? { boxShadow: MATURE_GLOW[timeOfDay] } : {}),
                  ...(isOverdue && !isMature ? { boxShadow: '0 0 0 2px rgba(239,68,68,0.6)' } : {}),
                }
              : undefined;
            const unfilled = isNight ? 'bg-slate-800/60 text-slate-400' : 'bg-white/60 text-slate-500';
            return (
              <button
                key={ch}
                onClick={() => setView({ kind: 'editor', bookIndex: view.bookIndex, chapter: ch })}
                style={bgStyle}
                className={`py-2 rounded-xl text-sm font-medium transition-colors flex flex-col items-center justify-center gap-0.5 ${isFilled ? filled.text : unfilled}`}
              >
                <span>{ch}</span>
                {label && <span className={`text-[10px] leading-none ${isOverdue ? 'text-red-400' : 'opacity-70'}`}>{label}</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const dueCount = (bookIndex: number): number => {
    const book = BIBLE_BOOKS[bookIndex];
    let count = 0;
    for (let ch = 1; ch <= book.chapters; ch++) {
      if (!themes[bookIndex]?.[ch]) continue;
      const mem = memoryStore?.[bookIndex]?.[ch];
      if (!mem || isMemDue(mem.dueDate)) count++;
    }
    return count;
  };

  const hasDue = (bookIndex: number): boolean => dueCount(bookIndex) > 0;

  const testamentDueCount = (testament: 'OT' | 'NT'): number =>
    BIBLE_BOOKS.reduce((sum, b, i) => b.testament === testament ? sum + dueCount(i) : sum, 0);

  const bookAllMature = (bookIndex: number): boolean => {
    const book = BIBLE_BOOKS[bookIndex];
    let hasAny = false;
    for (let ch = 1; ch <= book.chapters; ch++) {
      if (!themes[bookIndex]?.[ch]) continue;
      hasAny = true;
      if (memoryStore?.[bookIndex]?.[ch]?.status !== 'mature') return false;
    }
    return hasAny;
  };

  const bookMemoPct = (bookIndex: number): number => {
    const populated: number[] = [];
    for (let ch = 1; ch <= BIBLE_BOOKS[bookIndex].chapters; ch++) {
      if (themes[bookIndex]?.[ch]) populated.push(ch);
    }
    if (populated.length === 0) return 0;
    const sum = populated.reduce((acc, ch) => acc + memorizationPercent(memoryStore?.[bookIndex]?.[ch]), 0);
    return Math.round(sum / populated.length);
  };

  // --- Book list view ---
  const renderBooks = (books: typeof otBooks) => (
    <div className="space-y-2">
      {books.map(book => {
        const complete = bookComplete(book.i);
        const count = filledCount(book.i);
        const pct = bookMemoPct(book.i);
        const base = BASE_COLORS[timeOfDay];
        const fillColor = FILL_COLORS[timeOfDay];
        const allMature = bookAllMature(book.i);
        const bgStyle = count > 0
          ? {
              background: `linear-gradient(to top, ${fillColor} ${pct}%, ${base} ${pct}%)`,
              ...(allMature ? { boxShadow: MATURE_GLOW[timeOfDay] } : {}),
            }
          : undefined;
        return (
          <button
            key={book.i}
            onClick={() => setView({ kind: 'chapters', bookIndex: book.i })}
            style={bgStyle}
            className={`${rowBase} ${count > 0 ? (isNight ? 'bg-slate-800/60' : 'bg-white/60') : rowStyle}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${complete ? filled.dot : isNight ? 'bg-slate-600' : 'bg-slate-300'}`} />
              <span className={`text-sm font-medium ${complete ? filled.text : isNight ? 'text-slate-200' : 'text-slate-700'}`}>
                {book.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${count > 0 ? filled.text : isNight ? 'text-slate-500' : 'text-slate-400'}`}>
                {count > 0 ? `${count}/${book.chapters}` : ''}
              </span>
              {count > 0 && hasDue(book.i) && onStudy && (
                <button
                  onClick={e => { e.stopPropagation(); onStudy(book.i); }}
                  className={`flex items-center gap-1 p-1 rounded-lg transition-colors ${isNight ? 'hover:bg-slate-700 text-amber-400' : 'hover:bg-slate-100 text-amber-600'}`}
                >
                  <span className={`text-xs font-bold tabular-nums`}>{dueCount(book.i)}</span>
                  <BookOpenCheck className="w-4 h-4" />
                </button>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );

  const totalChapters = BIBLE_BOOKS.reduce((sum, b) => sum + b.chapters, 0);
  const totalFilled = BIBLE_BOOKS.reduce((sum, b, i) => sum + filledCount(i), 0);

  return (
    <div className="space-y-4">
      {/* Progress summary */}
      <div className={`text-xs mb-2 ${isNight ? 'text-slate-500' : 'text-slate-400'}`}>
        {totalFilled} / {totalChapters} chapters
      </div>

      {/* OT section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => { const v = !otOpen; setOtOpen(v); try { localStorage.setItem('themes-ot-open', String(v)); } catch {} }}
            className={`flex items-center gap-2 ${labelClass}`}
          >
            {otOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Old Testament
          </button>
          {onStudy && testamentDueCount('OT') > 0 && (
            <button
              onClick={() => onStudy('OT')}
              className={`flex items-center gap-1 p-1 rounded-lg transition-colors ${isNight ? 'hover:bg-slate-700 text-amber-400' : 'hover:bg-slate-100 text-amber-600'}`}
            >
              <span className="text-xs font-bold tabular-nums">{testamentDueCount('OT')}</span>
              <BookOpenCheck className="w-4 h-4" />
            </button>
          )}
        </div>
        {otOpen && renderBooks(otBooks)}
      </div>

      {/* NT section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => { const v = !ntOpen; setNtOpen(v); try { localStorage.setItem('themes-nt-open', String(v)); } catch {} }}
            className={`flex items-center gap-2 ${labelClass}`}
          >
            {ntOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            New Testament
          </button>
          {onStudy && testamentDueCount('NT') > 0 && (
            <button
              onClick={() => onStudy('NT')}
              className={`flex items-center gap-1 p-1 rounded-lg transition-colors ${isNight ? 'hover:bg-slate-700 text-amber-400' : 'hover:bg-slate-100 text-amber-600'}`}
            >
              <span className="text-xs font-bold tabular-nums">{testamentDueCount('NT')}</span>
              <BookOpenCheck className="w-4 h-4" />
            </button>
          )}
        </div>
        {ntOpen && renderBooks(ntBooks)}
      </div>
    </div>
  );
}
