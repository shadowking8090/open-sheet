import type { Measure } from '../model/score';
import { lastNoteEndTick } from '../model/duration';

export interface Cursor {
  measureIndex: number;
  tick: number;
}

export function activateMeasure(measure: Measure, measureIndex: number): Cursor {
  return { measureIndex, tick: lastNoteEndTick(measure) };
}
