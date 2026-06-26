import { useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, getDocFromServer } from 'firebase/firestore';
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

  // Pull from Firestore once per uid, only when online
  useEffect(() => {
    if (!uid) return;
    if (pulledUid.current === uid) return;
    if (!navigator.onLine) return;

    pulledUid.current = uid;
    readyToPush.current = false;
    const ref = doc(db, 'users', uid);
    getDocFromServer(ref).then(snap => {
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
      // Failed (offline or error) — allow retry later
      pulledUid.current = null;
      // Still enable push so offline changes can sync later
      readyToPush.current = true;
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

  // When coming back online: push local data up
  useEffect(() => {
    if (!uid) return;
    const handleOnline = () => {
      // Always push local state when reconnecting — local is source of truth
      if (readyToPush.current) {
        const ref = doc(db, 'users', uid);
        setDoc(ref, dataRef.current, { merge: true }).catch(console.error);
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [uid]);
}
