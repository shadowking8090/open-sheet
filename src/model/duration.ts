import type { Duration, Measure, Score, TimeSignature } from './score';


// To compare and add up note lengths, everything is measured in "ticks".
// A quarter note is 64 ticks, which keeps even a double-dotted 32nd a whole number.
export const TICKS_PER_QUARTER = 64;
const TICKS_PER_WHOLE = TICKS_PER_QUARTER * 4;

// How long each plain (undotted) note lasts.
const TICKS_PER_NOTE: Record<Duration, number> = {
  whole: TICKS_PER_QUARTER * 4,
  half: TICKS_PER_QUARTER * 2,
  quarter: TICKS_PER_QUARTER,
  eighth: TICKS_PER_QUARTER / 2,
  sixteenth: TICKS_PER_QUARTER / 4,
  thirtysecond: TICKS_PER_QUARTER / 8
};

// The order restsToFill tries note sizes in: longest first.
const DURATIONS_LONGEST_FIRST: Duration[] = [
  'whole', 'half', 'quarter', 'eighth', 'sixteenth', 'thirtysecond'
];

// ---------- Lengths ----------

export function durationTicks(duration: Duration, dots = 0): number {
  const plain = TICKS_PER_NOTE[duration];

  if (dots === 1) return plain * 1.5;  // one dot adds half the note's length
  if (dots === 2) return plain * 1.75; // a second dot adds a quarter more
  return plain;
}

// ---------- Measures ----------

// How much a measure can hold. 4/4 = four quarters, 6/8 = six eighths.
export function measureCapacity(timeSignature: TimeSignature): number {
  const ticksPerBeat = TICKS_PER_WHOLE / timeSignature.beatType;
  return timeSignature.beats * ticksPerBeat;
}

// How much of a measure its notes and rests already take up.
export function measureUsed(measure: Measure): number {
  let total = 0;
  for (const note of measure.notes) {
    total += durationTicks(note.duration, note.dots);
  }
  return total;
}

// The time signature in effect at a measure. There is one per score for now;
// supporting meter changes later only means changing this function.
export function timeSignatureAt(score: Score, _measureIndex: number): TimeSignature {
  return score.timeSignature;
}

// Room left in a measure. 0 = full, negative = overfull.
export function measureRemaining(score: Score, measureIndex: number): number {
  const capacity = measureCapacity(timeSignatureAt(score, measureIndex));
  return capacity - measureUsed(score.measures[measureIndex]);
}

// ---------- Rests ----------

// Splits an amount of time into the fewest rests that add up to it.
// 256 ticks (a 4/4 measure) -> [whole rest]. 192 ticks -> [dotted half rest].
export function restsToFill(ticks: number): { duration: Duration; dots: number }[] {
  const rests: { duration: Duration; dots: number }[] = [];
  let remaining = ticks;

  for (const duration of DURATIONS_LONGEST_FIRST) {
    for (const dots of [1, 0]) { // try the dotted rest first, it's the longer one
      const size = durationTicks(duration, dots);

      while (size <= remaining) {
        rests.push({ duration, dots });
        remaining -= size;
      }
    }
  }
  return rests;
}

// Where the last real note (not a filler rest) ends, in ticks.
export function lastNoteEndTick(measure: Measure): number {
  let tick = 0;
  let endOfLastNote = 0;

  for (const note of measure.notes) {
    const noteEnd = tick + durationTicks(note.duration, note.dots);
    if (note.pitch !== null) {
      endOfLastNote = noteEnd;
    }
    tick = noteEnd;
  }
  return endOfLastNote;
}