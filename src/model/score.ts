export type Duration = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth' | 'thirtysecond';

export interface Note {
  id: string;
  pitch: string | null;  
  duration: Duration;
  dots?: number;
}

export interface Measure {
  notes: Note[];
}

export interface Score {
  title: string;
  measures: Measure[];
}