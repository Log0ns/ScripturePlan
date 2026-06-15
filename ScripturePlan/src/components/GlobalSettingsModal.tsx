import React, { useState } from 'react';
import { X } from 'lucide-react';
import { User } from 'firebase/auth';

type Props = {
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onApplyPlan: (plan: string) => void;
  onResetDayCounter: () => void;
  openOnTap: boolean;
  onToggleOpenOnTap: () => void;
  onClose: () => void;
};

const selectClass = "w-full p-3 border border-slate-600 rounded-xl bg-slate-700 text-slate-100 focus:outline-none focus:border-amber-500";

export default function GlobalSettingsModal({ user, onSignIn, onSignOut, onApplyPlan, onResetDayCounter, openOnTap, onToggleOpenOnTap, onClose }: Props) {
  const [selectedPlan, setSelectedPlan] = useState('Default');

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      <div className="bg-slate-800 w-full h-full overflow-y-auto animate-slide-up">
      <div className="max-w-md mx-auto p-6 pb-8">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-slate-100">Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reading Plan */}
        <div className="mb-6">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">Reading Plan</label>
          <select
            className={selectClass}
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
            <div className="text-xs text-slate-400 mt-2 space-y-0.5 pl-1">
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
            className="mt-3 w-full p-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-500 transition-colors"
            onClick={() => { onApplyPlan(selectedPlan); onClose(); }}
          >
            Apply Plan
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-700 my-6" />

        {/* Preferences */}
        <div className="mb-6">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 block">Preferences</label>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="openOnTap"
              className="mr-2 h-4 w-4 accent-amber-500"
              checked={openOnTap}
              onChange={onToggleOpenOnTap}
            />
            <label htmlFor="openOnTap" className="text-sm text-slate-300">Open Bible chapter from tiles (NET)</label>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-700 my-6" />

        {/* Account */}
        <div className="mb-6">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 block">Account</label>
          {user ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-300">Signed in as {user.displayName || user.email}</p>
              <button
                onClick={onSignOut}
                className="w-full p-3 bg-slate-700 text-slate-200 rounded-xl font-medium hover:bg-slate-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="w-full p-3 bg-white text-slate-800 rounded-xl font-medium hover:bg-slate-100 transition-colors"
            >
              Sign in with Google
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-700 my-6" />

        {/* Reset */}
        <div>
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 block">Reset</label>
          <button
            onClick={onResetDayCounter}
            className="w-full p-3 bg-slate-700 text-slate-200 rounded-xl font-medium hover:bg-slate-600 transition-colors"
          >
            Reset Day Counter
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
