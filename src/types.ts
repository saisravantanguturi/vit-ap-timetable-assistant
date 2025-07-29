export interface ClassEntry {
  id: string;
  day: string;
  subject: string;
  venue: string; // "Block, Room"
  slot: string;
  startTime: string; // "HH:mm" format
  endTime: string; // "HH:mm" format
}

export type TimetableData = {
  [day: string]: ClassEntry[];
};

export type TimeFormat = '12h' | '24h' | '12h-condensed';
export type Theme = 'light' | 'dark';
export type Accent = 'blue' | 'pink';