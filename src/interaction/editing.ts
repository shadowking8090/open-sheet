  import type { Duration, Note, Score } from "../model/score";
  import { measureCapacity, timeSignatureAt, restsToFill } from '../model/duration';
  
  export function findNoteById(score: Score, id: string): Note | null {
    for (const measure of score.measures){
      for (const note of measure.notes){
        if (note.id == id){
          return note;
        }
      }
    }
    return null
  }

   export const PITCH_ORDER = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

  export function transposePitch(pitch: string, direction: 1 | -1): string {
    const step = pitch[0]
    const octave = parseInt(pitch.slice(1), 10);

    let index = PITCH_ORDER.indexOf(step);
    index += direction

    let newOctave = octave

    if (index >= PITCH_ORDER.length){
        index = 0
        newOctave += 1
    }
    else if (index < 0) {
        index = PITCH_ORDER.length - 1;
        newOctave -= 1;
    }

    return PITCH_ORDER[index] + newOctave
  }

  let idCounter = 0;

  // Guaranteed unique even when called many times in the same millisecond.
  export function newNoteId(): string {
    return `n${Date.now()}_${idCounter++}`;
  }

  export function addNote(score: Score, pitch: string | null, duration: Duration, dots?: number): Note {
    const newNote: Note = {
      id: newNoteId(),
      pitch,
      duration,
      dots
    };

    const lastMeasure = score.measures[score.measures.length - 1];
    lastMeasure.notes.push(newNote);

    return newNote
  }

  export function replaceWithRest(score: Score, id: string): void {
    const note = findNoteById(score,id);
    
    if (!note){
      return
    }

    note.pitch = null
  }

  // Adds a measure filled with rests (a whole rest in 4/4).
export function addMeasure(score: Score): void {
  const capacity = measureCapacity(timeSignatureAt(score, score.measures.length));

  const notes: Note[] = restsToFill(capacity).map(({ duration, dots }) => ({
    id: newNoteId(),
    pitch: null,
    duration,
    dots
  }));

  score.measures.push({ notes });
}