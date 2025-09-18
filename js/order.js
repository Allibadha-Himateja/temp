import { showNotification } from './ui.js';
import { getMenu, refreshState } from './state.js';
import { apiService } from './apiService.js';


let currentOrder = {
    tableId: null,
    orderType: null, // This will be set to 'DineIn' or 'Parcel'
    items: [], // An array of aggregated item objects: { ItemID, ItemName, RegularPrice, quantity }
};

// --- DOM Element Cache ---
// Caching these elements prevents repeated and slow lookups in the DOM.
let menuGridContainer, summaryContainer, actionButtonsContainer, categoryFilters, searchInput, orderTitle;

// --- Helper Functions ---


const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + item.RegularPrice * item.quantity, 0);
    const taxRate = 0.05; // Standard 5% GST
    const tax = subtotal * taxRate;
    const grandTotal = subtotal + tax;
    return { subtotal, tax, grandTotal };
};

// --- Render Functions ---

const renderMenuGrid = () => {
    if (!menuGridContainer) return;

    const filter = searchInput.value;
    const activeCategory = categoryFilters.querySelector('.filter-btn.active');
    const categoryId = activeCategory ? activeCategory.dataset.categoryId : 'All';

    const menu = getMenu();
    const filteredMenu = menu.filter(item =>
        item.IsAvailable &&
        (categoryId === 'All' || item.CategoryID == categoryId) &&
        item.ItemName.toLowerCase().includes(filter.toLowerCase())
    );

    if (filteredMenu.length === 0) {
        menuGridContainer.innerHTML = `<p class="no-data-msg" style="grid-column: 1 / -1;">No menu items found.</p>`;
    } else {
        menuGridContainer.innerHTML = filteredMenu.map(item => `
            <div class="item-card menu-item-card" data-item-id="${item.ItemID}">
                <div class="card-content">
                    <h4 class="item-name">${item.ItemName}</h4>
                    <p class="item-price">₹${item.RegularPrice.toFixed(2)}</p>
                </div>
            </div>`).join('');
    }
};


const renderOrderSummary = () => {
    if (!summaryContainer) return;

    if (currentOrder.items.length === 0) {
        summaryContainer.innerHTML = `
            <div class="summary-header"><h3>Current Order</h3></div>
            <div class="order-empty"><i class="fas fa-receipt"></i><p>Click menu items to add them.</p></div>`;
    } else {
        const { subtotal, tax, grandTotal } = calculateTotals(currentOrder.items);
        const orderItemsHtml = currentOrder.items.map(item => `
            <div class="order-item-row" data-item-id="${item.ItemID}">
                <div class="item-info">
                    <span class="item-name">${item.ItemName}</span>
                    <span class="item-price">₹${item.RegularPrice.toFixed(2)}</span>
                </div>
                <div class="item-actions">
                    <div class="quantity-controls">
                        <button class="btn-qty-minus" data-item-id="${item.ItemID}">-</button>
                        <span class="item-qty">${item.quantity}</span>
                        <button class="btn-qty-plus" data-item-id="${item.ItemID}">+</button>
                    </div>
                    <button class="btn-icon btn-delete-item" data-item-id="${item.ItemID}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>`).join('');

        summaryContainer.innerHTML = `
            <div class="summary-header"><h3>Current Order</h3></div>
            <div class="order-items-list">${orderItemsHtml}</div>
            <div class="order-totals">
                <div class="total-row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
                <div class="total-row"><span>Tax (5%)</span><span>₹${tax.toFixed(2)}</span></div>
                <div class="total-row grand-total"><span>Grand Total</span><span>₹${grandTotal.toFixed(2)}</span></div>
            </div>`;
    }
    updateActionButtonsState();
};


const updateActionButtonsState = () => {
    if (!actionButtonsContainer) return;
    const sendBtn = actionButtonsContainer.querySelector('[id^="send-to-kitchen-btn"]');
    if (sendBtn) {
        sendBtn.disabled = currentOrder.items.length === 0;
    }
};

// --- API Call Handlers ---

const handleSendToKitchen = async () => {
    if (currentOrder.items.length === 0) return;
    console.log("Current Order being sent to kitchen:", currentOrder);
    const orderData = {
        tableId: currentOrder.tableId,
        orderType: currentOrder.orderType, // CRITICAL: This is now correctly set to 'DineIn' or 'Parcel'
        items: currentOrder.items.map(item => ({
            itemId: item.ItemID,
            quantity: item.quantity,
        }))
    };

    try {
        console.log("Order Data to be sent:", orderData);
        const response = await apiService.createOrder(orderData);
        if (response.success || response.queued) {
            // After successfully creating the order, programmatically click the "back" button
            // to return the user to the previous screen (table list or parcel list).
            const backButton = document.querySelector('#back-to-tables-btn, #back-to-parcels-btn');
            backButton?.click();
        }
    } catch (error) {
        // The apiService already shows an error notification, so no extra UI is needed here.
        console.error("Failed to send order:", error);
    }
};

// --- Cart Management Functions ---

const handleAddItem = (itemId) => {
    const existingItem = currentOrder.items.find(i => i.ItemID === itemId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        const menuItem = getMenu().find(i => i.ItemID === itemId);
        if (menuItem) {
            currentOrder.items.push({ ...menuItem, quantity: 1 });
        }
    }
    renderOrderSummary();
};

const handleRemoveItem = (itemId) => {
    const existingItem = currentOrder.items.find(i => i.ItemID === itemId);
    if (existingItem && existingItem.quantity > 1) {
        existingItem.quantity--;
    } else {
        // If quantity is 1 or less, remove the item completely.
        currentOrder.items = currentOrder.items.filter(i => i.ItemID !== itemId);
    }
    renderOrderSummary();
};

const handleDeleteItem = (itemId) => {
    currentOrder.items = currentOrder.items.filter(i => i.ItemID !== itemId);
    renderOrderSummary();
};


// --- Event Delegation ---

/**
 * A single event handler for all clicks within the order interface.
 * This is more efficient than attaching many individual listeners.
 * @param {Event} e - The click event.
 */
function handleOrderViewClick(e) {
    const target = e.target;
    
    // Category filter buttons
    const filterBtn = target.closest('.filter-btn');
    if (filterBtn) {
        categoryFilters.querySelector('.filter-btn.active')?.classList.remove('active');
        filterBtn.classList.add('active');
        renderMenuGrid();
        return;
    }
    
    // Add item from menu grid
    const menuItemCard = target.closest('.menu-item-card');
    if (menuItemCard) {
        handleAddItem(parseInt(menuItemCard.dataset.itemId));
        return;
    }

    // --- Order Summary Buttons ---
    const plusBtn = target.closest('.btn-qty-plus');
    if (plusBtn) {
        handleAddItem(parseInt(plusBtn.dataset.itemId));
        return;
    }
    const minusBtn = target.closest('.btn-qty-minus');
    if (minusBtn) {
        handleRemoveItem(parseInt(minusBtn.dataset.itemId));
        return;
    }
    const deleteBtn = target.closest('.btn-delete-item');
    if (deleteBtn) {
        handleDeleteItem(parseInt(deleteBtn.dataset.itemId));
        return;
    }

    // --- Main Action Buttons ---
    if (target.closest('[id^="send-to-kitchen-btn"]')) {
        handleSendToKitchen();
    }
}

// --- Initialization ---

/**
 * Initializes the entire order-taking interface. This is the main public function for this module.
 * @param {object} config - Configuration object, e.g., { type: 'Table', source: tableObject } or { type: 'Parcel' }.
 * @param {HTMLElement} orderViewContainer - The main container element for the order view.
 */
export const initOrderInterface = (table, orderViewContainer,config) => {
    // 1. Reset and configure the current order based on type
    
    if (config.type === 'Table') {
        currentOrder = {
            tableId: table.TableID,
            orderType: 'DineIn',
            items: [],
        };
    } else { // It's a Parcel order
        currentOrder = {
            tableId: null,
            orderType: 'Parcel',
            items: [],
        };
    }

    // 2. Cache DOM elements for quick access
    menuGridContainer = orderViewContainer.querySelector('#menu-grid-container');
    summaryContainer = orderViewContainer.querySelector('#current-order-summary');
    actionButtonsContainer = orderViewContainer.querySelector('.action-buttons');
    categoryFilters = orderViewContainer.querySelector('#category-filters');
    searchInput = orderViewContainer.querySelector('#menu-search-input');
    orderTitle = orderViewContainer.querySelector('#order-title, #parcel-order-title');

    // 3. Set up the UI elements
    orderTitle.textContent = config.type === 'Table' ? `New Order for Table ${config.source.TableNumber}` : 'New Parcel Order';
    searchInput.value = '';

    const categories = getMenu().reduce((acc, item) => {
        if (!acc.find(c => c.CategoryID === item.CategoryID)) {
            acc.push({ CategoryID: item.CategoryID, CategoryName: item.CategoryName });
        }
        return acc;
    }, []);
    
    categoryFilters.innerHTML = `<button class="filter-btn active" data-category-id="All">All</button>` +
        categories.map(cat => `<button class="filter-btn" data-category-id="${cat.CategoryID}">${cat.CategoryName}</button>`).join('');

    // 4. Initial Render
    renderMenuGrid();
    renderOrderSummary();

    // 5. Attach Event Listeners
    // First, remove any old listeners to prevent memory leaks and duplicate events.
    orderViewContainer.removeEventListener('click', handleOrderViewClick);
    searchInput.removeEventListener('input', renderMenuGrid);
    // Then, attach the new listeners.
    orderViewContainer.addEventListener('click', handleOrderViewClick);
    searchInput.addEventListener('input', renderMenuGrid);
};

