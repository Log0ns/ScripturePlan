export const MATURE_INTERVAL = 21;   // days — interval at which a card is considered mature (matches Anki default)
export const MAX_INTERVAL = 365;     // days — cap so cards never disappear entirely
export const LEECH_THRESHOLD = 8;    // lapses before a card is marked leeched
// Learning steps in minutes — card must be answered correctly at each step before graduating
export const LEARNING_STEPS = [1, 10, 1440]; // 1min, 10min, 1day
