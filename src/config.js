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

export const VISUALIZER_TYPES = {
  FREQUENCY_BARS: 'frequency-bars',
  CIRCULAR_SPECTRUM: 'circular-spectrum', 
  WAVEFORM: 'waveform',
  PARTICLE_FIELD: 'particle-field',
  RADIAL_BARS: 'radial-bars',
  MATRIX_RAIN: 'matrix-rain'
};

export const VISUALIZER_CONFIG = {
  DEFAULT_TYPE: VISUALIZER_TYPES.FREQUENCY_BARS,
  PARTICLE_COUNT: 150,
  MATRIX_COLUMN_WIDTH: 20,
  WAVEFORM_TRAIL_LENGTH: 5,
  ANIMATION_SPEED: 0.016
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
  LEVEL_TEXT: 'level-text',
  TRACK_INFO: 'track-info',
  MINIMIZE_BUTTON: 'minimize-button',
  MINI_PLAYER: 'mini-player',
  MINI_TRACK_INFO: 'mini-track-title',
  MINI_PLAY_BUTTON: 'mini-play-button',
  MINI_NEXT_BUTTON: 'mini-next-button'
};
