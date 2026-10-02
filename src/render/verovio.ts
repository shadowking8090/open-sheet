// src/render/verovio.ts
import createVerovioModule from 'verovio/wasm';
import { VerovioToolkit } from 'verovio/esm';

export async function initVerovio(): Promise<VerovioToolkit> {
  const toolkit = new VerovioToolkit(await createVerovioModule());
  toolkit.setOptions({
    scale: 60,
    pageWidth: 2100,
    pageHeight: 10000, 
    adjustPageHeight: true
  });
  return toolkit;
}