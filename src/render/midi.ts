import type { VerovioToolkit } from 'verovio/esm';

// What playback needs from the app, without knowing anything about Svelte.
export interface PlaybackCallbacks {
  getCurrentPage: () => number;
  onPageChange: (page: number) => void;
}

export function playMIDI(toolkit: VerovioToolkit, callbacks: PlaybackCallbacks) {
  const base64midi = toolkit.renderToMIDI();
  MIDIjs.player_callback = (event) => highlightPlayingNotes(event.time, toolkit, callbacks);
  MIDIjs.play('data:audio/midi;base64,' + base64midi);
}

export function stopMIDI() {
  MIDIjs.stop();
}

const PLAYING_SELECTOR = 'g.note.playing, g.rest.playing';

function clearPlayingHighlight() {
  document.querySelectorAll(PLAYING_SELECTOR).forEach(el => el.classList.remove('playing'));
}

function highlightPlayingNotes(seconds: number, toolkit: VerovioToolkit, callbacks: PlaybackCallbacks) {
  clearPlayingHighlight();

  // Verovio's type definitions are missing "rests", even though the toolkit
  // returns them at runtime. This cast adds the field back so we can use it.
  const current = toolkit.getElementsAtTime(seconds * 1000) as {
    page: number;
    notes: string[];
    rests: string[];
  };

  if (current.page === 0) return;

  if (current.page !== callbacks.getCurrentPage()) {
    callbacks.onPageChange(current.page);
  }

  for (const id of current.notes) {
    document.getElementById(id)?.classList.add('playing');
  }
  for (const id of current.rests) {
    document.getElementById(id)?.classList.add('playing');
  }
}