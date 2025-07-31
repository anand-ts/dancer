export default class DragHandler {
  constructor(element, dragHandle = null) {
    this.element = element;
    this.dragHandle = dragHandle || element; // Use separate drag handle if provided
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    
    this.setupDragEvents();
  }
  
  setupDragEvents() {
    this.dragHandle.addEventListener('mousedown', (e) => this.startDrag(e));
    document.addEventListener('mousemove', (e) => this.drag(e));
    document.addEventListener('mouseup', () => this.stopDrag());
    
    // Add visual indication that drag handle is draggable
    this.dragHandle.style.cursor = 'move';
  }
  
  startDrag(e) {
    this.isDragging = true;
    const rect = this.element.getBoundingClientRect();
    this.dragOffset.x = e.clientX - rect.left;
    this.dragOffset.y = e.clientY - rect.top;
    
    // Add dragging class for visual feedback
    this.element.classList.add('dragging');
    e.preventDefault();
  }
  
  drag(e) {
    if (!this.isDragging) return;
    
    const x = e.clientX - this.dragOffset.x;
    const y = e.clientY - this.dragOffset.y;
    
    // Keep element within viewport bounds
    const maxX = window.innerWidth - this.element.offsetWidth;
    const maxY = window.innerHeight - this.element.offsetHeight;
    
    const boundedX = Math.max(0, Math.min(x, maxX));
    const boundedY = Math.max(0, Math.min(y, maxY));
    
    this.element.style.left = boundedX + 'px';
    this.element.style.top = boundedY + 'px';
  }
  
  stopDrag() {
    if (this.isDragging) {
      this.isDragging = false;
      this.element.classList.remove('dragging');
    }
  }
}
