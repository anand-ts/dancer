// Import configuration
import { STATUS_MESSAGES } from './config.js';

// Import modules
import DOMCache from './utils/DOMCache.js';
import StatusManager from './utils/StatusManager.js';
import AudioManager from './audio/AudioManager.js';
import AudioDropHandler from './audio/AudioDropHandler.js';
import VisualizationRenderer from './visualization/VisualizationRenderer.js';
import CustomAudioPlayer from './ui/CustomAudioPlayer.js';
import DragHandler from './ui/DragHandler.js';
import TimeWidget from './ui/TimeWidget.js';

// Main application class
class WaveformVisualizer {
  constructor() {
    this.domCache = new DOMCache();
    this.statusManager = new StatusManager(this.domCache);
    this.audioManager = new AudioManager(this.domCache, this.statusManager);
    this.renderer = new VisualizationRenderer(this.domCache, this.statusManager);
    this.controlsElement = this.domCache.get('controls');
    this.minimizeButton = this.domCache.get('minimizeButton');
    
    // Initialize custom audio player
    this.customPlayer = new CustomAudioPlayer(this.domCache.get('audioPlayer'), this.domCache);
    
    // Make controls draggable from the drag handle only
    const dragHandle = document.getElementById('drag-handle');
    this.dragHandler = new DragHandler(this.domCache.get('controls'), dragHandle);
    
    // Initialize drag and drop for audio files
    this.audioDropHandler = new AudioDropHandler(
      this.domCache.get('controls'), 
      this.audioManager
    );

    this.setupMinimizeControls();
    
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

  setupMinimizeControls() {
    const controls = this.controlsElement;
    const minimizeButton = this.minimizeButton;

    if (!controls || !minimizeButton) return;

    const updateButtonState = (isMinimized) => {
      minimizeButton.textContent = isMinimized ? 'FULL' : 'MIN';
      minimizeButton.setAttribute('aria-expanded', String(!isMinimized));
      minimizeButton.setAttribute('title', isMinimized ? 'Restore full player' : 'Minimize player');
    };

    updateButtonState(false);

    minimizeButton.addEventListener('mousedown', (event) => {
      event.stopPropagation();
    });

    minimizeButton.addEventListener('click', () => {
      const isNowMinimized = controls.classList.toggle('is-minimized');
      updateButtonState(isNowMinimized);
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing Waveform Visualizer...');
  new WaveformVisualizer();
  
  // Initialize time widget
  new TimeWidget();
});
