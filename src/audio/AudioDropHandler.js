export default class AudioDropHandler {
  constructor(dropZone, audioManager) {
    this.dropZone = dropZone;
    this.audioManager = audioManager;
    
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
    const files = Array.from(dt.files || []);

    if (files.length > 0) {
      this.audioManager.addTracksFromDrop(files);
    }
  }
}
