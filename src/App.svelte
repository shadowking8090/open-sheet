<script lang="ts">
  import type { Score } from './models/score';
  import { saveAs } from 'file-saver';
  import { onMount } from 'svelte';
  import createVerovioModule from 'verovio/wasm';
  import { VerovioToolkit } from 'verovio/esm';

  let notationHTML = '';
  let toolkit: VerovioToolkit

  onMount(async () => {
    const VerovioModule = await createVerovioModule();
    toolkit = new VerovioToolkit(VerovioModule);
    console.log('Verovio has loaded!');

    const response = await fetch(
      'https://www.verovio.org/examples/downloads/Schubert_Lindenbaum.mei'
    );
    const meiXML = await response.text();

    toolkit.setOptions({
      scale: 50,
      landscape: true,
      adjustPageWidth: true
    });

    let rests = document.querySelectorAll('g.rest');
    
    console.log("Verovio options:", toolkit.getOptions())

    toolkit.loadData(meiXML);
    notationHTML = toolkit.renderToSVG(1);
  });

  let currentPage = 1;

  const testScore: Score = {
    title: 'My First Melody',
    measures: [
      {
        notes: [
          { id: 'n1', pitch: 'C4', duration: 'quarter' },
          { id: 'n2', pitch: 'E4', duration: 'quarter' },
          { id: 'n3', pitch: 'G4', duration: 'half' }
        ]
      }
    ]
  };

  console.log(testScore);
  
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
</script>

<h1>Hello Verovio!</h1>
<div id="notation">{@html notationHTML}
  <button on:click={playMIDIHandler}>Play</button>
  <button on:click={stopMIDIHandler}>Stop</button>
  <button on:click={saveMEI}>Save as MEI </button>  
</div>

<style>
  #notation :global(g.rest){
    fill: crimson;
    color: crimson;
  }

  #notation :global(g.note.playing){
    fill: cornflowerblue;
    color: cornflowerblue;
  }
</style>