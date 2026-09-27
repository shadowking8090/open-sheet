// src/render/verovio.ts
import createVerovioModule from 'verovio/wasm';
import { VerovioToolkit } from 'verovio/esm';

export async function initVerovio(): Promise<VerovioToolkit> {
  const VerovioModule = await createVerovioModule();
  const toolkit = new VerovioToolkit(VerovioModule);
  toolkit.setOptions({
    scale: 60,
    landscape: true,
    adjustPageWidth: true
  });
  return toolkit;
}