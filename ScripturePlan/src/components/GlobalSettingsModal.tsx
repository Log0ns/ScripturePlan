import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useSwipeDismiss } from '../hooks/useSwipeDismiss';

type Props = {
  onApplyPlan: (plan: string) => void;
  onResetDayCounter: () => void;
  onClose: () => void;
};

export default function GlobalSettingsModal({ onApplyPlan, onResetDayCounter, onClose }: Props) {
  const [selectedPlan, setSelectedPlan] = useState('Default');
  const { offsetY, handlers } = useSwipeDismiss(onClose);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end z-50" onClick={onClose}>
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

        {/* Reading Plan */}
        <div className="mb-6">
          <label className="text-sm font-medium text-slate-600 mb-2 block">Reading Plan</label>
          <select
            className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-800"
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
          >
            <option value="Default">Default (OT + NT)</option>
            <option value="Chronological">Chronological</option>
            <option value="Parallel">Parallel OT/NT</option>
            <option value="Mcheyne">McHeyne (2 OT + 2 NT)</option>
            <option value="Custom">Horner System (10 lists)</option>
          </select>

          {selectedPlan === 'Custom' && (
            <div className="text-xs text-slate-500 mt-2 space-y-0.5 pl-1">
              <p>1. Matthew–John</p>
              <p>2. Genesis–Deuteronomy</p>
              <p>3. Romans–Colossians</p>
              <p>4. 1 Thess–Revelation</p>
              <p>5. Job–Song of Solomon</p>
              <p>6. Psalms</p>
              <p>7. Proverbs</p>
              <p>8. Joshua–Esther</p>
              <p>9. Isaiah–Malachi</p>
              <p>10. Acts</p>
            </div>
          )}

          <button
            className="mt-3 w-full p-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
            onClick={() => { onApplyPlan(selectedPlan); onClose(); }}
          >
            Apply Plan
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-200 my-6" />

        {/* Reset */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-600 block">Reset</label>
          <button
            onClick={onResetDayCounter}
            className="w-full p-3 bg-amber-50 text-amber-700 rounded-xl font-medium hover:bg-amber-100 transition-colors"
          >
            Reset Day Counter
          </button>
        </div>
      </div>
    </div>
  );
}
