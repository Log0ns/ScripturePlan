import React from 'react';
import { X } from 'lucide-react';
import type { TimeOfDay, StudySort } from '../types';

type Props = {
  scope: 'OT' | 'NT';
  timeOfDay: TimeOfDay;
  onSelect: (sort: StudySort) => void;
  onClose: () => void;
};

const OPTIONS: { sort: StudySort; label: string; desc: string }[] = [
  { sort: 'book-order',    label: 'Book Order',      desc: 'Genesis → Malachi / Matthew → Revelation' },
  { sort: 'random-books',  label: 'Random Books',    desc: 'Books shuffled, chapters in order within each book' },
  { sort: 'most-due-first', label: 'Most Due First', desc: 'Most overdue chapters first' },
];

export default function StudySortModal({ scope, timeOfDay, onSelect, onClose }: Props) {
  const isNight = timeOfDay === 'night';
  const panel = isNight ? 'bg-slate-900/95 text-slate-100' : 'bg-white/95 text-slate-800';
  const row   = isNight ? 'bg-slate-800 hover:bg-slate-700 border-slate-700' : 'bg-white hover:bg-slate-50 border-slate-200';

  return (
    <div className={`fixed inset-0 z-50 flex flex-col px-6 pb-8 ${panel}`} style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      <div className="flex items-center justify-between mb-6">
        <span className={`text-sm font-semibold ${isNight ? 'text-slate-200' : 'text-slate-700'}`}>
          Study {scope} — choose order
        </span>
        <button onClick={onClose}>
          <X className={`w-5 h-5 ${isNight ? 'text-slate-400' : 'text-slate-500'}`} />
        </button>
      </div>

      <div className="space-y-3">
        {OPTIONS.map(({ sort, label, desc }) => (
          <button
            key={sort}
            onClick={() => onSelect(sort)}
            className={`w-full text-left px-4 py-4 rounded-2xl border transition-colors ${row}`}
          >
            <div className={`text-sm font-semibold mb-0.5 ${isNight ? 'text-slate-100' : 'text-slate-800'}`}>{label}</div>
            <div className={`text-xs ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>{desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
