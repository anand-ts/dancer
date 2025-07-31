export default class AudioDropHandler {
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
