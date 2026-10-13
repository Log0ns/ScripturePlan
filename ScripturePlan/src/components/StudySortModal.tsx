import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { TimeOfDay, StudySort } from '../types';

type Props = {
  scope: 'OT' | 'NT';
  timeOfDay: TimeOfDay;
  onSelect: (sort: StudySort, includeNotDue: boolean, studiedOnly: boolean) => void;
  onClose: () => void;
};

const OPTIONS: { sort: StudySort; label: string; desc: string }[] = [
  { sort: 'book-order',           label: 'Book Order',      desc: 'Genesis → Malachi / Matthew → Revelation' },
  { sort: 'random-books-ordered', label: 'Random Books',    desc: 'Books shuffled, chapters in order within each book' },
  { sort: 'random-books-random',  label: 'Random Chapters', desc: 'Random book, random due chapter each card' },
];

export default function StudySortModal({ scope, timeOfDay, onSelect, onClose }: Props) {
  const [includeNotDue, setIncludeNotDue] = useState(false);
  const [studiedOnly, setStudiedOnly] = useState(false);
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
            onClick={() => onSelect(sort, includeNotDue, studiedOnly)}
            className={`w-full text-left px-4 py-4 rounded-2xl border transition-colors ${row}`}
          >
            <div className={`text-sm font-semibold mb-0.5 ${isNight ? 'text-slate-100' : 'text-slate-800'}`}>{label}</div>
            <div className={`text-xs ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>{desc}</div>
          </button>
        ))}

        <button
          onClick={() => setIncludeNotDue(v => !v)}
          className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl border transition-colors ${row}`}
        >
          <div>
            <div className={`text-sm font-semibold mb-0.5 ${isNight ? 'text-slate-100' : 'text-slate-800'}`}>Include not-yet-due</div>
            <div className={`text-xs ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>Study ahead after due chapters are done</div>
          </div>
          <div className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 ml-4 relative ${
            includeNotDue ? 'bg-emerald-500' : (isNight ? 'bg-slate-600' : 'bg-slate-300')
          }`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              includeNotDue ? 'translate-x-5' : 'translate-x-1'
            }`} />
          </div>
        </button>

        <button
          onClick={() => setStudiedOnly(v => !v)}
          className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl border transition-colors ${row}`}
        >
          <div>
            <div className={`text-sm font-semibold mb-0.5 ${isNight ? 'text-slate-100' : 'text-slate-800'}`}>Previously studied only</div>
            <div className={`text-xs ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>Skip chapters not yet studied</div>
          </div>
          <div className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 ml-4 relative ${
            studiedOnly ? 'bg-emerald-500' : (isNight ? 'bg-slate-600' : 'bg-slate-300')
          }`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              studiedOnly ? 'translate-x-5' : 'translate-x-1'
            }`} />
          </div>
        </button>
      </div>
    </div>
  );
}
