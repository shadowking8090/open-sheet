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

function pitchOrRestXML(pitch: string | null): string {
  if (pitch === null) return '<rest/>';
  const { step, octave } = parsePitch(pitch);
  return `<pitch><step>${step}</step><octave>${octave}</octave></pitch>`;
}

function noteToXML(note: Note): string {
  const dots = note.dots ?? 0;

  return `
    <note id="${note.id}">
      ${pitchOrRestXML(note.pitch)}
      <duration>${durationTicks(note.duration, dots)}</duration>
      <type>${XML_TYPE[note.duration]}</type>
      ${'<dot/>'.repeat(dots)}
    </note>`;
}

// Clef, time signature, and rhythm resolution. Written once, in the first measure.
function attributesXML(score: Score): string {
  const { beats, beatType } = timeSignatureAt(score, 0);

  return `
      <attributes>
        <divisions>${TICKS_PER_QUARTER}</divisions>
        <time><beats>${beats}</beats><beat-type>${beatType}</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>`;
}

function measureToXML(score: Score, measureIndex: number): string {
  const notesXML = score.measures[measureIndex].notes.map(noteToXML).join('');
  const attributes = measureIndex === 0 ? attributesXML(score) : '';

  return `
    <measure number="${measureIndex + 1}">${attributes}${notesXML}
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