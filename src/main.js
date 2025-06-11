/**
 * Zyeta Globe - Modern Entry Point
 * Modern ES6+ modular implementation with Vite
 */

import '/src/styles/main.css';
import { App } from '/src/core/App.js';


// Initialize application 
async function initializeApp() {
  try {
    const app = new App();
    await app.initialize();
    
    // Make app globally available for debugging
    if (import.meta.env.DEV) {
      window.zyetaApp = app;
    }
    
    
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    console.error('Error stack:', error.stack);
    
    // Show error in loading screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.innerHTML = `
        <div style="color: #ff6b6b; text-align: center; padding: 20px;">
          <h2>❌ Failed to Load</h2>
          <p>Error: ${error.message}</p>
          <p style="font-size: 12px; color: #999; margin-top: 20px;">
            Check browser console for details
          </p>
          <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Retry
          </button>
        </div>
      `;
    }
  }
}

// Run immediately if DOM is already ready, otherwise wait for DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Handle unload cleanup
window.addEventListener('beforeunload', () => {
  if (window.zyetaApp) {
    window.zyetaApp.destroy();
  }
});