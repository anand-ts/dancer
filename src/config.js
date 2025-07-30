// Application configuration
export const AUDIO_CONFIG = {
  FFT_SIZE: 2048, // Increased for better frequency resolution (1024 bins)
  SMOOTHING: 0.90,
  FREQUENCY_CUTOFF: 0.65, // Use 65% of frequency data - focus on most active musical range
  HEIGHT_MARGIN: 1.00, 
  MIN_THRESHOLD: 0.01,
  // Frequency range mapping for better bass/mid/treble distribution
  // These values match the visual bar distribution (30% bass, 40% mid, 30% treble)
  BASS_CUTOFF: 0.15,    // First 15% of frequency bins for bass (roughly 20-650 Hz)
  MID_CUTOFF: 0.45,     // Next 30% for mids (roughly 650-4300 Hz) 
  TREBLE_CUTOFF: 0.65   // Remaining 20% for treble (roughly 4300-14000 Hz)
};

export const VISUAL_CONFIG = {
  HUE_RANGE: 280,
  BASE_SATURATION: 70,
  SATURATION_RANGE: 30,
  BASE_LIGHTNESS: 45,
  LIGHTNESS_RANGE: 25,
  BAR_GAP: 2
};

export const STATUS_MESSAGES = {
  LOADING: 'Loading audio...',
  READY: 'Ready to play - Click play button',
  LOADED: 'Audio loaded successfully',
  VISUALIZING: 'Visualizing audio',
  PAUSED: 'Paused'
};

export const DOM_ELEMENTS = {
  CANVAS: 'waveform-canvas',
  AUDIO_PLAYER: 'audio-player',
  PLAY_BUTTON: 'play-button',
  STATUS: 'status',
  LEVEL_FILL: 'level-fill',
  LEVEL_TEXT: 'level-text'
};
