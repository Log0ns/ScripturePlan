import React, { useState } from 'react';
import { X } from 'lucide-react';
import { TimeOfDay, ThemeMemory } from '../types';
import { BIBLE_BOOKS } from '../constants';
import { reviewCard } from '../hooks/sm2';

type Card = { bookIndex: number; chapter: number; memory: ThemeMemory };

type Props = {
  cards: Card[];
  themes: Record<number, Record<number, string>>;
  timeOfDay: TimeOfDay;
  onUpdateMemory: (bookIndex: number, chapter: number, memory: ThemeMemory) => void;
  onClose: () => void;
};

const GRADES: { label: string; grade: 1 | 2 | 3 | 4 | 5; color: string }[] = [
  { label: 'Again', grade: 1, color: 'bg-red-500/20 text-red-400 hover:bg-red-500/30' },
  { label: 'Hard',  grade: 2, color: 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' },
  { label: 'Good',  grade: 3, color: 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' },
  { label: 'Easy',  grade: 5, color: 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30' },
];

export default function StudySession({ cards: initialCards, themes: initialThemes, timeOfDay, onUpdateMemory, onClose }: Props) {
  const [queue, setQueue] = useState<Card[]>(initialCards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  // Track which card ids have been passed on first attempt
  const [passedIds] = useState(() => new Set<string>());
  const [failedIds] = useState(() => new Set<string>());
  // cardId -> dueDate, updated on every grade so we always have the latest per card
  const [dueDateMap] = useState<Record<string, string>>(() => ({}));
  const [done, setDone] = useState(false);
  // Snapshot themes at session start so stale prop mid-session doesn't affect card display
  const [themes] = useState(initialThemes);

  const isNight = timeOfDay === 'night';
  const card = queue[index];

  // Guard against empty queue (shouldn't happen but prevents crash)
  if (!card && !done) return null;

  const handleGrade = (grade: 1 | 2 | 3 | 4 | 5) => {
    const cardId = `${card.bookIndex}-${card.chapter}`;
    const updated = reviewCard(card.memory, grade);
    onUpdateMemory(card.bookIndex, card.chapter, updated);

    const passed = grade >= 3;
    // Only record first-attempt outcome per unique card
    if (!passedIds.has(cardId) && !failedIds.has(cardId)) {
      if (passed) passedIds.add(cardId);
      else failedIds.add(cardId);
    }
    // Track latest due date per card id
    dueDateMap[cardId] = updated.dueDate;

    const next = !passed
      ? [...queue.slice(index + 1), { ...card, memory: updated }]
      : queue.slice(index + 1);

    if (next.length === 0) {
      setDone(true);
    } else {
      setQueue(next);
      setIndex(0);
      setFlipped(false);
    }
  };

  const panelClass = isNight
    ? 'bg-slate-900/95 text-slate-100'
    : 'bg-white/95 text-slate-800';

  const cardClass = isNight
    ? 'bg-slate-800 border border-slate-700'
    : 'bg-white border border-slate-200';

  if (done) {
    const total = initialCards.length;
    const correct = passedIds.size;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const dates = Object.values(dueDateMap);
    const nextDue = dates.length > 0 ? dates.reduce((a, b) => a < b ? a : b) : null;
    const nextDueLabel = nextDue
      ? new Date(nextDue.length === 10 ? nextDue + 'T00:00:00' : nextDue).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : null;

    return (
      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center px-6 ${panelClass}`}>
        <div className="text-4xl mb-4">✓</div>
        <div className={`text-lg font-semibold mb-4 ${isNight ? 'text-slate-100' : 'text-slate-800'}`}>
          Session complete
        </div>
        <div className={`w-full max-w-xs rounded-2xl p-5 space-y-3 ${isNight ? 'bg-slate-800' : 'bg-slate-100'}`}>
          <div className="flex justify-between text-sm">
            <span className={isNight ? 'text-slate-400' : 'text-slate-500'}>Cards reviewed</span>
            <span className={`font-semibold ${isNight ? 'text-slate-200' : 'text-slate-700'}`}>{total}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className={isNight ? 'text-slate-400' : 'text-slate-500'}>Correct</span>
            <span className={`font-semibold ${pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{pct}%</span>
          </div>
          {nextDueLabel && (
            <div className="flex justify-between text-sm">
              <span className={isNight ? 'text-slate-400' : 'text-slate-500'}>Next review</span>
              <span className={`font-semibold ${isNight ? 'text-slate-200' : 'text-slate-700'}`}>{nextDueLabel}</span>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className={`mt-8 px-6 py-2 rounded-xl text-sm font-medium ${isNight ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}`}
        >
          Done
        </button>
      </div>
    );
  }

  const bookName = BIBLE_BOOKS[card.bookIndex].name;
  const theme = themes[card.bookIndex]?.[card.chapter] ?? '';
  const remaining = queue.length - index;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col px-6 pt-12 pb-8 ${panelClass}`}>
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
          {card.memory.status === 'leeched' && (
            <div className="mt-2 text-xs text-red-400 font-medium">⚠ leech</div>
          )}

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
                className={`py-2 rounded-xl text-sm font-medium transition-colors ${color}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
