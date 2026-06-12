import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

type Verse = { verse: number; text: string };

type Props = {
  bookName: string;
  chapter: number;
  onClose: () => void;
};

export default function ChapterReader({ bookName, chapter, onClose }: Props) {
  const [verses, setVerses] = useState<Verse[] | null>(null);
  const [error, setError] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      <div className="bg-slate-800 w-full h-full overflow-y-auto animate-slide-up">
        <div className="max-w-md mx-auto p-6 pb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-slate-100">
              {bookName} {chapter}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

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
      </div>
    </div>
  );
}
