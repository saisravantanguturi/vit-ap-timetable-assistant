import type { TimeFormat } from './types';

// --- Time Utilities ---
export const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const formatTime = (time24h: string, format: TimeFormat): string => {
  if (format === '24h' || !time24h) return time24h;
  const [hours, minutes] = time24h.split(':');
  let h = parseInt(hours, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;

  if (format === '12h-condensed' && minutes === '00') {
      return `${h.toString()} ${suffix}`;
  }

  return `${h.toString()}:${minutes} ${suffix}`;
};


// --- Color Utility for Slots ---
export const getSlotColorStyle = (slot: string): { bg: string, text: string, darkText: string, border: string } => {
  const colors = [
    { bg: 'bg-teal-500/10', text: 'text-teal-800', darkText: 'dark:text-teal-300', border: 'border-teal-500' },
    { bg: 'bg-amber-500/10', text: 'text-amber-800', darkText: 'dark:text-amber-300', border: 'border-amber-500' },
    { bg: 'bg-violet-500/10', text: 'text-violet-800', darkText: 'dark:text-violet-300', border: 'border-violet-500' },
    { bg: 'bg-lime-500/10', text: 'text-lime-800', darkText: 'dark:text-lime-300', border: 'border-lime-500' },
    { bg: 'bg-rose-500/10', text: 'text-rose-800', darkText: 'dark:text-rose-300', border: 'border-rose-500' },
    { bg: 'bg-cyan-500/10', text: 'text-cyan-800', darkText: 'dark:text-cyan-300', border: 'border-cyan-500' },
    { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-800', darkText: 'dark:text-fuchsia-300', border: 'border-fuchsia-500' },
    { bg: 'bg-emerald-500/10', text: 'text-emerald-800', darkText: 'dark:text-emerald-300', border: 'border-emerald-500' },
  ];
  let hash = 0;
  if (slot.length === 0) return colors[0];
  for (let i = 0; i < slot.length; i++) {
    const char = slot.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return colors[Math.abs(hash % colors.length)];
};