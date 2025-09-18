// js/state.js
import { apiService } from './apiService.js';
import { showNotification } from '../js/ui.js';

// --- Central Application State ---
// The state is now initialized as null. It will be populated by fetching from the API.
const appState = {
    tables: [],
    menu: [],
    kitchenOrders:[],
    bills: [],
};

/**
 * Fetches initial data from the server to populate the appState.
 * This should be called once when the application starts.
 * It shows a loading indicator while fetching.
 */
export const initializeAppState = async () => {
    // You can implement a more sophisticated loading indicator in your UI
    document.body.classList.add('loading'); // A simple loading indicator

    try {
        const [menuRes, tablesRes, kitchenOrdersRes, billsRes] = await Promise.all([
            apiService.getMenu(),
            apiService.getTables(),
            apiService.getKitchenOrders(),
            apiService.getBills(),
        ]);

        appState.menu = menuRes.data || [];
        appState.tables = tablesRes.data || [];
        appState.kitchenOrders = kitchenOrdersRes.data || [];
        appState.bills = billsRes.data || [];
        console.log('✅ Application state initialized from API.');
    } catch (error) {
        console.error('❌ Failed to initialize application state:', error);
        showNotification('Fatal Error', 'Could not load initial data. Please check your connection and refresh the page.', 'error');
        // In a real app, you might want to show a full-page error message
    } finally {
        document.body.classList.remove('loading');
    }
};

/**
 * Gets a specific part of the application state.
 * @param {string} key - The key of the state to retrieve (e.g., 'tables').
 * @returns {any} The requested state data.
 */
export const getState = (key) => {
    if (appState[key] === null) {
        console.warn(`State for "${key}" has not been initialized yet.`);
    }
    return appState[key];
};

// --- Data Access Functions ---
// These functions now simply return the data from the already populated appState.

export const getTables = () => getState('tables');
export const getMenu = () => getState('menu');
export const getKitchenOrders = () => getState('kitchenOrders');
export const getBills = () => getState('bills');

export const getTableByName = (name) => getTables()?.find(t => t.TableNumber === name);
export const getMenuItemById = (id) => getMenu()?.find(item => item.id === id);


/**
 * Refreshes a specific part of the state from the API.
 * @param {string} key - The key of the state to refresh.
 */
export const refreshState = async (key) => {
    try {
        let response;
        switch (key) {
            case 'tables':
                response = await apiService.getTables();
                break;
            case 'menu':
                response = await apiService.getMenu();
                break;
            case 'kitchenOrders':
                response = await apiService.getKitchenOrders();
                break;
            case 'bills':
                response = await apiService.getBills();
                break;
            default:
                console.warn(`Unknown state key to refresh: ${key}`);
                return;
        }
        if (response.success) {
            appState[key] = response.data;
            console.log(`✅ ${key} state has been refreshed.`);
        } else {
            throw new Error(response.error);
        }
    } catch (error) {
        showNotification('Refresh Error', `Could not refresh ${key}.`, 'error');
    }
};