import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Plus, WifiOff, BookOpen } from 'lucide-react';
import { ScriptureIcon, IconGroup, CustomTile, MemoryTile, Themes, CompletedChunks } from './types';
import { BIBLE_BOOKS, DEFAULT_ICONS, READING_PLANS, MEMORY_CHUNKS, getTimeOfDay, getBackgroundGradient, getHeaderStyle, updateMetaThemeColor } from './constants';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useAuth } from './hooks/useAuth';
import { useFirebaseSync } from './hooks/useFirebaseSync';
import { ReadingTile, PrayerTile, MemorizationTile, SettingsModal, GlobalSettingsModal, CustomTileSettings, ChapterReader, MemoryTileModal, ThemesTab, GroupSwitcher } from './components';

type Tab = 'reading' | 'memorization' | 'themes' | 'prayer';

export default function Planny() {
  const [iconGroups, setIconGroups] = useLocalStorage<IconGroup[]>('planny-icon-groups', () => {
    // Migrate legacy planny-icons to first group
    try {
      const legacy = localStorage.getItem('planny-icons');
      if (legacy) {
        const icons = JSON.parse(legacy) as ScriptureIcon[];
        localStorage.removeItem('planny-icons');
        return [{ id: 1, name: 'Group 1', icons }];
      }
    } catch {}
    return [{ id: 1, name: 'Group 1', icons: DEFAULT_ICONS }];
  });
  const [activeGroupId, setActiveGroupId] = useLocalStorage<number>('planny-active-group', 1);
  const [customTiles, setCustomTiles] = useLocalStorage<CustomTile[]>('custom-tiles', []);
  const [memoryTiles, setMemoryTiles] = useLocalStorage<MemoryTile[]>('memory-tiles', []);
  const [themes, setThemes] = useLocalStorage<Themes>('planny-themes', {}, v => {
    const raw = v as any;
    const result: Themes = {};
    for (const bk of Object.keys(raw)) {
      result[Number(bk)] = {};
      for (const ch of Object.keys(raw[bk])) {
        result[Number(bk)][Number(ch)] = raw[bk][ch];
      }
    }
    return result;
  });
  const [completedChunks, setCompletedChunks] = useLocalStorage<CompletedChunks>('planny-completed-chunks', []);
  const [daysCompleted, setDaysCompleted] = useLocalStorage<number>('daysCompleted', 0);
  const [lastResetDate, setLastResetDate] = useLocalStorage<string>('lastResetDate', '');
  const [openOnTap, setOpenOnTap] = useLocalStorage<boolean>('openOnTap', false);
  const [themeOnTap, setThemeOnTap] = useLocalStorage<boolean>('themeOnTap', false);

  const { user, loading, signIn, logOut } = useAuth();

  const syncData = useMemo(() => ({ iconGroups, activeGroupId, customTiles, memoryTiles, themes, completedChunks, daysCompleted, lastResetDate }), [iconGroups, activeGroupId, customTiles, memoryTiles, themes, completedChunks, daysCompleted, lastResetDate]);
  useFirebaseSync(user, syncData, { setIconGroups, setActiveGroupId, setCustomTiles, setMemoryTiles, setThemes, setCompletedChunks, setDaysCompleted, setLastResetDate });

  const activeGroup = iconGroups.find(g => g.id === activeGroupId) ?? iconGroups[0];
  const icons = activeGroup?.icons ?? [];
  const setIcons = (updater: ScriptureIcon[] | ((prev: ScriptureIcon[]) => ScriptureIcon[])) => {
    setIconGroups(prev => prev.map(g =>
      g.id === activeGroup.id
        ? { ...g, icons: typeof updater === 'function' ? updater(g.icons) : updater }
        : g
    ));
  };

  const [tab, setTab] = useState<Tab>('reading');
  const [themeTarget, setThemeTarget] = useState<{ bookIndex: number; chapter: number } | null>(null);
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay());
  const [selectedIcon, setSelectedIcon] = useState<ScriptureIcon | null>(null);
  const [selectedCustomTile, setSelectedCustomTile] = useState<CustomTile | null>(null);
  const [selectedMemoryTile, setSelectedMemoryTile] = useState<MemoryTile | null>(null);
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [readingIcon, setReadingIcon] = useState<ScriptureIcon | null>(null);
  const [online, setOnline] = useState(navigator.onLine);

  const isNight = timeOfDay === 'night';

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // Only auto-reset if not signed in (signed-in users get reset via sync)
  useEffect(() => {
    if (user) return;
    const today = new Date().toDateString();
    if (lastResetDate && lastResetDate !== today) {
      setIconGroups(prev => {
        const readCount = prev.flatMap(g => g.icons).filter(i => i.readToday).length;
        if (readCount > 0) setDaysCompleted(d => d + readCount);
        return prev.map(g => ({ ...g, icons: g.icons.map(i => ({ ...i, readToday: false, chaptersReadToday: 0 })) }));
      });
      setCustomTiles(prev => prev.map(t => ({ ...t, activeToday: false })));
      setMemoryTiles(prev => prev.map(t => ({ ...t, readToday: false })));
      setLastResetDate(today);
    }
  }, [user]);

  useEffect(() => {
    updateMetaThemeColor(timeOfDay);
    const interval = setInterval(() => {
      const current = getTimeOfDay();
      setTimeOfDay(prev => {
        if (prev !== current) updateMetaThemeColor(current);
        return prev === current ? prev : current;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const switchTab = (t: Tab, preserveThemeTarget = false) => {
    setTab(t);
    if (!preserveThemeTarget) setThemeTarget(null);
  };

  const advanceChapter = (icon: ScriptureIcon): ScriptureIcon => {
    let { bookIndex, chapter, startBook, startChapter, endBook, endChapter } = icon;
    if (chapter < BIBLE_BOOKS[bookIndex].chapters) {
      chapter++;
    } else {
      bookIndex++;
      chapter = 1;
    }
    if (endBook !== null && endChapter !== null) {
      if (bookIndex > endBook || (bookIndex === endBook && chapter > endChapter)) {
        bookIndex = startBook;
        chapter = startChapter;
      }
    } else if (bookIndex >= BIBLE_BOOKS.length) {
      bookIndex = startBook;
      chapter = startChapter;
    }
    return { ...icon, bookIndex, chapter };
  };

  const handleTap = useCallback((icon: ScriptureIcon) => {
    if (!online) return;
    if (openOnTap) {
      setReadingIcon(icon);
    } else {
      const cpd = icon.chaptersPerDay ?? 1;
      const crt = (icon.chaptersReadToday ?? 0) + 1;
      const done = crt >= cpd;
      const advanced = done ? advanceChapter(icon) : icon;
      setIcons(prev => prev.map(i =>
        i.id === icon.id
          ? { ...advanced, chaptersReadToday: done ? 0 : crt, readToday: done }
          : i
      ));
      if (done && themeOnTap) {
        setThemeTarget({ bookIndex: icon.bookIndex, chapter: icon.chapter });
        switchTab('themes', true);
      }
    }
  }, [openOnTap, themeOnTap, online]);

  const handleLongPress = useCallback((icon: ScriptureIcon) => {
    if (!online) return;
    setSelectedIcon(icon);
  }, [online]);

  const handleUpdateIcon = (updates: Partial<ScriptureIcon>) => {
    if (!selectedIcon) return;
    const updated = { ...selectedIcon, ...updates };
    if (updated.endBook !== null && updated.endChapter !== null) {
      if (updated.bookIndex > updated.endBook ||
          (updated.bookIndex === updated.endBook && updated.chapter > updated.endChapter) ||
          updated.bookIndex < updated.startBook ||
          (updated.bookIndex === updated.startBook && updated.chapter < updated.startChapter)) {
        updated.bookIndex = updated.startBook;
        updated.chapter = updated.startChapter;
      }
    }
    setIcons(icons.map(i => i.id === selectedIcon.id ? updated : i));
    setSelectedIcon(updated);
  };

  const addIcon = () => {
    if (icons.length >= 10) return;
    setIcons([...icons, {
      id: Math.max(0, ...icons.map(i => i.id)) + 1,
      bookIndex: 0, chapter: 1, startBook: 0, startChapter: 1,
      endBook: null, endChapter: null, readToday: false,
      chaptersPerDay: 1, chaptersReadToday: 0,
    }]);
  };

  const deleteIcon = () => {
    if (!selectedIcon) return;
    setIcons(icons.filter(i => i.id !== selectedIcon.id));
    setSelectedIcon(null);
  };

  // --- Memory tile logic ---

  const handleMemoryTap = useCallback((tile: MemoryTile) => {
    if (!online) return;
    const newDay = Math.min(tile.day + 1, 30);
    setMemoryTiles(prev => prev.map(t =>
      t.id === tile.id ? { ...t, day: newDay, readToday: true } : t
    ));
    if (newDay === 30) {
      setCompletedChunks(prev =>
        prev.includes(tile.chunkIndex) ? prev : [...prev, tile.chunkIndex]
      );
    }
  }, [online]);

  const handleMemoryLongPress = useCallback((tile: MemoryTile) => {
    if (!online) return;
    setSelectedMemoryTile(tile);
  }, [online]);

  const addMemoryTile = () => {
    if (memoryTiles.length >= 4) return;
    const usedChunks = new Set(memoryTiles.map(t => t.chunkIndex));
    const firstFree = MEMORY_CHUNKS.findIndex((_, i) => !usedChunks.has(i));
    setMemoryTiles(prev => [...prev, {
      id: Math.max(0, ...prev.map(t => t.id)) + 1,
      chunkIndex: firstFree === -1 ? 0 : firstFree,
      day: 0,
      readToday: false,
    }]);
  };

  // --- Themes logic ---

  const themeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingThemeRef = useRef<Themes | null>(null);
  const themesRef = useRef<Themes>(themes);
  themesRef.current = themes;

  const handleThemeChange = useCallback((bookIndex: number, chapter: number, value: string) => {
    const next = {
      ...themesRef.current,
      [bookIndex]: { ...themesRef.current[bookIndex], [chapter]: value },
    };
    pendingThemeRef.current = next;
    if (themeDebounceRef.current) clearTimeout(themeDebounceRef.current);
    themeDebounceRef.current = setTimeout(() => {
      setThemes(next);
      pendingThemeRef.current = null;
      themeDebounceRef.current = null;
    }, 500);
  }, []);

  // Flush pending theme write on page unload directly to localStorage
  useEffect(() => {
    const flush = () => {
      if (!pendingThemeRef.current) return;
      if (themeDebounceRef.current) { clearTimeout(themeDebounceRef.current); themeDebounceRef.current = null; }
      try { localStorage.setItem('planny-themes', JSON.stringify(pendingThemeRef.current)); } catch {}
      pendingThemeRef.current = null;
    };
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, []);

  // --- Custom tile logic ---

  const handleCustomTap = useCallback((tile: CustomTile) => {
    if (!online) return;
    if (tile.items.length === 0) return;
    setCustomTiles(prev => prev.map(t =>
      t.id === tile.id ? { ...t, index: (t.index + 1) % t.items.length, activeToday: true } : t
    ));
  }, [online]);

  const handleCustomLongPress = useCallback((tile: CustomTile) => {
    if (!online) return;
    setSelectedCustomTile(tile);
  }, [online]);

  const addCustomTile = () => {
    if (customTiles.length >= 10) return;
    setCustomTiles([...customTiles, {
      id: Math.max(0, ...customTiles.map(t => t.id)) + 1,
      items: ['New Item'], index: 0, activeToday: false,
    }]);
  };

  // --- Group logic ---

  const addGroup = () => {
    if (iconGroups.length >= 3) return;
    const newId = Math.max(0, ...iconGroups.map(g => g.id)) + 1;
    setIconGroups(prev => [...prev, { id: newId, name: `Group ${newId}`, icons: DEFAULT_ICONS }]);
    setActiveGroupId(newId);
  };

  const deleteGroup = (id: number) => {
    if (iconGroups.length <= 1) return;
    setIconGroups(prev => prev.filter(g => g.id !== id));
    if (activeGroupId === id) setActiveGroupId(iconGroups.find(g => g.id !== id)!.id);
  };

  const renameGroup = (id: number, name: string) => {
    setIconGroups(prev => prev.map(g => g.id === id ? { ...g, name } : g));
  };

  const memoryPoints = completedChunks.length;

  const themePoints = useMemo(() => BIBLE_BOOKS.reduce((count, book, bookIndex) => {
    const bookThemes = themes[bookIndex];
    if (!bookThemes) return count;
    for (let ch = 1; ch <= book.chapters; ch++) {
      if (!bookThemes[ch]?.trim()) return count;
    }
    return count + 1;
  }, 0), [themes]);

  // --- Plan / reset logic ---

  const applyPlan = (plan: string) => {
    const planIcons = READING_PLANS[plan] || READING_PLANS.Default;
    setIcons(planIcons.map(p => ({ ...p, readToday: false })) as ScriptureIcon[]);
  };


  const addButtonStyle = `aspect-square rounded-2xl shadow-md flex items-center justify-center cursor-pointer
    active:scale-95 transition-all border-2 border-dashed
    ${isNight ? 'bg-slate-800/50 border-slate-600/50' : 'bg-white/50 border-slate-300/50'}`;

  const tabLabelClass = (t: Tab) =>
    `text-xs font-semibold uppercase tracking-widest pb-1 transition-colors whitespace-nowrap ${
      tab === t
        ? (isNight ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-700 border-b-2 border-slate-700')
        : (isNight ? 'text-slate-500' : 'text-slate-400')
    }`;

  return (
    <div className={`h-screen bg-gradient-to-b ${getBackgroundGradient(timeOfDay)} flex flex-col transition-colors duration-1000`}>

      {/* Single scroll container */}
      <div className="flex-1 overflow-y-auto pb-24" style={{ scrollbarGutter: 'stable' }}>

        {/* Sticky header */}
        <div className={`sticky top-0 z-40 ${getHeaderStyle(timeOfDay)} shadow-sm transition-colors duration-1000`}>
          <div className="px-6 pt-4 pb-3 max-w-md mx-auto">
            {(!online || (!user && !loading)) && (
              <div className="flex justify-end items-center gap-2 mb-1">
                {!user && !loading && (
                  <span className={`text-xs ${isNight ? 'text-slate-500' : 'text-slate-400'}`}>not signed in</span>
                )}
                {!online && <WifiOff className={`w-4 h-4 ${isNight ? 'text-slate-500' : 'text-slate-400'}`} />}
              </div>
            )}
            <div className="flex justify-center gap-6 overflow-x-auto">
              <button className={tabLabelClass('reading')} onClick={() => switchTab('reading')}>Reading</button>
              <button className={tabLabelClass('memorization')} onClick={() => switchTab('memorization')}>Memorization</button>
              <button className={tabLabelClass('themes')} onClick={() => switchTab('themes')}>Themes</button>
              <button className={tabLabelClass('prayer')} onClick={() => switchTab('prayer')}>Prayer</button>
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div className="px-6 pt-6 pb-8 max-w-md mx-auto">

          {/* Tab: Reading */}
          {tab === 'reading' && (
            <div>
              <GroupSwitcher
                groups={iconGroups}
                activeGroupId={activeGroupId}
                timeOfDay={timeOfDay}
                onSwitch={setActiveGroupId}
                onAdd={addGroup}
                onDelete={deleteGroup}
                onRename={renameGroup}
              />
              <div className="grid grid-cols-2 gap-4">
                {icons.map(icon => (
                  <ReadingTile key={icon.id} icon={icon} timeOfDay={timeOfDay} openOnTap={openOnTap} onTap={handleTap} onLongPress={handleLongPress} />
                ))}
                {icons.length < 10 && (
                  <button onClick={addIcon} className={addButtonStyle}>
                    <Plus className={`w-8 h-8 ${isNight ? 'text-slate-500' : 'text-slate-400'}`} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tab: Memorization */}
          {tab === 'memorization' && (
            <div className="grid grid-cols-2 gap-4">
              {memoryTiles.map(tile => (
                <MemorizationTile key={tile.id} tile={tile} timeOfDay={timeOfDay} onTap={handleMemoryTap} onLongPress={handleMemoryLongPress} />
              ))}
              {memoryTiles.length < 4 && (
                <button onClick={addMemoryTile} className={addButtonStyle}>
                  <Plus className={`w-8 h-8 ${isNight ? 'text-slate-500' : 'text-slate-400'}`} />
                </button>
              )}
            </div>
          )}

          {/* Tab: Themes */}
          {tab === 'themes' && (
            <ThemesTab
              themes={themes}
              timeOfDay={timeOfDay}
              onChange={handleThemeChange}
              initialView={themeTarget ? { kind: 'editor', bookIndex: themeTarget.bookIndex, chapter: themeTarget.chapter } : undefined}
            />
          )}

          {/* Tab: Prayer */}
          {tab === 'prayer' && (
            <div className="grid grid-cols-2 gap-4">
              {customTiles.map(tile => (
                <PrayerTile key={tile.id} tile={tile} timeOfDay={timeOfDay} onTap={handleCustomTap} onLongPress={handleCustomLongPress} />
              ))}
              {customTiles.length < 10 && (
                <button onClick={addCustomTile} className={addButtonStyle}>
                  <Plus className={`w-8 h-8 ${isNight ? 'text-slate-500' : 'text-slate-400'}`} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Toolbar */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 ${isNight ? 'bg-slate-900/90 border-slate-700' : 'bg-white/90 border-slate-200'} border-t`}>
        <div className="max-w-md mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <BookOpen className={`w-4 h-4 ${isNight ? 'text-slate-400' : 'text-slate-500'}`} />
              <span className={`text-sm font-semibold tabular-nums ${isNight ? 'text-slate-300' : 'text-slate-700'}`}>{daysCompleted}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-bold uppercase tracking-wider ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>M</span>
              <span className={`text-sm font-semibold tabular-nums ${isNight ? 'text-slate-300' : 'text-slate-700'}`}>{memoryPoints}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-bold uppercase tracking-wider ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>T</span>
              <span className={`text-sm font-semibold tabular-nums ${isNight ? 'text-slate-300' : 'text-slate-700'}`}>{themePoints}</span>
            </div>
          </div>

          <button
            onClick={() => setShowGlobalSettings(true)}
            disabled={!online}
            className={`active:scale-95 transition-transform ${!online ? 'opacity-40' : ''}`}
          >
            <span className="text-lg">⚙️</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      {showGlobalSettings && (
        <GlobalSettingsModal
          user={user}
          onSignIn={signIn}
          onSignOut={logOut}
          onApplyPlan={applyPlan}
          onResetDayCounter={() => setDaysCompleted(0)}
          onClearMemoryProgress={() => setCompletedChunks([])}
          onClearThemes={() => {
            if (themeDebounceRef.current) { clearTimeout(themeDebounceRef.current); themeDebounceRef.current = null; }
            pendingThemeRef.current = null;
            setThemes({});
          }}
          openOnTap={openOnTap}
          onToggleOpenOnTap={() => setOpenOnTap(v => !v)}
          themeOnTap={themeOnTap}
          onToggleThemeOnTap={() => setThemeOnTap(v => !v)}
          onClose={() => setShowGlobalSettings(false)}
        />
      )}

      {readingIcon && (
        <ChapterReader
          tileId={readingIcon.id}
          bookName={BIBLE_BOOKS[readingIcon.bookIndex].name}
          chapter={readingIcon.chapter}
          onComplete={() => {
            const cpd = readingIcon.chaptersPerDay ?? 1;
            const crt = (readingIcon.chaptersReadToday ?? 0) + 1;
            const done = crt >= cpd;
            const advanced = done ? advanceChapter(readingIcon) : readingIcon;
            setIcons(prev => prev.map(i =>
              i.id === readingIcon.id
                ? { ...advanced, chaptersReadToday: done ? 0 : crt, readToday: done }
                : i
            ));
            setReadingIcon(null);
          }}
          onClose={() => setReadingIcon(null)}
        />
      )}

      {selectedIcon && (
        <SettingsModal
          icon={selectedIcon}
          canDelete={icons.length > 1}
          onUpdate={handleUpdateIcon}
          onDelete={deleteIcon}
          onClose={() => setSelectedIcon(null)}
        />
      )}

      {selectedCustomTile && (
        <CustomTileSettings
          tile={selectedCustomTile}
          onSave={(items) => {
            setCustomTiles(customTiles.map(t => t.id === selectedCustomTile.id ? { ...t, items, index: 0 } : t));
            setSelectedCustomTile(null);
          }}
          onUpdate={(updates) => {
            const updated = { ...selectedCustomTile, ...updates };
            setCustomTiles(customTiles.map(t => t.id === selectedCustomTile.id ? updated : t));
            setSelectedCustomTile(updated);
          }}
          onDelete={() => {
            setCustomTiles(customTiles.filter(t => t.id !== selectedCustomTile.id));
            setSelectedCustomTile(null);
          }}
          onClose={() => setSelectedCustomTile(null)}
        />
      )}

      {selectedMemoryTile && (
        <MemoryTileModal
          tile={selectedMemoryTile}
          allTiles={memoryTiles}
          completedChunks={completedChunks}
          onUpdate={(updates) => {
            const updated = { ...selectedMemoryTile, ...updates };
            setMemoryTiles(memoryTiles.map(t => t.id === selectedMemoryTile.id ? updated : t));
            setSelectedMemoryTile(updated);
          }}
          onDelete={() => {
            setMemoryTiles(memoryTiles.filter(t => t.id !== selectedMemoryTile.id));
            setSelectedMemoryTile(null);
          }}
          onClose={() => setSelectedMemoryTile(null)}
        />
      )}
    </div>
  );
}
