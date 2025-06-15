/**
 * Toolbar Component - Navigation and action toolbar
 */

import BaseComponent from '../utils/BaseComponent.js';
import { SearchUtils } from '../utils/SearchUtils.js';

export class Toolbar extends BaseComponent {
  constructor(globe, controls, modal) {
    super('Toolbar');
    
    this.globe = globe;
    this.controls = controls;
    this.modal = modal;
    
    // DOM elements
    this.container = null;
    this.buttons = new Map();
    
    // State
    this.activeButton = null;
  }

  /**
   * Initialize toolbar
   */
  initialize() {
    if (this.isInitialized) return;

    this.setupToolbarElements();
    this.setupEventListeners();
    
    this.isInitialized = true;
    this.emit('toolbar:initialized');
  }

  /**
   * Setup toolbar DOM elements
   */
  setupToolbarElements() {
    this.container = document.getElementById('toolbar');
    if (!this.container) {
      console.warn('Toolbar container not found');
      return;
    }

    // Get button references
    this.buttons.set('home', document.getElementById('btn-home'));
    this.buttons.set('search', document.getElementById('btn-search'));
    this.buttons.set('notes', document.getElementById('btn-notes'));
    this.buttons.set('settings', document.getElementById('btn-settings'));
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Button click handlers
    this.buttons.forEach((button, action) => {
      if (button) {
        button.addEventListener('click', () => this.handleButtonClick(action));
      }
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return; // Don't trigger shortcuts when typing
      }

      switch (e.key.toLowerCase()) {
        case 'h':
          this.handleButtonClick('home');
          break;
        case '/':
          e.preventDefault();
          this.handleButtonClick('search');
          break;
        case 'n':
          if (e.ctrlKey) {
            e.preventDefault();
            this.handleButtonClick('notes');
          }
          break;
        case ',':
          if (e.ctrlKey) {
            e.preventDefault();
            this.handleButtonClick('settings');
          }
          break;
      }
    });
  }

  /**
   * Handle button clicks
   */
  handleButtonClick(action) {
    // Update active button state
    this.setActiveButton(action);
    
    // Emit action event
    this.emit(`toolbar:${action}`);
    
    // Handle specific actions
    switch (action) {
      case 'home':
        this.handleHomeAction();
        break;
      case 'search':
        this.handleSearchAction();
        break;
      case 'notes':
        this.handleNotesAction();
        break;
      case 'settings':
        this.handleSettingsAction();
        break;
    }
  }

  /**
   * Handle home button action
   */
  handleHomeAction() {
    if (this.controls) {
      this.controls.resetView();
    }
    
    if (this.globe) {
      this.globe.resetView();
    }
    
    // Clear active button after animation
    setTimeout(() => {
      this.clearActiveButton();
    }, 1000);
  }

  /**
   * Handle search button action
   */
  handleSearchAction() {
    if (!this.modal) return;

    this.modal.show({
      title: 'Search Projects & Locations',
      content: this.createSearchContent(),
      size: 'medium',
      onShow: () => {
        const searchInput = document.getElementById('toolbar-search-input');
        if (searchInput) {
          searchInput.focus();
          this.setupSearchFunctionality();
        }
      }
    });
  }

  /**
   * Create search modal content
   */
  createSearchContent() {
    return `
      <div class="toolbar-search">
        <div class="search-input-wrapper">
          <input 
            type="text" 
            id="toolbar-search-input" 
            class="search-input"
            placeholder="Search countries, projects, clients..." 
          />
          <div class="search-icon">🔍</div>
        </div>
        
        <div class="search-filters">
          <button class="filter-btn active" data-filter="all">All</button>
          <button class="filter-btn" data-filter="countries">Countries</button>
          <button class="filter-btn" data-filter="projects">Projects</button>
          <button class="filter-btn" data-filter="clients">Clients</button>
        </div>
        
        <div id="toolbar-search-results" class="search-results">
          <div class="search-placeholder">
            <div class="placeholder-icon">🔍</div>
            <p>Start typing to search...</p>
            <div class="search-tips">
              <strong>Tips:</strong>
              <ul>
                <li>Try searching for "Singapore" or "workspace"</li>
                <li>Use quotes for exact phrases</li>
                <li>Search by client names or project types</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Setup search functionality
   */
  setupSearchFunctionality() {
    const searchInput = document.getElementById('toolbar-search-input');
    const resultsContainer = document.getElementById('toolbar-search-results');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    let searchTimeout;
    let currentFilter = 'all';

    // Search input handler
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.performSearch(e.target.value, currentFilter, resultsContainer);
      }, 300);
    });

    // Filter button handlers
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Update active filter
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.dataset.filter;
        
        // Re-run search with new filter
        this.performSearch(searchInput.value, currentFilter, resultsContainer);
      });
    });

    // Enter key to search
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.performSearch(searchInput.value, currentFilter, resultsContainer);
      }
    });
  }

  /**
   * Perform search and update results
   */
  performSearch(query, filter, resultsContainer) {
    if (!query || query.length < 2) {
      resultsContainer.innerHTML = `
        <div class="search-placeholder">
          <div class="placeholder-icon">🔍</div>
          <p>Start typing to search...</p>
        </div>
      `;
      return;
    }

    // Get search results from globe/data manager
    const results = this.globe ? this.globe.search(query) : { countries: [], engagements: [], offices: [], projects: [] };
    
    // Filter results
    let filteredResults = results;
    if (filter !== 'all') {
      filteredResults = {};
      filteredResults[filter] = results[filter] || [];
    }

    // Build results HTML
    const resultsHTML = this.buildSearchResults(filteredResults, query);
    resultsContainer.innerHTML = resultsHTML;

    // Setup result click handlers
    this.setupResultClickHandlers();
  }

  /**
   * Build search results HTML
   */
  buildSearchResults(results, query) {
    let html = '<div class="search-results-content">';
    let totalResults = 0;

    Object.entries(results).forEach(([category, items]) => {
      if (items && items.length > 0) {
        totalResults += items.length;
        html += `<div class="result-category">`;
        html += `<h4 class="category-title">${category.charAt(0).toUpperCase() + category.slice(1)} (${items.length})</h4>`;
        
        items.slice(0, 5).forEach(item => { // Limit to 5 results per category
          html += this.buildResultItem(item, category);
        });
        
        if (items.length > 5) {
          html += `<div class="more-results">+${items.length - 5} more results</div>`;
        }
        
        html += '</div>';
      }
    });

    if (totalResults === 0) {
      html = `
        <div class="no-results">
          <div class="no-results-icon">🔍</div>
          <h3>No results found</h3>
          <p>Try different keywords or check your spelling.</p>
        </div>
      `;
    }

    html += '</div>';
    return html;
  }

  /**
   * Build individual result item
   */
  buildResultItem(item, category) {
    switch (category) {
      case 'countries':
        return `
          <div class="result-item" data-type="country" data-id="${item.properties.ISO_A3}">
            <div class="result-title">${item.properties.NAME}</div>
            <div class="result-subtitle">Country • ${item.properties.ISO_A3}</div>
          </div>
        `;
        
      case 'engagements':
        return `
          <div class="result-item" data-type="engagement" data-id="${item.countryCode}">
            <div class="result-title">${item.countryName || item.engagement?.title}</div>
            <div class="result-subtitle">
              ${item.engagement ? `${item.engagement.client} • ${item.engagement.type}` : `${item.totalProjects} projects`}
            </div>
          </div>
        `;
        
      case 'offices':
        return `
          <div class="result-item" data-type="office" data-id="${item.city}">
            <div class="result-title">${item.city}</div>
            <div class="result-subtitle">Office • ${item.country}</div>
          </div>
        `;
        
      default:
        return `
          <div class="result-item" data-type="${category}" data-id="${item.id || 'unknown'}">
            <div class="result-title">${item.name || item.title || 'Unknown'}</div>
            <div class="result-subtitle">${category}</div>
          </div>
        `;
    }
  }

  /**
   * Setup result click handlers
   */
  setupResultClickHandlers() {
    const resultItems = document.querySelectorAll('.result-item');
    
    resultItems.forEach(item => {
      item.addEventListener('click', () => {
        const type = item.dataset.type;
        const id = item.dataset.id;
        
        // Close modal
        this.modal.hide();
        
        // Navigate to result
        if (type === 'country' || type === 'engagement') {
          this.emit('toolbar:navigate-to-country', id);
        }
        
        this.clearActiveButton();
      });
    });
  }

  /**
   * Handle notes button action
   */
  handleNotesAction() {
    // This will be handled by the UI component
    // Just clear active state after a delay
    setTimeout(() => {
      this.clearActiveButton();
    }, 100);
  }

  /**
   * Handle settings button action
   */
  handleSettingsAction() {
    // This will be handled by the UI component
    // Just clear active state after a delay
    setTimeout(() => {
      this.clearActiveButton();
    }, 100);
  }

  /**
   * Set active button
   */
  setActiveButton(action) {
    // Clear previous active state
    this.clearActiveButton();
    
    // Set new active state
    const button = this.buttons.get(action);
    if (button) {
      button.classList.add('toolbar-btn-active');
      this.activeButton = action;
    }
  }

  /**
   * Clear active button
   */
  clearActiveButton() {
    if (this.activeButton) {
      const button = this.buttons.get(this.activeButton);
      if (button) {
        button.classList.remove('toolbar-btn-active');
      }
      this.activeButton = null;
    }
  }

  /**
   * Update button state
   */
  updateButtonState(action, state) {
    const button = this.buttons.get(action);
    if (button) {
      button.classList.toggle('toolbar-btn-disabled', state.disabled);
      button.classList.toggle('toolbar-btn-loading', state.loading);
      
      if (state.badge) {
        this.addButtonBadge(button, state.badge);
      } else {
        this.removeButtonBadge(button);
      }
    }
  }

  /**
   * Add badge to button
   */
  addButtonBadge(button, text) {
    this.removeButtonBadge(button);
    
    const badge = document.createElement('span');
    badge.className = 'toolbar-btn-badge';
    badge.textContent = text;
    button.appendChild(badge);
  }

  /**
   * Remove badge from button
   */
  removeButtonBadge(button) {
    const existingBadge = button.querySelector('.toolbar-btn-badge');
    if (existingBadge) {
      existingBadge.remove();
    }
  }

  /**
   * Get toolbar state
   */
  getState() {
    return {
      activeButton: this.activeButton,
      buttons: Array.from(this.buttons.keys())
    };
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    this.clearActiveButton();
    
    // Remove event listeners
    this.buttons.forEach((button) => {
      if (button) {
        button.removeEventListener('click', this.handleButtonClick);
      }
    });
    
    this.buttons.clear();
    this.removeAllListeners();
    this.emit('toolbar:destroyed');
  }
}