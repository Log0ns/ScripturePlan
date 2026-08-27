import React from 'react';
import { TimeOfDay } from '../types';
import { getTileStyle } from '../constants';

const RING_COLORS: Record<string, string> = {
  morning: '#fbbf24',
  afternoon: '#22d3ee',
  evening: '#fb7185',
  night: '#fbbf24',
};

function ProgressBorder({ progress, timeOfDay }: { progress: number; timeOfDay: TimeOfDay }) {
  const size = 100;
  const stroke = 3;
  const r = 16;
  const half = stroke / 2;
  const w = size - stroke;
  const h = size - stroke;
  const perimeter = 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;
  const dash = perimeter * progress;
  const offset = -((w - 2 * r) / 2);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
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
        strokeDashoffset={offset}
        strokeLinecap="round"
        opacity={0.9}
      />
    </svg>
  );
}

type Props = {
  timeOfDay: TimeOfDay;
  progress?: number; // 0–1, undefined = no ring
  pressing: boolean;
  onContextMenu: (e: React.MouseEvent) => void;
  handlers: Record<string, any>;
  children: React.ReactNode;
};

export default function TileShell({ timeOfDay, progress, pressing, onContextMenu, handlers, children }: Props) {
  const showRing = progress !== undefined && progress > 0;
  const inset = 3;
  const [contextPressing, setContextPressing] = React.useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    setContextPressing(true);
    setTimeout(() => setContextPressing(false), 200);
    onContextMenu(e);
  };

  return (
    <div
      className={`aspect-square relative ${pressing || contextPressing ? 'tile-pressing' : 'tile-idle'}`}
      onContextMenu={handleContextMenu}
      {...handlers}
    >
      <div
        className={`absolute ${getTileStyle(timeOfDay)} flex items-center justify-center shadow-md`}
        style={{ inset, borderRadius: '14%' }}
      >
        {children}
      </div>
      {showRing && <ProgressBorder progress={progress!} timeOfDay={timeOfDay} />}
    </div>
  );
}
