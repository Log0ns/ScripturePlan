import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { TimeOfDay, ThemeMemory, StudySort } from '../types';
import { BIBLE_BOOKS } from '../constants';
import { reviewCard } from '../hooks/sm2';

type Card = { bookIndex: number; chapter: number; memory: ThemeMemory };

type Props = {
  cards: Card[];
  themes: Record<number, Record<number, string>>;
  timeOfDay: TimeOfDay;
  sort?: StudySort;
  onUpdateMemory: (bookIndex: number, chapter: number, memory: ThemeMemory) => void;
  onClose: () => void;
};

const GRADES: { label: string; grade: 1 | 2 | 3 | 4 | 5; color: string }[] = [
  { label: 'Again', grade: 1, color: 'bg-red-500/20 text-red-400 hover:bg-red-500/30' },
  { label: 'Hard',  grade: 2, color: 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' },
  { label: 'Good',  grade: 3, color: 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' },
  { label: 'Easy',  grade: 5, color: 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30' },
];

export default function StudySession({ cards: initialCards, themes: initialThemes, timeOfDay, sort = 'book-order', onUpdateMemory, onClose }: Props) {
  const [queue, setQueue] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [themes] = useState(initialThemes);
  const initialized = useRef(false);

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

  const isNight = timeOfDay === 'night';
  const nowDisplay = new Date().toISOString();
  const card = queue[0] && queue[0].memory.dueDate <= nowDisplay ? queue[0] : null;

  if (!card) return null;

  const handleGrade = (grade: 1 | 2 | 3 | 4 | 5) => {
    const updated = reviewCard(card.memory, grade);
    onUpdateMemory(card.bookIndex, card.chapter, updated);

    const passed = grade >= 3;

    const rest = queue.slice(1);
    const failedCard = passed ? null : { ...card, memory: updated };
    const next: Card[] = failedCard ? [...rest, failedCard] : rest;

    const now = new Date().toISOString();
    // For most-due-first: sort due cards by dueDate ascending.
    // For all other sorts: preserve existing queue order — only move newly-due cards to front.
    if (sort === 'most-due-first') {
      next.sort((a, b) => {
        const aFailed = a === failedCard;
        const bFailed = b === failedCard;
        if (aFailed) return 1;
        if (bFailed) return -1;
        const aDue = a.memory.dueDate <= now;
        const bDue = b.memory.dueDate <= now;
        if (aDue && !bDue) return -1;
        if (!aDue && bDue) return 1;
        return a.memory.dueDate < b.memory.dueDate ? -1 : a.memory.dueDate > b.memory.dueDate ? 1 : 0;
      });
    } else {
      // Stable: just sink the failed card to back, float any newly-due cards ahead of not-yet-due ones.
      // We do this without changing relative order among due cards or among not-due cards.
      const due = next.filter(c => c !== failedCard && c.memory.dueDate <= now);
      const notDue = next.filter(c => c !== failedCard && c.memory.dueDate > now);
      next.splice(0, next.length, ...due, ...notDue, ...(failedCard ? [failedCard] : []));
    }

    if (next.length === 0 || next.every(c => c.memory.dueDate > now && c !== failedCard)) {
      onClose();
    } else {
      setQueue(next);
      setFlipped(false);
    }
  };

  const panelClass = isNight
    ? 'bg-slate-900/95 text-slate-100'
    : 'bg-white/95 text-slate-800';


  const cardClass = isNight
    ? 'bg-slate-800 border border-slate-700'
    : 'bg-white border border-slate-200';


  const bookName = BIBLE_BOOKS[card.bookIndex].name;
  const theme = themes[card.bookIndex]?.[card.chapter] ?? '';
  const remaining = queue.filter(c => c.memory.dueDate <= nowDisplay).length;

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
          onClick={() => !flipped && setFlipped(true)}
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
          ) : (
            <div className={`mt-6 text-xs ${isNight ? 'text-slate-500' : 'text-slate-400'}`}>
              tap to reveal
            </div>
          )}
        </div>

        {/* Grade buttons — only shown after flip */}
        {flipped && (
          <div className="grid grid-cols-4 gap-2 w-full max-w-sm">
            {GRADES.map(({ label, grade, color }) => (
              <button
                key={label}
                onClick={() => handleGrade(grade)}
                className={`py-2 rounded-xl text-sm font-medium transition-colors flex flex-col items-center leading-tight ${color}`}
              >
                <span>{label}</span>
                <span className="text-xs opacity-60">{previewInterval(card.memory, grade)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
