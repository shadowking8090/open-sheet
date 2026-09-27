import type { Score } from './score';

export const testScore: Score = {
  title: 'My First Melody',
  measures: [
    {
      notes: [
        { id: 'n1', pitch: 'C4', duration: 'quarter' },
        { id: 'n2', pitch: 'E4', duration: 'quarter' },
        { id: 'n3', pitch: 'G4', duration: 'half' }
      ]
    }
  ]
};