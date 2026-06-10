import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CustomTile } from '../types';
import { useSwipeDismiss } from '../hooks/useSwipeDismiss';

type Props = {
  tile: CustomTile;
  onSave: (items: string[]) => void;
  onDelete: () => void;
  onClose: () => void;
};

export default function CustomTileSettings({ tile, onSave, onDelete, onClose }: Props) {
  const [input, setInput] = useState(tile.items.join('\n'));
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
          <h2 className="text-xl font-medium text-slate-800">Custom Tile Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <label className="text-sm font-medium text-slate-600 mb-2 block">
          Tile Items (one per line)
        </label>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={8}
          className="w-full p-3 border border-slate-200 rounded-xl text-slate-800"
        />

        <button
          onClick={() => {
            const items = input.split('\n').map(s => s.trim()).filter(Boolean);
            onSave(items);
          }}
          className="mt-6 w-full p-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600"
        >
          Save
        </button>

        <button
          onClick={onDelete}
          className="mt-3 w-full p-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100"
        >
          Delete Tile
        </button>
      </div>
    </div>
  );
}
