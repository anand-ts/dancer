import { AUDIO_CONFIG, VISUAL_CONFIG, STATUS_MESSAGES } from '../config.js';

export default class VisualizationRenderer {
  constructor(domCache, statusManager) {
    this.canvas = domCache.get('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.statusManager = statusManager;
    this.animationId = null;
    this.currentVisualizer = 'frequency-bars';
    this.particles = []; // For particle field visualizer
    this.waveHistory = []; // For waveform visualizer
    this.matrixColumns = []; // For matrix rain visualizer
    this.time = 0; // Animation time tracker
    
    // Make canvas responsive
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    this.initializeVisualizerData();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.initializeVisualizerData();
  }

  initializeVisualizerData() {
    // Initialize particles for particle field
    this.particles = [];
    for (let i = 0; i < 150; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: Math.random() * 3 + 1,
        originalRadius: Math.random() * 3 + 1,
        hue: Math.random() * 360
      });
    }
    
    // Initialize matrix columns
    this.matrixColumns = [];
    const columnCount = Math.floor(this.canvas.width / 20);
    for (let i = 0; i < columnCount; i++) {
      this.matrixColumns.push({
        x: i * 20,
        y: Math.random() * this.canvas.height,
        speed: Math.random() * 3 + 2,
        chars: '01'.split(''),
        trail: []
      });
    }
  }

  setVisualizer(type) {
    this.currentVisualizer = type;
    this.initializeVisualizerData();
  }

  startVisualization(audioManager) {
    const draw = () => {
      if (audioManager.isPaused()) return;
      
      const frequencyData = audioManager.getFrequencyData();
      if (!frequencyData) return;
      
      this.time += 0.016; // Roughly 60fps timing
      
      switch (this.currentVisualizer) {
        case 'frequency-bars':
          this.renderFrequencyBars(frequencyData);
          break;
        case 'circular-spectrum':
          this.renderCircularSpectrum(frequencyData);
          break;
        case 'waveform':
          this.renderWaveform(frequencyData);
          break;
        case 'particle-field':
          this.renderParticleField(frequencyData);
          break;
        case 'radial-bars':
          this.renderRadialBars(frequencyData);
          break;
        case 'matrix-rain':
          this.renderMatrixRain(frequencyData);
          break;
        default:
          this.renderFrequencyBars(frequencyData);
      }
      
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

  renderCircularSpectrum(frequencyData) {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const baseRadius = Math.min(this.canvas.width, this.canvas.height) * 0.15;
    const maxRadius = Math.min(this.canvas.width, this.canvas.height) * 0.4;
    
    const usefulBins = Math.floor(frequencyData.length * AUDIO_CONFIG.FREQUENCY_CUTOFF);
    const numBars = Math.min(120, usefulBins);
    
    for (let i = 0; i < numBars; i++) {
      const angle = (i / numBars) * Math.PI * 2;
      const value = frequencyData[Math.floor((i / numBars) * usefulBins)];
      const normalizedValue = Math.max(value / 255, AUDIO_CONFIG.MIN_THRESHOLD);
      const barLength = normalizedValue * (maxRadius - baseRadius);
      
      const hue = (i / numBars) * VISUAL_CONFIG.HUE_RANGE;
      const saturation = VISUAL_CONFIG.BASE_SATURATION + (normalizedValue * VISUAL_CONFIG.SATURATION_RANGE);
      const lightness = VISUAL_CONFIG.BASE_LIGHTNESS + (normalizedValue * VISUAL_CONFIG.LIGHTNESS_RANGE);
      
      this.ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      this.ctx.lineWidth = 3;
      
      const startX = centerX + Math.cos(angle) * baseRadius;
      const startY = centerY + Math.sin(angle) * baseRadius;
      const endX = centerX + Math.cos(angle) * (baseRadius + barLength);
      const endY = centerY + Math.sin(angle) * (baseRadius + barLength);
      
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();
    }
  }

  renderWaveform(frequencyData) {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Store wave data for trail effect
    const waveData = [];
    const centerY = this.canvas.height / 2;
    const amplitude = this.canvas.height * 0.3;
    
    for (let i = 0; i < this.canvas.width; i++) {
      const freqIndex = Math.floor((i / this.canvas.width) * frequencyData.length * AUDIO_CONFIG.FREQUENCY_CUTOFF);
      const value = frequencyData[freqIndex] || 0;
      const normalizedValue = (value / 255) - 0.5;
      waveData.push(centerY + normalizedValue * amplitude);
    }
    
    this.waveHistory.unshift(waveData);
    if (this.waveHistory.length > 5) {
      this.waveHistory.pop();
    }
    
    // Draw multiple waveforms for trail effect
    this.waveHistory.forEach((wave, index) => {
      const alpha = 1 - (index * 0.15);
      const hue = (this.time * 50) % 360;
      
      this.ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${alpha})`;
      this.ctx.lineWidth = 3 - index;
      this.ctx.beginPath();
      this.ctx.moveTo(0, wave[0]);
      
      for (let i = 1; i < wave.length; i++) {
        this.ctx.lineTo(i, wave[i]);
      }
      this.ctx.stroke();
    });
  }

  renderParticleField(frequencyData) {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const avgFreq = frequencyData.reduce((sum, val) => sum + val, 0) / frequencyData.length;
    const energy = avgFreq / 255;
    
    this.particles.forEach((particle, index) => {
      // Update particle based on frequency data
      const freqIndex = Math.floor((index / this.particles.length) * frequencyData.length * AUDIO_CONFIG.FREQUENCY_CUTOFF);
      const freq = frequencyData[freqIndex] || 0;
      const normalizedFreq = freq / 255;
      
      // Move particles
      particle.x += particle.vx + (normalizedFreq * 2);
      particle.y += particle.vy;
      particle.radius = particle.originalRadius + (normalizedFreq * 5);
      
      // Wrap around screen
      if (particle.x < 0) particle.x = this.canvas.width;
      if (particle.x > this.canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.canvas.height;
      if (particle.y > this.canvas.height) particle.y = 0;
      
      // Draw particle
      const hue = particle.hue + (normalizedFreq * 100);
      const saturation = 70 + (normalizedFreq * 30);
      const lightness = 50 + (normalizedFreq * 30);
      
      this.ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Connect nearby particles
      this.particles.forEach((otherParticle, otherIndex) => {
        if (otherIndex > index) {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100 && normalizedFreq > 0.3) {
            this.ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.3 * normalizedFreq})`;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(particle.x, particle.y);
            this.ctx.lineTo(otherParticle.x, otherParticle.y);
            this.ctx.stroke();
          }
        }
      });
    });
  }

  renderRadialBars(frequencyData) {
    // Clean black background
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const maxRadius = Math.min(this.canvas.width, this.canvas.height) * 0.4;
    const innerRadius = maxRadius * 0.25;
    
    const usefulBins = Math.floor(frequencyData.length * AUDIO_CONFIG.FREQUENCY_CUTOFF);
    const numBars = Math.min(180, usefulBins); // Much more bars for density
    
    const avgEnergy = frequencyData.reduce((sum, val) => sum + val, 0) / frequencyData.length / 255;
    const bassEnergy = frequencyData.slice(0, Math.floor(usefulBins * 0.2)).reduce((sum, val) => sum + val, 0) / Math.floor(usefulBins * 0.2) / 255;

    // CONSTANT slow rotation - not reactive to music
    const constantRotationSpeed = 0.015; // Very slow constant speed

    // Add subtle ring guides to show the structure
    if (avgEnergy > 0.1) {
      for (let ring = 0; ring < 3; ring++) {
        const guideRadius = innerRadius + (ring * (maxRadius - innerRadius) / (3 - 0.3) * 1.3);
        this.ctx.strokeStyle = `rgba(100, 100, 150, ${0.1 + avgEnergy * 0.15})`;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, guideRadius, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }

    // Concentric rings with PERFECT SYMMETRY
    const rings = 3;
    const ringSpacing = (maxRadius - innerRadius) / (rings - 0.3);
    
    // EXTREMELY DENSE bars for maximum symmetry
    const barsPerRing = [120, 160, 200]; // Much higher density
    
    for (let ring = 0; ring < rings; ring++) {
      const ringRadius = innerRadius + (ring * ringSpacing * 1.3);
      const ringRotation = this.time * constantRotationSpeed * (ring % 2 === 0 ? 1 : -1); // Constant slow rotation
      const barsInRing = barsPerRing[ring];
      
      for (let i = 0; i < barsInRing; i++) {
        // PERFECT ANGULAR SPACING for symmetry
        const angle = (i / barsInRing) * Math.PI * 2 + ringRotation;
        
        // SYMMETRIC SAMPLING: Each bar samples the same relative position in frequency spectrum
        const baseProgress = i / barsInRing;
        const sampleIndex = Math.floor(baseProgress * usefulBins);
        const value = frequencyData[Math.min(sampleIndex, usefulBins - 1)];
        const normalizedValue = Math.max(value / 255, AUDIO_CONFIG.MIN_THRESHOLD);
        
        // SYMMETRIC scaling for all rings
        const ringScale = 1.0; // Same scale for perfect symmetry
        const barStartRadius = ringRadius;
        const barLength = (normalizedValue * ringScale) * ringSpacing * 1.0;
        
        // CONSISTENT bar width for symmetry
        const barWidth = 3 + (normalizedValue * 4); // Consistent sizing
        
        // VIBRANT colors - no boring grays!
        let baseHue;
        if (ring === 0) baseHue = 280 + (bassEnergy * 80); // Purple-pink for bass
        else if (ring === 1) baseHue = 180 + (avgEnergy * 60); // Cyan-blue for mids  
        else baseHue = 30 + (normalizedValue * 120); // Orange-red for treble
        
        const hue = (baseHue + (i / barsInRing) * 40 + this.time * 50) % 360;
        const saturation = 85 + normalizedValue * 15; // High saturation always
        const lightness = 55 + normalizedValue * 35 + (avgEnergy * 10); // Fixed: use avgEnergy instead of ringEnergy
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(angle);
        
        // Draw powerful bars
        this.ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        this.ctx.fillRect(barStartRadius, -barWidth/2, barLength, barWidth);
        
        // More dramatic glow for reactive power
        if (normalizedValue > 0.4) {
          this.ctx.shadowBlur = 8 + (normalizedValue * 15);
          this.ctx.shadowColor = `hsl(${hue}, 100%, 70%)`;
          this.ctx.fillRect(barStartRadius, -barWidth/2, barLength, barWidth);
          this.ctx.shadowBlur = 0;
        }
        
        this.ctx.restore();
      }
    }

    // DYNAMIC STAR CENTER instead of boring circle
    const starPoints = 8;
    const starOuterRadius = (innerRadius * 0.4) + (avgEnergy * 20) + (bassEnergy * 15);
    const starInnerRadius = starOuterRadius * 0.4;
    const starRotation = this.time * (0.3 + avgEnergy * 0.5); // Reactive rotation
    
    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(starRotation);
    
    // Create star path
    this.ctx.beginPath();
    for (let i = 0; i < starPoints * 2; i++) {
      const angle = (i * Math.PI) / starPoints;
      const radius = i % 2 === 0 ? starOuterRadius : starInnerRadius;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.closePath();
    
    // Vibrant star colors that react to music
    const starHue = (this.time * 120 + avgEnergy * 200) % 360;
    const starGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, starOuterRadius);
    starGradient.addColorStop(0, `hsl(${starHue}, 95%, 80%)`);
    starGradient.addColorStop(0.6, `hsl(${(starHue + 60) % 360}, 90%, 65%)`);
    starGradient.addColorStop(1, `hsl(${(starHue + 120) % 360}, 85%, 45%)`);
    
    this.ctx.fillStyle = starGradient;
    this.ctx.fill();
    
    // Powerful star glow
    this.ctx.shadowBlur = 15 + (avgEnergy * 25);
    this.ctx.shadowColor = `hsl(${starHue}, 100%, 70%)`;
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
    
    // Inner star core
    const coreRadius = starInnerRadius * 0.6;
    this.ctx.fillStyle = `hsl(${(starHue + 180) % 360}, 100%, 90%)`;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }

  renderMatrixRain(frequencyData) {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const avgFreq = frequencyData.reduce((sum, val) => sum + val, 0) / frequencyData.length;
    const energy = avgFreq / 255;
    
    this.matrixColumns.forEach((column, index) => {
      // Update column position based on frequency
      const freqIndex = Math.floor((index / this.matrixColumns.length) * frequencyData.length * AUDIO_CONFIG.FREQUENCY_CUTOFF);
      const freq = frequencyData[freqIndex] || 0;
      const normalizedFreq = freq / 255;
      
      column.y += column.speed + (normalizedFreq * 5);
      
      if (column.y > this.canvas.height + 100) {
        column.y = -100;
      }
      
      // Draw trail
      this.ctx.font = '16px monospace';
      for (let i = 0; i < 15; i++) {
        const alpha = (1 - (i / 15)) * normalizedFreq;
        const y = column.y - (i * 20);
        
        if (y > -20 && y < this.canvas.height + 20) {
          const hue = 120 + (normalizedFreq * 60); // Green to yellow-green
          this.ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${alpha})`;
          
          const char = column.chars[Math.floor(Math.random() * column.chars.length)];
          this.ctx.fillText(char, column.x, y);
        }
      }
    });
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
