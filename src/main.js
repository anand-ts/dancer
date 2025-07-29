class SimpleWaveformVisualizer {
  constructor() {
    this.canvas = document.getElementById('waveform-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.audioPlayer = document.getElementById('audio-player');
    
    this.audioContext = null;
    this.analyser = null;
    this.audioSource = null;
    this.frequencyData = null;
    
    this.animationId = null;
    
    // Make canvas responsive to window size
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    this.init();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    // Redraw if not currently visualizing
    if (this.audioPlayer.paused) {
      this.drawStaticWaveform();
    }
  }

  async init() {
    try {
      // Set up audio context when user interacts with audio
      this.audioPlayer.addEventListener('play', () => {
        console.log('Play event triggered');
        this.setupAudio();
      });
      this.audioPlayer.addEventListener('pause', () => {
        console.log('Pause event triggered');
        this.stopVisualization();
      });
      
      // Add error handling for audio loading
      this.audioPlayer.addEventListener('loadstart', () => {
        console.log('Started loading audio');
        document.getElementById('status').textContent = 'Loading audio...';
      });
      
      this.audioPlayer.addEventListener('canplay', () => {
        console.log('Audio can start playing');
        document.getElementById('status').textContent = 'Ready - Press play to start visualization';
      });
      
      this.audioPlayer.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        document.getElementById('status').textContent = 'Error loading audio file';
      });
      
      // Add click handler to help with user interaction requirement
      this.audioPlayer.addEventListener('click', () => {
        console.log('Audio player clicked');
      });
      
      // Start with a simple static display
      this.drawStaticWaveform();
      
      document.getElementById('status').textContent = 'Initializing...';
    } catch (error) {
      console.error('Initialization error:', error);
      document.getElementById('status').textContent = 'Error: ' + error.message;
    }
  }

  async setupAudio() {
    try {
      console.log('Setting up audio context...');
      
      if (!this.audioContext) {
        // Create audio context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('Audio context created');
        
        // Create analyser
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        console.log('Analyser created');
        
        // Create audio source from the audio element
        this.audioSource = this.audioContext.createMediaElementSource(this.audioPlayer);
        console.log('Audio source created');
        
        // Connect: source -> analyser -> destination
        this.audioSource.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        console.log('Audio nodes connected');
      }
      
      // Resume context if suspended (required for some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('Audio context resumed');
      }
      
      // Start visualization
      this.startVisualization();
      document.getElementById('status').textContent = 'Visualizing audio...';
      
    } catch (error) {
      console.error('Audio setup error:', error);
      document.getElementById('status').textContent = 'Audio error: ' + error.message;
    }
  }

  startVisualization() {
    const draw = () => {
      if (this.audioPlayer.paused) return;
      
      // Get frequency data
      this.analyser.getByteFrequencyData(this.frequencyData);
      
      // Clear canvas
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Draw frequency bars
      const barWidth = this.canvas.width / this.frequencyData.length;
      
      for (let i = 0; i < this.frequencyData.length; i++) {
        const barHeight = (this.frequencyData[i] / 255) * this.canvas.height;
        
        // Create gradient color based on frequency
        const hue = (i / this.frequencyData.length) * 360;
        this.ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        
        // Draw bar
        this.ctx.fillRect(
          i * barWidth, 
          this.canvas.height - barHeight, 
          barWidth - 1, 
          barHeight
        );
      }
      
      // Update audio level display
      const avgLevel = this.frequencyData.reduce((sum, val) => sum + val, 0) / this.frequencyData.length;
      const levelPercent = Math.round((avgLevel / 255) * 100);
      document.getElementById('level-fill').style.width = levelPercent + '%';
      document.getElementById('level-text').textContent = levelPercent;
      
      this.animationId = requestAnimationFrame(draw);
    };
    
    draw();
  }

  stopVisualization() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Reset display
    this.drawStaticWaveform();
    document.getElementById('level-fill').style.width = '0%';
    document.getElementById('level-text').textContent = '0';
    document.getElementById('status').textContent = 'Paused';
  }

  drawStaticWaveform() {
    // Draw a simple static waveform pattern
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    
    const centerY = this.canvas.height / 2;
    for (let x = 0; x < this.canvas.width; x += 4) {
      const y = centerY + Math.sin(x * 0.02) * 20;
      if (x === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.stroke();
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing Simple Waveform Visualizer...');
  new SimpleWaveformVisualizer();
});

// Remove all the old complex code below this line
