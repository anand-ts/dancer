import * as THREE from 'three';

class AudioVisualizer {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.cubes = [];
    this.sphere = null;
    this.matrixCircle = null;
    this.isPlaying = false;
    this.animationId = null;
    this.audioDataInterval = null;
    this.currentTheme = 'matrix'; // Default theme
    
    this.init();
    this.setupEventListeners();
  }

  init() {
    console.log('Initializing AudioVisualizer...');
    
    // Create scene
    this.scene = new THREE.Scene();
    console.log('Scene created:', this.scene);
    
    // Create camera - closer position for testing
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 0, 20); // Closer to objects
    console.log('Camera created and positioned:', this.camera.position);
    
    // Create renderer
    const canvas = document.getElementById('three-canvas');
    console.log('Canvas element found:', canvas);
    
    if (!canvas) {
      console.error('Canvas element not found!');
      return;
    }
    
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x222222); // Lighter background to see objects better
    console.log('Renderer created with size:', window.innerWidth, 'x', window.innerHeight);
    
    // Create a simple test first
    this.createSimpleTest();
    
    // Create audio reactive objects
    this.createAudioReactiveObjects();
    console.log('Audio reactive objects created. Cubes:', this.cubes.length, 'Sphere:', this.sphere);
    
    // Add brighter lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Much brighter
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 10, 10);
    this.scene.add(directionalLight);
    console.log('Lights added to scene');
    
    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
    
    // Start render loop
    this.animate();
    
    console.log('AudioVisualizer initialized successfully');
    console.log('Idle animation should be active (isPlaying =', this.isPlaying, ')');
    console.log('Scene children count:', this.scene.children.length);
  }

  createSimpleTest() {
    // Create a simple red cube that should be very visible
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.testCube = new THREE.Mesh(geometry, material);
    this.testCube.position.z = 0; // Right in front of camera
    this.scene.add(this.testCube);
    console.log('Simple test cube added at origin');
    
    // Add a wireframe sphere for extra visibility
    const sphereGeometry = new THREE.SphereGeometry(3, 16, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00, 
      wireframe: true 
    });
    this.testSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.testSphere.position.set(5, 0, 0);
    this.scene.add(this.testSphere);
    console.log('Test wireframe sphere added');
  }

  createMatrixTheme() {
    // Create Matrix-style 3D green wireframe sphere
    const sphereGeometry = new THREE.SphereGeometry(4, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    this.matrixSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.scene.add(this.matrixSphere);
    
    // Add inner wireframe sphere for more Matrix effect
    const innerSphereGeometry = new THREE.SphereGeometry(2.5, 16, 16);
    const innerSphereMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff88,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });
    this.matrixInnerSphere = new THREE.Mesh(innerSphereGeometry, innerSphereMaterial);
    this.scene.add(this.matrixInnerSphere);
    
    console.log('Matrix theme: Green wireframe spheres created');
  }

  createRainbowTheme() {
    // Create rainbow frequency bars (cubes in a circle)
    const cubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const numCubes = 32;
    
    for (let i = 0; i < numCubes; i++) {
      const cubeMaterial = new THREE.MeshBasicMaterial({ 
        color: new THREE.Color().setHSL(i / numCubes, 0.8, 0.5)
      });
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      
      const angle = (i / numCubes) * Math.PI * 2;
      const radius = 6;
      cube.position.x = Math.cos(angle) * radius;
      cube.position.z = Math.sin(angle) * radius;
      cube.originalY = 0;
      
      this.cubes.push(cube);
      this.scene.add(cube);
    }
    console.log('Rainbow theme: Created', numCubes, 'colorful cubes');
  }

  switchTheme(theme) {
    console.log('Switching to theme:', theme);
    
    // Clear existing objects
    this.clearScene();
    
    this.currentTheme = theme;
    
    // Create theme-specific objects
    if (theme === 'matrix') {
      this.createMatrixTheme();
    } else if (theme === 'rainbow') {
      this.createRainbowTheme();
    }
  }

  clearScene() {
    // Remove matrix spheres
    if (this.matrixSphere) {
      this.scene.remove(this.matrixSphere);
      this.matrixSphere = null;
    }
    if (this.matrixInnerSphere) {
      this.scene.remove(this.matrixInnerSphere);
      this.matrixInnerSphere = null;
    }
    
    // Remove rainbow cubes
    this.cubes.forEach(cube => {
      this.scene.remove(cube);
    });
    this.cubes = [];
    
    // Remove any remaining test objects
    if (this.sphere) {
      this.scene.remove(this.sphere);
      this.sphere = null;
    }
    if (this.testCube) {
      this.scene.remove(this.testCube);
      this.testCube = null;
    }
    if (this.testSphere) {
      this.scene.remove(this.testSphere);
      this.testSphere = null;
    }
  }

  createAudioReactiveObjects() {
    // Initialize with default theme
    this.switchTheme(this.currentTheme);
  }

  async setupSystemAudio() {
    try {
      document.getElementById('status').textContent = 'Starting system audio capture...';
      console.log('Starting system audio capture...');
      
      // Check if Tauri is available
      if (typeof window.__TAURI__ === 'undefined') {
        throw new Error('Tauri not available - running in browser mode with mock data');
      }
      
      const { invoke } = window.__TAURI__.core;
      const result = await invoke('start_audio_capture');
      
      console.log('System audio capture result:', result);
      document.getElementById('status').textContent = 'System audio capture active!';
      
      // Start polling for audio data
      this.startAudioDataPolling();
      
      return true;
    } catch (error) {
      console.error('Error starting system audio:', error);
      console.log('Falling back to mock audio data...');
      
      document.getElementById('status').textContent = 'Using demo mode - beautiful visualizations!';
      
      // Start mock data for demo purposes ONLY when Tauri is not available
      this.startMockAudioData();
      
      return true; // Return true to show visualization anyway
    }
  }

  startAudioDataPolling() {
    const { invoke } = window.__TAURI__.core;
    
    this.audioDataInterval = setInterval(async () => {
      try {
        const audioData = await invoke('get_audio_data');
        this.processAudioData(audioData);
      } catch (error) {
        console.error('Error getting audio data:', error);
      }
    }, 16); // ~60 FPS
  }

  startMockAudioData() {
    // Generate beautiful mock audio data for demo
    this.audioDataInterval = setInterval(() => {
      const mockData = [];
      const time = Date.now() / 1000;
      
      for (let i = 0; i < 64; i++) {
        const frequency = i / 64;
        const wave1 = Math.sin(time * 2 + frequency * 10) * 0.5 + 0.5;
        const wave2 = Math.sin(time * 3 + frequency * 15) * 0.3 + 0.3;
        const wave3 = Math.sin(time * 1.5 + frequency * 8) * 0.2 + 0.2;
        
        mockData.push((wave1 + wave2 + wave3) * 255);
      }
      
      this.processAudioData(mockData);
    }, 16);
  }

  processAudioData(audioData) {
    this.currentAudioData = audioData;
    
    // Update UI indicators
    const average = audioData.reduce((a, b) => a + b) / audioData.length;
    const levelPercent = (average / 255) * 100;
    
    document.getElementById('level-fill').style.width = `${levelPercent}%`;
    document.getElementById('level-text').textContent = Math.round(average);
  }

  updateVisualization() {
    if (!this.currentAudioData) return;
    
    const audioData = this.currentAudioData;
    const average = audioData.reduce((a, b) => a + b) / audioData.length;
    const max = Math.max(...audioData);
    
    if (this.currentTheme === 'matrix') {
      this.updateMatrixVisualization(audioData, average, max);
    } else if (this.currentTheme === 'rainbow') {
      this.updateRainbowVisualization(audioData, average, max);
    }
  }

  updateMatrixVisualization(audioData, average, max) {
    if (this.matrixSphere) {
      // Scale based on volume
      const scale = 1 + (average / 256) * 2;
      this.matrixSphere.scale.setScalar(scale);
      
      // Multi-axis rotation speed based on audio
      this.matrixSphere.rotation.x += 0.015 + (average / 512) * 0.08;
      this.matrixSphere.rotation.y += 0.02 + (average / 512) * 0.1;
      this.matrixSphere.rotation.z += 0.01 + (average / 512) * 0.05;
      
      // Opacity based on volume
      this.matrixSphere.material.opacity = 0.5 + (average / 512);
      
      // Green intensity based on volume
      const greenIntensity = 0.6 + (average / 512);
      this.matrixSphere.material.color.setRGB(0, greenIntensity, 0);
    }
    
    if (this.matrixInnerSphere) {
      // Inner sphere reacts to higher frequencies
      const highFreqAvg = audioData.slice(audioData.length * 0.7).reduce((a, b) => a + b) / (audioData.length * 0.3);
      
      // Scale based on high frequency content
      const innerScale = 1 + (highFreqAvg / 256) * 1.5;
      this.matrixInnerSphere.scale.setScalar(innerScale);
      
      // Counter-rotate based on audio with different axes
      this.matrixInnerSphere.rotation.x -= 0.025 + (highFreqAvg / 512) * 0.12;
      this.matrixInnerSphere.rotation.y += 0.03 + (highFreqAvg / 512) * 0.15;
      this.matrixInnerSphere.rotation.z -= 0.02 + (highFreqAvg / 512) * 0.1;
      
      // Opacity based on high frequencies
      this.matrixInnerSphere.material.opacity = 0.3 + (highFreqAvg / 512);
      
      // Brighter green for high frequencies
      const innerGreenIntensity = 0.7 + (highFreqAvg / 512);
      this.matrixInnerSphere.material.color.setRGB(0, innerGreenIntensity, 0.2);
    }
  }

  updateRainbowVisualization(audioData, average, max) {
    // Update rainbow cubes based on frequency data
    this.cubes.forEach((cube, index) => {
      const dataIndex = Math.floor(index * audioData.length / this.cubes.length);
      const value = audioData[dataIndex];
      
      // Scale cube height based on frequency
      const height = (value / 256) * 12 + 0.5;
      cube.scale.y = height;
      cube.position.y = cube.originalY + height / 2;
      
      // Scale width based on value
      const widthScale = 1 + (value / 512);
      cube.scale.x = widthScale;
      cube.scale.z = widthScale;
      
      // Rotation based on frequency
      cube.rotation.y += 0.02 + (value / 512) * 0.05;
      cube.rotation.z += 0.01;
      
      // Color based on frequency and position
      const hue = (index / this.cubes.length + average / 512 + value / 1024) % 1;
      const saturation = 0.7 + (value / 512) * 0.3;
      const lightness = 0.4 + (value / 512) * 0.4;
      cube.material.color.setHSL(hue, saturation, lightness);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    // Debug: Log every 60 frames (about once per second)
    if (!this.frameCount) this.frameCount = 0;
    this.frameCount++;
    
    if (this.frameCount % 60 === 0) {
      console.log('Animation running. Frame:', this.frameCount, 'isPlaying:', this.isPlaying);
      console.log('Camera position:', this.camera.position);
      console.log('Scene children:', this.scene.children.length);
    }
    
    if (this.isPlaying) {
      this.updateVisualization();
    } else {
      // Enhanced idle animation
      this.updateIdleAnimation();
    }
    
    // Simple camera position for debugging - keep it stationary first
    this.camera.position.set(0, 0, 15);
    this.camera.lookAt(0, 0, 0);
    
    this.renderer.render(this.scene, this.camera);
  }

  updateIdleAnimation() {
    const time = Date.now() * 0.001;
    
    // Animate test objects for visibility
    if (this.testCube) {
      this.testCube.rotation.x = time;
      this.testCube.rotation.y = time * 0.7;
      console.log('Test cube rotating at time:', time);
    }
    
    if (this.testSphere) {
      this.testSphere.rotation.y = time;
      this.testSphere.position.y = Math.sin(time) * 2;
    }
    
    if (this.currentTheme === 'matrix') {
      this.updateMatrixAnimation(time);
    } else if (this.currentTheme === 'rainbow') {
      this.updateRainbowAnimation(time);
    }
  }

  updateMatrixAnimation(time) {
    if (this.matrixSphere) {
      // Slower, more subtle rotation for 3D sphere
      this.matrixSphere.rotation.x = time * 0.3;
      this.matrixSphere.rotation.y = time * 0.2;
      this.matrixSphere.rotation.z = time * 0.15;
      
      // Gentle pulsating scale
      const scale = 1 + Math.sin(time * 1.5) * 0.1;
      this.matrixSphere.scale.setScalar(scale);
      
      // Subtle opacity changes for matrix effect
      this.matrixSphere.material.opacity = 0.7 + Math.sin(time * 2) * 0.1;
      
      // Gentle green color variations
      const greenIntensity = 0.8 + Math.sin(time * 1.2) * 0.1;
      this.matrixSphere.material.color.setRGB(0, greenIntensity, 0);
    }
    
    if (this.matrixInnerSphere) {
      // Slower counter-rotating inner sphere
      this.matrixInnerSphere.rotation.x = -time * 0.4;
      this.matrixInnerSphere.rotation.y = time * 0.3;
      this.matrixInnerSphere.rotation.z = -time * 0.2;
      
      // Very subtle pulsing
      const innerScale = 1 + Math.sin(time * 2 + 1) * 0.08;
      this.matrixInnerSphere.scale.setScalar(innerScale);
      
      // Gentle opacity changes offset from outer sphere
      this.matrixInnerSphere.material.opacity = 0.5 + Math.sin(time * 1.8 + 1) * 0.1;
      
      // Subtle green variations
      const innerGreenIntensity = 0.9 + Math.sin(time * 1.5) * 0.05;
      this.matrixInnerSphere.material.color.setRGB(0, innerGreenIntensity, 0.3);
    }
  }

  updateRainbowAnimation(time) {
    // Animate rainbow cubes in wave pattern
    this.cubes.forEach((cube, index) => {
      const waveOffset = index * 0.2;
      const wave1 = Math.sin(time * 2.5 + waveOffset) * 0.5 + 0.5;
      const wave2 = Math.sin(time * 4 + waveOffset * 0.5) * 0.3 + 0.3;
      const combinedWave = (wave1 + wave2) / 2;
      
      // Height animation
      const height = 1 + combinedWave * 8;
      cube.scale.y = height;
      cube.position.y = cube.originalY + height / 2;
      
      // Rotation
      cube.rotation.y += 0.025 + combinedWave * 0.02;
      cube.rotation.x += 0.01;
      cube.rotation.z = Math.sin(time * 2 + waveOffset) * 0.3;
      
      // Rainbow color cycling
      const colorHue = (index / this.cubes.length + time * 0.2 + combinedWave * 0.1) % 1;
      const saturation = 0.8 + combinedWave * 0.2;
      const lightness = 0.4 + combinedWave * 0.4;
      cube.material.color.setHSL(colorHue, saturation, lightness);
      
      // Scale pulsing
      const pulse = 1 + Math.sin(time * 3 + waveOffset) * 0.4;
      cube.scale.x = pulse;
      cube.scale.z = pulse;
      
      // Vertical bobbing
      const bob = Math.sin(time * 2 + waveOffset * 2) * 1.5;
      cube.position.y += bob;
    });
  }

  setupEventListeners() {
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const testBtn = document.getElementById('test-btn');
    const themeSelect = document.getElementById('theme-select');
    
    // Theme selector event listener
    themeSelect.addEventListener('change', (e) => {
      console.log('Theme changed to:', e.target.value);
      this.switchTheme(e.target.value);
    });
    
    startBtn.addEventListener('click', async () => {
      console.log('Start button clicked');
      startBtn.disabled = true;
      startBtn.textContent = 'Starting...';
      
      try {
        const success = await this.setupSystemAudio();
        if (success) {
          this.isPlaying = true;
          startBtn.textContent = 'System Audio Active';
          stopBtn.disabled = false;
          testBtn.disabled = true; // Disable demo when real audio is active
        } else {
          throw new Error('Failed to setup audio');
        }
      } catch (error) {
        console.error('Error starting audio:', error);
        startBtn.disabled = false;
        startBtn.textContent = 'Start Audio Visualization';
        document.getElementById('status').textContent = 'Error starting audio: ' + error.message;
      }
    });
    
    stopBtn.addEventListener('click', () => {
      console.log('Stop button clicked');
      this.stopAudio();
    });
    
    testBtn.addEventListener('click', () => {
      console.log('Demo mode button clicked');
      
      if (!this.isPlaying) {
        // Start demo mode with mock audio
        this.isPlaying = true;
        this.startMockAudioData();
        
        testBtn.textContent = 'Stop Demo';
        startBtn.disabled = true;
        stopBtn.disabled = false;
        document.getElementById('status').textContent = 'Demo mode active - beautiful mock audio visualization!';
      } else {
        // Stop demo mode
        this.stopAudio();
      }
    });
  }

  async stopAudio() {
    try {
      if (typeof window.__TAURI__ !== 'undefined') {
        const { invoke } = window.__TAURI__.core;
        await invoke('stop_audio_capture');
      }
    } catch (error) {
      console.error('Error stopping audio capture:', error);
    }
    
    if (this.audioDataInterval) {
      clearInterval(this.audioDataInterval);
      this.audioDataInterval = null;
    }
    
    this.isPlaying = false;
    this.currentAudioData = null;
    
    document.getElementById('start-btn').disabled = false;
    document.getElementById('start-btn').textContent = 'Start System Audio';
    document.getElementById('stop-btn').disabled = true;
    document.getElementById('test-btn').disabled = false;
    document.getElementById('test-btn').textContent = 'Demo Mode';
    document.getElementById('status').textContent = 'Idle Animation Active - Beautiful visuals even without audio!';
    document.getElementById('level-fill').style.width = '0%';
    document.getElementById('level-text').textContent = '0';
    
    console.log('Returned to idle animation mode (isPlaying =', this.isPlaying, ')');
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded, starting Dancer app initialization");
  
  // Quick test to verify Three.js is working
  console.log('THREE.js version:', THREE.REVISION);
  
  // Add a visible fallback for debugging
  const canvas = document.getElementById('three-canvas');
  if (canvas) {
    console.log('Canvas found, creating context test...');
    const ctx = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (ctx) {
      console.log('WebGL context created successfully');
    } else {
      console.error('Failed to create WebGL context');
    }
  } else {
    console.error('Canvas element not found!');
  }
  
  try {
    new AudioVisualizer();
  } catch (error) {
    console.error('Error initializing AudioVisualizer:', error);
  }
});
