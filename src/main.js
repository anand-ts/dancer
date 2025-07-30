// Import configuration
import { AUDIO_CONFIG, VISUAL_CONFIG, STATUS_MESSAGES, DOM_ELEMENTS } from './config.js';

// Drag and Drop Audio File Handler
class AudioDropHandler {
  constructor(dropZone, audioManager, statusManager) {
    this.dropZone = dropZone;
    this.audioManager = audioManager;
    this.statusManager = statusManager;
    this.currentTrackInfo = document.getElementById('track-info');
    
    this.setupDropEvents();
  }
  
  setupDropEvents() {
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      this.dropZone.addEventListener(eventName, this.preventDefaults, false);
      document.body.addEventListener(eventName, this.preventDefaults, false);
    });
    
    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
      this.dropZone.addEventListener(eventName, () => this.highlight(), false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      this.dropZone.addEventListener(eventName, () => this.unhighlight(), false);
    });
    
    // Handle dropped files
    this.dropZone.addEventListener('drop', (e) => this.handleDrop(e), false);
  }
  
  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  highlight() {
    this.dropZone.classList.add('drag-over');
  }
  
  unhighlight() {
    this.dropZone.classList.remove('drag-over');
  }
  
  handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
      this.handleFile(files[0]);
    }
  }
  
  handleFile(file) {
    // Check if it's an audio file
    if (!file.type.startsWith('audio/')) {
      this.statusManager.setStatus('Error: Please drop an audio file');
      return;
    }
    
    this.statusManager.setStatus('Loading new audio file...');
    
    // Create URL for the file
    const fileURL = URL.createObjectURL(file);
    
    // Update audio source
    this.audioManager.audioPlayer.src = fileURL;
    
    // Update track info with filename (remove extension)
    const fileName = file.name.replace(/\.[^/.]+$/, "");
    this.currentTrackInfo.textContent = fileName;
    
    // Reset play button
    this.audioManager.playButton.textContent = '▶ PLAY';
    
    this.statusManager.setStatus('New audio file loaded - Ready to play');
  }
}
class CustomAudioPlayer {
  constructor(audioElement, domCache) {
    this.audio = audioElement;
    this.domCache = domCache;
    this.isDragging = false;
    this.isVolumeDragging = false;
    this.isMuted = false;
    this.lastVolume = 1.0;
    
    // Get custom player elements
    this.progressBar = document.getElementById('progress-bar');
    this.progressFill = document.getElementById('progress-fill');
    this.progressHandle = document.getElementById('progress-handle');
    this.currentTimeDisplay = document.getElementById('current-time');
    this.durationDisplay = document.getElementById('duration-time');
    
    // Volume elements
    this.volumeButton = document.getElementById('volume-button');
    this.volumeBar = document.getElementById('volume-bar');
    this.volumeFill = document.getElementById('volume-fill');
    this.volumeHandle = document.getElementById('volume-handle');
    this.volumeMax = document.querySelector('.volume-max');
    
    // Volume display timer
    this.volumeDisplayTimer = null;
    
    this.setupEventListeners();
    this.updateVolumeDisplay();
  }
  
  setupEventListeners() {
    // Audio events
    this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
    this.audio.addEventListener('timeupdate', () => this.updateProgress());
    this.audio.addEventListener('volumechange', () => this.updateVolumeDisplay());
    
    // Progress bar events
    this.progressBar.addEventListener('mousedown', (e) => this.startDrag(e));
    document.addEventListener('mousemove', (e) => this.drag(e));
    document.addEventListener('mouseup', () => this.stopDrag());
    
    // Click to seek
    this.progressBar.addEventListener('click', (e) => this.seek(e));
    
    // Volume events
    this.volumeButton.addEventListener('click', () => this.toggleMute());
    this.volumeBar.addEventListener('mousedown', (e) => this.startVolumeDrag(e));
    document.addEventListener('mousemove', (e) => this.dragVolume(e));
    document.addEventListener('mouseup', () => this.stopVolumeDrag());
    this.volumeBar.addEventListener('click', (e) => this.setVolume(e));
  }
  
  updateDuration() {
    const duration = this.audio.duration;
    this.durationDisplay.textContent = this.formatTime(duration);
  }
  
  updateProgress() {
    if (this.isDragging) return;
    
    const currentTime = this.audio.currentTime;
    const duration = this.audio.duration;
    const percentage = (currentTime / duration) * 100;
    
    this.progressFill.style.width = percentage + '%';
    this.progressHandle.style.left = percentage + '%';
    this.currentTimeDisplay.textContent = this.formatTime(currentTime);
  }
  
  startDrag(e) {
    this.isDragging = true;
    this.seek(e);
    e.preventDefault();
  }
  
  drag(e) {
    if (!this.isDragging) return;
    this.seek(e);
  }
  
  stopDrag() {
    this.isDragging = false;
  }
  
  seek(e) {
    const rect = this.progressBar.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const newTime = (percentage / 100) * this.audio.duration;
    
    this.audio.currentTime = newTime;
    this.progressFill.style.width = percentage + '%';
    this.progressHandle.style.left = percentage + '%';
    this.currentTimeDisplay.textContent = this.formatTime(newTime);
  }
  
  // Volume methods
  toggleMute() {
    if (this.isMuted) {
      this.audio.volume = this.lastVolume;
      this.isMuted = false;
      this.showVolumePercentage(Math.round(this.lastVolume * 100));
    } else {
      this.lastVolume = this.audio.volume;
      this.audio.volume = 0;
      this.isMuted = true;
      this.showVolumePercentage(0);
    }
    this.updateVolumeDisplay();
  }
  
  startVolumeDrag(e) {
    this.isVolumeDragging = true;
    this.setVolume(e);
    e.preventDefault();
  }
  
  dragVolume(e) {
    if (!this.isVolumeDragging) return;
    this.setVolume(e);
  }
  
  stopVolumeDrag() {
    this.isVolumeDragging = false;
  }
  
  setVolume(e) {
    const rect = this.volumeBar.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const volume = percentage / 100;
    
    this.audio.volume = volume;
    this.isMuted = volume === 0;
    if (volume > 0) {
      this.lastVolume = volume;
    }
    this.updateVolumeDisplay();
    this.showVolumePercentage(Math.round(percentage));
  }
  
  updateVolumeDisplay() {
    const volume = this.audio.volume;
    const percentage = volume * 100;
    
    this.volumeFill.style.width = percentage + '%';
    this.volumeHandle.style.left = percentage + '%';
    
    // Update button text based on mute state
    if (this.isMuted || volume === 0) {
      this.volumeButton.textContent = 'MUTE';
      this.volumeButton.style.background = '#000';
      this.volumeButton.style.color = '#fff';
    } else {
      this.volumeButton.textContent = 'VOL';
      this.volumeButton.style.background = '#000';
      this.volumeButton.style.color = '#fff';
    }
  }
  
  showVolumePercentage(percentage) {
    // Clear any existing timer
    if (this.volumeDisplayTimer) {
      clearTimeout(this.volumeDisplayTimer);
    }
    
    // Show percentage
    this.volumeMax.textContent = percentage + '%';
    
    // Reset to MAX after 1.5 seconds
    this.volumeDisplayTimer = setTimeout(() => {
      this.volumeMax.textContent = 'MAX';
      this.volumeDisplayTimer = null;
    }, 1500);
  }
  
  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }
}
class DragHandler {
  constructor(element, dragHandle = null) {
    this.element = element;
    this.dragHandle = dragHandle || element; // Use separate drag handle if provided
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    
    this.setupDragEvents();
  }
  
  setupDragEvents() {
    this.dragHandle.addEventListener('mousedown', (e) => this.startDrag(e));
    document.addEventListener('mousemove', (e) => this.drag(e));
    document.addEventListener('mouseup', () => this.stopDrag());
    
    // Add visual indication that drag handle is draggable
    this.dragHandle.style.cursor = 'move';
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
    // Map the visual bar index to the frequency data with proper frequency distribution
    const usefulBins = Math.floor(frequencyData.length * AUDIO_CONFIG.FREQUENCY_CUTOFF);
    
    // Calculate which frequency range this bar represents
    const normalizedIndex = index / totalBars;
    let scaledIndex;
    
    if (normalizedIndex < 0.3) {
      // First 30% of visual bars = Bass range (use first 10% of frequency bins)
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

// Main application class
class WaveformVisualizer {
  constructor() {
    this.domCache = new DOMCache();
    this.statusManager = new StatusManager(this.domCache);
    this.audioManager = new AudioManager(this.domCache, this.statusManager);
    this.renderer = new VisualizationRenderer(this.domCache, this.statusManager);
    
    // Initialize custom audio player
    this.customPlayer = new CustomAudioPlayer(this.domCache.get('audioPlayer'), this.domCache);
    
    // Make controls draggable from the drag handle only
    const dragHandle = document.getElementById('drag-handle');
    this.dragHandler = new DragHandler(this.domCache.get('controls'), dragHandle);
    
    // Initialize drag and drop for audio files
    this.audioDropHandler = new AudioDropHandler(
      this.domCache.get('controls'), 
      this.audioManager, 
      this.statusManager
    );
    
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

// Time Widget Class
class TimeWidget {
  constructor() {
    this.timeElement = document.getElementById('current-time-widget');
    this.dateElement = document.getElementById('current-date-widget');
    this.widgetElement = document.getElementById('time-widget');
    this.intervalId = null;
    this.is24Hour = true;
    this.lastSecond = -1;
    
    this.setupEventListeners();
    this.start();
  }
  
  setupEventListeners() {
    // Click to toggle 12/24 hour format
    if (this.widgetElement) {
      this.widgetElement.addEventListener('click', () => {
        this.is24Hour = !this.is24Hour;
        this.updateTime();
        
        // Add a little feedback animation
        this.widgetElement.style.transform = 'scale(0.95)';
        setTimeout(() => {
          this.widgetElement.style.transform = '';
        }, 100);
      });
    }
  }
  
  start() {
    // Update immediately
    this.updateTime();
    
    // Update every second
    this.intervalId = setInterval(() => {
      this.updateTime();
    }, 1000);
  }
  
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  updateTime() {
    const now = new Date();
    const currentSecond = now.getSeconds();
    
    // Format time based on 12/24 hour preference
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    let timeString;
    if (this.is24Hour) {
      hours = hours.toString().padStart(2, '0');
      timeString = `${hours}:${minutes}:${seconds}`;
    } else {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 should be 12
      timeString = `${hours}:${minutes}:${seconds} ${ampm}`;
    }
    
    // Add pulse effect on second change
    if (currentSecond !== this.lastSecond && this.timeElement) {
      this.timeElement.classList.add('pulse');
      setTimeout(() => {
        this.timeElement.classList.remove('pulse');
      }, 100);
      this.lastSecond = currentSecond;
    }
    
    // Format date as DAY, MON DD
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                   'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const date = now.getDate().toString().padStart(2, '0');
    const dateString = `${dayName}, ${monthName} ${date}`;
    
    // Update elements
    if (this.timeElement) {
      this.timeElement.textContent = timeString;
    }
    if (this.dateElement) {
      this.dateElement.textContent = dateString;
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing Waveform Visualizer...');
  new WaveformVisualizer();
  
  // Initialize time widget
  new TimeWidget();
});
