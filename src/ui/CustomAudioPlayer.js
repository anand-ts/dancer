export default class CustomAudioPlayer {
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
