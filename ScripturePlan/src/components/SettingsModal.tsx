import React from 'react';
import { X } from 'lucide-react';
import { ScriptureIcon } from '../types';
import { BIBLE_BOOKS } from '../constants';
import { useSwipeDismiss } from '../hooks/useSwipeDismiss';

type Props = {
  icon: ScriptureIcon;
  canDelete: boolean;
  onUpdate: (updates: Partial<ScriptureIcon>) => void;
  onDelete: () => void;
  onClose: () => void;
};

export default function SettingsModal({ icon, canDelete, onUpdate, onDelete, onClose }: Props) {
  const { offsetY, handlers } = useSwipeDismiss(onClose);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50" onClick={onClose}>
      <div
        className="bg-white w-full rounded-t-3xl p-6 pb-8 max-h-[80vh] overflow-y-auto transition-transform"
        style={{ transform: `translateY(${offsetY}px)` }}
        onClick={(e) => e.stopPropagation()}
        {...handlers}
      >
        {/* Swipe handle */}
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-slate-800">Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            id="readToday"
            className="mr-2 h-4 w-4 accent-yellow-500"
            checked={icon.readToday || false}
            onChange={(e) => onUpdate({ readToday: e.target.checked })}
          />
          <label htmlFor="readToday" className="text-gray-700 text-sm">
            Marked as read today
          </label>
        </div>

        {/* Current Position */}
        <div className="mb-6">
          <label className="text-sm font-medium text-slate-600 mb-3 block">Current Position</label>
          <div className="space-y-2">
            <select
              value={icon.bookIndex}
              onChange={(e) => onUpdate({ bookIndex: parseInt(e.target.value), chapter: 1 })}
              className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-800"
            >
              {BIBLE_BOOKS.map((book, idx) => (
                <option key={idx} value={idx}>{book.name}</option>
              ))}
            </select>
            <select
              value={icon.chapter}
              onChange={(e) => onUpdate({ chapter: parseInt(e.target.value) })}
              className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-800"
            >
              {Array.from({ length: BIBLE_BOOKS[icon.bookIndex].chapters }, (_, i) => i + 1).map(ch => (
                <option key={ch} value={ch}>Chapter {ch}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Start Range */}
        <div className="mb-6">
          <label className="text-sm font-medium text-slate-600 mb-3 block">Start Range</label>
          <div className="space-y-2">
            <select
              value={icon.startBook}
              onChange={(e) => onUpdate({ startBook: parseInt(e.target.value), startChapter: 1 })}
              className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-800"
            >
              {BIBLE_BOOKS.map((book, idx) => (
                <option key={idx} value={idx}>{book.name}</option>
              ))}
            </select>
            <select
              value={icon.startChapter}
              onChange={(e) => onUpdate({ startChapter: parseInt(e.target.value) })}
              className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-800"
            >
              {Array.from({ length: BIBLE_BOOKS[icon.startBook].chapters }, (_, i) => i + 1).map(ch => (
                <option key={ch} value={ch}>Chapter {ch}</option>
              ))}
            </select>
          </div>
        </div>

        {/* End Range */}
        <div className="mb-6">
          <label className="text-sm font-medium text-slate-600 mb-3 block">End Range (Optional)</label>
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
              className="mr-2"
            />
            <span className="text-sm text-slate-600">Set end limit</span>
          </div>
          {icon.endBook !== null && (
            <div className="space-y-2">
              <select
                value={icon.endBook}
                onChange={(e) => onUpdate({ endBook: parseInt(e.target.value), endChapter: BIBLE_BOOKS[parseInt(e.target.value)].chapters })}
                className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-800"
              >
                {BIBLE_BOOKS.map((book, idx) => (
                  <option key={idx} value={idx}>{book.name}</option>
                ))}
              </select>
              <select
                value={icon.endChapter}
                onChange={(e) => onUpdate({ endChapter: parseInt(e.target.value) })}
                className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-800"
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
            className="w-full p-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
          >
            Delete Icon
          </button>
        )}
      </div>
    </div>
  );
}
