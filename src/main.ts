import { mount } from 'svelte'
import App from './App.svelte'
import * as verovio from 'verovio';

// 1. Wait for the WebAssembly runtime to load
verovio.module.onRuntimeInitialized = () => {
  console.log('Verovio WASM module successfully loaded!');

  // 2. Instantiate the toolkit
  const tk = new verovio.toolkit();

  // 3. (Optional) Test it by checking the version
  console.log('Verovio Version:', tk.getVersion());
};


const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
