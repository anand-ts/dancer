import { AUDIO_CONFIG, VISUAL_CONFIG, STATUS_MESSAGES } from '../config.js';

export default class VisualizationRenderer {
  constructor(domCache, statusManager) {
    this.canvas = domCache.get('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.statusManager = statusManager;
    this.animationId = null;
    
    // Make canvas responsive
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  startVisualization(audioManager) {
    const draw = () => {
      if (audioManager.isPaused()) return;
      
      const frequencyData = audioManager.getFrequencyData();
      if (!frequencyData) return;
      
      this.renderFrequencyBars(frequencyData);
      this.statusManager.updateAudioLevel(audioManager.calculateAudioLevel());
      
      this.animationId = requestAnimationFrame(draw);
    };
    
    draw();
  }

  renderFrequencyBars(frequencyData) {
    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const usefulBins = Math.floor(frequencyData.length * AUDIO_CONFIG.FREQUENCY_CUTOFF);
    // Use fewer bars focused on the most active musical frequencies
    const numBars = Math.min(76, usefulBins); // Cap at 76 bars to eliminate all dead zones
    const barWidth = this.canvas.width / numBars;
    const maxHeight = this.canvas.height * AUDIO_CONFIG.HEIGHT_MARGIN;
    
    for (let i = 0; i < numBars; i++) {
      this.renderSingleBar(i, numBars, frequencyData, barWidth, maxHeight);
    }
  }

  renderSingleBar(index, totalBars, frequencyData, barWidth, maxHeight) {
    // Map the visual bar index to the frequency data with proper frequency distribution
    const usefulBins = Math.floor(frequencyData.length * AUDIO_CONFIG.FREQUENCY_CUTOFF);
    
    // Calculate which frequency range this bar represents
    const normalizedIndex = index / totalBars;
    let scaledIndex;
    
    if (normalizedIndex < 0.3) {
      // First 30% of visual bars = Bass range (use first 15% of frequency bins)
      const bassProgress = normalizedIndex / 0.3;
      scaledIndex = Math.floor(bassProgress * usefulBins * AUDIO_CONFIG.BASS_CUTOFF);
    } else if (normalizedIndex < 0.7) {
      // Next 40% of visual bars = Mid range (use next 30% of frequency bins)
      const midProgress = (normalizedIndex - 0.3) / 0.4;
      const bassEnd = usefulBins * AUDIO_CONFIG.BASS_CUTOFF;
      const midRange = usefulBins * (AUDIO_CONFIG.MID_CUTOFF - AUDIO_CONFIG.BASS_CUTOFF);
      scaledIndex = Math.floor(bassEnd + (midProgress * midRange));
    } else {
      // Last 30% of visual bars = Treble range (use remaining frequency bins)
      const trebleProgress = (normalizedIndex - 0.7) / 0.3;
      const midEnd = usefulBins * AUDIO_CONFIG.MID_CUTOFF;
      const trebleRange = usefulBins * (AUDIO_CONFIG.TREBLE_CUTOFF - AUDIO_CONFIG.MID_CUTOFF);
      scaledIndex = Math.floor(midEnd + (trebleProgress * trebleRange));
    }
    
    const value = frequencyData[scaledIndex];
    
    // Calculate bar properties
    const normalizedValue = Math.max(value / 255, AUDIO_CONFIG.MIN_THRESHOLD);
    const barHeight = normalizedValue * maxHeight;
    
    // Generate color based on frequency and amplitude
    const hue = (index / totalBars) * VISUAL_CONFIG.HUE_RANGE;
    const saturation = VISUAL_CONFIG.BASE_SATURATION + (normalizedValue * VISUAL_CONFIG.SATURATION_RANGE);
    const lightness = VISUAL_CONFIG.BASE_LIGHTNESS + (normalizedValue * VISUAL_CONFIG.LIGHTNESS_RANGE);
    
    this.ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    
    // Draw bar from bottom up
    this.ctx.fillRect(
      index * barWidth,
      this.canvas.height - barHeight,
      barWidth - VISUAL_CONFIG.BAR_GAP,
      barHeight
    );
  }

  stopVisualization() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    this.drawStaticWaveform();
    this.statusManager.resetAudioLevel();
    this.statusManager.setStatus(STATUS_MESSAGES.PAUSED);
  }

  drawStaticWaveform() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
