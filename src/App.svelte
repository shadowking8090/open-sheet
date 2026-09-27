<script lang="ts">
  import type { Score, Note, Duration } from './model/score';
  import { testScore } from './model/testData';
  import { scoreToMusicXML } from './render/toMusicXML';
  import { initVerovio } from './render/verovio';
  import { selectNoteFromClick } from './interaction/selection';
  import { findNoteById, transposePitch, addNote, replaceWithRest } from './interaction/editing';
  import { saveAs } from 'file-saver';
  import { onMount, onDestroy } from 'svelte';
  import type { VerovioToolkit } from 'verovio/esm';
  
  

  let notationHTML = '';
  let toolkit: VerovioToolkit
  
  let toolDuration: Duration = 'quarter';
  let toolDots = 0;
  let toolIsRest = false;

  onMount(async () => {
    toolkit = await initVerovio();
    const musicXML = scoreToMusicXML(testScore);
    toolkit.loadData(musicXML);
    notationHTML = toolkit.renderToSVG(1);

  
    window.addEventListener('keydown', handleKeydown);
 });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown);
  });

  let currentPage = 1;


  async function handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.mxl')) {
  
    const arrayBuffer = await file.arrayBuffer();
    toolkit.loadZipDataBuffer(arrayBuffer);
  } else {
    const fileContent = await file.text();
    toolkit.loadData(fileContent);
  }

  notationHTML = toolkit.renderToSVG(1);
 }

  function rerenderScore() {
    const musicXML = scoreToMusicXML(testScore);
    toolkit.loadData(musicXML);
    notationHTML = toolkit.renderToSVG(currentPage);
  }

  function reapplySelection() {
    if (!selectedNoteId) return;
    requestAnimationFrame(() => {
      document.getElementById(selectedNoteId!)?.classList.add('selected');
    });
  }
  
  function saveMEI() {
    const meiContent = toolkit.getMEI();
    const myBlob = new Blob([meiContent], { type: 'application/xml' });
    saveAs(myBlob, 'meifile.mei');
  }

  function playMIDIHandler(){
    const base64midi = toolkit.renderToMIDI();
    const midiString = 'data:audio/midi;base64,' + base64midi;
    MIDIjs.player_callback = midiHighlightHandler;
    MIDIjs.play(midiString)
  }

  function stopMIDIHandler(){
    MIDIjs.stop();
  }

  function midiHighlightHandler(event: {time: number}) {

    const playingNotes = document.querySelectorAll('g.note.playing');
    for (const playingNote of playingNotes){
      playingNote.classList.remove('playing');
    }

    const currentElements = toolkit.getElementsAtTime(event.time * 1000);
    
    if (currentElements.page == 0){
      return;
    }

    if (currentElements.page != currentPage) {
      currentPage = currentElements.page;
      notationHTML = toolkit.renderToSVG(currentPage)
    }

    for (const note of currentElements.notes){
      const noteElement = document.getElementById(note);
      if (noteElement){
        noteElement.classList.add('playing');
      }
    }
  }

  let selectedNoteId: string | null = null;

  function handleNoteClick(event: MouseEvent) {
    const id = selectNoteFromClick(event);
      if (id){
        selectedNoteId = id;
      }
  }

  function handleKeydown(event: KeyboardEvent){
    
    if (!selectedNoteId){
      return
      }
    
    if (event.key === 'Backspace') {
      event.preventDefault();
      replaceWithRest(testScore, selectedNoteId)
      rerenderScore();
      reapplySelection();

      return;
    }
    

    if (event.key !== "ArrowUp" && event.key !== "ArrowDown"){
      return
    }

    const note = findNoteById(testScore, selectedNoteId)

    if (!note || note.pitch === null){
      return
    }

    const direction = event.key === 'ArrowUp' ? 1: -1;
    note.pitch = transposePitch(note.pitch, direction);

    rerenderScore();
    reapplySelection();
  }

  function handleAddNote(){
    const pitch = toolIsRest ? null : 'C4';
    const newNote = addNote(testScore, pitch, toolDuration, toolDots);
    rerenderScore();
    selectedNoteId = newNote.id;
    reapplySelection();
  
  }
  

</script>
   
<h1>Hello Anna Chiv!</h1>
  <button on:click={playMIDIHandler}>Play</button>
  <button on:click={stopMIDIHandler}>Stop</button>
  <button on:click={saveMEI}>Save as MEI </button>  
  <button on:click={handleAddNote}>AddNote</button>
<input type="file" accept=".mei,.xml,.musicxml,.mxl" on:change={handleFileUpload} />

<div id="notation" on:click={handleNoteClick}>{@html notationHTML}</div>


<div class="toolbar">
  <label>
    Duration:
    <select bind:value={toolDuration}>
      <option value="whole">Whole</option>
      <option value="half">Half</option>
      <option value="quarter">Quarter</option>
      <option value="eighth">Eighth</option>
      <option value="sixteenth">Sixteenth</option>
      <option value="thirtysecond">thirtysecond</option>
    </select>
  </label>

  <label>
    <input type="checkbox" bind:checked={toolIsRest} />
    Rest
  </label>

  <label>
    <input
      type="checkbox"
      checked={toolDots > 0}
      on:change={(e) => toolDots = e.currentTarget.checked ? 1 : 0}
    />
    Dotted
  </label>
</div>

<style>
  #notation :global(g.note.playing){
    fill: cornflowerblue;
    color: cornflowerblue;
  }
  #notation :global(g.note.selected){
    fill: green;
    color: green;
  }
  #notation :global(g.rest) {
  fill: crimson;
  color: crimson;
}
</style>