import type { ThemeMemory } from '../types';
import { MATURE_INTERVAL, MAX_INTERVAL, LEARNING_STEPS } from './srsConstants';

const MIN_EASE = 1.3;

function addMinutes(minutes: number): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

/**
 * Returns the current learning step index stored in `interval` for learning cards.
 * We repurpose `interval` as step index (negative) during learning phase:
 *   interval = -(stepIndex + 1)  e.g. step 0 → interval = -1
 * Positive interval = days (review/mature phase).
 */
function isLearning(memory: ThemeMemory): boolean {
  return memory.status === 'new' || memory.status === 'learning';
}

function getLearningStep(memory: ThemeMemory): number {
  // interval < 0 encodes step index; interval 0 = brand new (step 0)
  if (memory.interval <= 0) return Math.max(0, -memory.interval);
  return 0;
}

/**
 * SM-2 review function.
 *
 * grade:
 *   1 — wrong / again
 *   2 — hard (wrong feel, or correct but very difficult)
 *   3 — correct with significant difficulty
 *   4 — correct with some hesitation
 *   5 — perfect recall
 */
export function reviewCard(memory: ThemeMemory, grade: 1 | 2 | 3 | 4 | 5): ThemeMemory {
  let { interval, easeFactor, repetitions, lapses } = memory;

  // --- Learning / relearning phase ---
  if (isLearning(memory)) {
    if (grade === 1) {
      // Failed — restart learning steps from beginning
      lapses += 1;
      return {
        interval: 0,
        easeFactor,
        dueDate: addMinutes(LEARNING_STEPS[0]),
        repetitions: 0,
        lapses,
        status: 'learning',
      };
    }

    const step = getLearningStep(memory);

    if (grade === 5) {
      // Easy — graduate immediately
      return {
        interval: 4,
        easeFactor,
        dueDate: addDays(4),
        repetitions: 1,
        lapses,
        status: 'review',
      };
    }

    if (grade === 2) {
      // Hard — repeat current step
      return {
        interval: -(step),
        easeFactor,
        dueDate: addMinutes(LEARNING_STEPS[step]),
        repetitions: 0,
        lapses,
        status: 'learning',
      };
    }

    // Good — advance one step
    const nextStep = step + 1;

    if (nextStep >= LEARNING_STEPS.length) {
      // Graduated
      return {
        interval: 1,
        easeFactor,
        dueDate: addDays(1),
        repetitions: 1,
        lapses,
        status: 'review',
      };
    }

    return {
      interval: -(nextStep),
      easeFactor,
      dueDate: addMinutes(LEARNING_STEPS[nextStep]),
      repetitions: 0,
      lapses,
      status: 'learning',
    };
  }

  // --- Review / mature phase ---
  if (grade === 1) {
    // Failed — send back to learning steps (relearning)
    lapses += 1;
    return {
      interval: 0,
      easeFactor: Math.max(MIN_EASE, easeFactor - 0.2),
      dueDate: addMinutes(LEARNING_STEPS[0]),
      repetitions: 0,
      lapses,
      status: 'learning',
    };
  }

  if (grade === 2) {
    // Hard — stay in review but reduce interval, don't reset
    interval = Math.max(1, Math.round((repetitions <= 1 ? 2 : interval) * 0.8));
    easeFactor = Math.max(MIN_EASE, easeFactor - 0.15);
  } else {
    // Good (3) / Easy (4 or 5)
    if (repetitions <= 1) {
      interval = grade >= 4 ? 4 : 2;
    } else {
      interval = Math.min(MAX_INTERVAL, Math.round(interval * easeFactor));
    }
    repetitions += 1;
    easeFactor = Math.max(
      MIN_EASE,
      easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
    );
  }

  const status = interval >= MATURE_INTERVAL ? 'mature' : 'review';

  return {
    interval,
    easeFactor,
    dueDate: addDays(interval),
    repetitions,
    lapses,
    status,
  };
}
