// js/main.js
import { handleRouteChange } from './router.js';
import { initSidebar, initBillModal } from './ui.js';
import { applyTheme } from './settings.js';

// --- LIVE CLOCK FEATURE ---
function updateClock() {
    const clockElement = document.getElementById('header-clock');
    if (clockElement) {
        const now = new Date();
        clockElement.textContent = now.toLocaleTimeString('en-US');
    }
}

function initializeApp() {
    applyTheme();
    initSidebar();
    initBillModal();
    
    // Initialize the clock
    updateClock();
    setInterval(updateClock, 1000);
    
    // Set up the router
    window.addEventListener('hashchange', handleRouteChange);
    handleRouteChange();
}

initializeApp();