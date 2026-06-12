import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { ScriptureIcon, CustomTile } from './types';
import { BIBLE_BOOKS, DEFAULT_ICONS, READING_PLANS, getTimeOfDay, getBackgroundGradient, getTileStyle, getTileTextColor, updateMetaThemeColor } from './constants';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useAuth } from './hooks/useAuth';
import { useFirebaseSync } from './hooks/useFirebaseSync';
import { ReadingTile, PrayerTile, SettingsModal, GlobalSettingsModal, CustomTileSettings, ChapterReader } from './components';

export default function Planny() {
  const [icons, setIcons] = useLocalStorage<ScriptureIcon[]>('planny-icons', DEFAULT_ICONS);
  const [customTiles, setCustomTiles] = useLocalStorage<CustomTile[]>('custom-tiles', []);
  const [daysCompleted, setDaysCompleted] = useLocalStorage<number>('daysCompleted', 0);
  const [lastResetDate, setLastResetDate] = useLocalStorage<string>('lastResetDate', '');
  const [openOnTap, setOpenOnTap] = useLocalStorage<boolean>('openOnTap', false);

  const { user, loading, signIn, logOut } = useAuth();

  const syncData = useMemo(() => ({ icons, customTiles, daysCompleted, lastResetDate }), [icons, customTiles, daysCompleted, lastResetDate]);
  useFirebaseSync(user, syncData, { setIcons, setCustomTiles, setDaysCompleted, setLastResetDate });

  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay());
  const [selectedIcon, setSelectedIcon] = useState<ScriptureIcon | null>(null);
  const [selectedCustomTile, setSelectedCustomTile] = useState<CustomTile | null>(null);
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [readingIcon, setReadingIcon] = useState<ScriptureIcon | null>(null);

  const isNight = timeOfDay === 'night';

  useEffect(() => {
    const today = new Date().toDateString();
    if (lastResetDate && lastResetDate !== today) {
      setIcons(prev => prev.map(i => ({ ...i, readToday: false })));
      setCustomTiles(prev => prev.map(t => ({ ...t, activeToday: false })));
    }
    setLastResetDate(today);
  }, []);

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

  // --- Scripture icon logic ---

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
    if (openOnTap) {
      setReadingIcon(icon);
    } else {
      const advanced = advanceChapter(icon);
      setIcons(prev => prev.map(i => i.id === icon.id ? { ...advanced, readToday: true } : i));
    }
  }, [openOnTap]);

  const handleLongPress = useCallback((icon: ScriptureIcon) => setSelectedIcon(icon), []);

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

  // --- Custom tile logic ---

  const handleCustomTap = useCallback((tile: CustomTile) => {
    if (tile.items.length === 0) return;
    setCustomTiles(prev => prev.map(t =>
      t.id === tile.id ? { ...t, index: (t.index + 1) % t.items.length, activeToday: true } : t
    ));
  }, []);

  const handleCustomLongPress = useCallback((tile: CustomTile) => setSelectedCustomTile(tile), []);

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

  const resetDay = useCallback(() => {
    setIcons(prev => {
      const allRead = prev.length > 0 && prev.every(i => i.readToday);
      if (allRead) setDaysCompleted(d => d + 1);
      return prev.map(i => ({ ...i, readToday: false }));
    });
    setCustomTiles(prev => prev.map(t => ({ ...t, activeToday: false })));
    setLastResetDate(new Date().toDateString());
  }, []);

  const addButtonStyle = `aspect-square rounded-2xl shadow-md flex items-center justify-center cursor-pointer
    active:scale-95 transition-all border-2 border-dashed
    ${isNight ? 'bg-slate-800/50 border-slate-600/50' : 'bg-white/50 border-slate-300/50'}`;

  return (
    <div className={`min-h-screen bg-gradient-to-b ${getBackgroundGradient(timeOfDay)} flex flex-col transition-colors duration-1000`}>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="px-6 pt-12 pb-8 max-w-md mx-auto">

          {/* Section: Reading */}
          <div className="mb-8">
            <h2 className={`text-xs font-bold uppercase tracking-widest mb-4 ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>
              Reading
            </h2>
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

          {/* Divider */}
          <div className={`h-px mb-8 ${isNight ? 'bg-slate-700' : 'bg-slate-300/50'}`} />

          {/* Section: Prayer */}
          <div>
            <h2 className={`text-xs font-bold uppercase tracking-widest mb-4 ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>
              Prayer
            </h2>
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
          </div>
        </div>
      </div>

      {/* Bottom Toolbar */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 ${isNight ? 'bg-slate-900/90 border-slate-700' : 'bg-white/90 border-slate-200'} border-t`}>
        <div className="max-w-md mx-auto flex items-center justify-between px-6 py-3">
          <button onClick={resetDay} className="flex items-center gap-2 active:scale-95 transition-transform">
            <span className="text-lg">☀️</span>
            <span className={`text-sm font-semibold tabular-nums ${isNight ? 'text-slate-300' : 'text-slate-700'}`}>
              {daysCompleted}
            </span>
          </button>

          <button
            onClick={() => setShowGlobalSettings(true)}
            className="active:scale-95 transition-transform"
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
          openOnTap={openOnTap}
          onToggleOpenOnTap={() => setOpenOnTap(v => !v)}
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
          onDelete={() => {
            setCustomTiles(customTiles.filter(t => t.id !== selectedCustomTile.id));
            setSelectedCustomTile(null);
          }}
          onClose={() => setSelectedCustomTile(null)}
        />
      )}
    </div>
  );
}
