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
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const maxRadius = Math.min(this.canvas.width, this.canvas.height) * 0.45;
    const innerRadius = maxRadius * 0.15;
    
    const usefulBins = Math.floor(frequencyData.length * AUDIO_CONFIG.FREQUENCY_CUTOFF);
    const numBars = Math.min(240, usefulBins); // Even more bars for ultra-smooth effect
    
    // Calculate average energy and frequency analysis
    const avgEnergy = frequencyData.reduce((sum, val) => sum + val, 0) / frequencyData.length / 255;
    const bassEnergy = frequencyData.slice(0, usefulBins * 0.1).reduce((sum, val) => sum + val, 0) / (usefulBins * 0.1) / 255;
    const midEnergy = frequencyData.slice(usefulBins * 0.1, usefulBins * 0.5).reduce((sum, val) => sum + val, 0) / (usefulBins * 0.4) / 255;
    const trebleEnergy = frequencyData.slice(usefulBins * 0.5, usefulBins).reduce((sum, val) => sum + val, 0) / (usefulBins * 0.5) / 255;
    
    // Draw background energy field
    if (avgEnergy > 0.3) {
      const fieldGradient = this.ctx.createRadialGradient(
        centerX, centerY, innerRadius,
        centerX, centerY, maxRadius * 1.2
      );
      fieldGradient.addColorStop(0, `hsla(${this.time * 20}, 40%, 20%, 0)`);
      fieldGradient.addColorStop(0.7, `hsla(${this.time * 20 + 60}, 60%, 30%, ${avgEnergy * 0.15})`);
      fieldGradient.addColorStop(1, `hsla(${this.time * 20 + 120}, 80%, 40%, ${avgEnergy * 0.05})`);
      
      this.ctx.fillStyle = fieldGradient;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, maxRadius * 1.2, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Draw multiple layers for depth and vibrancy
    for (let layer = 0; layer < 4; layer++) { // Added one more layer
      const layerAlpha = layer === 0 ? 1 : 0.7 - (layer * 0.15);
      const layerScale = 1 + (layer * 0.25);
      const layerOffset = layer * 0.08;
      // Slower rotation speeds
      const rotationSpeed = (0.15 + layer * 0.08) * (1 + bassEnergy * 0.5);
      
      for (let i = 0; i < numBars; i++) {
        const angle = (i / numBars) * Math.PI * 2 + (this.time * rotationSpeed);
        const value = frequencyData[Math.floor((i / numBars) * usefulBins)];
        const normalizedValue = Math.max(value / 255, AUDIO_CONFIG.MIN_THRESHOLD);
        
        // Enhanced bar length with multiple pulsing effects
        const basePulse = 1 + Math.sin(this.time * 2.5 + i * 0.05) * 0.15 * avgEnergy;
        const frequencyPulse = 1 + Math.sin(this.time * 4 + i * 0.1) * 0.1 * normalizedValue;
        const energyBoost = 1 + (bassEnergy * 0.3) + (midEnergy * 0.2) + (trebleEnergy * 0.1);
        const barLength = (normalizedValue * maxRadius * layerScale * basePulse * frequencyPulse * energyBoost) + innerRadius;
        
        // Dynamic bar width with frequency-based modulation
        const baseWidth = 1.5 + (normalizedValue * 3) + (avgEnergy * 2);
        const widthPulse = 1 + Math.sin(this.time * 6 + i * 0.2) * 0.3 * normalizedValue;
        const barWidth = baseWidth * widthPulse;
        
        // Advanced color system with frequency-specific hues
        let baseHue;
        if (i < numBars * 0.3) {
          baseHue = 240 + (bassEnergy * 60); // Blues/purples for bass
        } else if (i < numBars * 0.7) {
          baseHue = 60 + (midEnergy * 120); // Greens/yellows for mids
        } else {
          baseHue = 300 + (trebleEnergy * 60); // Reds/magentas for treble
        }
        
        const timeHue = baseHue + (this.time * 15); // Slower color cycling
        const frequencyHue = timeHue + (normalizedValue * 90) + (layer * 30);
        const saturation = Math.min(98, 75 + (normalizedValue * 35) + (avgEnergy * 15));
        const lightness = Math.min(85, 45 + (normalizedValue * 45) + (avgEnergy * 10));
        
        // Create ultra-vibrant gradient for each bar
        const gradient = this.ctx.createRadialGradient(
          centerX, centerY, innerRadius - layerOffset,
          centerX, centerY, barLength
        );
        
        gradient.addColorStop(0, `hsla(${frequencyHue}, ${saturation}%, ${lightness + 25}%, ${layerAlpha})`);
        gradient.addColorStop(0.3, `hsla(${frequencyHue + 20}, ${saturation}%, ${lightness + 10}%, ${layerAlpha * 0.9})`);
        gradient.addColorStop(0.7, `hsla(${frequencyHue + 40}, ${saturation - 10}%, ${lightness}%, ${layerAlpha * 0.7})`);
        gradient.addColorStop(1, `hsla(${frequencyHue + 60}, ${saturation - 25}%, ${lightness - 15}%, ${layerAlpha * 0.3})`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(angle);
        
        // Draw main bar with rounded ends
        this.ctx.beginPath();
        this.ctx.roundRect(innerRadius - layerOffset, -barWidth/2, barLength - innerRadius + layerOffset, barWidth, barWidth/3);
        this.ctx.fill();
        
        // Enhanced glow effect for high energy bars
        if (normalizedValue > 0.5 && layer === 0) {
          this.ctx.shadowBlur = 20 + (normalizedValue * 30);
          this.ctx.shadowColor = `hsl(${frequencyHue}, ${saturation}%, ${lightness + 20}%)`;
          this.ctx.fill();
          this.ctx.shadowBlur = 0;
        }
        
        this.ctx.restore();
        
        // Enhanced sparkle effects with different types
        if (layer === 0) {
          const tipX = centerX + Math.cos(angle) * barLength;
          const tipY = centerY + Math.sin(angle) * barLength;
          
          // Primary sparkles for high energy
          if (normalizedValue > 0.7 && Math.random() < normalizedValue * 0.4) {
            this.ctx.fillStyle = `hsla(${frequencyHue + 180}, 100%, 95%, ${normalizedValue * 0.8})`;
            this.ctx.beginPath();
            this.ctx.arc(tipX, tipY, 1 + normalizedValue * 3, 0, Math.PI * 2);
            this.ctx.fill();
          }
          
          // Secondary sparkles for extreme energy
          if (normalizedValue > 0.85 && Math.random() < 0.3) {
            const sparkleRadius = 2 + Math.random() * 3;
            this.ctx.fillStyle = `hsla(${Math.random() * 360}, 100%, 90%, 0.6)`;
            this.ctx.beginPath();
            this.ctx.arc(tipX + (Math.random() - 0.5) * 10, tipY + (Math.random() - 0.5) * 10, sparkleRadius, 0, Math.PI * 2);
            this.ctx.fill();
          }
        }
      }
    }
    
    // Enhanced center element with frequency-responsive design
    const baseCenterSize = 12 + (avgEnergy * 25);
    const centerPulse = 1 + Math.sin(this.time * 3) * 0.25 * avgEnergy;
    const centerSize = baseCenterSize * centerPulse;
    
    // Multi-layer center with different frequencies
    for (let centerLayer = 0; centerLayer < 3; centerLayer++) {
      const layerSize = centerSize * (1 - centerLayer * 0.3);
      const layerAlpha = 0.9 - centerLayer * 0.2;
      
      const centerGradient = this.ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, layerSize
      );
      
      const centerHue = (this.time * 80 + centerLayer * 60) % 360;
      centerGradient.addColorStop(0, `hsla(${centerHue}, 95%, 90%, ${layerAlpha})`);
      centerGradient.addColorStop(0.5, `hsla(${centerHue + 40}, 85%, 70%, ${layerAlpha * 0.7})`);
      centerGradient.addColorStop(1, `hsla(${centerHue + 80}, 75%, 50%, ${layerAlpha * 0.3})`);
      
      this.ctx.fillStyle = centerGradient;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, layerSize, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Frequency-specific energy rings
    if (avgEnergy > 0.4) {
      // Bass ring (slow, thick)
      if (bassEnergy > 0.5) {
        const bassRingRadius = centerSize + 30 + (bassEnergy * 20);
        this.ctx.strokeStyle = `hsla(240, 80%, 70%, ${bassEnergy * 0.6})`;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, bassRingRadius, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      
      // Mid ring (medium speed, medium thickness)
      if (midEnergy > 0.6) {
        const midRingRadius = centerSize + 50 + (midEnergy * 25);
        this.ctx.strokeStyle = `hsla(120, 85%, 65%, ${midEnergy * 0.5})`;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, midRingRadius, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      
      // Treble ring (fast, thin)
      if (trebleEnergy > 0.7) {
        const trebleRingRadius = centerSize + 70 + (trebleEnergy * 30);
        this.ctx.strokeStyle = `hsla(0, 90%, 75%, ${trebleEnergy * 0.4})`;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, trebleRingRadius, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }
    
    // Ultra-high energy explosion effect
    if (avgEnergy > 0.8) {
      const explosionRadius = maxRadius * 0.8;
      const explosionIntensity = (avgEnergy - 0.8) * 5;
      
      for (let burst = 0; burst < 12; burst++) {
        const burstAngle = (burst / 12) * Math.PI * 2 + (this.time * 0.5);
        const burstDistance = explosionRadius * (0.8 + Math.random() * 0.4);
        const burstX = centerX + Math.cos(burstAngle) * burstDistance;
        const burstY = centerY + Math.sin(burstAngle) * burstDistance;
        
        if (Math.random() < explosionIntensity) {
          this.ctx.fillStyle = `hsla(${Math.random() * 360}, 100%, 80%, ${explosionIntensity * 0.3})`;
          this.ctx.beginPath();
          this.ctx.arc(burstX, burstY, 2 + Math.random() * 4, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }
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
