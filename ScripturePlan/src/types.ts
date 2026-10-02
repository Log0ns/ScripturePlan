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
  chaptersPerDay: number;
  chaptersReadToday: number;
};

export type IconGroup = {
  id: number;
  name: string;
  icons: ScriptureIcon[];
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
  readToday: boolean;
};

// set of chunkIndexes that have reached 30 days, persisted independently of tiles
export type CompletedChunks = number[];

// themes[bookIndex][chapter] = theme string (max 300 chars)
export type Themes = Record<number, Record<number, string>>;

export type SRSStatus = 'new' | 'learning' | 'review' | 'mature' | 'leeched';

export type ThemeMemory = {
  interval: number;      // days until next review
  easeFactor: number;    // multiplier for interval growth (starts at 2.5)
  dueDate: string;       // ISO date string (YYYY-MM-DD) or ISO datetime for intra-day steps
  repetitions: number;   // consecutive correct reviews
  lapses: number;        // total times card has been failed
  status: SRSStatus;
};

// themeMemory[bookIndex][chapter] = ThemeMemory
export type ThemeMemoryStore = Record<number, Record<number, ThemeMemory>>;
