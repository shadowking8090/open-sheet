declare const MIDIjs: {
  play: (midiDataUrl: string) => void;
  stop: () => void;
  player_callback: (event: { time: number }) => void;
};