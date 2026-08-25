import { useRef, useState, useCallback } from 'react';

export function useSwipeDismiss(onDismiss: () => void, threshold = 100) {
  const startY = useRef(0);
  const [offsetY, setOffsetY] = useState(0);
  const dragging = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    dragging.current = true;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging.current) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) setOffsetY(delta);
  }, []);

  const onTouchEnd = useCallback(() => {
    dragging.current = false;
    if (offsetY > threshold) {
      onDismiss();
    }
    setOffsetY(0);
  }, [offsetY, threshold, onDismiss]);

  return { offsetY, handlers: { onTouchStart, onTouchMove, onTouchEnd } };
}
