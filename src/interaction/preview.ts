import type { VerovioToolkit } from 'verovio/esm';
import type { Duration, Score } from '../model/score';
import { placeNote } from '../interaction/editing';
import { scoreToMusicXML } from '../render/toMusicXML';

export interface PreviewResult {
  svg: string;
  noteId: string;
}

// Renders a copy of the score with one extra note inserted at the given
// position, without touching the real score. Returns null if it doesn't fit.
export function renderPreview(
  toolkit: VerovioToolkit,
  score: Score,
  page: number,
  measureIndex: number,
  tick: number,
  pitch: string | null,
  duration: Duration,
  dots: number
): PreviewResult | null {
  const previewScore = structuredClone(score);
  const placed = placeNote(previewScore, measureIndex, tick, pitch, duration, dots);

  if (!placed) {
    return null;
  }

  toolkit.loadData(scoreToMusicXML(previewScore));
  const svg = toolkit.renderToSVG(page);
  return { svg, noteId: placed.id };
}