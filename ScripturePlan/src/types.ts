export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export type BibleBook = {
  name: string;
  chapters: number;
  testament: 'OT' | 'NT';
};

export type ScriptureIcon = {
  id: number;
  bookIndex: number;
  chapter: number;
  startBook: number;
  startChapter: number;
  endBook: number | null;
  endChapter: number | null;
  readToday: boolean;
};

export type CustomTile = {
  id: number;
  items: string[];
  index: number;
  activeToday: boolean;
};

export type MemoryTile = {
  id: number;
  chunkIndex: number; // index into MEMORY_CHUNKS
  day: number;        // 0–30
};

// themes[bookIndex][chapter] = theme string (max 300 chars)
export type Themes = Record<number, Record<number, string>>;
