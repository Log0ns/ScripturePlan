import { useRef, useCallback } from 'react';

type LongPressHandlers = {
  onTouchStart: () => void;
  onTouchMove: () => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onMouseDown: () => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
};

export function useLongPress(onTap: () => void, onLongPress: () => void, delay = 500): LongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchMovedRef = useRef(false);
  const triggeredRef = useRef(false);

  const cancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = useCallback(() => {
    touchMovedRef.current = false;
    triggeredRef.current = false;
    timerRef.current = setTimeout(() => {
      triggeredRef.current = true;
      if (navigator.vibrate) navigator.vibrate(30);
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  return {
    onTouchStart: start,
    onTouchMove: () => { touchMovedRef.current = true; cancel(); },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      cancel();
      if (!touchMovedRef.current && !triggeredRef.current) onTap();
    },
    onMouseDown: start,
    onMouseUp: () => { cancel(); if (!triggeredRef.current) onTap(); },
    onMouseLeave: cancel,
  };
}
