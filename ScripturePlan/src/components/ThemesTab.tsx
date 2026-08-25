import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, ArrowLeft, Mic, MicOff } from 'lucide-react';
import { TimeOfDay, Themes } from '../types';
import { BIBLE_BOOKS, getFilledStyle } from '../constants';

const MAX_CHARS = 300;

type Props = {
  themes: Themes;
  timeOfDay: TimeOfDay;
  onChange: (bookIndex: number, chapter: number, value: string) => void;
  initialView?: View;
};

type View =
  | { kind: 'list' }
  | { kind: 'chapters'; bookIndex: number }
  | { kind: 'editor'; bookIndex: number; chapter: number };

// SpeechRecognition browser compat
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const hasVTT = !!SpeechRecognition;

export default function ThemesTab({ themes, timeOfDay, onChange, initialView }: Props) {
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

  // VTT
  const toggleListening = () => {
    if (!hasVTT) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join('');
      handleDraftChange((draftRef.current + ' ' + transcript).trim().slice(0, MAX_CHARS));
    };
    rec.onend = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  };

  // Stop listening when leaving editor
  const goBack = () => {
    if (listening) { recognitionRef.current?.stop(); setListening(false); }
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
    return (
      <div>
        <button onClick={goBack} className={`flex items-center gap-1 mb-4 ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-medium">{book.name} {view.chapter}</span>
        </button>

        <div className={`text-sm font-medium mb-2 ${isNight ? 'text-slate-200' : 'text-slate-700'}`}>
          {book.name} — Chapter {view.chapter}
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
          {Array.from({ length: book.chapters }, (_, i) => i + 1).map(ch => (
              <button
                key={ch}
                onClick={() => setView({ kind: 'editor', bookIndex: view.bookIndex, chapter: ch })}
                className={`py-2 rounded-xl text-sm font-medium transition-colors
                  ${chapterFilled(view.bookIndex, ch)
                    ? `${filled.bg} ${filled.text}`
                    : isNight ? 'bg-slate-800/60 text-slate-400' : 'bg-white/60 text-slate-500'}
                `}
              >
                {ch}
              </button>
            ))}
        </div>
      </div>
    );
  }

  // --- Book list view ---
  const renderBooks = (books: typeof otBooks) => (
    <div className="space-y-2">
      {books.map(book => {
        const complete = bookComplete(book.i);
        const count = filledCount(book.i);
        return (
          <button
            key={book.i}
            onClick={() => setView({ kind: 'chapters', bookIndex: book.i })}
            className={`${rowBase} ${complete ? `${filled.bg}` : rowStyle}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${complete ? filled.dot : isNight ? 'bg-slate-600' : 'bg-slate-300'}`} />
              <span className={`text-sm font-medium ${complete ? filled.text : isNight ? 'text-slate-200' : 'text-slate-700'}`}>
                {book.name}
              </span>
            </div>
            <span className={`text-xs ${count > 0 ? filled.text : isNight ? 'text-slate-500' : 'text-slate-400'}`}>
              {count > 0 ? `${count}/${book.chapters}` : ''}
            </span>
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
        <button
          onClick={() => { const v = !otOpen; setOtOpen(v); try { localStorage.setItem('themes-ot-open', String(v)); } catch {} }}
          className={`flex items-center gap-2 mb-3 ${labelClass}`}
        >
          {otOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          Old Testament
        </button>
        {otOpen && renderBooks(otBooks)}
      </div>

      {/* NT section */}
      <div>
        <button
          onClick={() => { const v = !ntOpen; setNtOpen(v); try { localStorage.setItem('themes-nt-open', String(v)); } catch {} }}
          className={`flex items-center gap-2 mb-3 ${labelClass}`}
        >
          {ntOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          New Testament
        </button>
        {ntOpen && renderBooks(ntBooks)}
      </div>
    </div>
  );
}
