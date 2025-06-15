import { EventEmitter } from './EventEmitter.js';

export default class BaseComponent extends EventEmitter {
    constructor(name) {
        super();
        this.name = name;
        this.isInitialized = false;
        this.isDestroyed = false;
    }

    async initialize() {
        if (this.isInitialized) return;
        
        try {
            await this.setup();
            this.isInitialized = true;
            this.emit(`${this.name}:initialized`);
        } catch (error) {
            console.error(`❌ [${this.name}] initialization failed:`, error);
            throw error;
        }
    }

    async setup() {
        // Override in subclasses
    }

    destroy() {
        if (this.isDestroyed) return;

        try {
            this.cleanup();
            this.removeAllListeners();
            this.isDestroyed = true;
            this.isInitialized = false;
        } catch (error) {
            console.error(`❌ [${this.name}] destruction failed:`, error);
        }
    }

    cleanup() {
        // Override in subclasses
    }

    setupEventListeners() {
        // Override in subclasses
    }

    setupDOMElements() {
        // Override in subclasses
    }
}