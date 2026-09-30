<script lang="ts">
  import { measureRemaining } from './model/duration';
  import { onMount, onDestroy } from 'svelte';
  import type { VerovioToolkit } from 'verovio/esm';
  import type { Duration } from './model/score';
  import { testScore } from './model/testData';
  import { scoreToMusicXML } from './render/toMusicXML';
  import { initVerovio } from './render/verovio';
  import { playMIDI, stopMIDI } from './render/midi';
  import { loadFileIntoToolkit, downloadMEI } from './io/files';
  import { selectNoteFromClick } from './interaction/selection';
  import { findNoteById, transposePitch, addNote, replaceWithRest, addMeasure } from './interaction/editing';
  import Toolbar from './ui/Toolbar.svelte';

  let toolkit: VerovioToolkit;
  let notationHTML = '';
  let currentPage = 1;

  let selectedNoteId: string | null = null;

  let toolDuration: Duration = 'quarter';
  let toolDots = 0;
  let toolIsRest = false;

  onMount(async () => {
    toolkit = await initVerovio();
    rerenderScore();
    window.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown);
  });

  function rerenderScore() {
    toolkit.loadData(scoreToMusicXML(testScore));
    notationHTML = toolkit.renderToSVG(currentPage);
  }

  function reapplySelection() {
    if (!selectedNoteId) return;
    requestAnimationFrame(() => {
      document.getElementById(selectedNoteId!)?.classList.add('selected');
    });
  }

  function refreshAfterEdit() {
    rerenderScore();
    reapplySelection();
  }

  function deleteSelectedNote() {
    if (!selectedNoteId) return;
    replaceWithRest(testScore, selectedNoteId);
    refreshAfterEdit();
  }

  function transposeSelectedNote(direction: 1 | -1) {
    if (!selectedNoteId) return;
    const note = findNoteById(testScore, selectedNoteId);
    if (!note || note.pitch === null) return;
    note.pitch = transposePitch(note.pitch, direction);
    refreshAfterEdit();
  }

  function addToolNote() {
    const pitch = toolIsRest ? null : 'C4';
    const newNote = addNote(testScore, pitch, toolDuration, toolDots);
    selectedNoteId = newNote.id;
    refreshAfterEdit();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!selectedNoteId) return;

    switch (event.key) {
      case 'Backspace':
        event.preventDefault(); // stop the browser's "go back" behavior
        deleteSelectedNote();
        break;
      case 'ArrowUp':
        transposeSelectedNote(1);
        break;
      case 'ArrowDown':
        transposeSelectedNote(-1);
        break;
    }
  }

  function handleNoteClick(event: MouseEvent) {
    const id = selectNoteFromClick(event);
    if (id) selectedNoteId = id;
  }

  function handlePlay() {
    playMIDI(toolkit, {
      getCurrentPage: () => currentPage,
      onPageChange: (page) => {
        currentPage = page;
        notationHTML = toolkit.renderToSVG(page);
      }
    });
  }

  async function handleFileUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    await loadFileIntoToolkit(toolkit, file);
    currentPage = 1;
    notationHTML = toolkit.renderToSVG(currentPage);
  }

  function addMeasureToScore() {
  addMeasure(testScore);
  refreshAfterEdit();
}

</script>

<h1>Hello Anna Chiv!</h1>

<div class="controls">
  <button on:click={handlePlay}>Play</button>
  <button on:click={stopMIDI}>Stop</button>
  <button on:click={() => downloadMEI(toolkit)}>Save as MEI</button>
  <button on:click={addToolNote}>Add Note</button>
  <button on:click={addMeasureToScore}>Add Measure</button>
  <input type="file" accept=".mei,.xml,.musicxml,.mxl" on:change={handleFileUpload} />
</div>

<Toolbar bind:duration={toolDuration} bind:dots={toolDots} bind:isRest={toolIsRest} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  id="notation"
  on:click={handleNoteClick}
>{@html notationHTML}</div>

<style>
  #notation :global(g.note.playing) {
    fill: cornflowerblue;
    color: cornflowerblue;
  }
  #notation :global(g.note.selected) {
    fill: green;
    color: green;
  }
  #notation :global(g.rest) {
    fill: crimson;
    color: crimson;
  }
</style>