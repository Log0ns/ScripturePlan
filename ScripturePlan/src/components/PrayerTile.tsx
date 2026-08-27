import React, { useCallback } from 'react';
import { CustomTile, TimeOfDay } from '../types';
import { getTileTextColor } from '../constants';
import { useLongPress } from '../hooks/useLongPress';
import TileShell from './TileShell';

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
    <TileShell
      timeOfDay={timeOfDay}
      progress={tile.activeToday ? 1 : undefined}
      pressing={pressing}
      onContextMenu={(e) => { e.preventDefault(); onLongPress(tile); }}
      handlers={handlers}
    >
      <div className={`text-sm font-medium ${colors.primary} whitespace-pre-wrap text-center px-3`}>
        {tile.items[tile.index] || ''}
      </div>
    </TileShell>
  );
});
