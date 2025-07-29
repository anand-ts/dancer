// Application configuration
export const AUDIO_CONFIG = {
  FFT_SIZE: 512,
  SMOOTHING: 0.8,
  FREQUENCY_CUTOFF: 0.7, // Use 70% of frequency data
  HEIGHT_MARGIN: 0.85,   // Leave 15% margin
  MIN_THRESHOLD: 0.02
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
