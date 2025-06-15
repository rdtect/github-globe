/**
 * Scene Manager - Three.js scene, camera, renderer setup
 */

import * as THREE from 'three';
import BaseComponent from '../utils/BaseComponent.js';

export class Scene extends BaseComponent {
  constructor(container) {
    super('Scene');
    
    this.container = container;
    this.isAnimating = false;
    this.isPaused = false;
    
    // Three.js core objects
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.raycaster = null;
    this.mouse = new THREE.Vector2();
    
    // Animation
    this.animationId = null;
    this.clock = new THREE.Clock();
    
    // Performance monitoring
    this.stats = {
      frameCount: 0,
      fps: 0,
      lastTime: 0,
      renderTime: 0
    };
    
    // Bind methods
    this.animate = this.animate.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  /**
   * Initialize the Three.js scene
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      this.setupRenderer();
      this.setupScene();
      this.setupCamera();
      this.setupLighting();
      this.setupRaycaster();
      this.setupEventListeners();
      
      this.isInitialized = true;
      this.emit('scene:initialized');
      
      console.log('✅ Scene initialized');
      
    } catch (error) {
      console.error('❌ Scene initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup WebGL renderer
   */
  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x040d21, 1);
    
    // Modern Three.js settings
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Append to container
    this.container.appendChild(this.renderer.domElement);
  }

  /**
   * Setup Three.js scene
   */
  setupScene() {
    this.scene = new THREE.Scene();
    
    // Fog for depth perception
    this.scene.fog = new THREE.Fog(0x535ef3, 400, 2000);
    
    // Background
    this.scene.background = new THREE.Color(0x040d21);
  }

  /**
   * Setup camera
   */
  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      60,  // Reduced field of view for better focus
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    
    // Exact legacy camera position
    this.camera.position.z = 400;
    this.camera.position.x = 0;
    this.camera.position.y = 0;
    this.camera.lookAt(0, 0, 0);
    
    // Store initial camera position for reset
    this.initialCameraPosition = this.camera.position.clone();
  }

  /**
   * Setup scene lighting to match legacy exactly
   */
  setupLighting() {
    // Exact legacy ambient light
    const ambientLight = new THREE.AmbientLight(0xbbbbbb, 0.3);
    this.scene.add(ambientLight);
    
    // Legacy directional lights attached to camera
    const dLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dLight.position.set(-800, 2000, 400);
    this.camera.add(dLight);
    
    const dLight1 = new THREE.DirectionalLight(0x7982f6, 1);
    dLight1.position.set(-200, 500, 200);
    this.camera.add(dLight1);
    
    const dLight2 = new THREE.PointLight(0x8566cc, 0.5);
    dLight2.position.set(-200, 500, 200);
    this.camera.add(dLight2);
    
    // Add camera to scene (legacy does this)
    this.scene.add(this.camera);
  }

  /**
   * Setup raycaster for mouse interactions
   */
  setupRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Points.threshold = 0.1;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.renderer.domElement.addEventListener('mousemove', this.handleMouseMove);
    this.renderer.domElement.addEventListener('click', this.handleClick);
  }

  /**
   * Handle mouse movement
   */
  handleMouseMove(event) {
    // Convert mouse position to normalized device coordinates
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.emit('scene:mousemove', {
      mouse: this.mouse,
      originalEvent: event
    });
  }

  /**
   * Handle mouse clicks
   */
  handleClick(event) {
    this.updateRaycaster();
    
    this.emit('scene:click', {
      mouse: this.mouse,
      raycaster: this.raycaster,
      originalEvent: event
    });
  }

  /**
   * Update raycaster with current mouse position
   */
  updateRaycaster() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
  }

  /**
   * Get raycaster intersections
   */
  getIntersections(objects, recursive = true) {
    this.updateRaycaster();
    return this.raycaster.intersectObjects(objects, recursive);
  }

  /**
   * Start the animation loop
   */
  start() {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    this.isPaused = false;
    this.stats.lastTime = performance.now();
    this.animate();
    
    this.emit('scene:started');
  }

  /**
   * Animation loop
   */
  animate() {
    if (!this.isAnimating) return;
    
    this.animationId = requestAnimationFrame(this.animate);
    
    if (this.isPaused) return;
    
    const currentTime = performance.now();
    const deltaTime = this.clock.getDelta();
    
    // Update performance stats
    this.updateStats(currentTime);
    
    // Emit animation frame event
    this.emit('scene:animate', {
      deltaTime,
      elapsedTime: this.clock.getElapsedTime(),
      currentTime
    });
    
    // Render the scene
    const renderStart = performance.now();
    this.renderer.render(this.scene, this.camera);
    this.stats.renderTime = performance.now() - renderStart;
  }

  /**
   * Update performance statistics
   */
  updateStats(currentTime) {
    this.stats.frameCount++;
    
    if (currentTime - this.stats.lastTime >= 1000) {
      this.stats.fps = Math.round((this.stats.frameCount * 1000) / (currentTime - this.stats.lastTime));
      this.stats.frameCount = 0;
      this.stats.lastTime = currentTime;
      
      this.emit('scene:stats', this.stats);
    }
  }

  /**
   * Pause animation
   */
  pause() {
    this.isPaused = true;
    this.emit('scene:paused');
  }

  /**
   * Resume animation
   */
  resume() {
    this.isPaused = false;
    this.clock.start();
    this.emit('scene:resumed');
  }

  /**
   * Stop animation
   */
  stop() {
    this.isAnimating = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    this.emit('scene:stopped');
  }

  /**
   * Handle window resize
   */
  handleResize() {
    if (!this.camera || !this.renderer) return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Update camera
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    // Update renderer
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    this.emit('scene:resize', { width, height });
  }

  /**
   * Add object to scene
   */
  add(object) {
    if (this.scene) {
      this.scene.add(object);
      this.emit('scene:object-added', object);
    }
  }

  /**
   * Remove object from scene
   */
  remove(object) {
    if (this.scene) {
      this.scene.remove(object);
      this.emit('scene:object-removed', object);
    }
  }

  /**
   * Get scene objects by type
   */
  getObjectsByType(type) {
    const objects = [];
    this.scene.traverse((object) => {
      if (object.type === type || object.constructor.name === type) {
        objects.push(object);
      }
    });
    return objects;
  }

  /**
   * Screenshot functionality
   */
  takeScreenshot(width = 1920, height = 1080) {
    const originalSize = this.renderer.getSize(new THREE.Vector2());
    const originalPixelRatio = this.renderer.getPixelRatio();
    
    // Temporarily resize for screenshot
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(width, height);
    
    // Update camera aspect ratio
    const originalAspect = this.camera.aspect;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    // Render
    this.renderer.render(this.scene, this.camera);
    
    // Get image data
    const dataURL = this.renderer.domElement.toDataURL('image/png');
    
    // Restore original settings
    this.renderer.setPixelRatio(originalPixelRatio);
    this.renderer.setSize(originalSize.x, originalSize.y);
    this.camera.aspect = originalAspect;
    this.camera.updateProjectionMatrix();
    
    return dataURL;
  }

  /**
   * Get performance statistics
   */
  getStats() {
    return {
      ...this.stats,
      memory: this.renderer.info.memory,
      render: this.renderer.info.render,
      capabilities: this.renderer.capabilities
    };
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    this.stop();
    
    // Remove event listeners
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.removeEventListener('mousemove', this.handleMouseMove);
      this.renderer.domElement.removeEventListener('click', this.handleClick);
    }
    
    // Dispose of Three.js objects
    if (this.scene) {
      this.scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    }
    
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
    
    // Clear references
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.raycaster = null;
    
    this.removeAllListeners();
    this.emit('scene:destroyed');
  }
}