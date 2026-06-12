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

export default React.memo(function ReadingTile({ icon, timeOfDay, openOnTap, onTap, onLongPress }: Props) {
  const { handlers, pressing } = useLongPress(
    useCallback(() => onTap(icon), [icon, onTap]),
    useCallback(() => onLongPress(icon), [icon, onLongPress])
  );

  const colors = getTileTextColor(timeOfDay);
  const bookName = BIBLE_BOOKS[icon.bookIndex].name;
  const nameSize = bookName.length > 12 ? 'text-xs' : 'text-sm';
  const hasProgress = openOnTap && !!sessionStorage.getItem(`planny-scroll-${icon.id}`);

  return (
    <div
      className={`aspect-square rounded-2xl relative
        ${getTileStyle(timeOfDay)}
        flex items-center justify-center transition-shadow
        ${icon.readToday ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-400/20' : 'shadow-md'}
        ${pressing ? 'tile-pressing' : 'tile-idle'}
      `}
      {...handlers}
    >
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
