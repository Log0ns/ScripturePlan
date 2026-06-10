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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pull from Firestore on sign-in
  useEffect(() => {
    if (!user) { hasPulled.current = false; return; }
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
    }).catch(console.error);
  }, [user]);

  // Push to Firestore on data changes (debounced)
  useEffect(() => {
    if (!user || !hasPulled.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const ref = doc(db, 'users', user.uid);
      setDoc(ref, data, { merge: true }).catch(console.error);
    }, 1000);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [user, data.icons, data.customTiles, data.daysCompleted, data.lastResetDate]);
}
