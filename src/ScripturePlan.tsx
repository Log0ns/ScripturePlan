import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, X } from 'lucide-react';

// Bible books data
const BIBLE_BOOKS = [
  // Old Testament
  { name: "Genesis", chapters: 50, testament: "OT" },
  { name: "Exodus", chapters: 40, testament: "OT" },
  { name: "Leviticus", chapters: 27, testament: "OT" },
  { name: "Numbers", chapters: 36, testament: "OT" },
  { name: "Deuteronomy", chapters: 34, testament: "OT" },
  { name: "Joshua", chapters: 24, testament: "OT" },
  { name: "Judges", chapters: 21, testament: "OT" },
  { name: "Ruth", chapters: 4, testament: "OT" },
  { name: "1 Samuel", chapters: 31, testament: "OT" },
  { name: "2 Samuel", chapters: 24, testament: "OT" },
  { name: "1 Kings", chapters: 22, testament: "OT" },
  { name: "2 Kings", chapters: 25, testament: "OT" },
  { name: "1 Chronicles", chapters: 29, testament: "OT" },
  { name: "2 Chronicles", chapters: 36, testament: "OT" },
  { name: "Ezra", chapters: 10, testament: "OT" },
  { name: "Nehemiah", chapters: 13, testament: "OT" },
  { name: "Esther", chapters: 10, testament: "OT" },
  { name: "Job", chapters: 42, testament: "OT" },
  { name: "Psalms", chapters: 150, testament: "OT" },
  { name: "Proverbs", chapters: 31, testament: "OT" },
  { name: "Ecclesiastes", chapters: 12, testament: "OT" },
  { name: "Song of Solomon", chapters: 8, testament: "OT" },
  { name: "Isaiah", chapters: 66, testament: "OT" },
  { name: "Jeremiah", chapters: 52, testament: "OT" },
  { name: "Lamentations", chapters: 5, testament: "OT" },
  { name: "Ezekiel", chapters: 48, testament: "OT" },
  { name: "Daniel", chapters: 12, testament: "OT" },
  { name: "Hosea", chapters: 14, testament: "OT" },
  { name: "Joel", chapters: 3, testament: "OT" },
  { name: "Amos", chapters: 9, testament: "OT" },
  { name: "Obadiah", chapters: 1, testament: "OT" },
  { name: "Jonah", chapters: 4, testament: "OT" },
  { name: "Micah", chapters: 7, testament: "OT" },
  { name: "Nahum", chapters: 3, testament: "OT" },
  { name: "Habakkuk", chapters: 3, testament: "OT" },
  { name: "Zephaniah", chapters: 3, testament: "OT" },
  { name: "Haggai", chapters: 2, testament: "OT" },
  { name: "Zechariah", chapters: 14, testament: "OT" },
  { name: "Malachi", chapters: 4, testament: "OT" },
  // New Testament
  { name: "Matthew", chapters: 28, testament: "NT" },
  { name: "Mark", chapters: 16, testament: "NT" },
  { name: "Luke", chapters: 24, testament: "NT" },
  { name: "John", chapters: 21, testament: "NT" },
  { name: "Acts", chapters: 28, testament: "NT" },
  { name: "Romans", chapters: 16, testament: "NT" },
  { name: "1 Corinthians", chapters: 16, testament: "NT" },
  { name: "2 Corinthians", chapters: 13, testament: "NT" },
  { name: "Galatians", chapters: 6, testament: "NT" },
  { name: "Ephesians", chapters: 6, testament: "NT" },
  { name: "Philippians", chapters: 4, testament: "NT" },
  { name: "Colossians", chapters: 4, testament: "NT" },
  { name: "1 Thessalonians", chapters: 5, testament: "NT" },
  { name: "2 Thessalonians", chapters: 3, testament: "NT" },
  { name: "1 Timothy", chapters: 6, testament: "NT" },
  { name: "2 Timothy", chapters: 4, testament: "NT" },
  { name: "Titus", chapters: 3, testament: "NT" },
  { name: "Philemon", chapters: 1, testament: "NT" },
  { name: "Hebrews", chapters: 13, testament: "NT" },
  { name: "James", chapters: 5, testament: "NT" },
  { name: "1 Peter", chapters: 5, testament: "NT" },
  { name: "2 Peter", chapters: 3, testament: "NT" },
  { name: "1 John", chapters: 5, testament: "NT" },
  { name: "2 John", chapters: 1, testament: "NT" },
  { name: "3 John", chapters: 1, testament: "NT" },
  { name: "Jude", chapters: 1, testament: "NT" },
  { name: "Revelation", chapters: 22, testament: "NT" }
];

const DEFAULT_ICONS = [
  { id: 1, bookIndex: 0, chapter: 1, startBook: 0, startChapter: 1, endBook: 38, endChapter: 4, readToday: false },
  { id: 2, bookIndex: 39, chapter: 1, startBook: 39, startChapter: 1, endBook: 65, endChapter: 22, readToday: false }
];

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 16) return 'afternoon';
  if (hour >= 16 && hour < 20) return 'evening';
  return 'night';
};

const getBackgroundGradient = (timeOfDay) => {
  const gradients = {
    morning: 'from-rose-200 via-amber-100 to-yellow-100',
    afternoon: 'from-cyan-200 via-teal-100 to-emerald-100',
    evening: 'from-orange-200 via-rose-200 to-purple-200',
    night: 'from-indigo-700 via-blue-600 to-blue-950'
  };
  return gradients[timeOfDay];
};

const getIconColor = (timeOfDay) => {
  const colors = {
    morning: 'bg-amber-50 bg-opacity-90',
    afternoon: 'bg-teal-50 bg-opacity-90',
    evening: 'bg-rose-50 bg-opacity-90',
    night: 'bg-blue-50 bg-opacity-90'
  };
  return colors[timeOfDay];
};

export default function ScriptureReader() {
  const [icons, setIcons] = useState([]);
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay());
  const [touchMoved, setTouchMoved] = useState(false);
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const [lastOpenedDate, setLastOpenedDate] = useState(() => localStorage.getItem('lastOpenedDate') || '');
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Default');
  const [showQuestions, setShowQuestions] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});

  type Question = {
    id: number;
    gradient: string;
    location: string;
    description: string;
    question: string;
    answer: string;
  };
  
  const questionList: Question[] = [
    {
      id: 1,
      gradient: "bg-gradient-to-br from-blue-700 via-indigo-500 to-purple-600",
      location: "Eden",
      description: "Where creation began — life and light.",
      question: "Who created the heavens and the earth?",
      answer: "god",
    },
    {
      id: 2,
      gradient: "bg-gradient-to-br from-amber-600 via-orange-500 to-red-700",
      location: "Ararat",
      description: "Where the ark came to rest.",
      question: "Who built the ark?",
      answer: "noah",
    },
    {
      id: 3,
      gradient: "bg-gradient-to-br from-sky-600 via-cyan-500 to-blue-700",
      location: "Red Sea",
      description: "Where God made a way through the waters.",
      question: "Who parted the Red Sea?",
      answer: "moses",
    },
    // add more as desired
  ];

  // Store reference to our scheduled midnight reset
  const midnightTimeoutRef = useRef<number | null>(null);
  
  // Helper: milliseconds until next midnight (local time)
  const msUntilNextMidnight = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime() - now.getTime();
  };
  
  // Reset logic encapsulated in one function
  const doDailyReset = useCallback(() => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem('lastResetDate');
  
    if (!stored || stored !== today) {
      setIcons(prev => {
        if (!prev || prev.length === 0) return prev;
        const resetIcons = prev.map(icon => ({ ...icon, readToday: false }));
        try {
          localStorage.setItem('scripture-icons', JSON.stringify(resetIcons));
          localStorage.setItem('lastResetDate', today);
        } catch (err) {
          console.error('Failed to persist reset state:', err);
        }
        setLastOpenedDate(today);
        console.log('Daily reset triggered at', new Date().toISOString());
        return resetIcons;
      });
    } else {
      setLastOpenedDate(stored);
    }
  }, []);
  
  // Schedule next midnight reset
  const scheduleMidnightReset = useCallback(() => {
    if (midnightTimeoutRef.current) {
      window.clearTimeout(midnightTimeoutRef.current);
      midnightTimeoutRef.current = null;
    }
  
    const ms = msUntilNextMidnight();
    midnightTimeoutRef.current = window.setTimeout(() => {
      doDailyReset();
      scheduleMidnightReset(); // schedule again for following midnight
    }, ms);
  }, [doDailyReset]);
  
  // Initial check + scheduling
  useEffect(() => {
    try {
      doDailyReset(); // runs immediately if needed
    } catch (err) {
      console.error('Error during daily reset check on mount:', err);
    }
  
    scheduleMidnightReset();
  
    return () => {
      if (midnightTimeoutRef.current) {
        window.clearTimeout(midnightTimeoutRef.current);
        midnightTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (icons.length > 0) {
      saveData();
    }
  }, [icons]);

  const loadData = () => {
    try {
      const data = localStorage.getItem('scripture-icons');
      if (data) {
        setIcons(JSON.parse(data));
      } else {
        setIcons(DEFAULT_ICONS);
      }
    } catch (error) {
      setIcons(DEFAULT_ICONS);
    }
  };

  function applyPlan(plan: string) {
    let newIcons = [];
  
    if (plan === 'Chronological') {
      newIcons = [
        { id: 1, bookIndex: 0, chapter: 1, startBook: 0, startChapter: 1, endBook: 65, endChapter: 22 }
      ];
    } else if (plan === 'Mcheyne') {
      newIcons = [
        { id: 1, bookIndex: 0, chapter: 1, startBook: 0, startChapter: 1, endBook: 14, endChapter: 28 },  // Genesis–2 Chronicles
        { id: 2, bookIndex: 15, chapter: 1, startBook: 15, startChapter: 1, endBook: 38, endChapter: 4 }, // Ezra–Malachi
        { id: 3, bookIndex: 39, chapter: 1, startBook: 39, startChapter: 1, endBook: 43, endChapter: 28 }, // Matthew–Acts
        { id: 4, bookIndex: 44, chapter: 1, startBook: 44, startChapter: 1, endBook: 65, endChapter: 22 }  // Romans–Revelation
      ];
    } else if (plan === 'Parallel') {
      newIcons = [
        { id: 1, bookIndex: 0, chapter: 1, startBook: 0, startChapter: 1, endBook: 38, endChapter: 4 },
        { id: 2, bookIndex: 39, chapter: 1, startBook: 39, startChapter: 1, endBook: 65, endChapter: 22 }
      ];
    } else if (plan === 'Custom') {
      newIcons = [
        { id: 1, bookIndex: 39, chapter: 1, startBook: 39, startChapter: 1, endBook: 42, endChapter: 21 },  // Matthew–John
        { id: 2, bookIndex: 0, chapter: 1, startBook: 0, startChapter: 1, endBook: 4, endChapter: 34 },     // Genesis–Deut
        { id: 3, bookIndex: 44, chapter: 1, startBook: 44, startChapter: 1, endBook: 50, endChapter: 4 },   // Romans–Col
        { id: 4, bookIndex: 51, chapter: 1, startBook: 51, startChapter: 1, endBook: 65, endChapter: 22 },  // 1 Thess–Rev
        { id: 5, bookIndex: 17, chapter: 1, startBook: 17, startChapter: 1, endBook: 21, endChapter: 8 },   // Job–Song
        { id: 6, bookIndex: 18, chapter: 1, startBook: 18, startChapter: 1, endBook: 18, endChapter: 150 }, // Psalms
        { id: 7, bookIndex: 19, chapter: 1, startBook: 19, startChapter: 1, endBook: 19, endChapter: 31 },  // Proverbs
        { id: 8, bookIndex: 5, chapter: 1, startBook: 5, startChapter: 1, endBook: 16, endChapter: 10 },    // Joshua–Esther
        { id: 9, bookIndex: 22, chapter: 1, startBook: 22, startChapter: 1, endBook: 38, endChapter: 4 },   // Isaiah–Malachi
        { id: 10, bookIndex: 43, chapter: 1, startBook: 43, startChapter: 1, endBook: 43, endChapter: 28 }  // Acts
      ];
    } else {
      // Default
      newIcons = [
        { id: 1, bookIndex: 0, chapter: 1, startBook: 0, startChapter: 1, endBook: 38, endChapter: 4 },
        { id: 2, bookIndex: 39, chapter: 1, startBook: 39, startChapter: 1, endBook: 65, endChapter: 22 }
      ];
    }
  
    setIcons(newIcons);
    localStorage.setItem('icons', JSON.stringify(newIcons));
  }
  
  const saveData = () => {
    try {
      localStorage.setItem('scripture-icons', JSON.stringify(icons));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  const advanceChapter = (icon) => {
    let { bookIndex, chapter, startBook, startChapter, endBook, endChapter } = icon;
    
    if (chapter < BIBLE_BOOKS[bookIndex].chapters) {
      chapter++;
    } else {
      bookIndex++;
      chapter = 1;
    }
    
    if (endBook !== null) {
      if (bookIndex > endBook) {
        bookIndex = startBook;
        chapter = startChapter;
      } else if (bookIndex === endBook && chapter > endChapter) {
        bookIndex = startBook;
        chapter = startChapter;
      }
    } else if (bookIndex >= BIBLE_BOOKS.length) {
      bookIndex = startBook;
      chapter = startChapter;
    }
    
    return { ...icon, bookIndex, chapter };
  };

  const handleTap = (icon) => {
    const updated = advanceChapter(icon);
    const updatedIcons = icons.map(i =>
      i.id === icon.id ? { ...updated, readToday: true } : i
    );
    setIcons(updatedIcons);
    localStorage.setItem('icons', JSON.stringify(updatedIcons));
  };

  const handleLongPress = (icon) => {
    setSelectedIcon(icon);
    setShowSettings(true);
  };

  const handleTouchStart = (icon) => {
    const timer = setTimeout(() => handleLongPress(icon), 500);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = (icon, e) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
      
      if (e.timeStamp - e.target.dataset.startTime < 500) {
        handleTap(icon);
      }
    }
  };

  const addIcon = () => {
    if (icons.length >= 10) return;
    
    const newIcon = {
      id: Math.max(0, ...icons.map(i => i.id)) + 1,
      bookIndex: 0,
      chapter: 1,
      startBook: 0,
      startChapter: 1,
      endBook: null,
      endChapter: null
    };
    
    setIcons([...icons, newIcon]);
  };

  const deleteIcon = (id) => {
    setIcons(icons.filter(i => i.id !== id));
    if (selectedIcon?.id === id) {
      setShowSettings(false);
      setSelectedIcon(null);
    }
  };

  const updateIconSettings = (updates) => {
    const updated = { ...selectedIcon, ...updates };
    
    if (updated.endBook !== null) {
      if (updated.bookIndex > updated.endBook || 
          (updated.bookIndex === updated.endBook && updated.chapter > updated.endChapter) ||
          updated.bookIndex < updated.startBook ||
          (updated.bookIndex === updated.startBook && updated.chapter < updated.startChapter)) {
        updated.bookIndex = updated.startBook;
        updated.chapter = updated.startChapter;
      }
    }
    
    setIcons(icons.map(i => i.id === selectedIcon.id ? updated : i));
    setSelectedIcon(updated);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b ${getBackgroundGradient(timeOfDay)} flex flex-col transition-colors duration-1000`}>
      {/* Grass texture overlay */}
      <div className="fixed inset-0 opacity-10 pointer-events-none" 
           style={{
             backgroundImage: `repeating-linear-gradient(
               0deg,
               transparent,
               transparent 2px,
               rgba(0,0,0,0.03) 2px,
               rgba(0,0,0,0.03) 4px
             )`
           }} />

      {/* MAIN SCRIPTURE SCREEN */}
      <div className="relative w-full h-full overflow-y-auto">
        {/* Icons Grid */}
        <div className="flex-1 px-8 py-20 relative z-10 flex items-center justify-center">
          <div className="w-full max-w-md">
            {/* ⚙️ and ❓ buttons fixed to bottom-right */}
            <div className="fixed bottom-6 right-6 flex flex-col space-y-3 z-30">
              <button
                className="bg-gray-200 text-gray-800 px-3 py-1 rounded-lg shadow hover:bg-gray-300"
                onClick={() => setShowGlobalSettings(true)}
              >
                ⚙️
              </button>
              <button
                className="bg-gray-200 text-gray-800 px-3 py-1 rounded-lg shadow hover:bg-gray-300"
                onClick={() => setShowQuestions(true)}
              >
                ❓
              </button>
            </div>
      
            <div className="grid grid-cols-2 gap-6">
              {icons.map(icon => (
                <div
                  key={icon.id}
                  className={`aspect-square ${getIconColor(timeOfDay)} backdrop-blur-md rounded-2xl flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-all
                    ${icon.readToday ? 'ring-4 ring-yellow-400 shadow-yellow-400/50' : 'shadow-xl'}
                  `}
                  onTouchStart={(e) => {
                    setTouchMoved(false);
                    setLongPressTriggered(false);
                    e.target.dataset.startTime = e.timeStamp;
                    const timer = setTimeout(() => {
                      setLongPressTriggered(true);
                      handleLongPress(icon);
                    }, 500);
                    setLongPressTimer(timer);
                  }}
                  onTouchMove={() => {
                    setTouchMoved(true);
                    if (longPressTimer) {
                      clearTimeout(longPressTimer);
                      setLongPressTimer(null);
                    }
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    if (longPressTimer) {
                      clearTimeout(longPressTimer);
                      setLongPressTimer(null);
                    }
                    if (!touchMoved && !longPressTriggered) handleTap(icon);
                  }}
                  onMouseDown={() => {
                    setLongPressTriggered(false);
                    const timer = setTimeout(() => {
                      setLongPressTriggered(true);
                      handleLongPress(icon);
                    }, 500);
                    setLongPressTimer(timer);
                  }}
                  onMouseUp={() => {
                    if (longPressTimer) {
                      clearTimeout(longPressTimer);
                      setLongPressTimer(null);
                    }
                    if (!longPressTriggered) handleTap(icon);
                  }}
                  onMouseLeave={() => {
                    if (longPressTimer) {
                      clearTimeout(longPressTimer);
                      setLongPressTimer(null);
                    }
                  }}
                >
                  <div className="text-center px-3">
                    <div className="text-xs font-medium text-slate-600 mb-1 tracking-wide">
                      {BIBLE_BOOKS[icon.bookIndex].name}
                    </div>
                    <div className="text-4xl font-light text-slate-700 mb-1">
                      {icon.chapter}
                    </div>
                    {icon.endBook !== null && (
                      <div className="text-xs text-slate-500 mt-2 leading-tight">
                        {BIBLE_BOOKS[icon.startBook].name} {icon.startChapter} - {BIBLE_BOOKS[icon.endBook].name} {icon.endChapter}
                      </div>
                    )}
                  </div>
                </div>
              ))}
      
              {icons.length < 10 && (
                <button
                  onClick={addIcon}
                  className={`aspect-square ${getIconColor(timeOfDay)} backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center cursor-pointer hover:bg-opacity-95 active:scale-95 transition-all border-2 border-dashed border-white border-opacity-40`}
                >
                  <Plus className="w-10 h-10 text-slate-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* QUESTIONS SCREEN (overlay, slides in) */}
      <div
        className={`fixed top-0 left-0 w-full h-full overflow-y-auto text-white transition-transform duration-700 ease-in-out z-40 ${
          showQuestions ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 space-y-12">
          {questionList.map((q, i) => {
            const unlocked = i === 0 || answers[i - 1];
            if (!unlocked) return null;
            return (
              <div
                key={q.id}
                className={`relative h-[80vh] ${q.gradient} rounded-xl shadow-xl flex flex-col justify-center items-center text-center p-6`}
              >
                <div className="max-w-xl">
                  <h3 className="text-3xl font-bold text-white drop-shadow-md mb-1">{q.location}</h3>
                  <p className="text-sm text-gray-200 mb-4 drop-shadow-md">{q.description}</p>
                  <h2 className="text-2xl font-semibold text-white drop-shadow-md mb-4">{q.question}</h2>
      
                  {!answers[i] ? (
                    <input
                      type="text"
                      className="text-black px-3 py-2 rounded w-3/4"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = e.currentTarget.value.toLowerCase().trim();
                          if (val === q.answer.toLowerCase()) {
                            setAnswers((prev) => ({ ...prev, [i]: true }));
                          } else {
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                      placeholder="Your answer..."
                    />
                  ) : (
                    <div className="mt-4 text-green-300 font-semibold">✅ Correct!</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      
        <button
          onClick={() => setShowQuestions(false)}
          className="fixed top-4 left-4 bg-gray-800 text-white px-4 py-2 rounded-full shadow-md"
        >
          ← Return
        </button>
      </div>

      {/* Global Settings Modal */}
      {showGlobalSettings && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 w-80 shadow-lg">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">Select Reading Plan</h2>
            
            <select
              className="w-full border rounded p-2 mb-4 text-gray-800"
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
            >
              <option value="Default">Default</option>
              <option value="Chronological">Chronological Bible</option>
              <option value="Parallel">Old + New Testament Parallel</option>
              <option value="Mcheyne">2OT-2NT</option>
              <option value="Custom">Professor Grant Horner Bible-Reading System</option>
            </select>
      
            {selectedPlan === 'Custom' && (
              <div className="text-sm text-gray-700 max-h-48 overflow-y-auto border-t pt-2 space-y-1">
                <p>Range 1: Matthew–John</p>
                <p>Range 2: Genesis–Deuteronomy</p>
                <p>Range 3: Romans–Colossians</p>
                <p>Range 4: 1 Thess–Revelation</p>
                <p>Range 5: Job–Song of Solomon</p>
                <p>Range 6: Psalms</p>
                <p>Range 7: Proverbs</p>
                <p>Range 8: Joshua–Esther</p>
                <p>Range 9: Isaiah–Malachi</p>
                <p>Range 10: Acts</p>
              </div>
            )}
      
            <div className="flex justify-end mt-4 space-x-2">
              <button
                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setShowGlobalSettings(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => {
                  applyPlan(selectedPlan);
                  setShowGlobalSettings(false);
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && selectedIcon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-6 pb-8 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium text-slate-800">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="readToday"
                className="mr-2 h-4 w-4 accent-yellow-500"
                checked={selectedIcon.readToday || false}
                onChange={(e) => {
                  const updated = icons.map((i) =>
                    i.id === selectedIcon.id ? { ...i, readToday: e.target.checked } : i
                  );
                  setIcons(updated);
                  localStorage.setItem('icons', JSON.stringify(updated));
                  setSelectedIcon({ ...selectedIcon, readToday: e.target.checked });
                }}
              />
              <label htmlFor="readToday" className="text-gray-700 text-sm">
                Marked as read today
              </label>
            </div>

            {/* Current Position */}
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-600 mb-3 block">Current Position</label>
              <div className="space-y-2">
                <select
                  value={selectedIcon.bookIndex}
                  onChange={(e) => updateIconSettings({ 
                    bookIndex: parseInt(e.target.value),
                    chapter: 1
                  })}
                  className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-800"
                >
                  {BIBLE_BOOKS.map((book, idx) => (
                    <option key={idx} value={idx}>{book.name}</option>
                  ))}
                </select>
                <select
                  value={selectedIcon.chapter}
                  onChange={(e) => updateIconSettings({ chapter: parseInt(e.target.value) })}
                  className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-800"
                >
                  {Array.from({ length: BIBLE_BOOKS[selectedIcon.bookIndex].chapters }, (_, i) => i + 1).map(ch => (
                    <option key={ch} value={ch}>Chapter {ch}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Start Range */}
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-600 mb-3 block">Start Range</label>
              <div className="space-y-2">
                <select
                  value={selectedIcon.startBook}
                  onChange={(e) => updateIconSettings({ 
                    startBook: parseInt(e.target.value),
                    startChapter: 1
                  })}
                  className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-800"
                >
                  {BIBLE_BOOKS.map((book, idx) => (
                    <option key={idx} value={idx}>{book.name}</option>
                  ))}
                </select>
                <select
                  value={selectedIcon.startChapter}
                  onChange={(e) => updateIconSettings({ startChapter: parseInt(e.target.value) })}
                  className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-800"
                >
                  {Array.from({ length: BIBLE_BOOKS[selectedIcon.startBook].chapters }, (_, i) => i + 1).map(ch => (
                    <option key={ch} value={ch}>Chapter {ch}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* End Range */}
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-600 mb-3 block">
                End Range (Optional)
              </label>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={selectedIcon.endBook !== null}
                  onChange={(e) => {
                    if (e.target.checked) {
                      updateIconSettings({
                        endBook: selectedIcon.startBook,
                        endChapter: BIBLE_BOOKS[selectedIcon.startBook].chapters
                      });
                    } else {
                      updateIconSettings({ endBook: null, endChapter: null });
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-slate-600">Set end limit</span>
              </div>
              {selectedIcon.endBook !== null && (
                <div className="space-y-2">
                  <select
                    value={selectedIcon.endBook}
                    onChange={(e) => updateIconSettings({ 
                      endBook: parseInt(e.target.value),
                      endChapter: BIBLE_BOOKS[parseInt(e.target.value)].chapters
                    })}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-800"
                  >
                    {BIBLE_BOOKS.map((book, idx) => (
                      <option key={idx} value={idx}>{book.name}</option>
                    ))}
                  </select>
                  <select
                    value={selectedIcon.endChapter}
                    onChange={(e) => updateIconSettings({ endChapter: parseInt(e.target.value) })}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-800"
                  >
                    {Array.from({ length: BIBLE_BOOKS[selectedIcon.endBook].chapters }, (_, i) => i + 1).map(ch => (
                      <option key={ch} value={ch}>Chapter {ch}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Delete Button */}
            {icons.length > 1 && (
              <button
                onClick={() => deleteIcon(selectedIcon.id)}
                className="w-full p-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
              >
                Delete Icon
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
