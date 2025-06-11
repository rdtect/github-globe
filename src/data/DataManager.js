/**
 * Data Manager - Handles all data loading, caching, and CRUD operations
 */

import { EventEmitter } from '/src/utils/EventEmitter.js';
// Simplified DataManager without complex D3 processing

export class DataManager extends EventEmitter {
  constructor() {
    super();
    
    this.isInitialized = false;
    this.cache = new Map();
    this.data = {
      countries: null,
      offices: null,
      projects: null,
      engagements: null,
      userNotes: new Map(),
      userPreferences: {}
    };
    
    // Simple processed data storage
    this.processedData = null;
    
    // Storage keys
    this.storageKeys = {
      userNotes: 'zyeta-user-notes',
      preferences: 'zyeta-preferences',
      backupData: 'zyeta-backup'
    };
  }

  /**
   * Initialize data manager and load all data
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      
      // Load core data files
      await this.loadCoreData();
      
      // Load user data from storage
      await this.loadUserData();
      
      // Simple data processing (no complex D3 processing needed)
      this.processedData = {
        countries: this.data.countries?.features || [],
        offices: this.data.offices || [],
        projects: this.data.projects || [],
        engagements: this.data.engagements || {}
      };
      
      // Setup auto-save
      this.setupAutoSave();
      
      this.isInitialized = true;
      this.emit('data:initialized');
      
      
    } catch (error) {
      console.error('❌ Data loading failed:', error);
      throw error;
    }
  }

  /**
   * Load core application data
   */
  async loadCoreData() {
    const dataFiles = [
      { key: 'countries', path: '/src/data/files/globe-data-min.json' },
      { key: 'offices', path: '/src/data/files/zyeta-offices.json' },
      { key: 'projects', path: '/src/data/files/zyeta-projects.json' },
      { key: 'engagements', path: '/src/data/files/zyeta-engagements.json' }
    ];

    const loadPromises = dataFiles.map(async ({ key, path }) => {
      try {
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`Failed to load ${key}: ${response.statusText}`);
        }
        const data = await response.json();
        this.data[key] = data;
        this.cache.set(key, data);
        this.emit(`data:${key}-loaded`, data);
      } catch (error) {
        console.error(`❌ Failed to load ${key}:`, error);
        throw error;
      }
    });

    await Promise.all(loadPromises);
  }


  /**
   * Load user data from localStorage
   */
  async loadUserData() {
    try {
      // Load user notes
      const notesData = localStorage.getItem(this.storageKeys.userNotes);
      if (notesData) {
        const parsed = JSON.parse(notesData);
        this.data.userNotes = new Map(Object.entries(parsed));
      }

      // Load user preferences
      const prefsData = localStorage.getItem(this.storageKeys.preferences);
      if (prefsData) {
        this.data.userPreferences = JSON.parse(prefsData);
      }

      this.emit('data:user-loaded');
      
    } catch (error) {
      console.warn('⚠️ Failed to load user data:', error);
      // Not critical, continue with defaults
    }
  }

  /**
   * Setup auto-save for user data
   */
  setupAutoSave() {
    // Auto-save every 30 seconds
    setInterval(() => {
      this.saveUserData();
    }, 30000);

    // Save on page unload
    window.addEventListener('beforeunload', () => {
      this.saveUserData();
    });
  }

  /**
   * Save user data to localStorage
   */
  saveUserData() {
    try {
      // Save notes
      const notesObj = Object.fromEntries(this.data.userNotes);
      localStorage.setItem(this.storageKeys.userNotes, JSON.stringify(notesObj));

      // Save preferences
      localStorage.setItem(this.storageKeys.preferences, JSON.stringify(this.data.userPreferences));

      this.emit('data:user-saved');
      
    } catch (error) {
      console.error('❌ Failed to save user data:', error);
      this.emit('data:save-error', error);
    }
  }

  /**
   * Get country data by ISO code
   */
  getCountry(isoCode) {
    if (!this.data.countries) return null;
    
    return this.data.countries.features.find(
      country => country.properties.ISO_A3 === isoCode
    );
  }

  /**
   * Get engagement data for a country
   */
  getEngagements(countryCode) {
    if (!this.data.engagements) return null;
    return this.data.engagements[countryCode] || null;
  }

  /**
   * Get all countries with Zyeta projects
   */
  getActiveCountries() {
    if (!this.data.engagements) return [];
    return Object.keys(this.data.engagements);
  }

  /**
   * Get office data
   */
  getOffices() {
    return this.data.offices || [];
  }

  /**
   * Get project data
   */
  getProjects() {
    return this.data.projects || [];
  }

  /**
   * Get processed engagement data by category
   */
  getProcessedData(category = null) {
    if (!this.processedData) return null;
    
    if (category) {
      return this.processedData[category] || [];
    }
    return this.processedData;
  }

  /**
   * Get country visualization data (simplified)
   */
  getCountryVisualizationData() {
    return this.processedData?.countries || [];
  }

  /**
   * Get engagement by coordinates (for click detection) - enhanced with better bounds
   */
  getEngagementByCoords(lat, lng, tolerance = 5) {
    
    // Enhanced country bounds with better coverage
    const countryBounds = {
      'IND': { latMin: 6, latMax: 37, lngMin: 68, lngMax: 97 }, // Expanded for better coverage
      'SGP': { latMin: 1.1, latMax: 1.5, lngMin: 103.6, lngMax: 104.0 },
      'ARE': { latMin: 22, latMax: 26.5, lngMin: 51, lngMax: 57 },
      'MYS': { latMin: 0.8, latMax: 7.5, lngMin: 99, lngMax: 120 }, // Expanded for East Malaysia
      'THA': { latMin: 5.5, latMax: 21, lngMin: 97, lngMax: 106 },
      'IDN': { latMin: -11, latMax: 6, lngMin: 95, lngMax: 141 },
      'PHL': { latMin: 4, latMax: 21, lngMin: 116, lngMax: 127 },
      'HKG': { latMin: 22.1, latMax: 22.6, lngMin: 113.8, lngMax: 114.5 }
    };
    
    for (const [country, bounds] of Object.entries(countryBounds)) {
      if (lat >= bounds.latMin && lat <= bounds.latMax && 
          lng >= bounds.lngMin && lng <= bounds.lngMax) {
        // Return the engagement data for this country
        return this.data.engagements[country] ? {
          countryCode: country,
          ...this.data.engagements[country]
        } : null;
      }
    }
    return null;
  }

  /**
   * Search functionality
   */
  search(query) {
    const results = this.basicSearch(query);
    this.emit('data:search-results', { query, results });
    return results;
  }

  /**
   * Basic search functionality (fallback)
   */
  basicSearch(query) {
    const results = {
      countries: [],
      offices: [],
      projects: [],
      talks: [],
      contacts: []
    };

    if (!query || query.length < 2) return results;

    const searchTerm = query.toLowerCase();

    // Search countries
    if (this.data.countries) {
      results.countries = this.data.countries.features.filter(country => 
        country.properties.NAME.toLowerCase().includes(searchTerm) ||
        country.properties.ISO_A3.toLowerCase().includes(searchTerm)
      );
    }

    // Search offices
    if (this.data.offices) {
      results.offices = this.data.offices.filter(office =>
        office.city.toLowerCase().includes(searchTerm) ||
        office.country.toLowerCase().includes(searchTerm)
      );
    }

    return results;
  }

  /**
   * User Notes Management
   */
  
  /**
   * Add or update a note
   */
  setNote(key, note) {
    const noteData = {
      ...note,
      id: key,
      updatedAt: new Date().toISOString(),
      createdAt: this.data.userNotes.has(key) 
        ? this.data.userNotes.get(key).createdAt 
        : new Date().toISOString()
    };

    this.data.userNotes.set(key, noteData);
    this.emit('data:note-updated', { key, note: noteData });
    
    // Auto-save after 1 second delay
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.saveUserData(), 1000);
    
    return noteData;
  }

  /**
   * Get a note
   */
  getNote(key) {
    return this.data.userNotes.get(key) || null;
  }

  /**
   * Delete a note
   */
  deleteNote(key) {
    const existed = this.data.userNotes.delete(key);
    if (existed) {
      this.emit('data:note-deleted', { key });
      this.saveUserData();
    }
    return existed;
  }

  /**
   * Get all notes
   */
  getAllNotes() {
    return Array.from(this.data.userNotes.entries()).map(([key, note]) => ({
      key,
      ...note
    }));
  }

  /**
   * Get notes by type (country, project, general)
   */
  getNotesByType(type) {
    return this.getAllNotes().filter(note => note.type === type);
  }

  /**
   * User Preferences Management
   */
  
  /**
   * Set a preference
   */
  setPreference(key, value) {
    this.data.userPreferences[key] = value;
    this.emit('data:preference-updated', { key, value });
    this.saveUserData();
  }

  /**
   * Get a preference
   */
  getPreference(key, defaultValue = null) {
    return this.data.userPreferences[key] ?? defaultValue;
  }

  /**
   * Reset preferences to defaults
   */
  resetPreferences() {
    this.data.userPreferences = {};
    this.emit('data:preferences-reset');
    this.saveUserData();
  }

  /**
   * Data Export/Import
   */
  
  /**
   * Export all user data
   */
  exportUserData() {
    const exportData = {
      notes: Object.fromEntries(this.data.userNotes),
      preferences: this.data.userPreferences,
      exportedAt: new Date().toISOString(),
      version: '2.0.0'
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import user data
   */
  importUserData(jsonString) {
    try {
      const importData = JSON.parse(jsonString);
      
      // Validate structure
      if (!importData.notes && !importData.preferences) {
        throw new Error('Invalid data format');
      }

      // Import notes
      if (importData.notes) {
        this.data.userNotes = new Map(Object.entries(importData.notes));
      }

      // Import preferences
      if (importData.preferences) {
        this.data.userPreferences = importData.preferences;
      }

      this.saveUserData();
      this.emit('data:imported', importData);
      
      return true;
      
    } catch (error) {
      console.error('❌ Failed to import data:', error);
      this.emit('data:import-error', error);
      return false;
    }
  }

  /**
   * Clear all user data
   */
  clearUserData() {
    this.data.userNotes.clear();
    this.data.userPreferences = {};
    
    // Clear from storage
    localStorage.removeItem(this.storageKeys.userNotes);
    localStorage.removeItem(this.storageKeys.preferences);
    
    this.emit('data:user-cleared');
  }

  /**
   * Get data statistics
   */
  getStats() {
    const stats = {
      countries: this.data.countries?.features?.length || 0,
      offices: this.data.offices?.length || 0,
      projects: this.data.projects?.length || 0,
      activeCountries: this.getActiveCountries().length,
      totalEngagements: 0,
      userNotes: this.data.userNotes.size,
      cacheSize: this.cache.size
    };

    // Count total engagements
    if (this.data.engagements) {
      stats.totalEngagements = Object.values(this.data.engagements)
        .reduce((total, country) => total + (country.engagements?.length || 0), 0);
    }

    return stats;
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    // Save any pending data
    this.saveUserData();
    
    // Clear timers
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Clear cache
    this.cache.clear();
    
    // Clear data
    this.data = {
      countries: null,
      offices: null,
      projects: null,
      engagements: null,
      userNotes: new Map(),
      userPreferences: {}
    };

    this.removeAllListeners();
    this.emit('data:destroyed');
  }
}