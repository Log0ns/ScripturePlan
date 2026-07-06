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
  const lastPulledAt = useRef(0);

  const uid = user?.uid ?? null;

  // Pull on every mount/focus when signed in
  useEffect(() => {
    if (!uid) return;

    const pull = () => {
      readyToPush.current = false;
      const ref = doc(db, 'users', uid);
      console.log('[sync] pulling for uid:', uid);
      getDoc(ref).then(snap => {
        console.log('[sync] doc exists:', snap.exists());
        if (snap.exists()) {
          const remote = snap.data() as RemoteDoc;
          console.log('[sync] remote lastModified:', remote.lastModified, 'local lastPulledAt:', lastPulledAt.current);
          console.log('[sync] remote icons:', remote.icons?.length, 'remote daysCompleted:', remote.daysCompleted);
          const remoteTime = remote.lastModified ?? 0;
          if (remoteTime >= lastPulledAt.current) {
            lastPulledAt.current = remoteTime;
            callbacks.setIcons(remote.icons);
            callbacks.setCustomTiles(remote.customTiles);
            callbacks.setDaysCompleted(remote.daysCompleted);
            callbacks.setLastResetDate(remote.lastResetDate);
            console.log('[sync] applied remote data');
          } else {
            console.log('[sync] skipped pull, local is newer');
          }
        }
        setTimeout(() => { readyToPush.current = true; }, 500);
      }).catch(err => {
        console.error('[sync] pull error:', err);
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
      lastPulledAt.current = now;
      const ref = doc(db, 'users', uid);
      setDoc(ref, { ...dataRef.current, lastModified: now }, { merge: true }).catch(console.error);
    }, 1000);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [uid, data.icons, data.customTiles, data.daysCompleted, data.lastResetDate]);
}
