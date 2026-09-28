import type { Score } from './score';

export const testScore: Score = {
  title: 'My First Melody',
  measures: [
    {
      notes: [
        { id: 'n1', pitch: 'C4', duration: 'eighth' },
        { id: 'n2', pitch: 'E4', duration: 'eighth' },
        { id: 'n3', pitch: 'G4', duration: 'eighth' },
        { id: 'n4', pitch: 'G4', duration: 'eighth' },
        { id: 'n5', pitch: 'E4', duration: 'eighth' },
        { id: 'n6', pitch: 'C4', duration: 'eighth' }
      ]
    }
  ]
};