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
import { findNoteById, transposePitch, addNote, replaceWithRest, addMeasure, findNotePosition, placeNote } from './interaction/editing';
import Toolbar from './ui/Toolbar.svelte';
import { activateMeasure, type Cursor } from './interaction/cursor';
import { measureUnderCursor } from './interaction/hover';

let toolkit: VerovioToolkit;
let notationHTML = '';
let currentPage = 1;

let selectedNoteId: string | null = null;

let toolDuration: Duration = 'quarter';
let toolDots = 0;
let toolIsRest = false;

let cursor: Cursor | null = null

let activeMeasureBox: { x: number; y: number; width: number; height: number } | null = null;

let previewKey = '';

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

function reapplyActiveMeasure() {
  if (!cursor) {
    return;
  }
  requestAnimationFrame(() => {
    const measureElement = document.getElementById(`m${cursor!.measureIndex}`);
    if (measureElement) {
      updateActiveMeasureBox(measureElement);
    }
  });
}

function showPreview() {
  if (!cursor) {
    return;
  }

  const pitch = toolIsRest ? null : 'C4'; // pitch will come from the mouse later
  const key = `${cursor.measureIndex}|${cursor.tick}|${pitch}|${toolDuration}|${toolDots}`;

  if (key === previewKey) {
    return;
  }
  previewKey = key;

  const previewScore = structuredClone(testScore);
  const placed = placeNote(previewScore, cursor.measureIndex, cursor.tick, pitch, toolDuration, toolDots);

  if (!placed) {
    return;
  }

  toolkit.loadData(scoreToMusicXML(previewScore));
  notationHTML = toolkit.renderToSVG(currentPage);

  requestAnimationFrame(() => {
    document.getElementById(placed.id)?.classList.add('preview-note');
  });
}

function refreshAfterEdit() {
  rerenderScore();
  reapplySelection();
  reapplyActiveMeasure();
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

function handleMouseMove(event: MouseEvent) {
  showPreview();
}

function handleNoteClick(event: MouseEvent) {
  const id = selectNoteFromClick(event);
  
  if (id){
    selectedNoteId = id;
    
    const position = findNotePosition(testScore, id);
    if (position) {
      cursor = { measureIndex: position.measureIndex, tick: position.tick};

      const measureElement = document.getElementById(`m${position.measureIndex}`);
      if (measureElement) {
        updateActiveMeasureBox(measureElement);
      }
    }
    return;
  }

  handleMeasureClick(event);
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

function updateActiveMeasureBox(measureElement: Element) {
  const box = measureElement.getBoundingClientRect();
  activeMeasureBox = { x: box.left, y: box.top, width: box.width, height: box.height };
}

function handleMeasureClick(event: MouseEvent) {
  const container = event.currentTarget as HTMLElement;
  const measure = measureUnderCursor(container, event);

  if (!measure) {
    return;
  }

  const measureIndex = parseInt(measure.id.replace('m', ''), 10);
  cursor = activateMeasure(measureIndex);
  updateActiveMeasureBox(measure);
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
  on:mousemove={handleMouseMove}
>{@html notationHTML}</div>

{#if activeMeasureBox}
  <div
    class="active-measure-highlight"
    style="left: {activeMeasureBox.x}px; top: {activeMeasureBox.y}px; width: {activeMeasureBox.width}px; height: {activeMeasureBox.height}px;"
  ></div>
{/if}



<style>
  #notation :global(g.note.playing),
  #notation :global(g.rest.playing) {
    fill: cornflowerblue;
    color: cornflowerblue;
  }
  #notation :global(g.note.selected) {
    fill: green;
    color: green;
  }
  #notation :global(g.note.preview-note) {
    opacity: 0.4;
  }
  .active-measure-highlight {
  position: fixed;
  background: rgba(0, 100, 255, 0.08);
  pointer-events: none;
  }
</style>