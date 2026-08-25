import React, { useCallback } from 'react';
import { MemoryTile, TimeOfDay } from '../types';
import { MEMORY_CHUNKS, getTileStyle, getTileTextColor, getRingStyle } from '../constants';
import { useLongPress } from '../hooks/useLongPress';

type Props = {
  tile: MemoryTile;
  timeOfDay: TimeOfDay;
  onTap: (tile: MemoryTile) => void;
  onLongPress: (tile: MemoryTile) => void;
};

export default React.memo(function MemorizationTile({ tile, timeOfDay, onTap, onLongPress }: Props) {
  const { handlers, pressing } = useLongPress(
    useCallback(() => onTap(tile), [tile, onTap]),
    useCallback(() => onLongPress(tile), [tile, onLongPress])
  );

  const colors = getTileTextColor(timeOfDay);
  const chunk = MEMORY_CHUNKS[tile.chunkIndex] ?? MEMORY_CHUNKS[0];
  const completed = tile.day >= 30;
  const highlighted = tile.readToday || completed;

  return (
    <div
      className={`aspect-square rounded-2xl
        ${getTileStyle(timeOfDay)}
        flex items-center justify-center
        ${highlighted ? `ring-4 ${getRingStyle(timeOfDay)}` : 'shadow-md'}
        ${pressing ? 'tile-pressing' : 'tile-idle'}
      `}}
      onContextMenu={(e) => { e.preventDefault(); onLongPress(tile); }}
      {...handlers}
    >
      <div className="text-center px-3">
        <div className={`text-xs font-semibold ${colors.secondary} mb-1 tracking-wide leading-tight truncate w-full text-center`} title={chunk.label}>
          {chunk.label}
        </div>
        <div className={`text-3xl font-light ${colors.primary}`}>
          {tile.day}
        </div>
        <div className={`text-xs ${colors.muted} mt-1`}>
          / 30
        </div>
      </div>
    </div>
  );
});
