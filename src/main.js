import * as THREE from 'three';

class AudioVisualizer {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.cubes = [];
    this.sphere = null;
    this.isPlaying = false;
    this.animationId = null;
    this.audioDataInterval = null;
    
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

  createAudioReactiveObjects() {
    // Create central sphere - smaller and closer
    const sphereGeometry = new THREE.SphereGeometry(2, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff6b6b,
      transparent: true,
      opacity: 0.8
    });
    this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.sphere.position.set(0, 0, 0);
    this.scene.add(this.sphere);
    console.log('Central sphere added to scene');
    
    // Create frequency bars (cubes in a circle) - smaller and closer
    const cubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const numCubes = 16; // Fewer cubes for testing
    
    for (let i = 0; i < numCubes; i++) {
      const cubeMaterial = new THREE.MeshBasicMaterial({ 
        color: new THREE.Color().setHSL(i / numCubes, 0.8, 0.5)
      });
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      
      const angle = (i / numCubes) * Math.PI * 2;
      const radius = 6; // Much smaller radius
      cube.position.x = Math.cos(angle) * radius;
      cube.position.z = Math.sin(angle) * radius;
      cube.originalY = 0;
      
      this.cubes.push(cube);
      this.scene.add(cube);
    }
    console.log('Created', numCubes, 'frequency cubes');
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
      document.getElementById('status').textContent = 'System audio capture active! 🎵';
      
      // Start polling for audio data
      this.startAudioDataPolling();
      
      return true;
    } catch (error) {
      console.error('Error starting system audio:', error);
      console.log('Falling back to mock audio data...');
      
      document.getElementById('status').textContent = 'Using demo mode - beautiful visualizations! 🌈';
      
      // Start mock data for demo purposes
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
    
    // Calculate overall volume and frequency metrics
    const average = audioData.reduce((a, b) => a + b) / audioData.length;
    const max = Math.max(...audioData);
    
    // Update sphere based on overall volume
    const scale = 1 + (average / 256) * 3;
    this.sphere.scale.setScalar(scale);
    this.sphere.rotation.y += 0.01 * (average / 128);
    this.sphere.rotation.x += 0.005 * (max / 256);
    
    // Update sphere color based on frequency
    const hue = (average / 256) * 0.8; // Extended color range
    this.sphere.material.color.setHSL(hue, 0.9, 0.6);
    
    // Make sphere glow more with higher volume
    this.sphere.material.opacity = 0.6 + (average / 512);
    
    // Update cubes based on frequency data
    this.cubes.forEach((cube, index) => {
      const dataIndex = Math.floor(index * audioData.length / this.cubes.length);
      const value = audioData[dataIndex];
      
      // Scale cube height based on frequency (more dramatic)
      const height = (value / 256) * 15 + 0.5;
      cube.scale.y = height;
      cube.position.y = cube.originalY + height / 2;
      
      // Scale width slightly for more dynamic effect
      const widthScale = 1 + (value / 512);
      cube.scale.x = widthScale;
      cube.scale.z = widthScale;
      
      // Rotate cubes based on their frequency value
      cube.rotation.y += 0.02 + (value / 512) * 0.05;
      cube.rotation.z += 0.01;
      
      // Update color based on frequency and position
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
    
    // More dramatic breathing effect for sphere
    if (this.sphere) {
      const breathe = 1.2 + Math.sin(time * 1.5) * 0.5;
      this.sphere.scale.setScalar(breathe);
      this.sphere.rotation.y += 0.015;
      this.sphere.rotation.x += 0.008;
      
      // Rainbow color cycling for sphere (faster)
      const hue = (time * 0.15) % 1;
      this.sphere.material.color.setHSL(hue, 0.9, 0.7);
      
      // Pulsating opacity for more visual appeal
      this.sphere.material.opacity = 0.7 + Math.sin(time * 3) * 0.2;
    }
    
    // More dramatic wave pattern for cubes
    this.cubes.forEach((cube, index) => {
      const waveOffset = index * 0.15;
      const wave1 = Math.sin(time * 2.5 + waveOffset) * 0.5 + 0.5;
      const wave2 = Math.sin(time * 4 + waveOffset * 0.5) * 0.3 + 0.3;
      const combinedWave = (wave1 + wave2) / 2;
      
      // More dramatic height animation
      const height = 1 + combinedWave * 12;
      cube.scale.y = height;
      cube.position.y = cube.originalY + height / 2;
      
      // Enhanced rotation with multiple axes
      cube.rotation.y += 0.025 + combinedWave * 0.02;
      cube.rotation.x += 0.01;
      cube.rotation.z = Math.sin(time * 2 + waveOffset) * 0.3;
      
      // Dynamic color waves with multiple hues
      const colorHue = (index / this.cubes.length + time * 0.2 + combinedWave * 0.1) % 1;
      const saturation = 0.8 + combinedWave * 0.2;
      const lightness = 0.4 + combinedWave * 0.4;
      cube.material.color.setHSL(colorHue, saturation, lightness);
      
      // More dramatic scale pulsing
      const pulse = 1 + Math.sin(time * 3 + waveOffset) * 0.4;
      cube.scale.x = pulse;
      cube.scale.z = pulse;
      
      // Add vertical bobbing motion
      const bob = Math.sin(time * 2 + waveOffset * 2) * 2;
      cube.position.y += bob;
    });
  }

  setupEventListeners() {
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const testBtn = document.getElementById('test-btn');
    
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
          testBtn.disabled = false;
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
      console.log('Testing audio input...');
      document.getElementById('status').textContent = 'Test mode active - watch the visualization!';
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
    document.getElementById('start-btn').textContent = 'Start Audio Visualization';
    document.getElementById('stop-btn').disabled = true;
    document.getElementById('test-btn').disabled = true;
    document.getElementById('status').textContent = '🌈 Idle Animation Active - Beautiful visuals even without audio!';
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
