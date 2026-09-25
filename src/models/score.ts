export type Duration = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth';

export interface Note {
  id: string;
  pitch: string;      // e.g. "C4", "F#5"
  duration: Duration;
}

export interface Measure {
  notes: Note[];
}

export interface Score {
  title: string;
  measures: Measure[];
}