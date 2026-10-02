export function measureUnderCursor(container: HTMLElement, event: MouseEvent): Element | null {
    const measures = container.querySelectorAll('g.measure');

    for (const measure of measures) {
        const box = measure.getBoundingClientRect();
        const isInsideX = event.clientX >= box.left && event.clientX <= box.right;
        const isInsideY = event.clientY >= box.top && event.clientY <= box.bottom;

        if (isInsideX && isInsideY) {
            return measure
        }
    }
    return null;
}

// The on-screen Y position of each of the five staff lines in a measure.
export function staffLineYs(measureElement: Element): number[] {
  const lines = measureElement.querySelectorAll(':scope > g.staff > path');

  const positions: number[] = [];
  for (const line of Array.from(lines).slice(0, 5)) {
    const box = line.getBoundingClientRect();
    positions.push((box.top + box.bottom) / 2);
  }
  return positions;
}

const PITCH_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

// Treble clef only for now. F5 sits on the top line.
// Counting notes as octave * 7 + letter position (C = 0), F5 = 38.
const TOP_LINE_NOTE_INDEX = 38;

// How many line/space steps below the top line a Y position is, rounded to
// the nearest whole step.
function stepsBelowTopLine(mouseY: number, lineYs: number[]): number {
  const lineSpacing = (lineYs[4] - lineYs[0]) / 4;
  const halfStep = lineSpacing / 2;
  return Math.round((mouseY - lineYs[0]) / halfStep);
}

// The pitch nearest a Y position, like "E4".
export function pitchAtY(mouseY: number, lineYs: number[]): string {
  const noteIndex = TOP_LINE_NOTE_INDEX - stepsBelowTopLine(mouseY, lineYs);
  const octave = Math.floor(noteIndex / 7);
  const letterIndex = ((noteIndex % 7) + 7) % 7; // keeps the result 0-6, even for low notes
  return PITCH_LETTERS[letterIndex] + octave;
}