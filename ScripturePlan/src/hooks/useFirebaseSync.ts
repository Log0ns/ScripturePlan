import { useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { IconGroup, CustomTile, MemoryTile, Themes, CompletedChunks } from '../types';

type SyncData = {
  iconGroups: IconGroup[];
  activeGroupId: number;
  customTiles: CustomTile[];
  memoryTiles: MemoryTile[];
  themes: Themes;
  completedChunks: CompletedChunks;
  daysCompleted: number;
  lastResetDate: string;
};

type SyncCallbacks = {
  setIconGroups: (v: IconGroup[]) => void;
  setActiveGroupId: (v: number) => void;
  setCustomTiles: (v: CustomTile[]) => void;
  setMemoryTiles: (v: MemoryTile[]) => void;
  setThemes: (v: Themes) => void;
  setCompletedChunks: (v: CompletedChunks) => void;
  setDaysCompleted: (v: number) => void;
  setLastResetDate: (v: string) => void;
};

type RemoteDoc = SyncData & { lastModified: number };

export function useFirebaseSync(
  user: User | null,
  data: SyncData,
  callbacks: SyncCallbacks
) {
  const readyToPush = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;
  const lastPulledAt = useRef(
    (() => { try { return Number(localStorage.getItem('planny-lastSync')) || 0; } catch { return 0; } })()
  );

  const parseThemes = (raw: any): Themes => {
    if (!raw) return {};
    const result: Themes = {};
    for (const bk of Object.keys(raw)) {
      result[Number(bk)] = {};
      for (const ch of Object.keys(raw[bk])) {
        result[Number(bk)][Number(ch)] = raw[bk][ch];
      }
    }
    return result;
  };

  const persistSyncTime = (t: number) => {
    lastPulledAt.current = t;
    try { localStorage.setItem('planny-lastSync', String(t)); } catch {}
  };

  const uid = user?.uid ?? null;

  useEffect(() => {
    if (!uid) return;

    const pull = () => {
      readyToPush.current = false;
      const ref = doc(db, 'users', uid);
      getDoc(ref).then(snap => {
        if (snap.exists()) {
          const remote = snap.data() as RemoteDoc;
          const remoteTime = remote.lastModified ?? 0;
          if (remoteTime > lastPulledAt.current || lastPulledAt.current === 0) {
            persistSyncTime(remoteTime);
            const today = new Date().toDateString();
            const isNewDay = remote.lastResetDate && remote.lastResetDate !== today;
            const rawGroups = remote.iconGroups;
            const iconGroups: IconGroup[] = rawGroups && rawGroups.length > 0
              ? rawGroups
              : [{ id: 1, name: 'Group 1', icons: (remote as any).icons ?? [] }];
            if (isNewDay) {
              const readCount = iconGroups.flatMap(g => g.icons).filter(i => i.readToday).length;
              callbacks.setIconGroups(iconGroups.map(g => ({ ...g, icons: g.icons.map(i => ({ ...i, readToday: false, chaptersReadToday: 0 })) })));
              callbacks.setActiveGroupId(remote.activeGroupId ?? iconGroups[0]?.id ?? 1);
              callbacks.setCustomTiles(remote.customTiles.map(t => ({ ...t, activeToday: false })));
              callbacks.setMemoryTiles(remote.memoryTiles?.map(t => ({ ...t, readToday: false })) ?? []);
              callbacks.setThemes(parseThemes(remote.themes));
              callbacks.setCompletedChunks(remote.completedChunks ?? []);
              callbacks.setDaysCompleted(remote.daysCompleted + readCount);
              callbacks.setLastResetDate(today);
            } else {
              callbacks.setIconGroups(iconGroups);
              callbacks.setActiveGroupId(remote.activeGroupId ?? iconGroups[0]?.id ?? 1);
              callbacks.setCustomTiles(remote.customTiles);
              callbacks.setMemoryTiles(remote.memoryTiles ?? []);
              callbacks.setThemes(parseThemes(remote.themes));
              callbacks.setCompletedChunks(remote.completedChunks ?? []);
              callbacks.setDaysCompleted(remote.daysCompleted);
              callbacks.setLastResetDate(remote.lastResetDate);
            }
          } else {
            const today = new Date().toDateString();
            const localResetDate = dataRef.current.lastResetDate;
            if (localResetDate && localResetDate !== today) {
              const readCount = dataRef.current.iconGroups.flatMap(g => g.icons).filter(i => i.readToday).length;
              if (readCount > 0) callbacks.setDaysCompleted(dataRef.current.daysCompleted + readCount);
              callbacks.setIconGroups(dataRef.current.iconGroups.map(g => ({ ...g, icons: g.icons.map(i => ({ ...i, readToday: false, chaptersReadToday: 0 })) })));
              callbacks.setCustomTiles(dataRef.current.customTiles.map(t => ({ ...t, activeToday: false })));
              callbacks.setMemoryTiles(dataRef.current.memoryTiles.map(t => ({ ...t, readToday: false })));
              callbacks.setLastResetDate(today);
            }
          }
        }
        setTimeout(() => { readyToPush.current = true; }, 500);
      }).catch(err => {
        console.error(err);
        readyToPush.current = true;
      });
    };

    pull();
    window.addEventListener('focus', pull);
    return () => window.removeEventListener('focus', pull);
  }, [uid]);

  useEffect(() => {
    if (!uid || !readyToPush.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const now = Date.now();
      persistSyncTime(now);
      const ref = doc(db, 'users', uid);
      setDoc(ref, { ...dataRef.current, lastModified: now }, { merge: true }).catch(console.error);
      debounceRef.current = null;
    }, 1000);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [uid, data.iconGroups, data.activeGroupId, data.customTiles, data.memoryTiles, data.themes, data.completedChunks, data.daysCompleted, data.lastResetDate]);

  useEffect(() => {
    const flush = () => {
      if (!uid || !debounceRef.current) return;
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
      const now = Date.now();
      persistSyncTime(now);
      const ref = doc(db, 'users', uid);
      setDoc(ref, { ...dataRef.current, lastModified: now }, { merge: true }).catch(console.error);
    };
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, [uid]);
}
