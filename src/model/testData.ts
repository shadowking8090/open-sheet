import type { Score } from './score';

export const testScore: Score = {
  title: 'My First Melody',
  timeSignature: {
    beats: 4,
    beatType: 4
  },
  keySignature: { fifths: 1 },
  measures: [
    { notes: [{ id: 'r1', pitch: null, duration: 'whole', dots: 0 }] },
    { notes: [{ id: 'r2', pitch: null, duration: 'whole', dots: 0 }] },
    { notes: [{ id: 'r3', pitch: null, duration: 'whole', dots: 0 }] },
    { notes: [{ id: 'r4', pitch: null, duration: 'whole', dots: 0 }] }
  ]
};