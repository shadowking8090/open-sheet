import { PITCH_ORDER } from './editing';

// Treble clef only for now (our XML always writes a treble clef).
// F5 is the top line. Counting notes as octave * 7 + letter position (C = 0), F5 = 38.
const TOP_LINE_INDEX = 38;

// Returns the measure the mouse is currently inside, or null if none.
export function measureUnderCursor(
  container: HTMLElement,
  event: MouseEvent
): Element | null {
  const measures = container.querySelectorAll('g.measure');

  for (const measure of measures) {
    const box = measure.getBoundingClientRect();
    const isInside =
      event.clientX >= box.left && event.clientX <= box.right &&
      event.clientY >= box.top && event.clientY <= box.bottom;

    if (isInside) return measure;
  }
  return null;
}

// The on-screen Y position of each of the five staff lines in a measure.
export function staffLineYs(measure: Element): number[] {
  const lines = measure.querySelectorAll(':scope > g.staff > path');

  return Array.from(lines).slice(0, 5).map(line => {
    const box = line.getBoundingClientRect();
    return (box.top + box.bottom) / 2;
  });
}

// The distance between two neighboring staff lines, in pixels.
export function lineSpacingOf(lineYs: number[]): number {
  return (lineYs[4] - lineYs[0]) / 4;
}

// How many line/space steps below the top line the mouse is (snapped to a whole step).
function stepsDownAt(mouseY: number, lineYs: number[]): number {
  const halfStep = lineSpacingOf(lineYs) / 2;
  return Math.round((mouseY - lineYs[0]) / halfStep);
}

// The on-screen Y of the nearest line or space, for drawing the ghost note.
export function snappedY(mouseY: number, lineYs: number[]): number {
  const halfStep = lineSpacingOf(lineYs) / 2;
  return lineYs[0] + stepsDownAt(mouseY, lineYs) * halfStep;
}

// The pitch at the mouse position, like "E4".
export function pitchAtY(mouseY: number, lineYs: number[]): string {
  const index = TOP_LINE_INDEX - stepsDownAt(mouseY, lineYs);
  const octave = Math.floor(index / 7);
  const letter = PITCH_ORDER[((index % 7) + 7) % 7];
  return letter + octave;
}