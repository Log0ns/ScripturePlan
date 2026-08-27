import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { IconGroup, TimeOfDay } from '../types';
import { getTileTextColor } from '../constants';
import { useLongPress } from '../hooks/useLongPress';

type Props = {
  groups: IconGroup[];
  activeGroupId: number;
  timeOfDay: TimeOfDay;
  onSwitch: (id: number) => void;
  onAdd: () => void;
  onDelete: (id: number) => void;
  onRename: (id: number, name: string) => void;
};

function GroupRow({ group, isActive, timeOfDay, onSwitch, onDelete, onRename, onEditingChange }: {
  group: IconGroup;
  isActive: boolean;
  timeOfDay: TimeOfDay;
  onSwitch: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
  onEditingChange: (editing: boolean) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(group.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const isNight = timeOfDay === 'night';
  const colors = getTileTextColor(timeOfDay);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commitRename = () => {
    const trimmed = draft.trim();
    if (trimmed) onRename(trimmed);
    else setDraft(group.name);
    setEditing(false);
    onEditingChange(false);
  };

  const { handlers } = useLongPress(
    onSwitch,
    () => setConfirmDelete(true)
  );

  if (confirmDelete) {
    return (
      <div className={`flex items-center justify-between px-4 py-3 rounded-xl ${isNight ? 'bg-red-900/30' : 'bg-red-50'}`}>
        <span className={`text-sm ${isNight ? 'text-red-300' : 'text-red-600'}`}>Delete "{group.name}"?</span>
        <div className="flex gap-2">
          <button
            onClick={() => setConfirmDelete(false)}
            className={`text-xs px-3 py-1 rounded-lg ${isNight ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}
          >
            Cancel
          </button>
          <button
            onClick={onDelete}
            className="text-xs px-3 py-1 rounded-lg bg-red-500 text-white"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors
        ${isActive
          ? (isNight ? 'bg-amber-400/20 border border-amber-400/40' : 'bg-amber-100 border border-amber-300')
          : (isNight ? 'bg-slate-800/60 cursor-pointer' : 'bg-white/60 cursor-pointer')
        }`}
      {...(!editing ? handlers : {})}
      onContextMenu={(e) => { e.preventDefault(); setConfirmDelete(true); }}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setDraft(group.name); setEditing(false); onEditingChange(false); } }}
          maxLength={20}
          className={`text-sm font-medium bg-transparent border-b outline-none w-32
            ${isActive ? (isNight ? 'text-amber-300 border-amber-400' : 'text-amber-800 border-amber-400') : `${colors.primary} ${isNight ? 'border-slate-500' : 'border-slate-400'}`}
          `}
        />
      ) : (
        <span
          className={`text-sm font-medium ${isActive ? (isNight ? 'text-amber-300' : 'text-amber-800') : colors.primary}`}
          onClick={(e) => { e.stopPropagation(); setEditing(true); setDraft(group.name); onEditingChange(true); }}
        >
          {group.name}
        </span>
      )}
      <span className={`text-xs ${isNight ? 'text-slate-500' : 'text-slate-400'}`}>
        {group.icons.length} tile{group.icons.length !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

export default function GroupSwitcher({ groups, activeGroupId, timeOfDay, onSwitch, onAdd, onDelete, onRename }: Props) {
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const isNight = timeOfDay === 'night';
  const activeGroup = groups.find(g => g.id === activeGroupId) ?? groups[0];

  return (
    <div className="relative mb-4">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors
          ${isNight ? 'bg-slate-800/60 text-slate-200' : 'bg-white/60 text-slate-700'}
        `}
      >
        <span>{activeGroup?.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { if (!isEditing) setOpen(false); }} />
          <div className={`absolute left-0 top-full mt-2 z-20 w-56 rounded-2xl shadow-xl p-2 space-y-1
            ${isNight ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}
          `}>
            {groups.map(g => (
              <GroupRow
                key={g.id}
                group={g}
                isActive={g.id === activeGroupId}
                timeOfDay={timeOfDay}
                onSwitch={() => { onSwitch(g.id); setOpen(false); }}
                onDelete={() => { onDelete(g.id); setOpen(false); }}
                onRename={(name) => onRename(g.id, name)}
                onEditingChange={setIsEditing}
              />
            ))}
            {groups.length < 3 && (
              <button
                onClick={() => { onAdd(); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl transition-colors
                  ${isNight ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-50'}
                `}
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Add group</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
