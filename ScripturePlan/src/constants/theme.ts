import { TimeOfDay } from '../types';

export const getTimeOfDay = (): TimeOfDay => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 16) return 'afternoon';
  if (hour >= 16 && hour < 20) return 'evening';
  return 'night';
};

export const getBackgroundGradient = (timeOfDay: TimeOfDay): string => {
  const gradients: Record<TimeOfDay, string> = {
    morning: 'from-rose-200 via-amber-100 to-yellow-100',
    afternoon: 'from-cyan-200 via-teal-100 to-emerald-100',
    evening: 'from-orange-200 via-rose-200 to-purple-200',
    night: 'from-slate-900 via-indigo-950 to-slate-950',
  };
  return gradients[timeOfDay];
};

export const getTileStyle = (timeOfDay: TimeOfDay): string => {
  const styles: Record<TimeOfDay, string> = {
    morning: 'bg-white/80 border border-amber-200/50',
    afternoon: 'bg-white/80 border border-teal-200/50',
    evening: 'bg-white/80 border border-rose-200/50',
    night: 'bg-slate-800/80 border border-slate-700/50',
  };
  return styles[timeOfDay];
};

export const getTileTextColor = (timeOfDay: TimeOfDay): { primary: string; secondary: string; muted: string } => {
  if (timeOfDay === 'night') {
    return { primary: 'text-slate-100', secondary: 'text-slate-300', muted: 'text-slate-400' };
  }
  return { primary: 'text-slate-800', secondary: 'text-slate-600', muted: 'text-slate-500' };
};

export const getIconColor = (timeOfDay: TimeOfDay): string => {
  const colors: Record<TimeOfDay, string> = {
    morning: 'bg-amber-50',
    afternoon: 'bg-teal-50',
    evening: 'bg-rose-50',
    night: 'bg-slate-800',
  };
  return colors[timeOfDay];
};

export const getThemeColor = (timeOfDay: TimeOfDay): string => {
  const colors: Record<TimeOfDay, string> = {
    morning: '#fecdd3',
    afternoon: '#a5f3fc',
    evening: '#fdba74',
    night: '#0f172a',
  };
  return colors[timeOfDay];
};

export const updateMetaThemeColor = (timeOfDay: TimeOfDay): void => {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', getThemeColor(timeOfDay));
};
