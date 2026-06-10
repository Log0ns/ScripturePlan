import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CustomTile } from '../types';

type Props = {
  tile: CustomTile;
  onSave: (items: string[]) => void;
  onDelete: () => void;
  onClose: () => void;
};

export default function CustomTileSettings({ tile, onSave, onDelete, onClose }: Props) {
  const [input, setInput] = useState(tile.items.join('\n'));

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      <div
        className="bg-slate-800 w-full h-full p-6 pb-8 overflow-y-auto animate-slide-up"
      >

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-slate-100">Prayer Tile Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
          Items (one per line)
        </label>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={8}
          className="w-full p-3 border border-slate-600 rounded-xl bg-slate-700 text-slate-100 focus:outline-none focus:border-amber-500"
        />

        <button
          onClick={() => {
            const items = input.split('\n').map(s => s.trim()).filter(Boolean);
            onSave(items);
          }}
          className="mt-4 w-full p-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-500 transition-colors"
        >
          Save
        </button>

        <button
          onClick={onDelete}
          className="mt-3 w-full p-3 bg-red-900/40 text-red-400 rounded-xl font-medium hover:bg-red-900/60 transition-colors"
        >
          Delete Tile
        </button>
      </div>
    </div>
  );
}
