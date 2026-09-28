<script lang="ts">
  import type { Duration } from '../model/score';

  // Values passed in by whoever uses this component (like function parameters).
  export let x: number;
  export let y: number;
  export let size: number;        // distance between two staff lines, in pixels
  export let duration: Duration;
  export let dots = 0;
  export let isRest = false;

  // How each duration looks. Adding a 32nd note later means adding one line here.
  const NOTE_SHAPES: Record<Duration, { filled: boolean; hasStem: boolean; flags: number }> = {
    whole:     { filled: false, hasStem: false, flags: 0 },
    half:      { filled: false, hasStem: true,  flags: 0 },
    quarter:   { filled: true,  hasStem: true,  flags: 0 },
    eighth:    { filled: true,  hasStem: true,  flags: 1 },
    sixteenth: { filled: true,  hasStem: true,  flags: 2 },
    thirtysecond: { filled: true, hasStem: true, flags: 3 }
  };

  // "$:" means "recalculate these whenever the values they use change".
  $: shape = NOTE_SHAPES[duration];
  $: stroke = size * 0.12;
  $: stemX = size * 0.62;
  $: stemTop = -size * 3.5;
</script>

<!-- Everything below is drawn relative to (0, 0), the center of the notehead. -->
<div class="ghost" style="left: {x}px; top: {y}px;">
  <svg width="1" height="1">
    {#if isRest}
      <rect x={-size * 0.6} y={-size * 0.25} width={size * 1.2} height={size * 0.5} fill="black" />
    {:else}
      <ellipse
        cx="0" cy="0" rx={size * 0.65} ry={size * 0.5}
        fill={shape.filled ? 'black' : 'none'}
        stroke="black" stroke-width={stroke}
      />

      {#if shape.hasStem}
        <line x1={stemX} y1="0" x2={stemX} y2={stemTop} stroke="black" stroke-width={stroke} />
      {/if}

      {#each Array(shape.flags) as _, i}
        <line
          x1={stemX} y1={stemTop + i * size * 0.6}
          x2={stemX + size * 0.7} y2={stemTop + i * size * 0.6 + size}
          stroke="black" stroke-width={stroke}
        />
      {/each}
    {/if}

    {#each Array(dots) as _, i}
      <circle cx={size * 1.1 + i * size * 0.45} cy={-size * 0.25} r={size * 0.15} fill="black" />
    {/each}
  </svg>
</div>

<style>
  .ghost {
    position: fixed;
    opacity: 0.35;
    pointer-events: none;
  }

  svg {
    overflow: visible;
  }
</style>