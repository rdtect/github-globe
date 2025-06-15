import { ANIMATION_TIMINGS } from './Constants.js';

export const ModalMixin = {
    show() {
        if (!this.element) return;
        
        this.element.style.display = 'block';
        this.element.classList.add('visible');
        
        // Focus management
        const firstFocusable = this.element.querySelector('input, button, textarea, select');
        if (firstFocusable) {
            firstFocusable.focus();
        }
        
        this.emit(`${this.name}:shown`);
    },

    hide() {
        if (!this.element) return;
        
        this.element.classList.remove('visible');
        setTimeout(() => {
            this.element.style.display = 'none';
        }, ANIMATION_TIMINGS.MODAL_TRANSITION);
        
        this.emit(`${this.name}:hidden`);
    },

    setupModalEvents() {
        if (!this.element) return;

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.element.style.display === 'block') {
                this.hide();
            }
        });

        // Close on backdrop click
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) {
                this.hide();
            }
        });
    }
};