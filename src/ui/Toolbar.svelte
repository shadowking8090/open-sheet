<script lang="ts">
  import type { Duration } from '../model/score';

  // Passed in by the parent. With bind:, changes flow back up to the parent too.
  export let duration: Duration;
  export let dots: number;
  export let isRest: boolean;

  // Adding a new duration to the dropdown means adding one line here.
  const DURATION_OPTIONS: { value: Duration; label: string }[] = [
    { value: 'whole', label: 'Whole' },
    { value: 'half', label: 'Half' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'eighth', label: 'Eighth' },
    { value: 'sixteenth', label: 'Sixteenth' },
    { value: 'thirtysecond', label: '32nd' }
  ];

  // A checkbox can only be true/false, but dots is a number, so we translate.
  function setDotted(event: Event) {
    dots = (event.currentTarget as HTMLInputElement).checked ? 1 : 0;
  }
</script>

<div class="toolbar">
  <label>
    Duration:
    <select bind:value={duration}>
      {#each DURATION_OPTIONS as option}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
  </label>

  <label>
    <input type="checkbox" bind:checked={isRest} />
    Rest
  </label>

  <label>
    <input type="checkbox" checked={dots > 0} on:change={setDotted} />
    Dotted
  </label>
</div>