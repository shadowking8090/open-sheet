import type { Duration, Measure, Note, Score } from "../model/score";
import { measureCapacity, timeSignatureAt, restsToFill, durationTicks } from '../model/duration';


export function findNoteById(score: Score, id: string): Note | null {
  for (const measure of score.measures) {
    for (const note of measure.notes) {
      if (note.id == id) {
        return note;
      }
    }
  }
  return null;
}

export const PITCH_ORDER = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export function transposePitch(pitch: string, direction: 1 | -1): string {
  const step = pitch[0];
  const octave = parseInt(pitch.slice(1), 10);

  let index = PITCH_ORDER.indexOf(step);
  index += direction;

  let newOctave = octave;

  if (index >= PITCH_ORDER.length) {
    index = 0;
    newOctave += 1;
  } else if (index < 0) {
    index = PITCH_ORDER.length - 1;
    newOctave -= 1;
  }

  return PITCH_ORDER[index] + newOctave;
}

let idCounter = 0;

// Guaranteed unique even when called many times in the same millisecond.
export function newNoteId(): string {
  return `n${Date.now()}_${idCounter++}`;
}

export function replaceWithRest(score: Score, id: string): void {
  const note = findNoteById(score, id);

  if (!note) {
    return;
  }

  note.pitch = null;
}

// Notes that start before the new note begins.
function notesBefore(measure: Measure, startTick: number): Note[] {
  const kept: Note[] = [];
  let tick = 0;

  for (const note of measure.notes) {
    if (tick >= startTick) break;
    kept.push(note);
    tick += durationTicks(note.duration, note.dots);
  }
  return kept;
}

// Notes that start at or after the new note ends.
function notesAfter(measure: Measure, endTick: number): Note[] {
  const kept: Note[] = [];
  let tick = 0;

  for (const note of measure.notes) {
    if (tick >= endTick) kept.push(note);
    tick += durationTicks(note.duration, note.dots);
  }
  return kept;
}

// Total ticks used by a list of notes.
function sumTicks(notes: Note[]): number {
  let total = 0;
  for (const note of notes) {
    total += durationTicks(note.duration, note.dots);
  }
  return total;
}

// Rest notes that add up to the given number of ticks (empty list if 0 or less).
function restsForGap(ticks: number): Note[] {
  if (ticks <= 0) {
    return [];
  }
  return restsToFill(ticks).map(({ duration, dots }) => ({
    id: newNoteId(),
    pitch: null,
    duration,
    dots
  }));
}

// Puts a note (or rest) into a measure at a specific tick position,
// replacing whatever was there and filling leftover space with rests.
// Returns the new note, or null if it doesn't fit in the measure.
export function placeNote(
  score: Score,
  measureIndex: number,
  startTick: number,
  pitch: string | null,
  duration: Duration,
  dots = 0
): Note | null {
  const measure = score.measures[measureIndex];
  const capacity = measureCapacity(timeSignatureAt(score, measureIndex));
  const endTick = startTick + durationTicks(duration, dots);

  if (endTick > capacity) {
    return null;
  }

  const before = notesBefore(measure, startTick);
  const after = notesAfter(measure, endTick);

  const gapBefore = startTick - sumTicks(before);
  const gapAfter = capacity - endTick - sumTicks(after);

  const newNote: Note = { id: newNoteId(), pitch, duration, dots };

  measure.notes = [
    ...before,
    ...restsForGap(gapBefore),
    newNote,
    ...restsForGap(gapAfter),
    ...after
  ];

  return newNote;
}

// Adds a measure filled with rests (a whole rest in 4/4).
export function addMeasure(score: Score): void {
  const capacity = measureCapacity(timeSignatureAt(score, score.measures.length));
  score.measures.push({ notes: restsForGap(capacity) });
}

// Where the last real note (not a filler rest) ends, in ticks.
function lastNoteEndTick(measure: Measure): number {
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

// Temporary: appends to the end of the score. This will be replaced once
// notes are placed by clicking a measure instead of a button.
export function addNote(score: Score, pitch: string | null, duration: Duration, dots = 0): Note {
  const lastIndex = score.measures.length - 1;
  const capacity = measureCapacity(timeSignatureAt(score, lastIndex));
  const startTick = lastNoteEndTick(score.measures[lastIndex]);
  const noteLength = durationTicks(duration, dots);

  if (startTick + noteLength > capacity) {
    addMeasure(score);
    return placeNote(score, score.measures.length - 1, 0, pitch, duration, dots)!;
  }

  return placeNote(score, lastIndex, startTick, pitch, duration, dots)!;
}