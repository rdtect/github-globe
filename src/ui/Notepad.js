/**
 * Notepad Component - Modular note-taking system
 */

import { EventEmitter } from '/src/utils/EventEmitter.js';

export class Notepad extends EventEmitter {
  constructor(dataManager) {
    super();
    
    this.dataManager = dataManager;
    this.isInitialized = false;
    this.isVisible = false;
    
    // Current note being edited
    this.currentNote = null;
    this.currentKey = null;
    this.hasChanges = false;
    
    // DOM elements
    this.container = null;
    this.overlay = null;
    
    // Auto-save
    this.autoSaveTimeout = null;
    this.autoSaveDelay = 2000; // 2 seconds
    
    // Note types
    this.noteTypes = {
      country: 'Country Note',
      project: 'Project Note',
      general: 'General Note',
      idea: 'Idea',
      todo: 'Todo List'
    };
  }

  /**
   * Initialize notepad
   */
  initialize() {
    if (this.isInitialized) return;

    this.createNotepadDOM();
    this.setupEventListeners();
    
    this.isInitialized = true;
    this.emit('notepad:initialized');
    
    console.log('📝 Notepad initialized');
  }

  /**
   * Create notepad DOM structure
   */
  createNotepadDOM() {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'notepad-overlay';
    this.overlay.style.display = 'none';

    // Create container
    this.container = document.createElement('div');
    this.container.className = 'notepad-container';
    
    this.container.innerHTML = `
      <div class="notepad-header">
        <div class="notepad-title">
          <span class="notepad-icon">📝</span>
          <span id="notepad-title-text">Note</span>
        </div>
        <div class="notepad-actions">
          <button id="notepad-save" class="notepad-btn primary" title="Save (Ctrl+S)">
            <span class="btn-icon">💾</span>
            Save
          </button>
          <button id="notepad-close" class="notepad-btn" title="Close (Esc)">
            <span class="btn-icon">✕</span>
          </button>
        </div>
      </div>
      
      <div class="notepad-toolbar">
        <select id="note-type" class="note-type-select">
          ${Object.entries(this.noteTypes).map(([key, label]) => 
            `<option value="${key}">${label}</option>`
          ).join('')}
        </select>
        
        <div class="notepad-meta">
          <span id="note-status" class="note-status">Ready</span>
          <span id="note-updated" class="note-updated"></span>
        </div>
      </div>
      
      <div class="notepad-content">
        <textarea 
          id="note-textarea" 
          class="note-textarea" 
          placeholder="Start writing your note..."
          spellcheck="true"
        ></textarea>
        
        <div class="notepad-footer">
          <div class="note-stats">
            <span id="char-count">0 characters</span>
            <span id="word-count">0 words</span>
          </div>
          
          <div class="notepad-quick-actions">
            <button id="clear-note" class="quick-btn" title="Clear note">🗑️</button>
            <button id="copy-note" class="quick-btn" title="Copy to clipboard">📋</button>
            <button id="export-note" class="quick-btn" title="Export note">📤</button>
          </div>
        </div>
      </div>
    `;

    this.overlay.appendChild(this.container);
    document.body.appendChild(this.overlay);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Close button
    const closeBtn = this.container.querySelector('#notepad-close');
    closeBtn.addEventListener('click', () => this.hide());

    // Save button
    const saveBtn = this.container.querySelector('#notepad-save');
    saveBtn.addEventListener('click', () => this.saveNote());

    // Textarea changes
    const textarea = this.container.querySelector('#note-textarea');
    textarea.addEventListener('input', () => this.handleTextChange());
    textarea.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Note type change
    const typeSelect = this.container.querySelector('#note-type');
    typeSelect.addEventListener('change', () => this.handleTypeChange());

    // Quick actions
    const clearBtn = this.container.querySelector('#clear-note');
    clearBtn.addEventListener('click', () => this.clearNote());

    const copyBtn = this.container.querySelector('#copy-note');
    copyBtn.addEventListener('click', () => this.copyNote());

    const exportBtn = this.container.querySelector('#export-note');
    exportBtn.addEventListener('click', () => this.exportNote());

    // Overlay click to close
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.hide();
      }
    });

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (this.isVisible) {
        if (e.ctrlKey && e.key === 's') {
          e.preventDefault();
          this.saveNote();
        } else if (e.key === 'Escape') {
          this.hide();
        }
      }
    });
  }

  /**
   * Open notepad for a specific country
   */
  openForCountry(countryCode) {
    const key = `country:${countryCode}`;
    const engagement = this.dataManager.getEngagements(countryCode);
    const countryName = engagement?.countryName || countryCode;
    
    this.open({
      key,
      title: `${countryName} Notes`,
      type: 'country',
      note: this.dataManager.getNote(key)
    });
  }

  /**
   * Open notepad for a project
   */
  openForProject(projectId, projectName) {
    const key = `project:${projectId}`;
    
    this.open({
      key,
      title: `${projectName} Notes`,
      type: 'project', 
      note: this.dataManager.getNote(key)
    });
  }

  /**
   * Open notepad with general note
   */
  openGeneral() {
    const key = `general:${Date.now()}`;
    
    this.open({
      key,
      title: 'General Note',
      type: 'general',
      note: null
    });
  }

  /**
   * Open notepad with configuration
   */
  open(config) {
    const { key, title, type, note } = config;
    
    this.currentKey = key;
    this.currentNote = note || {
      type: type || 'general',
      content: '',
      title: title || 'Note',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.populateNotepad();
    this.show();
    
    this.emit('notepad:opened', { key, note: this.currentNote });
  }

  /**
   * Populate notepad with current note
   */
  populateNotepad() {
    if (!this.currentNote) return;

    // Set title
    const titleElement = this.container.querySelector('#notepad-title-text');
    titleElement.textContent = this.currentNote.title || 'Note';

    // Set type
    const typeSelect = this.container.querySelector('#note-type');
    typeSelect.value = this.currentNote.type || 'general';

    // Set content
    const textarea = this.container.querySelector('#note-textarea');
    textarea.value = this.currentNote.content || '';

    // Update meta info
    this.updateMetaInfo();
    this.updateStats();
    
    // Reset change tracking
    this.hasChanges = false;
    this.updateStatus('Ready');
  }

  /**
   * Handle text changes
   */
  handleTextChange() {
    this.hasChanges = true;
    this.updateStatus('Editing...');
    this.updateStats();
    
    // Schedule auto-save
    this.scheduleAutoSave();
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyDown(event) {
    if (event.ctrlKey) {
      switch (event.key) {
        case 's':
          event.preventDefault();
          this.saveNote();
          break;
        case 'n':
          event.preventDefault();
          this.openGeneral();
          break;
      }
    }
  }

  /**
   * Handle note type change
   */
  handleTypeChange() {
    if (this.currentNote) {
      const typeSelect = this.container.querySelector('#note-type');
      this.currentNote.type = typeSelect.value;
      this.hasChanges = true;
      this.scheduleAutoSave();
    }
  }

  /**
   * Schedule auto-save
   */
  scheduleAutoSave() {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
    
    this.autoSaveTimeout = setTimeout(() => {
      this.saveNote(true); // Silent auto-save
    }, this.autoSaveDelay);
  }

  /**
   * Save current note
   */
  saveNote(silent = false) {
    if (!this.currentNote || !this.currentKey) return;

    const textarea = this.container.querySelector('#note-textarea');
    
    // Update note content
    this.currentNote.content = textarea.value;
    this.currentNote.updatedAt = new Date().toISOString();

    // Save to data manager
    const savedNote = this.dataManager.setNote(this.currentKey, this.currentNote);
    
    this.hasChanges = false;
    this.updateStatus(silent ? 'Auto-saved' : 'Saved');
    this.updateMetaInfo();
    
    if (!silent) {
      this.emit('note:saved', {
        key: this.currentKey,
        note: savedNote
      });
    }

    // Clear auto-save timeout
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
    }
  }

  /**
   * Clear current note
   */
  clearNote() {
    if (confirm('Are you sure you want to clear this note?')) {
      const textarea = this.container.querySelector('#note-textarea');
      textarea.value = '';
      this.handleTextChange();
      textarea.focus();
    }
  }

  /**
   * Copy note to clipboard
   */
  async copyNote() {
    const textarea = this.container.querySelector('#note-textarea');
    
    try {
      await navigator.clipboard.writeText(textarea.value);
      this.updateStatus('Copied to clipboard');
      
      setTimeout(() => {
        this.updateStatus('Ready');
      }, 2000);
      
    } catch (error) {
      console.error('Failed to copy note:', error);
      this.updateStatus('Copy failed');
    }
  }

  /**
   * Export note as file
   */
  exportNote() {
    if (!this.currentNote) return;

    const content = this.container.querySelector('#note-textarea').value;
    const filename = `${this.currentNote.title || 'note'}_${new Date().toISOString().split('T')[0]}.txt`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
    
    this.updateStatus('Exported');
    setTimeout(() => this.updateStatus('Ready'), 2000);
  }

  /**
   * Update status display
   */
  updateStatus(status) {
    const statusElement = this.container.querySelector('#note-status');
    statusElement.textContent = status;
    
    // Add visual feedback
    statusElement.className = `note-status status-${status.toLowerCase().replace(/\s+/g, '-')}`;
  }

  /**
   * Update meta information
   */
  updateMetaInfo() {
    if (!this.currentNote) return;

    const updatedElement = this.container.querySelector('#note-updated');
    const updatedDate = new Date(this.currentNote.updatedAt);
    updatedElement.textContent = `Updated: ${updatedDate.toLocaleDateString()} ${updatedDate.toLocaleTimeString()}`;
  }

  /**
   * Update character and word stats
   */
  updateStats() {
    const textarea = this.container.querySelector('#note-textarea');
    const content = textarea.value;
    
    const charCount = content.length;
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    
    const charCountElement = this.container.querySelector('#char-count');
    const wordCountElement = this.container.querySelector('#word-count');
    
    charCountElement.textContent = `${charCount} characters`;
    wordCountElement.textContent = `${wordCount} words`;
  }

  /**
   * Show all notes in a modal
   */
  showAllNotes() {
    const notes = this.dataManager.getAllNotes();
    
    // Create notes list modal content
    const content = this.createNotesListContent(notes);
    
    // Show in modal (assuming modal exists in UI)
    this.emit('notepad:show-all-notes', { content, notes });
  }

  /**
   * Create notes list content
   */
  createNotesListContent(notes) {
    if (notes.length === 0) {
      return `
        <div class="notes-empty">
          <div class="empty-icon">📝</div>
          <h3>No Notes Yet</h3>
          <p>Start creating notes to see them here.</p>
          <button id="create-first-note" class="btn primary">Create Your First Note</button>
        </div>
      `;
    }

    // Group notes by type
    const notesByType = notes.reduce((acc, note) => {
      const type = note.type || 'general';
      if (!acc[type]) acc[type] = [];
      acc[type].push(note);
      return acc;
    }, {});

    let html = '<div class="notes-list">';
    
    Object.entries(notesByType).forEach(([type, typeNotes]) => {
      html += `
        <div class="notes-section">
          <h3 class="notes-section-title">${this.noteTypes[type] || type}</h3>
          <div class="notes-grid">
      `;
      
      typeNotes.forEach(note => {
        const preview = note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '');
        const updatedDate = new Date(note.updatedAt).toLocaleDateString();
        
        html += `
          <div class="note-card" data-key="${note.key}">
            <div class="note-card-header">
              <span class="note-title">${note.title || 'Untitled'}</span>
              <span class="note-date">${updatedDate}</span>
            </div>
            <div class="note-preview">${preview}</div>
            <div class="note-actions">
              <button class="note-action-btn edit" data-action="edit" data-key="${note.key}">✏️</button>
              <button class="note-action-btn delete" data-action="delete" data-key="${note.key}">🗑️</button>
            </div>
          </div>
        `;
      });
      
      html += '</div></div>';
    });
    
    html += '</div>';
    
    return html;
  }

  /**
   * Show notepad
   */
  show() {
    this.overlay.style.display = 'flex';
    this.isVisible = true;
    
    // Focus textarea
    setTimeout(() => {
      const textarea = this.container.querySelector('#note-textarea');
      textarea.focus();
    }, 100);
    
    this.emit('notepad:shown');
  }

  /**
   * Hide notepad
   */
  hide() {
    // Check for unsaved changes
    if (this.hasChanges) {
      const save = confirm('You have unsaved changes. Save before closing?');
      if (save) {
        this.saveNote();
      }
    }
    
    this.overlay.style.display = 'none';
    this.isVisible = false;
    
    // Clear current note
    this.currentNote = null;
    this.currentKey = null;
    this.hasChanges = false;
    
    // Clear auto-save timeout
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
    }
    
    this.emit('notepad:hidden');
  }


  /**
   * Cleanup and destroy
   */
  destroy() {
    this.hide();
    
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
    
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    
    this.removeAllListeners();
    this.emit('notepad:destroyed');
  }
}