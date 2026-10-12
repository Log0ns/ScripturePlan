import React, { useState } from 'react';
import { X } from 'lucide-react';
import { TimeOfDay } from '../types';

type Props = {
  timeOfDay: TimeOfDay;
  currentTileCount: number;
  maxTiles: number;
  onAdd: (items: string[], tilesToUse: number) => void;
  onClose: () => void;
};

export default function BulkAddPrayerModal({ timeOfDay, currentTileCount, maxTiles, onAdd, onClose }: Props) {
  const [input, setInput] = useState('');
  const [tilesToUse, setTilesToUse] = useState(Math.max(currentTileCount, 1));
  const isNight = timeOfDay === 'night';
  const panel = isNight ? 'bg-slate-900/95 text-slate-100' : 'bg-white/95 text-slate-800';
  const textarea = isNight
    ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500'
    : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400';

  const handleAdd = () => {
    const items = input.split('\n').map(s => s.trim()).filter(Boolean);
    if (items.length === 0) return;
    onAdd(items, tilesToUse);
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col px-6 pb-8 ${panel}`} style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      <div className="flex items-center justify-between mb-6">
        <span className={`text-sm font-semibold ${isNight ? 'text-slate-200' : 'text-slate-700'}`}>
          Add Prayers
        </span>
        <button onClick={onClose}>
          <X className={`w-5 h-5 ${isNight ? 'text-slate-400' : 'text-slate-500'}`} />
        </button>
      </div>

      <p className={`text-xs mb-3 ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>
        One prayer per line. Items will be spread evenly across tiles.
      </p>

      <textarea
        autoFocus
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={10}
        placeholder={'John Smith\nJane Doe\nChurch family'}
        className={`w-full rounded-xl p-3 text-sm resize-none focus:outline-none border ${textarea}`}
      />

      {maxTiles > currentTileCount && (
        <div className="mt-4">
          <div className={`text-xs mb-2 ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>
            Spread across how many tiles?
          </div>
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: maxTiles - currentTileCount + (currentTileCount > 0 ? 1 : 0) }, (_, i) => {
              const val = currentTileCount > 0 ? currentTileCount + i : i + 1;
              return (
                <button
                  key={val}
                  onClick={() => setTilesToUse(val)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    tilesToUse === val
                      ? 'bg-amber-500/30 text-amber-400'
                      : isNight ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={handleAdd}
        disabled={!input.trim()}
        className="mt-4 w-full py-3 rounded-xl text-sm font-semibold bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors disabled:opacity-40"
      >
        Add to Tiles
      </button>
    </div>
  );
}
