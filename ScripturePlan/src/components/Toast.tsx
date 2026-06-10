import React, { useEffect } from 'react';

type Props = {
  message: string;
  visible: boolean;
  onHide: () => void;
};

export default function Toast({ message, visible, onHide }: Props) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onHide, 1500);
      return () => clearTimeout(timer);
    }
  }, [visible, onHide]);

  if (!visible) return null;

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[60] animate-fade-in">
      <div className="bg-black/70 text-white text-sm px-4 py-2 rounded-full shadow-lg backdrop-blur-sm">
        {message}
      </div>
    </div>
  );
}
