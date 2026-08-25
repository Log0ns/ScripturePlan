import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Plus, WifiOff, BookOpen } from 'lucide-react';
import { ScriptureIcon, CustomTile, MemoryTile, Themes, CompletedChunks } from './types';
import { BIBLE_BOOKS, DEFAULT_ICONS, READING_PLANS, MEMORY_CHUNKS, getTimeOfDay, getBackgroundGradient, getHeaderStyle, updateMetaThemeColor } from './constants';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useAuth } from './hooks/useAuth';
import { useFirebaseSync } from './hooks/useFirebaseSync';
import { ReadingTile, PrayerTile, MemorizationTile, SettingsModal, GlobalSettingsModal, CustomTileSettings, ChapterReader, MemoryTileModal, ThemesTab } from './components';

type Tab = 'reading' | 'memorization' | 'themes' | 'prayer';

export default function Planny() {
  const [icons, setIcons] = useLocalStorage<ScriptureIcon[]>('planny-icons', DEFAULT_ICONS);
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

  const syncData = useMemo(() => ({ icons, customTiles, memoryTiles, themes, completedChunks, daysCompleted, lastResetDate }), [icons, customTiles, memoryTiles, themes, completedChunks, daysCompleted, lastResetDate]);
  useFirebaseSync(user, syncData, { setIcons, setCustomTiles, setMemoryTiles, setThemes, setCompletedChunks, setDaysCompleted, setLastResetDate });

  const [tab, setTab] = useState<Tab>('reading');
  const [themeTarget, setThemeTarget] = useState<{ bookIndex: number; chapter: number } | null>(null);
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay());
  const [selectedIcon, setSelectedIcon] = useState<ScriptureIcon | null>(null);
  const [selectedCustomTile, setSelectedCustomTile] = useState<CustomTile | null>(null);
  const [selectedMemoryTile, setSelectedMemoryTile] = useState<MemoryTile | null>(null);
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [readingIcon, setReadingIcon] = useState<ScriptureIcon | null>(null);
  const [scrollVersion, setScrollVersion] = useState(0);
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
      setIcons(prev => {
        const readCount = prev.filter(i => i.readToday).length;
        if (readCount > 0) setDaysCompleted(d => d + readCount);
        return prev.map(i => ({ ...i, readToday: false }));
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

  const switchTab = (t: Tab) => {
    setTab(t);
    setThemeTarget(null);
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
      const advanced = advanceChapter(icon);
      setIcons(prev => prev.map(i => i.id === icon.id ? { ...advanced, readToday: true } : i));
      if (themeOnTap) {
        setThemeTarget({ bookIndex: icon.bookIndex, chapter: icon.chapter });
        switchTab('themes');
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
    <div className={`min-h-screen bg-gradient-to-b ${getBackgroundGradient(timeOfDay)} flex flex-col transition-colors duration-1000`}>

      {/* Sticky header */}
      <div className={`sticky top-0 z-40 ${getHeaderStyle(timeOfDay)} shadow-sm transition-colors duration-1000`}>
        <div className="px-6 pt-10 pb-3 max-w-md mx-auto">
        {(!online || (!user && !loading)) && (
          <div className="flex justify-end items-center gap-2 mb-2">
            {!user && !loading && (
              <span className={`text-xs ${isNight ? 'text-slate-500' : 'text-slate-400'}`}>not signed in</span>
            )}
            {!online && <WifiOff className={`w-4 h-4 ${isNight ? 'text-slate-500' : 'text-slate-400'}`} />}
          </div>
        )}
        <div className="flex gap-6 overflow-x-auto">
          <button className={tabLabelClass('reading')} onClick={() => switchTab('reading')}>Reading</button>
          <button className={tabLabelClass('memorization')} onClick={() => switchTab('memorization')}>Memorization</button>
          <button className={tabLabelClass('themes')} onClick={() => switchTab('themes')}>Themes</button>
          <button className={tabLabelClass('prayer')} onClick={() => switchTab('prayer')}>Prayer</button>
        </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-24" style={{ scrollbarGutter: 'stable' }}>
        <div className="px-6 pb-8 max-w-md mx-auto relative">

          {/* Tab: Reading */}
          {tab === 'reading' && (
            <div className="grid grid-cols-2 gap-4">
              {icons.map(icon => (
                <ReadingTile key={icon.id} icon={icon} timeOfDay={timeOfDay} openOnTap={openOnTap} scrollVersion={scrollVersion} onTap={handleTap} onLongPress={handleLongPress} />
              ))}
              {icons.length < 10 && (
                <button onClick={addIcon} className={addButtonStyle}>
                  <Plus className={`w-8 h-8 ${isNight ? 'text-slate-500' : 'text-slate-400'}`} />
                </button>
              )}
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
          <div className="flex items-center gap-2">
            <BookOpen className={`w-4 h-4 ${isNight ? 'text-slate-400' : 'text-slate-500'}`} />
            <span className={`text-sm font-semibold tabular-nums ${isNight ? 'text-slate-300' : 'text-slate-700'}`}>
              {daysCompleted}
            </span>
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
            const advanced = advanceChapter(readingIcon);
            setIcons(prev => prev.map(i => i.id === readingIcon.id ? { ...advanced, readToday: true } : i));
            setReadingIcon(null);
            setScrollVersion(v => v + 1);
          }}
          onClose={() => {
            setReadingIcon(null);
            setScrollVersion(v => v + 1);
          }}
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
