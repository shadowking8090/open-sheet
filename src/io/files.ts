import { saveAs } from 'file-saver';
import type { VerovioToolkit } from 'verovio/esm';

// Loads .mei / .musicxml / .xml (text) or .mxl (zipped) into Verovio.
export async function loadFileIntoToolkit(toolkit: VerovioToolkit, file: File): Promise<void> {
  if (file.name.endsWith('.mxl')) {
    toolkit.loadZipDataBuffer(await file.arrayBuffer());
  } else {
    toolkit.loadData(await file.text());
  }
}

export function downloadMEI(toolkit: VerovioToolkit): void {
  const blob = new Blob([toolkit.getMEI()], { type: 'application/xml' });
  saveAs(blob, 'meifile.mei');
}