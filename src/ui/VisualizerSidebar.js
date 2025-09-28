export default class VisualizerSidebar {
  constructor(renderer) {
    this.renderer = renderer;
    this.isOpen = false;
    this.currentVisualizer = 'frequency-bars';
    
    // Get DOM elements
    this.toggleButton = document.getElementById('visualizer-toggle');
    this.sidebar = document.getElementById('visualizer-sidebar');
    this.closeButton = document.getElementById('sidebar-close');
    this.backdrop = document.querySelector('.sidebar-backdrop');
    this.visualizerOptions = document.querySelectorAll('.visualizer-option');
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Toggle button
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', () => this.toggleSidebar());
    }
    
    // Close button
    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => this.closeSidebar());
    }
    
    // Backdrop click
    if (this.backdrop) {
      this.backdrop.addEventListener('click', () => this.closeSidebar());
    }
    
    // Visualizer options
    this.visualizerOptions.forEach(option => {
      option.addEventListener('click', () => {
        const visualizerType = option.getAttribute('data-visualizer');
        this.selectVisualizer(visualizerType);
      });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeSidebar();
      }
      
      // Quick visualizer shortcuts (V + number)
      if (e.key === 'v' && !this.isOpen) {
        this.openSidebar();
      }
      
      // Number keys to select visualizer when sidebar is open
      if (this.isOpen && e.key >= '1' && e.key <= '5') {
        const visualizers = [
          'frequency-bars',
          'circular-spectrum',
          'waveform',
          'particle-field',
          'matrix-rain'
        ];
        const index = parseInt(e.key) - 1;
        if (visualizers[index]) {
          this.selectVisualizer(visualizers[index]);
        }
      }
    });
  }
  
  toggleSidebar() {
    if (this.isOpen) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  }
  
  openSidebar() {
    this.isOpen = true;
    this.sidebar.classList.add('open');
    this.toggleButton.classList.add('active');
    
    // Prevent body scroll when sidebar is open
    document.body.style.overflow = 'hidden';
    
    // Add subtle background blur effect
    const canvas = document.getElementById('waveform-canvas');
    if (canvas) {
      canvas.style.filter = 'blur(2px) brightness(0.7)';
    }
    
    // Animate visualizer options with stagger effect
    this.visualizerOptions.forEach((option, index) => {
      option.style.transform = 'translateX(30px)';
      option.style.opacity = '0';
      
      setTimeout(() => {
        option.style.transform = 'translateX(0)';
        option.style.opacity = '1';
        option.style.transition = 'all 0.3s ease';
      }, 100 + (index * 50));
    });
    
    // Focus management for accessibility
    setTimeout(() => {
      if (this.closeButton) {
        this.closeButton.focus();
      }
    }, 400);
  }
  
  closeSidebar() {
    this.isOpen = false;
    this.sidebar.classList.remove('open');
    this.toggleButton.classList.remove('active');
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Remove background blur
    const canvas = document.getElementById('waveform-canvas');
    if (canvas) {
      canvas.style.filter = '';
    }
    
    // Reset option transitions
    this.visualizerOptions.forEach(option => {
      option.style.transform = '';
      option.style.opacity = '';
      option.style.transition = '';
    });
    
    // Return focus to toggle button
    if (this.toggleButton) {
      this.toggleButton.focus();
    }
  }
  
  selectVisualizer(type) {
    // Update active state
    this.visualizerOptions.forEach(option => {
      option.classList.remove('active');
    });
    
    const selectedOption = document.querySelector(`[data-visualizer="${type}"]`);
    if (selectedOption) {
      selectedOption.classList.add('active');
      
      // Add selection feedback animation
      selectedOption.style.transform = 'scale(0.98)';
      setTimeout(() => {
        selectedOption.style.transform = '';
      }, 150);
    }
    
    // Update current visualizer
    this.currentVisualizer = type;
    
    // Set visualizer in renderer
    if (this.renderer && this.renderer.setVisualizer) {
      this.renderer.setVisualizer(type);
    }
    
    // Show brief feedback notification
    this.showVisualizerFeedback(type);
    
    // Close sidebar after selection (optional - good UX)
    setTimeout(() => {
      this.closeSidebar();
    }, 300);
  }
  
  showVisualizerFeedback(type) {
    // Create temporary notification
    const notification = document.createElement('div');
    notification.className = 'visualizer-notification';
    notification.textContent = this.getVisualizerDisplayName(type);
    
    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(255, 255, 255, 0.95)',
      border: '3px solid #000',
      borderRadius: '0',
      padding: '12px 24px',
      fontFamily: 'Monaco, Courier New, monospace',
      fontSize: '14px',
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      boxShadow: '6px 6px 0px #000',
      zIndex: '2000',
      opacity: '0',
      transition: 'all 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translate(-50%, -50%) scale(1.05)';
    });
    
    // Animate out and remove
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translate(-50%, -50%) scale(0.95)';
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 1500);
  }
  
  getVisualizerDisplayName(type) {
    const names = {
      'frequency-bars': 'FREQUENCY BARS',
      'circular-spectrum': 'CIRCULAR SPECTRUM',
      'waveform': 'WAVEFORM',
      'particle-field': 'PARTICLE FIELD',
      'matrix-rain': 'MATRIX RAIN'
    };
    
    return names[type] || 'VISUALIZER';
  }
  
  getCurrentVisualizer() {
    return this.currentVisualizer;
  }
  
  // Method to be called when window resizes
  handleResize() {
    if (this.isOpen) {
      // Adjust sidebar for mobile if needed
      const sidebarContent = document.querySelector('.sidebar-content');
      if (sidebarContent && window.innerWidth <= 480) {
        sidebarContent.style.width = '100vw';
      } else if (sidebarContent) {
        sidebarContent.style.width = '400px';
      }
    }
  }
}