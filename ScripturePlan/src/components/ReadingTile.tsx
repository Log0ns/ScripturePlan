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

  const ringColor = RING_COLORS[timeOfDay];
  const borderWidth = 4;

  return (
    <div
      className={`aspect-square rounded-2xl relative flex items-center justify-center shadow-md ${pressing ? 'tile-pressing' : 'tile-idle'}`}
      style={showRing ? {
        background: `conic-gradient(${ringColor} ${progress * 360}deg, transparent ${progress * 360}deg)`,
        padding: borderWidth,
      } : undefined}
      onContextMenu={(e) => { e.preventDefault(); onLongPress(icon); }}
      {...handlers}
    >
      <div className={`w-full h-full rounded-2xl flex items-center justify-center ${getTileStyle(timeOfDay)} ${!showRing ? 'shadow-md' : ''}`}>
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
    </div>
  );
});
