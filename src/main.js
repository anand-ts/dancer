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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing Waveform Visualizer...');
  new WaveformVisualizer();
  
  // Initialize time widget
  new TimeWidget();
});
