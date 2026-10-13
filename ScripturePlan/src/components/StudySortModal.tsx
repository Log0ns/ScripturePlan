import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { TimeOfDay, StudySort } from '../types';

type Props = {
  scope: 'OT' | 'NT';
  timeOfDay: TimeOfDay;
  onSelect: (sort: StudySort, includeNotDue: boolean, studiedOnly: boolean) => void;
  onClose: () => void;
};

const OPTIONS: { sort: StudySort; label: string }[] = [
  { sort: 'random-books-random',  label: 'Random Chapters' },
  { sort: 'random-books-ordered', label: 'Random Books'    },
  { sort: 'book-order',           label: 'Book Order'      },
];

export default function StudySortModal({ scope, timeOfDay, onSelect, onClose }: Props) {
  const [sort, setSort] = useState<StudySort>(() => {
    try { return (localStorage.getItem('study-sort') as StudySort) || 'random-books-random'; } catch { return 'random-books-random'; }
  });
  const [includeNotDue, setIncludeNotDue] = useState(() => {
    try { return localStorage.getItem('study-include-not-due') === 'true'; } catch { return false; }
  });
  const [studiedOnly, setStudiedOnly] = useState(() => {
    try { return localStorage.getItem('study-studied-only') !== 'false'; } catch { return true; }
  });

  const isNight = timeOfDay === 'night';
  const panel = isNight ? 'bg-slate-900/95 text-slate-100' : 'bg-white/95 text-slate-800';
  const row   = isNight ? 'bg-slate-800 hover:bg-slate-700 border-slate-700' : 'bg-white hover:bg-slate-50 border-slate-200';
  const selectClass = isNight
    ? 'w-full pl-4 pr-10 py-3 rounded-2xl border border-slate-700 bg-slate-800 text-slate-100 text-sm font-semibold focus:outline-none'
    : 'w-full pl-4 pr-10 py-3 rounded-2xl border border-slate-200 bg-white text-slate-800 text-sm font-semibold focus:outline-none';

  const toggle = (key: string, val: boolean, set: (v: boolean) => void) => {
    set(val);
    try { localStorage.setItem(key, String(val)); } catch {}
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col px-6 pb-8 ${panel}`} style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      <div className="flex items-center justify-between mb-6">
        <span className={`text-sm font-semibold ${isNight ? 'text-slate-200' : 'text-slate-700'}`}>
          Study {scope}
        </span>
        <button onClick={onClose}>
          <X className={`w-5 h-5 ${isNight ? 'text-slate-400' : 'text-slate-500'}`} />
        </button>
      </div>

      <div className="space-y-3">
        <select
          value={sort}
          onChange={e => { const v = e.target.value as StudySort; setSort(v); try { localStorage.setItem('study-sort', v); } catch {} }}
          className={selectClass}
        >
          {OPTIONS.map(o => <option key={o.sort} value={o.sort}>{o.label}</option>)}
        </select>

        <button
          onClick={() => toggle('study-studied-only', !studiedOnly, setStudiedOnly)}
          className={`w-full text-left flex items-center justify-between px-4 py-4 rounded-2xl border transition-colors ${row}`}
        >
          <div>
            <div className={`text-sm font-semibold mb-0.5 ${isNight ? 'text-slate-100' : 'text-slate-800'}`}>Previously studied only</div>
            <div className={`text-xs ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>Skip chapters not yet studied</div>
          </div>
          <div className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 ml-4 relative ${studiedOnly ? 'bg-emerald-500' : (isNight ? 'bg-slate-600' : 'bg-slate-300')}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${studiedOnly ? 'translate-x-5' : 'translate-x-1'}`} />
          </div>
        </button>

        <button
          onClick={() => toggle('study-include-not-due', !includeNotDue, setIncludeNotDue)}
          className={`w-full text-left flex items-center justify-between px-4 py-4 rounded-2xl border transition-colors ${row}`}
        >
          <div>
            <div className={`text-sm font-semibold mb-0.5 ${isNight ? 'text-slate-100' : 'text-slate-800'}`}>Include not-yet-due</div>
            <div className={`text-xs ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>Study ahead after due chapters are done</div>
          </div>
          <div className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 ml-4 relative ${includeNotDue ? 'bg-emerald-500' : (isNight ? 'bg-slate-600' : 'bg-slate-300')}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${includeNotDue ? 'translate-x-5' : 'translate-x-1'}`} />
          </div>
        </button>

        <button
          onClick={() => onSelect(sort, includeNotDue, studiedOnly)}
          className="w-full py-4 rounded-2xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-400 transition-colors"
        >
          Study
        </button>
      </div>
    </div>
  );
}
