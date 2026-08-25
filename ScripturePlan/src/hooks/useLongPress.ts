import { useRef, useCallback, useState } from 'react';

type LongPressHandlers = {
  onTouchStart: () => void;
  onTouchMove: () => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
};

export function useLongPress(onTap: () => void, onLongPress: () => void, delay = 400): { handlers: LongPressHandlers; pressing: boolean } {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchMovedRef = useRef(false);
  const triggeredRef = useRef(false);
  const [pressing, setPressing] = useState(false);

  const cancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPressing(false);
  };

  const start = useCallback(() => {
    touchMovedRef.current = false;
    triggeredRef.current = false;
    setPressing(true);
    timerRef.current = setTimeout(() => {
      triggeredRef.current = true;
      setPressing(false);
      if (navigator.vibrate) navigator.vibrate(30);
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const handlers: LongPressHandlers = {
    onTouchStart: start,
    onTouchMove: () => { touchMovedRef.current = true; cancel(); },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      cancel();
      if (!touchMovedRef.current && !triggeredRef.current) onTap();
    },
    onMouseDown: (e: React.MouseEvent) => { if (e.button === 0) start(); },
    onMouseUp: (e: React.MouseEvent) => { if (e.button === 0) { cancel(); if (!triggeredRef.current) onTap(); } },
    onMouseLeave: cancel,
  };

  return { handlers, pressing };
}
