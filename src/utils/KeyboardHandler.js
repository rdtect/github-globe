export class KeyboardHandler {
    constructor() {
        this.shortcuts = new Map();
        this.isEnabled = true;
        this.setupGlobalHandler();
    }

    setupGlobalHandler() {
        document.addEventListener('keydown', (e) => {
            if (!this.isEnabled) return;

            const key = this.getKeySignature(e);
            const handler = this.shortcuts.get(key);
            
            if (handler) {
                e.preventDefault();
                handler(e);
            }
        });
    }

    getKeySignature(event) {
        const parts = [];
        
        if (event.ctrlKey) parts.push('ctrl');
        if (event.altKey) parts.push('alt');
        if (event.shiftKey) parts.push('shift');
        if (event.metaKey) parts.push('meta');
        
        parts.push(event.key.toLowerCase());
        
        return parts.join('+');
    }

    register(key, handler) {
        this.shortcuts.set(key.toLowerCase(), handler);
    }

    unregister(key) {
        this.shortcuts.delete(key.toLowerCase());
    }

    enable() {
        this.isEnabled = true;
    }

    disable() {
        this.isEnabled = false;
    }

    destroy() {
        this.shortcuts.clear();
        this.isEnabled = false;
    }
}

// Global keyboard handler instance
export const globalKeyboardHandler = new KeyboardHandler();