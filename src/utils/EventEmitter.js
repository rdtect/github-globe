/**
 * Simple EventEmitter implementation for inter-module communication
 */
export class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   * @param {Object} options - Options (once, priority)
   */
  on(event, callback, options = {}) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    
    const listener = {
      callback,
      once: options.once || false,
      priority: options.priority || 0
    };
    
    this.events.get(event).push(listener);
    
    // Sort by priority (higher first)
    this.events.get(event).sort((a, b) => b.priority - a.priority);
    
    return this;
  }

  /**
   * Register a one-time event listener
   */
  once(event, callback, options = {}) {
    return this.on(event, callback, { ...options, once: true });
  }

  /**
   * Remove event listener(s)
   */
  off(event, callback = null) {
    if (!this.events.has(event)) return this;
    
    if (callback) {
      const listeners = this.events.get(event);
      const index = listeners.findIndex(l => l.callback === callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    } else {
      this.events.delete(event);
    }
    
    return this;
  }

  /**
   * Emit an event
   */
  emit(event, ...args) {
    if (!this.events.has(event)) return this;
    
    const listeners = this.events.get(event).slice(); // Copy to avoid mutation issues
    
    for (let i = listeners.length - 1; i >= 0; i--) {
      const listener = listeners[i];
      
      try {
        listener.callback(...args);
      } catch (error) {
        console.error(`Error in event listener for '${event}':`, error);
      }
      
      if (listener.once) {
        this.events.get(event).splice(i, 1);
      }
    }
    
    return this;
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(event = null) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }

  /**
   * Get listener count for an event
   */
  listenerCount(event) {
    return this.events.has(event) ? this.events.get(event).length : 0;
  }

  /**
   * Get all event names
   */
  eventNames() {
    return Array.from(this.events.keys());
  }
}