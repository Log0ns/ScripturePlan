import { useState, useCallback } from 'react';
import type { ThemeMemory, ThemeMemoryStore } from '../types';
import type { StudySort } from '../types';
import { MATURE_INTERVAL } from './srsConstants';

const STORAGE_KEY = 'themeMemory';

function load(): ThemeMemoryStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function save(store: ThemeMemoryStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function defaultMemory(): ThemeMemory {
  return {
    interval: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
    repetitions: 0,
    lapses: 0,
    status: 'new',
  };
}

function isDue(dueDate: string): boolean {
  if (dueDate.length === 10) return dueDate <= new Date().toISOString().slice(0, 10);
  return dueDate <= new Date().toISOString();
}

export function nextDueLabel(memory: ThemeMemory | undefined): string | null {
  if (!memory || memory.status === 'new') return null;
  const due = memory.dueDate.length === 10
    ? new Date(memory.dueDate + 'T00:00:00')
    : new Date(memory.dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  if (diffMs <= 0) return 'due';
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.round(diffMs / 3600000);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.round(diffMs / 86400000);
  return `${diffDays}d`;
}

export function memorizationPercent(memory: ThemeMemory | undefined): number {
  if (!memory || memory.status === 'new') return 0;
  return Math.min(100, Math.max(0, Math.round((memory.interval / MATURE_INTERVAL) * 100)));
}

type StudyCard = { bookIndex: number; chapter: number; memory: ThemeMemory };

function shuffle<T>(arr: T[]): T[] {
  for (let k = arr.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [arr[k], arr[j]] = [arr[j], arr[k]];
  }
  return arr;
}

export function sortCards(cards: StudyCard[], sort: StudySort, initialSort = false): StudyCard[] {
  const due    = cards.filter(c => isDue(c.memory.dueDate));
  const notDue = cards.filter(c => !isDue(c.memory.dueDate) && c.memory.status !== 'new');
  const unseen = cards.filter(c => c.memory.status === 'new');

  if (sort === 'book-order') {
    due.sort((a, b) => a.bookIndex !== b.bookIndex ? a.bookIndex - b.bookIndex : a.chapter - b.chapter);
    notDue.sort((a, b) => a.bookIndex !== b.bookIndex ? a.bookIndex - b.bookIndex : a.chapter - b.chapter);
  } else {
    due.sort((a, b) => a.memory.dueDate < b.memory.dueDate ? -1 : 1);
    notDue.sort((a, b) => a.memory.dueDate < b.memory.dueDate ? -1 : 1);
  }
  shuffle(unseen);

  // Only shuffle buckets on initial sort — preserve order on re-sort after grading
  if (sort === 'random-books-random' && initialSort) {
    shuffle(due);
    shuffle(notDue);
  }

  return [...due, ...notDue, ...unseen];
}

export function useThemeMemory() {
  const [store, setStore] = useState<ThemeMemoryStore>(load);

  const getMemory = useCallback(
    (bookIndex: number, chapter: number): ThemeMemory | undefined =>
      store[bookIndex]?.[chapter],
    [store]
  );

  const updateMemory = useCallback(
    (bookIndex: number, chapter: number, memory: ThemeMemory) => {
      setStore(prev => {
        const next: ThemeMemoryStore = {
          ...prev,
          [bookIndex]: { ...prev[bookIndex], [chapter]: memory },
        };
        save(next);
        return next;
      });
    },
    []
  );

  const getDueCards = useCallback(
    (bookIndex?: number, themes?: Record<number, Record<number, string>>): Array<{ bookIndex: number; chapter: number; memory: ThemeMemory }> => {
      const freshStore: ThemeMemoryStore = load();

      const cards: Array<{ bookIndex: number; chapter: number; memory: ThemeMemory }> = [];
      const books = bookIndex !== undefined ? [bookIndex] : Object.keys(freshStore).map(Number);
      for (const b of books) {
        const chapters = freshStore[b];
        if (chapters) {
          for (const c of Object.keys(chapters).map(Number)) {
            cards.push({ bookIndex: b, chapter: c, memory: chapters[c] });
          }
        }
        if (themes?.[b]) {
          for (const c of Object.keys(themes[b]).map(Number)) {
            if (themes[b][c]?.trim() && !chapters?.[c]) {
              cards.push({ bookIndex: b, chapter: c, memory: defaultMemory() });
            }
          }
        }
      }
      // Return in neutral book/chapter order — caller applies sort via sortCards
      return cards.sort((a, b) => a.bookIndex !== b.bookIndex ? a.bookIndex - b.bookIndex : a.chapter - b.chapter);
    },
    []
  );

  const clearMemory = useCallback(() => {
    setStore({});
    save({});
  }, []);

  const resetMemory = useCallback((bookIndex: number, chapter: number) => {
    setStore(prev => {
      const next = { ...prev, [bookIndex]: { ...prev[bookIndex] } };
      delete next[bookIndex][chapter];
      if (Object.keys(next[bookIndex]).length === 0) delete next[bookIndex];
      save(next);
      return next;
    });
  }, []);

  const setThemeMemoryStore = useCallback((incoming: ThemeMemoryStore) => {
    setStore(incoming);
    save(incoming);
  }, []);

  return { getMemory, updateMemory, getDueCards, store, clearMemory, resetMemory, setThemeMemoryStore };
}

export { MATURE_INTERVAL };
export { isDue };
