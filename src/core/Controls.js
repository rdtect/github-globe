/**
 * Controls Manager - Camera controls and interaction handling
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EventEmitter } from '/src/utils/EventEmitter.js';

export class Controls extends EventEmitter {
  constructor(scene, globe) {
    super();
    
    this.scene = scene;
    this.globe = globe;
    this.isInitialized = false;
    
    // Controls
    this.orbitControls = null;
    this.isEnabled = true;
    this.isDragging = false;
    
    // Mouse interaction
    this.mouse = new THREE.Vector2();
    this.lastMousePosition = new THREE.Vector2();
    this.mouseDelta = new THREE.Vector2();
    
    // Touch interaction
    this.touches = new Map();
    this.lastTouchDistance = 0;
    
    // Configuration - Adjusted for larger globe (radius 150)
    this.config = {
      enableDamping: true,
      dampingFactor: 0.05,
      enablePan: false,
      enableZoom: true,
      enableRotate: true,
      minDistance: 200,  // Increased from 150 to 200
      maxDistance: 1000, // Increased from 800 to 1000  
      minPolarAngle: Math.PI / 3.5,
      maxPolarAngle: Math.PI - Math.PI / 3,
      rotateSpeed: 0.8,
      zoomSpeed: 1.0,
      autoRotateSpeed: 0.5
    };
    
    // State
    this.state = {
      isInteracting: false,
      lastInteractionTime: 0,
      autoRotateTimeout: null,
      mouseDownTime: 0,
      clickThreshold: 200 // ms
    };
    
    // Bind methods
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  /**
   * Initialize controls
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🎮 Initializing controls...');
      
      this.setupOrbitControls();
      this.setupEventListeners();
      this.setupKeyboardControls();
      
      this.isInitialized = true;
      this.emit('controls:initialized');
      
      console.log('✅ Controls initialized');
      
    } catch (error) {
      console.error('❌ Controls initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup OrbitControls
   */
  setupOrbitControls() {
    if (!this.scene.camera || !this.scene.renderer) {
      throw new Error('Scene camera and renderer required for controls');
    }

    this.orbitControls = new OrbitControls(
      this.scene.camera,
      this.scene.renderer.domElement
    );

    // Configure orbit controls
    this.orbitControls.enableDamping = this.config.enableDamping;
    this.orbitControls.dampingFactor = this.config.dampingFactor;
    this.orbitControls.enablePan = this.config.enablePan;
    this.orbitControls.enableZoom = this.config.enableZoom;
    this.orbitControls.enableRotate = this.config.enableRotate;
    
    this.orbitControls.minDistance = this.config.minDistance;
    this.orbitControls.maxDistance = this.config.maxDistance;
    this.orbitControls.minPolarAngle = this.config.minPolarAngle;
    this.orbitControls.maxPolarAngle = this.config.maxPolarAngle;
    
    this.orbitControls.rotateSpeed = this.config.rotateSpeed;
    this.orbitControls.zoomSpeed = this.config.zoomSpeed;
    this.orbitControls.autoRotateSpeed = this.config.autoRotateSpeed;

    // Orbit controls events
    this.orbitControls.addEventListener('start', () => {
      this.state.isInteracting = true;
      this.state.lastInteractionTime = performance.now();
      this.stopAutoRotate();
      this.emit('controls:interaction-start');
    });

    this.orbitControls.addEventListener('change', () => {
      this.emit('controls:change');
    });

    this.orbitControls.addEventListener('end', () => {
      this.state.isInteracting = false;
      this.scheduleAutoRotate();
      this.emit('controls:interaction-end');
    });

    // Listen for scene animation frames to update controls
    this.scene.on('scene:animate', () => {
      if (this.orbitControls) {
        this.orbitControls.update();
      }
    });
  }

  /**
   * Setup custom event listeners
   */
  setupEventListeners() {
    const canvas = this.scene.renderer.domElement;

    // Mouse events
    canvas.addEventListener('mousedown', this.handleMouseDown);
    canvas.addEventListener('mousemove', this.handleMouseMove);
    canvas.addEventListener('mouseup', this.handleMouseUp);
    canvas.addEventListener('wheel', this.handleWheel, { passive: false });

    // Touch events
    canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });

    // Prevent context menu
    canvas.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });
  }

  /**
   * Setup keyboard controls
   */
  setupKeyboardControls() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Handle mouse down
   */
  handleMouseDown(event) {
    this.isDragging = false;
    this.state.mouseDownTime = performance.now();
    this.lastMousePosition.set(event.clientX, event.clientY);
    
    this.emit('controls:mouse-down', { event, button: event.button });
  }

  /**
   * Handle mouse move
   */
  handleMouseMove(event) {
    // Update mouse position
    const rect = this.scene.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Calculate mouse delta
    this.mouseDelta.set(
      event.clientX - this.lastMousePosition.x,
      event.clientY - this.lastMousePosition.y
    );

    // Check if dragging
    const deltaLength = this.mouseDelta.length();
    if (deltaLength > 5) {
      this.isDragging = true;
    }

    this.lastMousePosition.set(event.clientX, event.clientY);
    
    this.emit('controls:mouse-move', {
      event,
      mouse: this.mouse,
      delta: this.mouseDelta,
      isDragging: this.isDragging
    });
  }

  /**
   * Handle mouse up
   */
  handleMouseUp(event) {
    const clickDuration = performance.now() - this.state.mouseDownTime;
    
    // Determine if this was a click or drag
    if (!this.isDragging && clickDuration < this.state.clickThreshold) {
      this.handleClick(event);
    }

    this.isDragging = false;
    
    this.emit('controls:mouse-up', {
      event,
      button: event.button,
      wasClick: !this.isDragging && clickDuration < this.state.clickThreshold
    });
  }

  /**
   * Handle click events
   */
  handleClick(event) {
    this.emit('controls:click', {
      event,
      mouse: this.mouse,
      button: event.button
    });
  }

  /**
   * Handle mouse wheel
   */
  handleWheel(event) {
    event.preventDefault();
    
    const delta = event.deltaY > 0 ? 1 : -1;
    
    this.emit('controls:wheel', {
      event,
      delta,
      deltaY: event.deltaY
    });
  }

  /**
   * Handle touch start
   */
  handleTouchStart(event) {
    event.preventDefault();
    
    // Store touch information
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      this.touches.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY,
        startTime: performance.now()
      });
    }

    // Handle pinch gestures
    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      this.lastTouchDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
    }

    this.emit('controls:touch-start', { event, touchCount: event.touches.length });
  }

  /**
   * Handle touch move
   */
  handleTouchMove(event) {
    event.preventDefault();

    // Handle pinch zoom
    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      if (this.lastTouchDistance > 0) {
        const scale = distance / this.lastTouchDistance;
        this.emit('controls:pinch', { scale, distance });
      }

      this.lastTouchDistance = distance;
    }

    this.emit('controls:touch-move', { event, touchCount: event.touches.length });
  }

  /**
   * Handle touch end
   */
  handleTouchEnd(event) {
    event.preventDefault();

    // Remove ended touches
    const currentTouchIds = Array.from(event.touches).map(t => t.identifier);
    for (const [id, touch] of this.touches) {
      if (!currentTouchIds.includes(id)) {
        const duration = performance.now() - touch.startTime;
        
        // Check for tap gesture
        if (duration < this.state.clickThreshold && event.touches.length === 0) {
          this.emit('controls:tap', { touch, duration });
        }
        
        this.touches.delete(id);
      }
    }

    // Reset pinch distance when no touches
    if (event.touches.length === 0) {
      this.lastTouchDistance = 0;
    }

    this.emit('controls:touch-end', { event, touchCount: event.touches.length });
  }

  /**
   * Handle keyboard input
   */
  handleKeyDown(event) {
    // Ignore if typing in input fields
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }

    const key = event.key.toLowerCase();
    
    switch (key) {
      case 'r':
        // Reset view
        this.resetView();
        break;
        
      case 'a':
        // Toggle auto-rotate
        this.toggleAutoRotate();
        break;
        
      case 'f':
        // Toggle fullscreen
        this.toggleFullscreen();
        break;
        
      case 'escape':
        // Cancel current interaction
        this.cancelInteraction();
        break;
        
      case ' ':
        // Pause/resume auto-rotate
        event.preventDefault();
        this.toggleAutoRotate();
        break;
    }

    this.emit('controls:key-down', { event, key });
  }

  /**
   * Reset view to default position
   */
  resetView() {
    if (!this.orbitControls) return;

    // Reset camera position
    this.scene.camera.position.set(0, 0, 400);
    this.orbitControls.target.set(0, 0, 0);
    this.orbitControls.update();

    this.emit('view:reset');
  }

  /**
   * Toggle auto-rotate
   */
  toggleAutoRotate() {
    if (!this.orbitControls) return;

    this.orbitControls.autoRotate = !this.orbitControls.autoRotate;
    
    if (this.orbitControls.autoRotate) {
      this.scheduleAutoRotate();
    } else {
      this.stopAutoRotate();
    }

    this.emit('controls:auto-rotate', this.orbitControls.autoRotate);
  }

  /**
   * Schedule auto-rotate to start after idle period
   */
  scheduleAutoRotate() {
    this.stopAutoRotate();
    
    this.state.autoRotateTimeout = setTimeout(() => {
      if (this.orbitControls && !this.state.isInteracting) {
        this.orbitControls.autoRotate = true;
        this.emit('controls:auto-rotate-started');
      }
    }, 3000); // Start auto-rotate after 3 seconds of inactivity
  }

  /**
   * Stop auto-rotate
   */
  stopAutoRotate() {
    if (this.state.autoRotateTimeout) {
      clearTimeout(this.state.autoRotateTimeout);
      this.state.autoRotateTimeout = null;
    }

    if (this.orbitControls) {
      this.orbitControls.autoRotate = false;
    }
  }

  /**
   * Toggle fullscreen
   */
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      this.emit('controls:fullscreen-enter');
    } else {
      document.exitFullscreen();
      this.emit('controls:fullscreen-exit');
    }
  }

  /**
   * Cancel current interaction
   */
  cancelInteraction() {
    this.isDragging = false;
    this.state.isInteracting = false;
    this.emit('controls:interaction-cancelled');
  }

  /**
   * Enable controls
   */
  enable() {
    this.isEnabled = true;
    if (this.orbitControls) {
      this.orbitControls.enabled = true;
    }
    this.emit('controls:enabled');
  }

  /**
   * Disable controls
   */
  disable() {
    this.isEnabled = false;
    if (this.orbitControls) {
      this.orbitControls.enabled = false;
    }
    this.stopAutoRotate();
    this.emit('controls:disabled');
  }

  /**
   * Set control configuration
   */
  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    if (this.orbitControls) {
      Object.keys(newConfig).forEach(key => {
        if (key in this.orbitControls) {
          this.orbitControls[key] = newConfig[key];
        }
      });
    }

    this.emit('controls:config-updated', this.config);
  }

  /**
   * Get current control state
   */
  getState() {
    return {
      isEnabled: this.isEnabled,
      isDragging: this.isDragging,
      isInteracting: this.state.isInteracting,
      autoRotate: this.orbitControls?.autoRotate || false,
      camera: {
        position: this.scene.camera?.position.toArray() || [0, 0, 0],
        target: this.orbitControls?.target.toArray() || [0, 0, 0]
      }
    };
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    this.stopAutoRotate();
    
    // Remove event listeners
    const canvas = this.scene.renderer?.domElement;
    if (canvas) {
      canvas.removeEventListener('mousedown', this.handleMouseDown);
      canvas.removeEventListener('mousemove', this.handleMouseMove);
      canvas.removeEventListener('mouseup', this.handleMouseUp);
      canvas.removeEventListener('wheel', this.handleWheel);
      canvas.removeEventListener('touchstart', this.handleTouchStart);
      canvas.removeEventListener('touchmove', this.handleTouchMove);
      canvas.removeEventListener('touchend', this.handleTouchEnd);
    }

    document.removeEventListener('keydown', this.handleKeyDown);

    // Dispose orbit controls
    if (this.orbitControls) {
      this.orbitControls.dispose();
      this.orbitControls = null;
    }

    // Clear state
    this.touches.clear();
    
    this.removeAllListeners();
    this.emit('controls:destroyed');
  }
}