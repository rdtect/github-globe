/**
 * Enhanced Engagement Panel - Migrated and improved from original app
 */

import { EventEmitter } from '/src/utils/EventEmitter.js';

export class EngagementPanel extends EventEmitter {
  constructor(dataManager) {
    super();
    
    this.dataManager = dataManager;
    this.isVisible = false;
    this.currentCountryData = null;
    
    // Initialize later to avoid DOM issues
    this.panel = null;
  }

  /**
   * Initialize engagement panel
   */
  initialize() {
    if (this.isInitialized) return;

    this.createPanel();
    this.setupEventListeners();
    
    this.isInitialized = true;
    this.emit('panel:initialized');
  }

  /**
   * Create the engagement panel DOM structure
   */
  createPanel() {
    // Create main panel
    this.panel = document.createElement('div');
    this.panel.id = 'engagement-panel';
    this.panel.className = 'engagement-panel hidden';
    
    // Panel content with enhanced structure
    this.panel.innerHTML = `
      <div class="panel-header">
        <h2 id="country-name" class="country-name"></h2>
        <button id="close-panel" class="close-btn" title="Close">×</button>
      </div>
      
      <div class="panel-stats">
        <div class="stat-item">
          <span class="stat-value" id="total-projects">0</span>
          <span class="stat-label">Total Projects</span>
        </div>
        <div class="stat-item">
          <span class="stat-value" id="total-talks">0</span>
          <span class="stat-label">Speaking Events</span>
        </div>
        <div class="stat-item">
          <span class="stat-value" id="total-contacts">0</span>
          <span class="stat-label">Contacts</span>
        </div>
      </div>
      
      <div class="panel-tabs">
        <button class="tab-btn active" data-tab="projects">Projects</button>
        <button class="tab-btn" data-tab="talks">Talks</button>
        <button class="tab-btn" data-tab="contacts">Contacts</button>
        <button class="tab-btn" data-tab="notes">Notes</button>
      </div>
      
      <div class="panel-content">
        <div id="tab-projects" class="tab-content active">
          <div id="projects-content" class="engagement-list"></div>
        </div>
        <div id="tab-talks" class="tab-content">
          <div id="talks-content" class="engagement-list"></div>
        </div>
        <div id="tab-contacts" class="tab-content">
          <div id="contacts-content" class="engagement-list"></div>
        </div>
        <div id="tab-notes" class="tab-content">
          <div id="notes-content" class="notes-section">
            <div class="notes-header">
              <button id="add-note-btn" class="add-note-btn">+ Add Note</button>
            </div>
            <div id="notes-list" class="notes-list"></div>
          </div>
        </div>
      </div>
      
      <div class="panel-actions">
        <button id="add-project-btn" class="action-btn primary">Add Project</button>
        <button id="export-data-btn" class="action-btn secondary">Export Data</button>
      </div>
    `;
    
    // Add to DOM
    const modalContainer = document.getElementById('modal-container') || document.body;
    modalContainer.appendChild(this.panel);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (!this.panel) return;
    
    // Close button
    const closeBtn = this.panel.querySelector('#close-panel');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }
    
    // Tab switching
    const tabBtns = this.panel.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });
    
    // Click outside to close
    document.addEventListener('click', (e) => {
      if (this.isVisible && this.panel && !this.panel.contains(e.target)) {
        // Check if click was on a country navigation button
        if (!e.target.closest('.nav-btn')) {
          this.hide();
        }
      }
    });
    
    // Action buttons
    const addProjectBtn = this.panel.querySelector('#add-project-btn');
    if (addProjectBtn) {
      addProjectBtn.addEventListener('click', () => {
        this.emit('action:add-project', this.currentCountryData);
      });
    }
    
    const exportBtn = this.panel.querySelector('#export-data-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportCountryData();
      });
    }
    
    const addNoteBtn = this.panel.querySelector('#add-note-btn');
    if (addNoteBtn) {
      addNoteBtn.addEventListener('click', () => {
        this.addNote();
      });
    }
    
    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }

  /**
   * Show engagement panel with country data
   */
  show(countryData) {
    this.currentCountryData = countryData;
    this.isVisible = true;
    
    // Update panel content
    this.updateCountryInfo(countryData);
    this.loadEngagementData(countryData);
    this.loadNotes(countryData.countryCode);
    
    // Show panel with animation
    this.panel.classList.remove('hidden');
    setTimeout(() => {
      this.panel.classList.add('visible');
    }, 10);
    
    this.emit('panel:shown', countryData);
  }

  /**
   * Hide engagement panel
   */
  hide() {
    if (!this.isVisible) return;
    
    this.isVisible = false;
    this.panel.classList.remove('visible');
    
    setTimeout(() => {
      this.panel.classList.add('hidden');
      this.currentCountryData = null;
    }, 300);
    
    this.emit('panel:hidden');
  }

  /**
   * Update country information display
   */
  updateCountryInfo(countryData) {
    this.panel.querySelector('#country-name').textContent = countryData.countryName;
    this.panel.querySelector('#total-projects').textContent = countryData.projectCount || 0;
    this.panel.querySelector('#total-talks').textContent = countryData.talkCount || 0;
    this.panel.querySelector('#total-contacts').textContent = countryData.contactCount || 0;
  }

  /**
   * Load engagement data by category - simplified approach
   */
  loadEngagementData(countryData) {
    const countryCode = countryData.countryCode;
    const engagement = countryData.engagement || this.dataManager.getEngagements(countryCode);
    
    if (!engagement || !engagement.engagements) {
      return;
    }
    
    // Simple categorization based on engagement type
    const projects = [];
    const talks = [];
    const contacts = [];
    
    engagement.engagements.forEach((item, index) => {
      const processedItem = {
        id: `${countryCode}-${index}`,
        countryCode,
        countryName: engagement.countryName,
        ...item,
        statusColor: this.getStatusColor(item.status),
        typeColor: this.getTypeColor(item.type)
      };
      
      // Simple categorization
      if (item.type && item.type.toLowerCase().includes('talk')) {
        talks.push(processedItem);
      } else if (item.type && (item.type.toLowerCase().includes('contact') || item.type.toLowerCase().includes('consultation'))) {
        contacts.push(processedItem);
      } else {
        projects.push(processedItem); // Default to projects
      }
    });
    
    // Populate tabs
    this.populateEngagementList('projects-content', projects);
    this.populateEngagementList('talks-content', talks);
    this.populateEngagementList('contacts-content', contacts);
  }

  /**
   * Populate engagement list for a specific tab
   */
  populateEngagementList(containerId, engagements) {
    const container = this.panel.querySelector(`#${containerId}`);
    
    if (engagements.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No ${containerId.replace('-content', '')} found for this country.</p>
        </div>
      `;
      return;
    }
    
    const html = engagements.map(engagement => `
      <div class="engagement-item" data-id="${engagement.id}">
        <div class="engagement-header">
          <h4 class="engagement-title">${engagement.title}</h4>
          <span class="engagement-status" style="color: ${engagement.statusColor}">
            ${engagement.status}
          </span>
        </div>
        <div class="engagement-details">
          <div class="engagement-client">${engagement.client}</div>
          <div class="engagement-meta">
            <span class="engagement-date">${engagement.date}</span>
            <span class="engagement-type" style="color: ${engagement.typeColor}">
              ${engagement.type}
            </span>
          </div>
          <div class="engagement-description">${engagement.description}</div>
        </div>
      </div>
    `).join('');
    
    container.innerHTML = html;
  }

  /**
   * Switch active tab
   */
  switchTab(tabName) {
    // Update tab buttons
    this.panel.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab content
    this.panel.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `tab-${tabName}`);
    });
    
    this.emit('tab:switched', tabName);
  }

  /**
   * Load notes for the country
   */
  loadNotes(countryCode) {
    // Get all notes and filter by country code or note key pattern
    const allNotes = this.dataManager.getAllNotes();
    const notes = allNotes.filter(note => 
      note.type === 'country' && 
      (note.countryCode === countryCode || note.key === `country:${countryCode}`)
    );
    
    const container = this.panel.querySelector('#notes-list');
    
    if (notes.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No notes for this country yet.</p>
          <button class="action-btn primary" style="margin-top: 10px;" onclick="window.zyetaApp?.ui?.notepad?.openForCountry('${countryCode}')">
            + Add First Note
          </button>
        </div>
      `;
      return;
    }
    
    const html = notes.map(note => `
      <div class="note-item" data-note-id="${note.key}">
        <div class="note-header">
          <h5 class="note-title">${note.title || 'Untitled Note'}</h5>
          <div class="note-meta">
            <span class="note-date">${new Date(note.updatedAt).toLocaleDateString()}</span>
            <button class="note-delete-btn" onclick="window.zyetaApp?.dataManager?.deleteNote('${note.key}'); window.zyetaApp?.ui?.engagementPanel?.refresh();">×</button>
          </div>
        </div>
        <div class="note-content">${note.content || 'No content'}</div>
      </div>
    `).join('');
    
    container.innerHTML = html;
  }

  /**
   * Add a new note
   */
  addNote() {
    if (!this.currentCountryData) return;
    
    this.emit('note:add', {
      type: 'country',
      countryCode: this.currentCountryData.countryCode,
      countryName: this.currentCountryData.countryName
    });
  }

  /**
   * Export country data
   */
  exportCountryData() {
    if (!this.currentCountryData) return;
    
    const exportData = {
      country: this.currentCountryData,
      engagements: this.getCurrentEngagements(),
      notes: this.dataManager.getNotesByType('country')
        .filter(note => note.countryCode === this.currentCountryData.countryCode),
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zyeta-${this.currentCountryData.countryCode}-data.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.emit('data:exported', exportData);
  }

  /**
   * Get current engagements for export
   */
  getCurrentEngagements() {
    if (!this.currentCountryData) return {};
    
    const processedData = this.dataManager.getProcessedData();
    if (!processedData) return {};
    
    const countryCode = this.currentCountryData.countryCode;
    
    return {
      projects: processedData.projects.filter(p => p.countryCode === countryCode),
      talks: processedData.talks.filter(t => t.countryCode === countryCode),
      contacts: processedData.contacts.filter(c => c.countryCode === countryCode)
    };
  }

  /**
   * Refresh panel content when data changes
   */
  refresh() {
    if (this.isVisible && this.currentCountryData) {
      this.loadEngagementData(this.currentCountryData);
      this.loadNotes(this.currentCountryData.countryCode);
    }
  }


  /**
   * Handle window resize
   */
  handleResize() {
    // Panel is responsive, but emit event for other components
    this.emit('panel:resize');
  }

  /**
   * Get status-based color
   */
  getStatusColor(status) {
    const colorMap = {
      'Completed': '#9cff00',
      'Active': '#9cff00', 
      'In Progress': '#00d4ff',
      'Planning': '#ffb84d',
      'On Hold': '#ff6b6b',
      'Cancelled': '#999999'
    };
    return colorMap[status] || '#cccccc';
  }

  /**
   * Get type-based color
   */
  getTypeColor(type) {
    if (type && type.toLowerCase().includes('talk')) {
      return '#9966ff'; // Purple for talks
    } else if (type && type.toLowerCase().includes('contact')) {
      return '#66ff99'; // Green for contacts  
    } else {
      return '#00d4ff'; // Blue for projects
    }
  }


  /**
   * Cleanup and destroy
   */
  destroy() {
    this.hide();
    
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }
    
    this.removeAllListeners();
    this.emit('panel:destroyed');
  }
}