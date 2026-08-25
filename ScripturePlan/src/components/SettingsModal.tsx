import React from 'react';
import { X } from 'lucide-react';
import { ScriptureIcon } from '../types';
import { BIBLE_BOOKS } from '../constants';

type Props = {
  icon: ScriptureIcon;
  canDelete: boolean;
  onUpdate: (updates: Partial<ScriptureIcon>) => void;
  onDelete: () => void;
  onClose: () => void;
};

const selectClass = "w-full p-3 border border-slate-600 rounded-xl bg-slate-700 text-slate-100 focus:outline-none focus:border-amber-500";

export default function SettingsModal({ icon, canDelete, onUpdate, onDelete, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      <div className="bg-slate-800 w-full h-full overflow-y-auto animate-slide-up">
      <div className="max-w-md mx-auto p-6 pb-8">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-slate-100">Tile Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center mb-5">
          <input
            type="checkbox"
            id="readToday"
            className="mr-2 h-4 w-4 accent-amber-500"
            checked={icon.readToday || false}
            onChange={(e) => onUpdate({ readToday: e.target.checked })}
          />
          <label htmlFor="readToday" className="text-slate-300 text-sm">
            Marked as read today
          </label>
        </div>

        {/* Current Position */}
        <div className="mb-5">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">Current Position</label>
          <div className="space-y-2">
            <select
              value={icon.bookIndex}
              onChange={(e) => onUpdate({ bookIndex: parseInt(e.target.value), chapter: 1 })}
              className={selectClass}
            >
              {BIBLE_BOOKS.map((book, idx) => (
                <option key={idx} value={idx}>{book.name}</option>
              ))}
            </select>
            <select
              value={icon.chapter}
              onChange={(e) => onUpdate({ chapter: parseInt(e.target.value) })}
              className={selectClass}
            >
              {Array.from({ length: BIBLE_BOOKS[icon.bookIndex].chapters }, (_, i) => i + 1).map(ch => (
                <option key={ch} value={ch}>Chapter {ch}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Start Range */}
        <div className="mb-5">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">Start Range</label>
          <div className="space-y-2">
            <select
              value={icon.startBook}
              onChange={(e) => onUpdate({ startBook: parseInt(e.target.value), startChapter: 1 })}
              className={selectClass}
            >
              {BIBLE_BOOKS.map((book, idx) => (
                <option key={idx} value={idx}>{book.name}</option>
              ))}
            </select>
            <select
              value={icon.startChapter}
              onChange={(e) => onUpdate({ startChapter: parseInt(e.target.value) })}
              className={selectClass}
            >
              {Array.from({ length: BIBLE_BOOKS[icon.startBook].chapters }, (_, i) => i + 1).map(ch => (
                <option key={ch} value={ch}>Chapter {ch}</option>
              ))}
            </select>
          </div>
        </div>

        {/* End Range */}
        <div className="mb-6">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">End Range</label>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={icon.endBook !== null}
              onChange={(e) => {
                if (e.target.checked) {
                  onUpdate({ endBook: icon.startBook, endChapter: BIBLE_BOOKS[icon.startBook].chapters });
                } else {
                  onUpdate({ endBook: null, endChapter: null });
                }
              }}
              className="mr-2 accent-amber-500"
            />
            <span className="text-sm text-slate-300">Set end limit</span>
          </div>
          {icon.endBook !== null && (
            <div className="space-y-2">
              <select
                value={icon.endBook}
                onChange={(e) => onUpdate({ endBook: parseInt(e.target.value), endChapter: BIBLE_BOOKS[parseInt(e.target.value)].chapters })}
                className={selectClass}
              >
                {BIBLE_BOOKS.map((book, idx) => (
                  <option key={idx} value={idx}>{book.name}</option>
                ))}
              </select>
              <select
                value={icon.endChapter}
                onChange={(e) => onUpdate({ endChapter: parseInt(e.target.value) })}
                className={selectClass}
              >
                {Array.from({ length: BIBLE_BOOKS[icon.endBook].chapters }, (_, i) => i + 1).map(ch => (
                  <option key={ch} value={ch}>Chapter {ch}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {canDelete && (
          <button
            onClick={onDelete}
            className="w-full p-3 bg-red-900/40 text-red-400 rounded-xl font-medium hover:bg-red-900/60 transition-colors"
          >
            Delete Tile
          </button>
        )}
      </div>
      </div>
    </div>
  );
}
