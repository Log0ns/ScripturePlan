import React, { useState } from 'react';
import { X, RotateCcw, Trash2, ChevronRight } from 'lucide-react';
import { MemoryTile } from '../types';
import { MEMORY_CHUNKS } from '../constants';

type Props = {
  tile: MemoryTile;
  allTiles: MemoryTile[];
  onUpdate: (updates: Partial<MemoryTile>) => void;
  onDelete: () => void;
  onClose: () => void;
};

export default function MemoryTileModal({ tile, allTiles, onUpdate, onDelete, onClose }: Props) {
  const [picking, setPicking] = useState(false);

  const chunk = MEMORY_CHUNKS[tile.chunkIndex] ?? MEMORY_CHUNKS[0];
  const completed = tile.day >= 30;

  if (picking) {
    return (
      <div className="fixed inset-0 z-50 animate-fade-in">
        <div className="bg-slate-800 w-full h-full overflow-y-auto animate-slide-up">
          <div className="max-w-md mx-auto p-6 pb-8">

            <div className="flex justify-between items-center mb-6">
              <button onClick={() => setPicking(false)} className="text-slate-400 hover:text-slate-200 p-1">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-medium text-slate-100">Choose Chunk</h2>
              <div className="w-7" />
            </div>

            <div className="space-y-2">
              {MEMORY_CHUNKS.map((c, idx) => {
                const existing = allTiles.find(t => t.chunkIndex === idx && t.id !== tile.id);
                const isCurrent = idx === tile.chunkIndex;
                const existingDay = existing?.day ?? 0;
                const existingDone = existingDay >= 30;
                return (
                  <button
                    key={idx}
                    onClick={() => { onUpdate({ chunkIndex: idx, day: 0, readToday: false }); setPicking(false); }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors
                      ${isCurrent ? 'bg-amber-600/30 text-amber-300' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}`}
                  >
                    <span className="text-sm font-medium">{c.label}</span>
                    <span className={`text-xs ${existingDone ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {existing ? (existingDone ? '✓ done' : `day ${existingDay}`) : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      <div className="bg-slate-800 w-full h-full overflow-y-auto animate-slide-up">
        <div className="max-w-md mx-auto p-6 pb-8">

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-slate-100">Memorization Tile</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current chunk summary */}
          <div className="bg-slate-700 rounded-xl p-4 mb-6">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Current Chunk</div>
            <div className="text-slate-100 font-medium">{chunk.label}</div>
            <div className={`text-sm mt-1 ${completed ? 'text-emerald-400' : 'text-slate-400'}`}>
              {completed ? '✓ Completed (30/30)' : `Day ${tile.day} of 30`}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="memReadToday"
                className="mr-2 h-4 w-4 accent-amber-500"
                checked={tile.readToday || false}
                onChange={(e) => onUpdate({ readToday: e.target.checked })}
              />
              <label htmlFor="memReadToday" className="text-slate-300 text-sm">
                Marked as read today
              </label>
            </div>
            <button
              onClick={() => onUpdate({ day: 0, readToday: false })}
              className="w-full flex items-center gap-3 p-3 bg-slate-700 text-slate-200 rounded-xl hover:bg-slate-600 transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium">Reset day counter</span>
            </button>

            <button
              onClick={() => setPicking(true)}
              className="w-full flex items-center justify-between p-3 bg-slate-700 text-slate-200 rounded-xl hover:bg-slate-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium">Change chunk</span>
              </div>
            </button>

            <button
              onClick={onDelete}
              className="w-full flex items-center gap-3 p-3 bg-red-900/40 text-red-400 rounded-xl hover:bg-red-900/60 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-medium">Remove tile</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
