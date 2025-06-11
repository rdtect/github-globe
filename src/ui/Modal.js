/**
 * Modal Component - Reusable modal dialog system
 */

import { EventEmitter } from '/src/utils/EventEmitter.js';

export class Modal extends EventEmitter {
  constructor() {
    super();
    
    this.isInitialized = false;
    this.isVisible = false;
    this.currentModal = null;
    
    // DOM elements
    this.overlay = null;
    this.container = null;
    
    // Configuration
    this.config = {
      closeOnOverlayClick: true,
      closeOnEscape: true,
      showCloseButton: true
    };
  }

  /**
   * Initialize modal system
   */
  initialize() {
    if (this.isInitialized) return;

    this.createModalDOM();
    this.setupEventListeners();
    
    this.isInitialized = true;
    this.emit('modal:initialized');
  }

  /**
   * Create modal DOM structure
   */
  createModalDOM() {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.style.display = 'none';

    // Create container
    this.container = document.createElement('div');
    this.container.className = 'modal-container';

    this.overlay.appendChild(this.container);
    
    // Add to modal container in body
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
      modalContainer.appendChild(this.overlay);
    } else {
      document.body.appendChild(this.overlay);
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Overlay click to close
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay && this.config.closeOnOverlayClick) {
        this.hide();
      }
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible && this.config.closeOnEscape) {
        this.hide();
      }
    });
  }

  /**
   * Show modal with content
   */
  show(options = {}) {
    const {
      title = 'Modal',
      content = '',
      size = 'medium',
      showCloseButton = true,
      closeOnOverlayClick = true,
      closeOnEscape = true,
      className = '',
      onShow = null,
      onHide = null
    } = options;

    // Update configuration
    this.config.closeOnOverlayClick = closeOnOverlayClick;
    this.config.closeOnEscape = closeOnEscape;
    this.config.showCloseButton = showCloseButton;

    // Store callbacks
    this.currentModal = {
      onShow,
      onHide
    };

    // Build modal content
    this.container.innerHTML = `
      <div class="modal-dialog modal-${size} ${className}">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          ${showCloseButton ? '<button class="modal-close" aria-label="Close">✕</button>' : ''}
        </div>
        <div class="modal-body">
          ${content}
        </div>
      </div>
    `;

    // Setup close button
    if (showCloseButton) {
      const closeButton = this.container.querySelector('.modal-close');
      closeButton.addEventListener('click', () => this.hide());
    }

    // Show modal
    this.overlay.style.display = 'flex';
    this.isVisible = true;

    // Add show animation class
    setTimeout(() => {
      this.container.classList.add('modal-show');
    }, 10);

    // Call onShow callback
    if (onShow) {
      setTimeout(onShow, 100);
    }

    this.emit('modal:shown', { title, size });
  }

  /**
   * Hide modal
   */
  hide() {
    if (!this.isVisible) return;

    // Remove show animation class
    this.container.classList.remove('modal-show');

    // Hide after animation
    setTimeout(() => {
      this.overlay.style.display = 'none';
      this.isVisible = false;
      this.container.innerHTML = '';

      // Call onHide callback
      if (this.currentModal && this.currentModal.onHide) {
        this.currentModal.onHide();
      }

      this.currentModal = null;
      this.emit('modal:hidden');
    }, 300);
  }

  /**
   * Show confirmation dialog
   */
  confirm(options = {}) {
    const {
      title = 'Confirm',
      message = 'Are you sure?',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      onConfirm = null,
      onCancel = null
    } = options;

    return new Promise((resolve) => {
      const content = `
        <div class="modal-confirm">
          <div class="confirm-message">${message}</div>
          <div class="confirm-actions">
            <button id="modal-cancel" class="btn btn-secondary">${cancelText}</button>
            <button id="modal-confirm" class="btn btn-primary">${confirmText}</button>
          </div>
        </div>
      `;

      this.show({
        title,
        content,
        size: 'small',
        closeOnOverlayClick: false,
        closeOnEscape: true,
        onShow: () => {
          const confirmBtn = document.getElementById('modal-confirm');
          const cancelBtn = document.getElementById('modal-cancel');

          confirmBtn.addEventListener('click', () => {
            this.hide();
            if (onConfirm) onConfirm();
            resolve(true);
          });

          cancelBtn.addEventListener('click', () => {
            this.hide();
            if (onCancel) onCancel();
            resolve(false);
          });

          // Focus confirm button
          confirmBtn.focus();
        }
      });
    });
  }

  /**
   * Show alert dialog
   */
  alert(options = {}) {
    const {
      title = 'Alert',
      message = '',
      buttonText = 'OK',
      onOk = null
    } = options;

    return new Promise((resolve) => {
      const content = `
        <div class="modal-alert">
          <div class="alert-message">${message}</div>
          <div class="alert-actions">
            <button id="modal-ok" class="btn btn-primary">${buttonText}</button>
          </div>
        </div>
      `;

      this.show({
        title,
        content,
        size: 'small',
        onShow: () => {
          const okBtn = document.getElementById('modal-ok');
          
          okBtn.addEventListener('click', () => {
            this.hide();
            if (onOk) onOk();
            resolve(true);
          });

          // Focus OK button
          okBtn.focus();
        }
      });
    });
  }

  /**
   * Handle window resize
   */
  handleResize() {
    // Modal automatically adjusts, but emit event for components
    this.emit('modal:resize');
  }


  /**
   * Cleanup and destroy
   */
  destroy() {
    this.hide();
    
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    
    this.removeAllListeners();
    this.emit('modal:destroyed');
  }
}