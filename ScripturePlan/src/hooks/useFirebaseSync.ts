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
  const hasPulled = useRef(false);
  const readyToPush = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pull from Firestore on sign-in
  useEffect(() => {
    if (!user) {
      hasPulled.current = false;
      readyToPush.current = false;
      return;
    }
    if (hasPulled.current) return;

    hasPulled.current = true;
    const ref = doc(db, 'users', user.uid);
    getDoc(ref).then(snap => {
      if (snap.exists()) {
        const remote = snap.data() as SyncData;
        callbacks.setIcons(remote.icons);
        callbacks.setCustomTiles(remote.customTiles);
        callbacks.setDaysCompleted(remote.daysCompleted);
        callbacks.setLastResetDate(remote.lastResetDate);
      }
      // Only allow pushing after pull is done and state has settled
      setTimeout(() => { readyToPush.current = true; }, 500);
    }).catch((err) => {
      console.error(err);
      readyToPush.current = true;
    });
  }, [user]);

  // Push to Firestore on data changes (debounced, only when online)
  useEffect(() => {
    if (!user || !readyToPush.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!navigator.onLine) return;
      const ref = doc(db, 'users', user.uid);
      setDoc(ref, data, { merge: true }).catch(console.error);
    }, 1000);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [user, data.icons, data.customTiles, data.daysCompleted, data.lastResetDate]);

  // Push when coming back online
  useEffect(() => {
    if (!user) return;
    const handleOnline = () => {
      if (!readyToPush.current) return;
      const ref = doc(db, 'users', user.uid);
      setDoc(ref, data, { merge: true }).catch(console.error);
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user, data]);
}
