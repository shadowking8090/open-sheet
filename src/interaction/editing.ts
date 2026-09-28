  import type { Duration, Note, Score } from "../model/score";
  
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

  export function addNote(score: Score, pitch: string | null, duration: Duration, dots?: number): Note {
    const newNote: Note = {
      id: `n${Date.now()}`,
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