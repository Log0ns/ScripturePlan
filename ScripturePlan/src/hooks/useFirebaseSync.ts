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

export function useFirebaseSync(
  user: User | null,
  data: SyncData,
  callbacks: SyncCallbacks
) {
  const pulledUid = useRef<string | null>(null);
  const readyToPush = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const uid = user?.uid ?? null;

  // Pull from Firestore once per uid
  useEffect(() => {
    if (!uid || !user) {
      pulledUid.current = null;
      readyToPush.current = false;
      return;
    }
    if (pulledUid.current === uid) return;

    pulledUid.current = uid;
    const ref = doc(db, 'users', uid);
    getDoc(ref).then(snap => {
      if (snap.exists()) {
        const remote = snap.data() as SyncData;
        callbacks.setIcons(remote.icons);
        callbacks.setCustomTiles(remote.customTiles);
        callbacks.setDaysCompleted(remote.daysCompleted);
        callbacks.setLastResetDate(remote.lastResetDate);
      }
      setTimeout(() => { readyToPush.current = true; }, 500);
    }).catch((err) => {
      console.error(err);
      pulledUid.current = null;
    });
  }, [uid]);

  // Push to Firestore on data changes (debounced, only when online)
  useEffect(() => {
    if (!uid || !readyToPush.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!navigator.onLine) return;
      const ref = doc(db, 'users', uid);
      setDoc(ref, dataRef.current, { merge: true }).catch(console.error);
    }, 1000);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [uid, data.icons, data.customTiles, data.daysCompleted, data.lastResetDate]);

  // When coming back online: push if already pulled, otherwise retry pull
  useEffect(() => {
    if (!uid) return;
    const handleOnline = () => {
      if (pulledUid.current !== uid) {
        // Retry pull
        pulledUid.current = uid;
        const ref = doc(db, 'users', uid);
        getDoc(ref).then(snap => {
          if (snap.exists()) {
            const remote = snap.data() as SyncData;
            callbacks.setIcons(remote.icons);
            callbacks.setCustomTiles(remote.customTiles);
            callbacks.setDaysCompleted(remote.daysCompleted);
            callbacks.setLastResetDate(remote.lastResetDate);
          }
          setTimeout(() => { readyToPush.current = true; }, 500);
        }).catch(() => { pulledUid.current = null; });
        return;
      }
      if (!readyToPush.current) return;
      const ref = doc(db, 'users', uid);
      setDoc(ref, dataRef.current, { merge: true }).catch(console.error);
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [uid]);
}
