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
  timeSignature: TimeSignature;
  keySignature: KeySignature;
  measures: Measure[];
}

export interface TimeSignature {
  beats: number;
  beatType: number;
}

export interface KeySignature {
  fifths: number; // sharps if positive, flats if negative, 0 = C major / A minor
}

// The keys offered in the toolbar, major keys only for now.
export const KEY_SIGNATURES: { name: string; fifths: number }[] = [
  { name: 'C♭ major', fifths: -7 },
  { name: 'G♭ major', fifths: -6 },
  { name: 'D♭ major', fifths: -5 },
  { name: 'A♭ major', fifths: -4 },
  { name: 'E♭ major', fifths: -3 },
  { name: 'B♭ major', fifths: -2 },
  { name: 'F major', fifths: -1 },
  { name: 'C major', fifths: 0 },
  { name: 'G major', fifths: 1 },
  { name: 'D major', fifths: 2 },
  { name: 'A major', fifths: 3 },
  { name: 'E major', fifths: 4 },
  { name: 'B major', fifths: 5 },
  { name: 'F♯ major', fifths: 6 },
  { name: 'C♯ major', fifths: 7 }
];