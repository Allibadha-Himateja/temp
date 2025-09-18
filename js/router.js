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

// The routes object now maps a hash to a page fragment and an initialization function.
const routes = {
    'home': { path: 'pages/home.html', init: initHomePage },
    'tables': { path: 'pages/tables.html', init: initTablesPage },
    'parcel': { path: 'pages/parcel.html', init: initParcelPage },
    'kitchen': { path: 'pages/kitchen.html', init: initKitchenPage },
    'update': { path: 'pages/update.html', init: initUpdatePage },
    'bills': { path: 'pages/bills.html', init: initBillsPage },
    'profile': { path: 'pages/profile.html', init: () => {} }, // No init function for profile page
    'settings': { path: 'pages/settings.html', init: initSettingsPage },
};

export const handleRouteChange = async () => {
    // If a cleanup function for the previous page exists, call it.
    if (typeof currentPageCleanup === 'function') {
        currentPageCleanup();
        currentPageCleanup = null;
    }

    // Determine the page from the URL hash, defaulting to 'home'.
    const pageKey = window.location.hash.substring(1) || 'home';
    
    // Redirect to the default page if no hash is present.
    if (!window.location.hash) {
        window.location.hash = pageKey;
        return;
    }

    const route = routes[pageKey];

    if (route) {
        try {
            // Fetch the HTML fragment for the page.
            const response = await fetch(route.path);
            if (!response.ok) {
                throw new Error(`Could not find ${route.path}`);
            }
            const htmlContent = await response.text();
            
            // Render the fetched HTML into the main content area.
            renderPage(htmlContent);

            // Run the initialization script for the new page.
            currentPageCleanup = route.init(); 
            
            // Update the active link in the sidebar.
            updateActiveNavLink(pageKey);
        } catch (error) {
            console.error("Failed to load page:", error);
            renderPage(`<div class="content-wrapper"><h2>Error</h2><p>Could not load the page. Please check the console for details.</p></div>`);
        }
    } else {
        // Handle cases where the route is not found.
        renderPage(`<div class="content-wrapper"><h2>404 - Not Found</h2><p>The page you are looking for does not exist.</p></div>`);
        updateActiveNavLink(''); // No active link
    }
};
