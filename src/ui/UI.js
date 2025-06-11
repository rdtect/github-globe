/**
 * UI Manager - Main interface controller
 */

import { EventEmitter } from '/src/utils/EventEmitter.js';
import { EngagementPanel } from '/src/ui/EngagementPanel.js';
import { Notepad } from '/src/ui/Notepad.js';
import { Modal } from '/src/ui/Modal.js';
import { Toolbar } from '/src/ui/Toolbar.js';

export class UI extends EventEmitter {
  constructor(dataManager, globe, controls) {
    super();
    
    this.dataManager = dataManager;
    this.globe = globe;
    this.controls = controls;
    this.isInitialized = false;
    this.isEnabled = false;
    
    // UI Components
    this.engagementPanel = null;
    this.notepad = null;
    this.modal = null;
    this.toolbar = null;
    
    // DOM elements
    this.elements = {
      overlay: null,
      navButtons: null,
      loadingScreen: null
    };
    
    // State
    this.activeCountry = null;
    this.tooltipTimeout = null;
    
    // Bind methods
    this.handleCountryNavigation = this.handleCountryNavigation.bind(this);
  }

  /**
   * Initialize UI components
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      
      this.setupDOMElements();
      this.initializeComponents();
      this.setupEventListeners();
      this.buildCountryNavigation();
      
      this.isInitialized = true;
      this.emit('ui:initialized');
      
      
    } catch (error) {
      console.error('❌ UI initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup DOM element references
   */
  setupDOMElements() {
    this.elements.overlay = document.getElementById('ui-overlay');
    this.elements.navButtons = document.getElementById('nav-buttons');
    this.elements.loadingScreen = document.getElementById('loading-screen');

    if (!this.elements.overlay) {
      throw new Error('UI overlay element not found');
    }
  }

  /**
   * Initialize UI components
   */
  initializeComponents() {
    // Engagement Panel
    this.engagementPanel = new EngagementPanel(this.dataManager);
    this.engagementPanel.initialize();

    // Notepad
    this.notepad = new Notepad(this.dataManager);
    this.notepad.initialize();

    // Modal System
    this.modal = new Modal();
    this.modal.initialize();

    // Toolbar
    this.toolbar = new Toolbar(this.globe, this.controls, this.modal);
    this.toolbar.initialize();

    // Connect components
    this.connectComponents();
  }

  /**
   * Connect components with event handling
   */
  connectComponents() {
    // Toolbar -> UI communication
    this.toolbar.on('toolbar:home', () => {
      this.emit('country:navigate', null); // Reset view
    });

    this.toolbar.on('toolbar:search', () => {
      this.showSearchModal();
    });

    this.toolbar.on('toolbar:notes', () => {
      this.showNotesModal();
    });

    this.toolbar.on('toolbar:settings', () => {
      this.showSettingsModal();
    });

    // Engagement Panel -> Notepad communication
    this.engagementPanel.on('panel:add-note', (data) => {
      this.notepad.openForCountry(data.countryCode);
    });

    // Notepad -> Data Manager communication
    this.notepad.on('note:saved', (noteData) => {
      this.dataManager.setNote(noteData.key, noteData.note);
      this.showToast('Note saved successfully', 'success');
    });

    this.notepad.on('note:deleted', (noteData) => {
      this.dataManager.deleteNote(noteData.key);
      this.showToast('Note deleted', 'info');
    });
  }

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // Handle escape key for closing modals
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.closeAllModals();
      }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  /**
   * Build country navigation buttons
   */
  buildCountryNavigation() {
    if (!this.elements.navButtons) return;

    const activeCountries = this.dataManager.getActiveCountries();
    this.elements.navButtons.innerHTML = '';

    activeCountries.forEach(countryCode => {
      const engagements = this.dataManager.getEngagements(countryCode);
      if (!engagements) return;

      const button = document.createElement('button');
      button.className = 'nav-btn';
      button.textContent = this.getCountryShortName(engagements.countryName);
      button.dataset.country = countryCode;
      button.addEventListener('click', (event) => this.handleCountryNavigation(event));

      this.elements.navButtons.appendChild(button);
    });

  }

  /**
   * Handle country navigation button clicks
   */
  handleCountryNavigation(event) {
    const countryCode = event.target.dataset.country;
    if (!countryCode) return;

    // Update active state
    this.setActiveCountryButton(countryCode);
    
    // Get engagement data and show panel
    const engagementData = this.dataManager.getEngagements(countryCode);
    if (engagementData) {
      this.showEngagementPanel({
        countryCode,
        engagement: engagementData,
        country: { properties: { ISO_A3: countryCode } }
      });
    }
    
    // Emit navigation event for globe focus
    this.emit('country:navigate', countryCode);
  }

  /**
   * Set active country button
   */
  setActiveCountryButton(countryCode) {
    const buttons = this.elements.navButtons?.querySelectorAll('.nav-btn');
    if (!buttons) return;

    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.country === countryCode);
    });

    this.activeCountry = countryCode;
  }

  /**
   * Show engagement panel for a country
   */
  showEngagementPanel(countryData) {
    // Support both old and new data formats
    let displayData;
    
    if (countryData.country && countryData.engagement) {
      // Old format from original app
      const { country, engagement, isoCode } = countryData;
      displayData = {
        country: engagement.countryName,
        countryCode: isoCode,
        engagement: engagement,
        userNote: this.dataManager.getNote(`country:${isoCode}`)
      };
    } else {
      // New enhanced format from DataProcessor
      displayData = countryData;
    }
    
    this.engagementPanel.show(displayData);

    this.setActiveCountryButton(displayData.countryCode);
    this.activeCountry = displayData.countryCode;

    this.emit('ui:engagement-panel-shown', displayData);
  }

  /**
   * Hide engagement panel
   */
  hideEngagementPanel() {
    this.engagementPanel.hide();
    this.setActiveCountryButton(null);
    this.activeCountry = null;

    this.emit('ui:engagement-panel-hidden');
  }

  /**
   * Show tooltip on hover
   */
  showTooltip(data) {
    // Clear existing tooltip timeout
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
    }

    // Show tooltip after short delay
    this.tooltipTimeout = setTimeout(() => {
      this.createTooltip(data);
    }, 300);
  }

  /**
   * Create and show tooltip
   */
  createTooltip(data) {
    const { country, engagement, isoCode } = data;
    
    // Remove existing tooltip
    this.removeTooltip();

    const tooltip = document.createElement('div');
    tooltip.className = 'country-tooltip';
    tooltip.innerHTML = `
      <div class="tooltip-header">${engagement.countryName}</div>
      <div class="tooltip-content">
        <div class="tooltip-stat">
          <span class="stat-label">Projects:</span>
          <span class="stat-value">${engagement.totalProjects}</span>
        </div>
        <div class="tooltip-hint">Click for details</div>
      </div>
    `;

    // Position tooltip near cursor
    document.body.appendChild(tooltip);
    

    this.emit('ui:tooltip-shown', data);
  }

  /**
   * Remove tooltip
   */
  removeTooltip() {
    const existingTooltip = document.querySelector('.country-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }

    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
      this.tooltipTimeout = null;
    }
  }


  /**
   * Show search modal
   */
  showSearchModal() {
    this.modal.show({
      title: 'Search Projects & Locations',
      content: this.createSearchModalContent(),
      size: 'medium',
      onShow: () => {
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.focus();
      }
    });
  }

  /**
   * Create search modal content
   */
  createSearchModalContent() {
    return `
      <div class="search-modal">
        <div class="search-input-group">
          <input type="text" id="search-input" placeholder="Search countries, projects, clients..." />
          <button id="search-btn">🔍</button>
        </div>
        <div id="search-results" class="search-results">
          <div class="search-placeholder">
            <div class="search-icon">🔍</div>
            <p>Start typing to search through countries, projects, and clients...</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Show notes modal
   */
  showNotesModal() {
    this.notepad.showAllNotes();
  }

  /**
   * Show settings modal
   */
  showSettingsModal() {
    this.modal.show({
      title: 'Settings',
      content: this.createSettingsModalContent(),
      size: 'medium'
    });
  }

  /**
   * Create settings modal content
   */
  createSettingsModalContent() {
    const preferences = this.dataManager.data.userPreferences;
    
    return `
      <div class="settings-modal">
        <div class="setting-section">
          <h3>Display</h3>
          <label class="setting-item">
            <input type="checkbox" id="auto-rotate" ${preferences.autoRotate ? 'checked' : ''} />
            <span>Auto-rotate globe</span>
          </label>
          <label class="setting-item">
            <input type="checkbox" id="show-tooltips" ${preferences.showTooltips !== false ? 'checked' : ''} />
            <span>Show country tooltips</span>
          </label>
        </div>
        
        <div class="setting-section">
          <h3>Data</h3>
          <button id="export-data" class="settings-btn">Export Notes</button>
          <button id="import-data" class="settings-btn">Import Notes</button>
          <button id="clear-data" class="settings-btn danger">Clear All Data</button>
        </div>
        
        <div class="setting-section">
          <h3>About</h3>
          <p>Zyeta Globe v2.0.0</p>
          <p>Modern interactive visualization for global workspace projects</p>
        </div>
      </div>
    `;
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;


    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.add('toast-show'), 100);

    // Remove after duration
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 300);
    }, duration);

    this.emit('ui:toast-shown', { message, type });
  }


  /**
   * Show error message
   */
  showError(message) {
    this.showToast(message, 'error', 5000);
    this.emit('ui:error-shown', message);
  }

  /**
   * Close all modals
   */
  closeAllModals() {
    this.modal.hide();
    this.engagementPanel.hide();
    this.notepad.hide();
    this.removeTooltip();
  }

  /**
   * Handle window resize
   */
  handleResize() {
    // Update component layouts
    if (this.engagementPanel) {
      this.engagementPanel.handleResize();
    }
    
    if (this.modal) {
      this.modal.handleResize();
    }

    this.emit('ui:resize');
  }

  /**
   * Get short name for country
   */
  getCountryShortName(countryName) {
    const shortNames = {
      'Singapore': 'SG',
      'United Arab Emirates': 'UAE',
      'Malaysia': 'MY',
      'Thailand': 'TH',
      'Indonesia': 'ID',
      'Philippines': 'PH',
      'Hong Kong': 'HK',
      'India': 'IN'
    };

    return shortNames[countryName] || countryName.substring(0, 3).toUpperCase();
  }

  /**
   * Enable UI interactions
   */
  enable() {
    this.isEnabled = true;
    this.elements.overlay?.classList.remove('ui-disabled');
    this.emit('ui:enabled');
  }

  /**
   * Disable UI interactions
   */
  disable() {
    this.isEnabled = false;
    this.elements.overlay?.classList.add('ui-disabled');
    this.closeAllModals();
    this.emit('ui:disabled');
  }

  /**
   * Get UI state
   */
  getState() {
    return {
      isEnabled: this.isEnabled,
      activeCountry: this.activeCountry,
      panelVisible: this.engagementPanel?.isVisible || false,
      modalVisible: this.modal?.isVisible || false
    };
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    this.closeAllModals();
    this.removeTooltip();

    // Destroy components
    if (this.engagementPanel) this.engagementPanel.destroy();
    if (this.notepad) this.notepad.destroy();
    if (this.modal) this.modal.destroy();
    if (this.toolbar) this.toolbar.destroy();

    // Remove event listeners
    const buttons = this.elements.navButtons?.querySelectorAll('.nav-btn');
    buttons?.forEach(btn => {
      btn.removeEventListener('click', this.handleCountryNavigation);
    });

    // Clear references
    this.engagementPanel = null;
    this.notepad = null;
    this.modal = null;
    this.toolbar = null;

    this.removeAllListeners();
    this.emit('ui:destroyed');
  }
}