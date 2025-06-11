/**
 * Main Application Class
 * Orchestrates all modules and manages application lifecycle
 */

import { EventEmitter } from '/src/utils/EventEmitter.js';
import { Scene } from '/src/core/Scene.js';
import { Globe } from '/src/core/Globe.js';
import { Controls } from '/src/core/Controls.js';
import { DataManager } from '/src/data/DataManager.js';
import { UI } from '/src/ui/UI.js';

export class App extends EventEmitter {
  constructor() {
    super();
    
    this.isInitialized = false;
    this.isDestroyed = false;
    
    // Core modules
    this.dataManager = null;
    this.scene = null;
    this.globe = null;
    this.controls = null;
    this.ui = null;
    
    // Configuration
    this.config = {
      container: '#globe-container',
      loadingScreen: '#loading-screen',
      enableStats: import.meta.env.DEV,
      autoRotate: false,
      enableDamping: true
    };
    
    // Bind context
    this.handleResize = this.handleResize.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  /**
   * Initialize the application
   */
  async initialize() {
    if (this.isInitialized) {
      console.warn('App already initialized');
      return;
    }

    try {
      
      // Show loading screen
      this.showLoading(true);
      
      // Initialize modules in order
      await this.initializeModules();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Start the application
      this.start();
      
      this.isInitialized = true;
      this.emit('app:initialized');
      
      
    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
      this.handleError(error);
    }
  }

  /**
   * Initialize all application modules
   */
  async initializeModules() {
    // 1. Data Manager (loads all data)
    this.dataManager = new DataManager();
    await this.dataManager.initialize();
    this.emit('app:data-loaded');

    // 2. Scene (Three.js setup)
    const container = document.querySelector(this.config.container);
    if (!container) {
      throw new Error(`Globe container not found: ${this.config.container}`);
    }
    
    this.scene = new Scene(container);
    await this.scene.initialize();
    this.emit('app:scene-ready');

    // 3. Globe (3D globe with data visualization)
    this.globe = new Globe(this.scene, this.dataManager);
    await this.globe.initialize();
    this.emit('app:globe-ready');

    // 4. Controls (interaction handling)
    this.controls = new Controls(this.scene, this.globe);
    await this.controls.initialize();
    this.emit('app:controls-ready');

    // 5. UI (interface components)
    this.ui = new UI(this.dataManager, this.globe, this.controls);
    await this.ui.initialize();
    this.emit('app:ui-ready');
    
  }

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // Window events
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Module cross-communication
    this.setupModuleEvents();
  }

  /**
   * Setup inter-module event communication
   */
  setupModuleEvents() {
    // Globe -> UI communication
    this.globe.on('country:clicked', (countryData) => {
      this.ui.showEngagementPanel(countryData);
    });

    this.globe.on('country:hovered', (countryData) => {
      this.ui.showTooltip(countryData);
    });

    // Controls -> Globe communication
    this.controls.on('view:reset', () => {
      this.globe.resetView();
    });

    // UI -> Globe communication
    this.ui.on('country:navigate', (countryCode) => {
      this.globe.focusCountry(countryCode);
    });

    this.ui.on('search:query', (query) => {
      this.globe.search(query);
    });

    // Data -> Globe communication
    this.dataManager.on('data:updated', (dataType) => {
      this.globe.updateData(dataType);
    });
  }

  /**
   * Start the application
   */
  start() {
    // Start the render loop
    this.scene.start();
    
    // Hide loading screen
    setTimeout(() => {
      this.showLoading(false);
    }, 500);
    
    // Enable UI interactions
    this.ui.enable();
    
    this.emit('app:started');
  }

  /**
   * Handle window resize
   */
  handleResize() {
    if (this.scene) {
      this.scene.handleResize();
    }
    
    this.emit('app:resize');
  }

  /**
   * Handle visibility change (tab switching, etc.)
   */
  handleVisibilityChange() {
    if (document.hidden) {
      this.pause();
    } else {
      this.resume();
    }
  }

  /**
   * Pause the application
   */
  pause() {
    if (this.scene) {
      this.scene.pause();
    }
    this.emit('app:paused');
  }

  /**
   * Resume the application
   */
  resume() {
    if (this.scene) {
      this.scene.resume();
    }
    this.emit('app:resumed');
  }

  /**
   * Show/hide loading screen
   */
  showLoading(show = true) {
    const loadingScreen = document.querySelector(this.config.loadingScreen);
    if (loadingScreen) {
      if (show) {
        loadingScreen.classList.remove('hidden');
      } else {
        loadingScreen.classList.add('hidden');
      }
    }
  }

  /**
   * Handle application errors
   */
  handleError(error) {
    console.error('Application Error:', error);
    
    // Show error to user
    if (this.ui) {
      this.ui.showError('An error occurred. Please refresh the page.');
    }
    
    this.emit('app:error', error);
  }

  /**
   * Get application statistics
   */
  getStats() {
    if (!this.isInitialized) return null;
    
    return {
      initialized: this.isInitialized,
      modules: {
        dataManager: !!this.dataManager,
        scene: !!this.scene,
        globe: !!this.globe,
        controls: !!this.controls,
        ui: !!this.ui
      },
      performance: this.scene ? this.scene.getStats() : null
    };
  }

  /**
   * Destroy the application and cleanup resources
   */
  destroy() {
    if (this.isDestroyed) return;
    
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Destroy modules in reverse order
    if (this.ui) this.ui.destroy();
    if (this.controls) this.controls.destroy();
    if (this.globe) this.globe.destroy();
    if (this.scene) this.scene.destroy();
    if (this.dataManager) this.dataManager.destroy();
    
    // Clear references
    this.ui = null;
    this.controls = null;
    this.globe = null;
    this.scene = null;
    this.dataManager = null;
    
    // Clear all event listeners
    this.removeAllListeners();
    
    this.isDestroyed = true;
    this.isInitialized = false;
    
  }
}