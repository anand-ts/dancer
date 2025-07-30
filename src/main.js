// Import configuration
import { AUDIO_CONFIG, VISUAL_CONFIG, STATUS_MESSAGES, DOM_ELEMENTS } from './config.js';

// Drag handler for making elements draggable
class DragHandler {
  constructor(element) {
    this.element = element;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    
    this.setupDragEvents();
  }
  
  setupDragEvents() {
    this.element.addEventListener('mousedown', (e) => this.startDrag(e));
    document.addEventListener('mousemove', (e) => this.drag(e));
    document.addEventListener('mouseup', () => this.stopDrag());
    
    // Add visual indication that element is draggable
    this.element.style.cursor = 'move';
  }
  
  startDrag(e) {
    this.isDragging = true;
    const rect = this.element.getBoundingClientRect();
    this.dragOffset.x = e.clientX - rect.left;
    this.dragOffset.y = e.clientY - rect.top;
    
    // Add dragging class for visual feedback
    this.element.classList.add('dragging');
    e.preventDefault();
  }
  
  drag(e) {
    if (!this.isDragging) return;
    
    const x = e.clientX - this.dragOffset.x;
    const y = e.clientY - this.dragOffset.y;
    
    // Keep element within viewport bounds
    const maxX = window.innerWidth - this.element.offsetWidth;
    const maxY = window.innerHeight - this.element.offsetHeight;
    
    const boundedX = Math.max(0, Math.min(x, maxX));
    const boundedY = Math.max(0, Math.min(y, maxY));
    
    this.element.style.left = boundedX + 'px';
    this.element.style.top = boundedY + 'px';
  }
  
  stopDrag() {
    if (this.isDragging) {
      this.isDragging = false;
      this.element.classList.remove('dragging');
    }
  }
}

// DOM element cache
class DOMCache {
  constructor() {
    this.elements = {
      canvas: document.getElementById(DOM_ELEMENTS.CANVAS),
      audioPlayer: document.getElementById(DOM_ELEMENTS.AUDIO_PLAYER),
      playButton: document.getElementById(DOM_ELEMENTS.PLAY_BUTTON),
      status: document.getElementById(DOM_ELEMENTS.STATUS),
      levelFill: document.getElementById(DOM_ELEMENTS.LEVEL_FILL),
      levelText: document.getElementById(DOM_ELEMENTS.LEVEL_TEXT),
      controls: document.getElementById('controls')
    };
  }

  get(elementName) {
    return this.elements[elementName];
  }
}

// Status manager for consistent UI updates
class StatusManager {
  constructor(domCache) {
    this.statusElement = domCache.get('status');
    this.levelFillElement = domCache.get('levelFill');
    this.levelTextElement = domCache.get('levelText');
  }

  setStatus(message) {
    this.statusElement.textContent = message;
    console.log('Status:', message);
  }

  updateAudioLevel(percentage) {
    this.levelFillElement.style.width = percentage + '%';
    this.levelTextElement.textContent = percentage;
  }

  resetAudioLevel() {
    this.updateAudioLevel(0);
  }
}

// Audio system manager
class AudioManager {
  constructor(domCache, statusManager) {
    this.audioPlayer = domCache.get('audioPlayer');
    this.playButton = domCache.get('playButton');
    this.statusManager = statusManager;
    this.audioContext = null;
    this.analyser = null;
    this.audioSource = null;
    this.frequencyData = null;
  }

  setupEventListeners(onPlay, onPause) {
    this.audioPlayer.addEventListener('play', onPlay);
    this.audioPlayer.addEventListener('pause', onPause);
    
    // Custom play button functionality
    this.playButton.addEventListener('click', () => {
      if (this.audioPlayer.paused) {
        this.audioPlayer.play();
        this.playButton.textContent = '⏸ PAUSE';
      } else {
        this.audioPlayer.pause();
        this.playButton.textContent = '▶ PLAY';
      }
    });
    
    // Update button text based on audio state
    this.audioPlayer.addEventListener('play', () => {
      this.playButton.textContent = '⏸ PAUSE';
    });
    
    this.audioPlayer.addEventListener('pause', () => {
      this.playButton.textContent = '▶ PLAY';
    });
    
    this.audioPlayer.addEventListener('loadstart', () => {
      this.statusManager.setStatus(STATUS_MESSAGES.LOADING);
    });
    
    this.audioPlayer.addEventListener('canplay', () => {
      this.statusManager.setStatus(STATUS_MESSAGES.READY);
    });
    
    this.audioPlayer.addEventListener('loadeddata', () => {
      this.statusManager.setStatus(STATUS_MESSAGES.LOADED);
    });
    
    this.audioPlayer.addEventListener('error', (e) => {
      this.handleAudioError(e);
    });
    
    this.audioPlayer.addEventListener('click', () => {
      console.log('Audio player clicked - user interaction registered');
    });
    
    this.audioPlayer.addEventListener('progress', () => {
      console.log('Audio loading progress');
    });
  }

  handleAudioError(e) {
    console.error('Audio error:', e);
    console.error('Audio error details:', this.audioPlayer.error);
    
    const errorMsg = this.audioPlayer.error ? 
      `Audio error (${this.audioPlayer.error.code}): ${this.audioPlayer.error.message || 'Unknown error'}` :
      'Audio file not found or cannot be loaded';
    
    this.statusManager.setStatus(errorMsg);
  }

  async setupAudioContext() {
    try {
      if (!this.audioContext) {
        console.log('Setting up audio context...');
        
        // Create audio context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('Audio context created');
        
        // Create and configure analyser
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = AUDIO_CONFIG.FFT_SIZE;
        this.analyser.smoothingTimeConstant = AUDIO_CONFIG.SMOOTHING;
        this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        console.log('Analyser created');
        
        // Create and connect audio source
        this.audioSource = this.audioContext.createMediaElementSource(this.audioPlayer);
        this.audioSource.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        console.log('Audio nodes connected');
      }
      
      // Resume context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('Audio context resumed');
      }
      
      this.statusManager.setStatus(STATUS_MESSAGES.VISUALIZING);
      return true;
    } catch (error) {
      console.error('Audio setup error:', error);
      this.statusManager.setStatus('Audio error: ' + error.message);
      return false;
    }
  }

  getFrequencyData() {
    if (this.analyser && this.frequencyData) {
      this.analyser.getByteFrequencyData(this.frequencyData);
      return this.frequencyData;
    }
    return null;
  }

  calculateAudioLevel() {
    if (!this.frequencyData) return 0;
    const avgLevel = this.frequencyData.reduce((sum, val) => sum + val, 0) / this.frequencyData.length;
    return Math.round((avgLevel / 255) * 100);
  }

  isPaused() {
    return this.audioPlayer.paused;
  }
}

// Visualization renderer
class VisualizationRenderer {
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
    // Map the visual bar index to the frequency data across the useful frequency range
    const usefulBins = Math.floor(frequencyData.length * AUDIO_CONFIG.FREQUENCY_CUTOFF);
    const scaledIndex = Math.floor((index / totalBars) * usefulBins);
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

// Main application class
class WaveformVisualizer {
  constructor() {
    this.domCache = new DOMCache();
    this.statusManager = new StatusManager(this.domCache);
    this.audioManager = new AudioManager(this.domCache, this.statusManager);
    this.renderer = new VisualizationRenderer(this.domCache, this.statusManager);
    
    // Make controls draggable
    this.dragHandler = new DragHandler(this.domCache.get('controls'));
    
    this.init();
  }

  async init() {
    try {
      // Set up audio event listeners
      this.audioManager.setupEventListeners(
        () => this.handlePlay(),
        () => this.handlePause()
      );
      
      // Initialize with static display
      this.renderer.drawStaticWaveform();
      this.statusManager.setStatus(STATUS_MESSAGES.LOADING);
      
    } catch (error) {
      console.error('Initialization error:', error);
      this.statusManager.setStatus('Error: ' + error.message);
    }
  }

  async handlePlay() {
    console.log('Play event triggered');
    const audioSetupSuccess = await this.audioManager.setupAudioContext();
    
    if (audioSetupSuccess) {
      this.renderer.startVisualization(this.audioManager);
    }
  }

  handlePause() {
    console.log('Pause event triggered');
    this.renderer.stopVisualization();
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing Waveform Visualizer...');
  new WaveformVisualizer();
});
