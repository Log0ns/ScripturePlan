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

function ProgressBorder({ progress, timeOfDay }: { progress: number; timeOfDay: TimeOfDay }) {
  const size = 100;
  const stroke = 3;
  const r = 16; // matches rounded-2xl (16px at 100-unit scale)
  const half = stroke / 2;
  const w = size - stroke;
  const h = size - stroke;
  // Perimeter of a rounded rect: 4 straight segments + 4 quarter-circle arcs
  const perimeter = 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;
  const dash = perimeter * progress;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ transform: 'rotate(-90deg)' }}
    >
      <rect
        x={half}
        y={half}
        width={w}
        height={h}
        rx={r}
        ry={r}
        fill="none"
        stroke={RING_COLORS[timeOfDay]}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${perimeter - dash}`}
        strokeLinecap="round"
        opacity={0.9}
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
      className={`aspect-square rounded-2xl relative overflow-hidden
        ${getTileStyle(timeOfDay)}
        flex items-center justify-center
        shadow-md
        ${pressing ? 'tile-pressing' : 'tile-idle'}
      `}
      onContextMenu={(e) => { e.preventDefault(); onLongPress(icon); }}
      {...handlers}
    >
      {showRing && <ProgressBorder progress={progress} timeOfDay={timeOfDay} />}
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
