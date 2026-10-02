// Pure geometry helpers for positioning overlays (the active-measure
// highlight, the cursor target) over elements Verovio has already drawn.

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export function boxOf(element: Element): Box {
  const box = element.getBoundingClientRect();
  return { x: box.left, y: box.top, width: box.width, height: box.height };
}

// Left edge, vertical center - used as the "the next note goes here" point.
export function leftCenterOf(element: Element): Point {
  const box = element.getBoundingClientRect();
  return { x: box.left, y: (box.top + box.bottom) / 2 };
}

export function isWithinDistance(mouseX: number, mouseY: number, target: Point, maxDistance: number): boolean {
  const dx = Math.abs(mouseX - target.x);
  const dy = Math.abs(mouseY - target.y);
  return dx <= maxDistance && dy <= maxDistance;
}

export function measureIndexFromId(id: string): number {
  return parseInt(id.replace('m', ''), 10);
}