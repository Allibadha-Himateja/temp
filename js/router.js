// js/router.js
import { renderPage, updateActiveNavLink } from './ui.js';
import { initHomePage } from './home.js';
import { initTablesPage } from './tables.js';
import { initParcelPage } from './parcel.js';
import { initKitchenPage } from './kitchen.js';
import { initUpdatePage } from './update.js';
import { initBillsPage } from './bills.js';
import { initSettingsPage } from './settings.js';

let currentPageCleanup = null;

const routes = {
    'home': { path: 'pages/home.html', init: initHomePage },
    'tables': { path: 'pages/tables.html', init: initTablesPage },
    'parcel': { path: 'pages/parcel.html', init: initParcelPage },
    'kitchen': { path: 'pages/kitchen.html', init: initKitchenPage },
    'update': { path: 'pages/update.html', init: initUpdatePage },
    'bills': { path: 'pages/bills.html', init: initBillsPage },
    'profile': { path: 'pages/profile.html', init: () => {} },
    'settings': { path: 'pages/settings.html', init: initSettingsPage },
};

export const handleRouteChange = async () => {
    // Clean up listeners from the previous page
    if (typeof currentPageCleanup === 'function') {
        currentPageCleanup();
        currentPageCleanup = null;
    }

    const page = window.location.hash.substring(1) || (localStorage.getItem('defaultPage') || 'home');
    
    if (!window.location.hash) {
        window.location.hash = page;
        return;
    }

    const route = routes[page];
    if (route) {
        try {
            const response = await fetch(route.path);
            if (!response.ok) throw new Error(`Page not found`);
            const html = await response.text();
            await renderPage(html);

            // Initialize the new page and store its cleanup function
            currentPageCleanup = route.init(); 
            
            updateActiveNavLink(page);
        } catch (error) {
            await renderPage(`<div class="content-wrapper"><h2>Error</h2><p>Could not load page.</p></div>`);
        }
    }
};