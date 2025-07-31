import { AUDIO_CONFIG, STATUS_MESSAGES } from '../config.js';

export default class AudioManager {
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
