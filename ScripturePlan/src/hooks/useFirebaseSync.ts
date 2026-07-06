import { useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ScriptureIcon, CustomTile } from '../types';

type SyncData = {
  icons: ScriptureIcon[];
  customTiles: CustomTile[];
  daysCompleted: number;
  lastResetDate: string;
};

type SyncCallbacks = {
  setIcons: (v: ScriptureIcon[]) => void;
  setCustomTiles: (v: CustomTile[]) => void;
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
  const persistSyncTime = (t: number) => {
    lastPulledAt.current = t;
    try { localStorage.setItem('planny-lastSync', String(t)); } catch {}
  };

  const uid = user?.uid ?? null;

  // Pull on every mount/focus when signed in
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
            if (isNewDay) {
              const readCount = remote.icons.filter(i => i.readToday).length;
              callbacks.setIcons(remote.icons.map(i => ({ ...i, readToday: false })));
              callbacks.setCustomTiles(remote.customTiles.map(t => ({ ...t, activeToday: false })));
              callbacks.setDaysCompleted(remote.daysCompleted + readCount);
              callbacks.setLastResetDate(today);
            } else {
              callbacks.setIcons(remote.icons);
              callbacks.setCustomTiles(remote.customTiles);
              callbacks.setDaysCompleted(remote.daysCompleted);
              callbacks.setLastResetDate(remote.lastResetDate);
            }
          } else {
            // Pull skipped but still check for daily reset locally
            const today = new Date().toDateString();
            const localResetDate = dataRef.current.lastResetDate;
            if (localResetDate && localResetDate !== today) {
              const readCount = dataRef.current.icons.filter(i => i.readToday).length;
              if (readCount > 0) callbacks.setDaysCompleted(dataRef.current.daysCompleted + readCount);
              callbacks.setIcons(dataRef.current.icons.map(i => ({ ...i, readToday: false })));
              callbacks.setCustomTiles(dataRef.current.customTiles.map(t => ({ ...t, activeToday: false })));
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

    const onFocus = () => pull();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [uid]);

  // Push on changes
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
  }, [uid, data.icons, data.customTiles, data.daysCompleted, data.lastResetDate]);

  // Flush pending push on page unload
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
