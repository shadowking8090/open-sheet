import type { Score, Note, Duration } from '../model/score';
   import { TICKS_PER_QUARTER, durationTicks, timeSignatureAt } from '../model/duration';

// MusicXML's own names for each note length (they don't always match ours).
const XML_TYPE: Record<Duration, string> = {
  whole: 'whole',
  half: 'half',
  quarter: 'quarter',
  eighth: 'eighth',
  sixteenth: '16th',
  thirtysecond: '32nd'
};

// Splits "C4" into { step: "C", octave: 4 }
function parsePitch(pitch: string): { step: string; octave: number } {
  return { step: pitch[0], octave: parseInt(pitch.slice(1), 10) };
}

function pitchOrRestXML(pitch: string | null, isFullMeasureRest: boolean): string {
  if (pitch === null) {
    if (isFullMeasureRest) {
      return '<rest measure="yes"/>';
    }
    return '<rest/>';
  }

  const { step, octave } = parsePitch(pitch);
  return `<pitch><step>${step}</step><octave>${octave}</octave></pitch>`;
}

function noteToXML(note: Note, isFullMeasureRest: boolean): string {
  const dots = note.dots ?? 0;

  return `
    <note id="${note.id}">
      ${pitchOrRestXML(note.pitch, isFullMeasureRest)}
      <duration>${durationTicks(note.duration, dots)}</duration>
      <type>${XML_TYPE[note.duration]}</type>
      ${'<dot/>'.repeat(dots)}
    </note>`;
}

// Clef, time signature, and rhythm resolution. Written once, in the first measure.
function attributesXML(score: Score): string {
  const { beats, beatType } = timeSignatureAt(score, 0);
  const { fifths } = score.keySignature;

  return `
      <attributes>
        <divisions>${TICKS_PER_QUARTER}</divisions>
        <key><fifths>${fifths}</fifths></key>
        <time><beats>${beats}</beats><beat-type>${beatType}</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>`;
}

function measureToXML(score: Score, measureIndex: number): string {
  const measure = score.measures[measureIndex];
  const isSingleRest = measure.notes.length === 1 && measure.notes[0].pitch === null;

  const notesXML = measure.notes
    .map(note => noteToXML(note, isSingleRest))
    .join('');

  const attributes = measureIndex === 0 ? attributesXML(score) : '';

  return `
    <measure number="${measureIndex + 1}" id="m${measureIndex}">${attributes}${notesXML}
    </measure>`;
}

export function scoreToMusicXML(score: Score): string {
  const measuresXML = score.measures.map((_, index) => measureToXML(score, index)).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1">
      <part-name>${score.title}</part-name>
    </score-part>
  </part-list>
  <part id="P1">${measuresXML}
  </part>
</score-partwise>`;
}