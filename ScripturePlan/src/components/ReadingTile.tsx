import React, { useCallback } from 'react';
import { BookOpen } from 'lucide-react';
import { ScriptureIcon, TimeOfDay } from '../types';
import { BIBLE_BOOKS, getTileStyle, getTileTextColor } from '../constants';
import { useLongPress } from '../hooks/useLongPress';

type Props = {
  icon: ScriptureIcon;
  timeOfDay: TimeOfDay;
  openOnTap: boolean;
  onTap: (icon: ScriptureIcon) => void;
  onLongPress: (icon: ScriptureIcon) => void;
};

const RING_COLORS: Record<string, string> = {
  morning: '#fbbf24',
  afternoon: '#22d3ee',
  evening: '#fb7185',
  night: '#fbbf24',
};

function ProgressRing({ progress, timeOfDay }: { progress: number; timeOfDay: TimeOfDay }) {
  const stroke = 6;
  const r = 50 - stroke / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * progress;
  const color = RING_COLORS[timeOfDay];

  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute inset-0 w-full h-full"
      style={{ transform: 'rotate(-90deg)' }}
    >
      <circle
        cx={50}
        cy={50}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        opacity={0.85}
      />
    </svg>
  );
}

export default React.memo(function ReadingTile({ icon, timeOfDay, openOnTap, onTap, onLongPress }: Props) {
  const { handlers, pressing } = useLongPress(
    useCallback(() => onTap(icon), [icon, onTap]),
    useCallback(() => onLongPress(icon), [icon, onLongPress])
  );

  const colors = getTileTextColor(timeOfDay);
  const bookName = BIBLE_BOOKS[icon.bookIndex].name;
  const nameSize = bookName.length > 12 ? 'text-xs' : 'text-sm';
  const hasProgress = openOnTap && !!sessionStorage.getItem(`planny-scroll-${icon.id}`);

  const cpd = icon.chaptersPerDay ?? 1;
  const crt = icon.chaptersReadToday ?? 0;
  const fullyDone = icon.readToday;
  const progress = fullyDone ? 1 : Math.min(crt / cpd, 1);
  const showRing = fullyDone || crt > 0;

  return (
    <div
      className={`aspect-square rounded-2xl relative
        ${getTileStyle(timeOfDay)}
        flex items-center justify-center
        shadow-md
        ${pressing ? 'tile-pressing' : 'tile-idle'}
      `}
      onContextMenu={(e) => { e.preventDefault(); onLongPress(icon); }}
      {...handlers}
    >
      {showRing && (
        <ProgressRing progress={progress} timeOfDay={timeOfDay} />
      )}
      {openOnTap && hasProgress && (
        <div className="absolute top-2 right-2">
          <BookOpen className={`w-3.5 h-3.5 ${colors.muted}`} />
        </div>
      )}
      <div className="text-center px-3">
        <div className={`${nameSize} font-semibold ${colors.secondary} mb-1 tracking-wide leading-tight`}>
          {bookName}
        </div>
        <div className={`text-3xl font-light ${colors.primary}`}>
          {icon.chapter}
        </div>
        {icon.endBook !== null && (
          <div className={`text-xs ${colors.muted} mt-2 leading-tight`}>
            {BIBLE_BOOKS[icon.startBook].name} — {BIBLE_BOOKS[icon.endBook].name}
          </div>
        )}
      </div>
    </div>
  );
});
