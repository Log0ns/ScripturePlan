import React, { useCallback } from 'react';
import { CustomTile, TimeOfDay } from '../types';
import { getTileStyle, getTileTextColor } from '../constants';
import { useLongPress } from '../hooks/useLongPress';

type Props = {
  tile: CustomTile;
  timeOfDay: TimeOfDay;
  onTap: (tile: CustomTile) => void;
  onLongPress: (tile: CustomTile) => void;
};

export default React.memo(function PrayerTile({ tile, timeOfDay, onTap, onLongPress }: Props) {
  const { handlers, pressing } = useLongPress(
    useCallback(() => onTap(tile), [tile, onTap]),
    useCallback(() => onLongPress(tile), [tile, onLongPress])
  );

  const colors = getTileTextColor(timeOfDay);

  return (
    <div
      className={`aspect-square rounded-2xl
        ${getTileStyle(timeOfDay)}
        flex items-center justify-center
        ${tile.activeToday ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-400/20' : 'shadow-md'}
        ${pressing ? 'tile-pressing' : 'tile-idle'}
      `}
      {...handlers}
    >
      <div className={`text-sm font-medium ${colors.primary} whitespace-pre-wrap text-center px-3`}>
        {tile.items[tile.index] || ''}
      </div>
    </div>
  );
});
