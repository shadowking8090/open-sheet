<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import type { VerovioToolkit } from "verovio/esm";
  import type { Duration } from "./model/score";
  import { testScore } from "./model/testData";
  import { scoreToMusicXML } from "./render/toMusicXML";
  import { initVerovio } from "./render/verovio";
  import { renderPreview } from "./interaction/preview";
  import { playMIDI, stopMIDI } from "./render/midi";
  import { loadFileIntoToolkit, downloadMEI } from "./io/files";
  import { selectNoteFromClick } from "./interaction/selection";
  import {findNoteById,transposePitch,addNote,replaceWithRest,addMeasure,noteIdAtTick,placeNote} from "./interaction/editing";
  import { activateMeasure, type Cursor } from "./interaction/cursor";
  import {measureUnderCursor,staffLineYs,pitchAtY} from "./interaction/hover";
  import { boxOf, measureIndexFromId, type Box } from "./interaction/placement";
  import Toolbar from "./ui/Toolbar.svelte";
  import {measureCapacity,lastNoteEndTick,durationTicks} from "./model/duration";
  import {leftCenterOf,isWithinDistance,type Point} from "./interaction/placement";

  let toolkit: VerovioToolkit;
  let notationHTML = "";  
  let currentPage = 1;

  let selectedNoteId: string | null = null;

  let toolDuration: Duration = "quarter";
  let toolDots = 0;
  let toolIsRest = false;

  let cursor: Cursor | null = null;
  let cursorTarget: Point | null = null;

  let activeMeasureBox: Box | null = null;
  let previewKey = ""; // skips re-rendering the preview when nothing changed

  onMount(async () => {
    toolkit = await initVerovio();
    rerenderScore();
    window.addEventListener("keydown", handleKeydown);
  });

  onDestroy(() => {
    window.removeEventListener("keydown", handleKeydown);
  });

  // ============ Rendering ============
  function rerenderScore() {
    toolkit.loadData(scoreToMusicXML(testScore));
    notationHTML = toolkit.renderToSVG(currentPage);
  }

  function reapplySelection() {
    if (!selectedNoteId) return;
    requestAnimationFrame(() => {
      document.getElementById(selectedNoteId!)?.classList.add("selected");
    });
  }

  let activeMeasureIndex: number | null = null;

  function reapplyActiveMeasure() {
    if (activeMeasureIndex === null) return;
    requestAnimationFrame(() => {
      const measureElement = document.getElementById(`m${activeMeasureIndex}`);
      if (measureElement) activeMeasureBox = boxOf(measureElement);
      updateCursorTarget();
    });
  }

  function refreshAfterEdit() {
    rerenderScore();
    reapplySelection();
    reapplyActiveMeasure();
  }

  function showPreview(pitch: string | null) {
    if (!cursor) return;

    const key = `${cursor.measureIndex}|${cursor.tick}|${pitch}|${toolDuration}|${toolDots}`;
    if (key === previewKey) return;
    previewKey = key;

    const result = renderPreview(
      toolkit,
      testScore,
      currentPage,
      cursor.measureIndex,
      cursor.tick,
      pitch,
      toolDuration,
      toolDots,
    );
    if (!result) return;

    notationHTML = result.svg;
    requestAnimationFrame(() => {
      document.getElementById(result.noteId)?.classList.add("preview-note");
    });
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
    const pitch = toolIsRest ? null : "C4";
    const newNote = addNote(testScore, pitch, toolDuration, toolDots);
    selectedNoteId = newNote.id;
    refreshAfterEdit();
  }

  function addMeasureToScore() {
    addMeasure(testScore);
    refreshAfterEdit();
  }

function placeAtCursor(pitch: string | null) {
  if (!cursor) return;

  const placed = placeNote(testScore, cursor.measureIndex, cursor.tick, pitch, toolDuration, toolDots);
  if (!placed) return;

  selectedNoteId = placed.id;

  const placedLength = durationTicks(toolDuration, toolDots);
  const newTick = cursor.tick + placedLength;
  const capacity = measureCapacity(testScore.timeSignature);

  if (newTick >= capacity) {
    advanceToNextMeasure(cursor.measureIndex);
  } else {
    cursor = { measureIndex: cursor.measureIndex, tick: newTick };
  }

  refreshAfterEdit();
}

function advanceToNextMeasure(currentMeasureIndex: number) {
  const nextIndex = currentMeasureIndex + 1;

  if (nextIndex >= testScore.measures.length) {
    addMeasure(testScore);
  }

  activeMeasureIndex = nextIndex;
  cursor = { measureIndex: nextIndex, tick: 0 };
}

  function handleKeydown(event: KeyboardEvent) {
    if (!selectedNoteId) return;

    switch (event.key) {
      case "Backspace":
        event.preventDefault(); // stop the browser's "go back" behavior
        deleteSelectedNote();
        break;
      case "ArrowUp":
        transposeSelectedNote(1);
        break;
      case "ArrowDown":
        transposeSelectedNote(-1);
        break;
    }
  }

  function handleNoteClick(event: MouseEvent) {
    const id = selectNoteFromClick(event);

    if (id) {
      selectedNoteId = id;
      cursor = null;
      activeMeasureIndex = null;
      activeMeasureBox = null;
      cursorTarget = null;
      return;
    }

    handleMeasureClick(event);
  }

  function handleMeasureClick(event: MouseEvent) {
    const container = event.currentTarget as HTMLElement;
    const measureElement = measureUnderCursor(container, event);
    if (!measureElement) return;

    const measureIndex = measureIndexFromId(measureElement.id);

    // If this measure is already active and the click landed on the cursor's
    // target spot, treat it as "place the note" rather than "re-activate".
    if (cursor && cursor.measureIndex === measureIndex && cursorTarget) {
      if (
        isWithinDistance(
          event.clientX,
          event.clientY,
          cursorTarget,
          PREVIEW_DISTANCE,
        )
      ) {
        const pitch = toolIsRest ? null : pitchFromEvent(event, measureElement);
        placeAtCursor(pitch);
        return;
      }
    }

    const measure = testScore.measures[measureIndex];
    const capacity = measureCapacity(testScore.timeSignature);

    activeMeasureIndex = measureIndex;
    activeMeasureBox = boxOf(measureElement);

    if (lastNoteEndTick(measure) >= capacity) {
      cursor = null;
      cursorTarget = null;
      return;
    }

    cursor = activateMeasure(measure, measureIndex);
    updateCursorTarget();
  }

  function pitchFromEvent(
    event: MouseEvent,
    measureElement: Element,
  ): string | null {
    const lineYs = staffLineYs(measureElement);
    if (lineYs.length !== 5) return null;
    return pitchAtY(event.clientY, lineYs);
  }
  function updateCursorTarget() {
    if (!cursor) {
      cursorTarget = null;
      return;
    }

    const measure = testScore.measures[cursor.measureIndex];
    const noteId = noteIdAtTick(measure, cursor.tick);
    const element = noteId ? document.getElementById(noteId) : null;

    cursorTarget = element ? leftCenterOf(element) : null;
  }

  const PREVIEW_DISTANCE = 40; // pixels

  function handleMouseMove(event: MouseEvent) {
    if (!cursor || !cursorTarget) return;

    if (
      !isWithinDistance(
        event.clientX,
        event.clientY,
        cursorTarget,
        PREVIEW_DISTANCE,
      )
    ) {
      if (previewKey !== "") {
        previewKey = "";
        rerenderScore();
        reapplySelection();
        reapplyActiveMeasure();
      }
      return;
    }

    if (toolIsRest) {
      showPreview(null);
      return;
    }

    const measureElement = document.getElementById(`m${cursor.measureIndex}`);
    if (!measureElement) return;

    const lineYs = staffLineYs(measureElement);
    if (lineYs.length !== 5) return;

    showPreview(pitchAtY(event.clientY, lineYs));
  }

  function handlePlay() {
    playMIDI(toolkit, {
      getCurrentPage: () => currentPage,
      onPageChange: (page) => {
        currentPage = page;
        notationHTML = toolkit.renderToSVG(page);
      },
    });
  }

  async function handleFileUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    await loadFileIntoToolkit(toolkit, file);
    currentPage = 1;
    notationHTML = toolkit.renderToSVG(currentPage);
  }
</script>

<h1>Hello Anna Chiv!</h1>

<div class="controls">
  <button on:click={handlePlay}>Play</button>
  <button on:click={stopMIDI}>Stop</button>
  <button on:click={() => downloadMEI(toolkit)}>Save as MEI</button>
  <button on:click={addToolNote}>Add Note</button>
  <button on:click={addMeasureToScore}>Add Measure</button>
  <input
    type="file"
    accept=".mei,.xml,.musicxml,.mxl"
    on:change={handleFileUpload}
  />
</div>

<Toolbar
  bind:duration={toolDuration}
  bind:dots={toolDots}
  bind:isRest={toolIsRest}
/>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div id="notation" on:click={handleNoteClick} on:mousemove={handleMouseMove}>
  {@html notationHTML}
</div>

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
