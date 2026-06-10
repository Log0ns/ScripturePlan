import { useState, useEffect, useCallback } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const signIn = useCallback(() => signInWithPopup(auth, googleProvider), []);
  const logOut = useCallback(() => signOut(auth), []);

  return { user, loading, signIn, logOut };
}
