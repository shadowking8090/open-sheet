import type { Score, Note, Duration } from '../model/score';

// Splits "C4" into { step: "C", octave: 4 }
function parsePitch(pitch: string): { step: string; octave: number } {
  const step = pitch[0];
  const octave = parseInt(pitch.slice(1), 10);
  return { step, octave };
}

// Maps our duration names to MusicXML's expected values + divisions count
const DIVISIONS_PER_QUARTER = 16;

const DURATION_TABLE: Record<Duration, { type: string; divisions: number }> = {
  whole:     { type: 'whole',     divisions: DIVISIONS_PER_QUARTER * 4 },
  half:      { type: 'half',      divisions: DIVISIONS_PER_QUARTER * 2 },
  quarter:   { type: 'quarter',   divisions: DIVISIONS_PER_QUARTER },
  eighth:    { type: 'eighth',    divisions: DIVISIONS_PER_QUARTER / 2 },
  sixteenth: { type: '16th', divisions: DIVISIONS_PER_QUARTER / 4 },
  thirtysecond: { type: '32nd', divisions: DIVISIONS_PER_QUARTER / 8}
};

function durationInfo(duration: Duration) {
  return DURATION_TABLE[duration];
}

function dotMultiplier(dots: number): number {
  if (dots === 2) return 1.75;
  if (dots === 1) return 1.5;
  return 1;
}

function pitchOrRestXML(pitch: string | null): string {
  if (pitch === null) return '<rest/>';
  const { step, octave } = parsePitch(pitch);
  return `<pitch><step>${step}</step><octave>${octave}</octave></pitch>`;
}

function noteToXML(note: Note): string {
  const { type, divisions } = durationInfo(note.duration);
  const dots = note.dots ?? 0;

  return `
    <note id="${note.id}">
      ${pitchOrRestXML(note.pitch)}
      <duration>${divisions * dotMultiplier(dots)}</duration>
      <type>${type}</type>
      ${'<dot/>'.repeat(dots)}
    </note>`;
}


export function scoreToMusicXML(score: Score): string {
  const measuresXML = score.measures
    .map((measure, index) => {
      const notesXML = measure.notes.map(noteToXML).join('');
      return `
    <measure number="${index + 1}">
      ${index === 0 ? `
      <attributes>
        <divisions>${DIVISIONS_PER_QUARTER}</divisions>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>` : ''}
      ${notesXML}
    </measure>`;
    })
    .join('');

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