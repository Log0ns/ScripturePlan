import React, { useEffect, useState, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

type Verse = { verse: number; text: string };

type Props = {
  tileId: number;
  bookName: string;
  chapter: number;
  onComplete: () => void;
  onClose: () => void;
};

const SCROLL_KEY_PREFIX = 'planny-scroll-';

export default function ChapterReader({ tileId, bookName, chapter, onComplete, onClose }: Props) {
  const [verses, setVerses] = useState<Verse[] | null>(null);
  const [error, setError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollKey = `${SCROLL_KEY_PREFIX}${tileId}`;

  useEffect(() => {
    fetch('/bible.json')
      .then(r => r.json())
      .then(data => {
        const ch = data[bookName]?.[String(chapter)];
        if (ch) setVerses(ch);
        else setError(true);
      })
      .catch(() => setError(true));
  }, [bookName, chapter]);

  // Restore scroll position once verses load
  useEffect(() => {
    if (verses && scrollRef.current) {
      const saved = sessionStorage.getItem(scrollKey);
      if (saved) scrollRef.current.scrollTop = parseInt(saved);
    }
  }, [verses]);

  // Save scroll position on close
  const saveScroll = useCallback(() => {
    if (scrollRef.current) {
      sessionStorage.setItem(scrollKey, String(scrollRef.current.scrollTop));
    }
  }, [scrollKey]);

  const handleClose = () => {
    saveScroll();
    onClose();
  };

  const handleComplete = () => {
    sessionStorage.removeItem(scrollKey);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      <div className="bg-slate-800 w-full h-full flex flex-col animate-slide-up">
        <div className="max-w-md mx-auto w-full flex flex-col h-full">
          <div className="flex justify-between items-center p-6 pb-3">
            <h2 className="text-lg font-medium text-slate-100">
              {bookName} {chapter}
            </h2>
            <button onClick={handleClose} className="text-slate-400 hover:text-slate-200 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 pb-4">
            {error && <p className="text-slate-400">Chapter not found.</p>}
            {!verses && !error && <p className="text-slate-400">Loading...</p>}
            {verses && (
              <div className="space-y-3">
                {verses.map(v => (
                  <p key={v.verse} className="text-slate-200 text-sm leading-relaxed">
                    <span className="text-amber-500 font-semibold text-xs mr-1.5">{v.verse}</span>
                    {v.text}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 pt-3">
            <button
              onClick={handleComplete}
              className="w-full p-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-500 transition-colors"
            >
              Mark Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
