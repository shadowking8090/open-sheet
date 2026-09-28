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

function clearPlayingHighlight() {
  document.querySelectorAll('g.note.playing').forEach(el => el.classList.remove('playing'));
}

function highlightPlayingNotes(seconds: number, toolkit: VerovioToolkit, callbacks: PlaybackCallbacks) {
  clearPlayingHighlight();

  const current = toolkit.getElementsAtTime(seconds * 1000); // Verovio wants milliseconds
  if (current.page === 0) return;

  if (current.page !== callbacks.getCurrentPage()) {
    callbacks.onPageChange(current.page);
  }

  for (const noteId of current.notes) {
    document.getElementById(noteId)?.classList.add('playing');
  }
}