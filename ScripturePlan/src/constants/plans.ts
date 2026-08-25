import { ScriptureIcon } from '../types';

export const DEFAULT_ICONS: ScriptureIcon[] = [
  { id: 1, bookIndex: 0, chapter: 1, startBook: 0, startChapter: 1, endBook: 38, endChapter: 4, readToday: false },
  { id: 2, bookIndex: 39, chapter: 1, startBook: 39, startChapter: 1, endBook: 65, endChapter: 22, readToday: false },
];

export const READING_PLANS: Record<string, Omit<ScriptureIcon, 'readToday'>[]> = {
  Default: [
    { id: 1, bookIndex: 0, chapter: 1, startBook: 0, startChapter: 1, endBook: 38, endChapter: 4 },
    { id: 2, bookIndex: 39, chapter: 1, startBook: 39, startChapter: 1, endBook: 65, endChapter: 22 },
  ],
  Chronological: [
    { id: 1, bookIndex: 0, chapter: 1, startBook: 0, startChapter: 1, endBook: 65, endChapter: 22 },
  ],
  Parallel: [
    { id: 1, bookIndex: 0, chapter: 1, startBook: 0, startChapter: 1, endBook: 38, endChapter: 4 },
    { id: 2, bookIndex: 39, chapter: 1, startBook: 39, startChapter: 1, endBook: 65, endChapter: 22 },
  ],
  Mcheyne: [
    { id: 1, bookIndex: 0, chapter: 1, startBook: 0, startChapter: 1, endBook: 14, endChapter: 28 },
    { id: 2, bookIndex: 15, chapter: 1, startBook: 15, startChapter: 1, endBook: 38, endChapter: 4 },
    { id: 3, bookIndex: 39, chapter: 1, startBook: 39, startChapter: 1, endBook: 43, endChapter: 28 },
    { id: 4, bookIndex: 44, chapter: 1, startBook: 44, startChapter: 1, endBook: 65, endChapter: 22 },
  ],
  Custom: [
    { id: 1, bookIndex: 39, chapter: 1, startBook: 39, startChapter: 1, endBook: 42, endChapter: 21 },
    { id: 2, bookIndex: 0, chapter: 1, startBook: 0, startChapter: 1, endBook: 4, endChapter: 34 },
    { id: 3, bookIndex: 44, chapter: 1, startBook: 44, startChapter: 1, endBook: 50, endChapter: 4 },
    { id: 4, bookIndex: 51, chapter: 1, startBook: 51, startChapter: 1, endBook: 65, endChapter: 22 },
    { id: 5, bookIndex: 17, chapter: 1, startBook: 17, startChapter: 1, endBook: 21, endChapter: 8 },
    { id: 6, bookIndex: 18, chapter: 1, startBook: 18, startChapter: 1, endBook: 18, endChapter: 150 },
    { id: 7, bookIndex: 19, chapter: 1, startBook: 19, startChapter: 1, endBook: 19, endChapter: 31 },
    { id: 8, bookIndex: 5, chapter: 1, startBook: 5, startChapter: 1, endBook: 16, endChapter: 10 },
    { id: 9, bookIndex: 22, chapter: 1, startBook: 22, startChapter: 1, endBook: 38, endChapter: 4 },
    { id: 10, bookIndex: 43, chapter: 1, startBook: 43, startChapter: 1, endBook: 43, endChapter: 28 },
  ],
};
