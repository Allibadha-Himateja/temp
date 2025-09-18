import { showNotification } from './ui.js';
import { getMenu } from './state.js';
import { apiService } from './apiService.js';

// --- Module-level State ---
let currentOrder = {
    tableId: null,
    orderType: null,
    items: [],
};

// --- DOM Element Cache ---
let menuGridContainer, summaryContainer, actionButtonsContainer, categoryFilters, searchInput, orderTitle;

// --- Helper Functions ---
const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + item.RegularPrice * item.quantity, 0);
    const taxRate = 0.05; // 5% tax
    const tax = subtotal * taxRate;
    const grandTotal = subtotal + tax;
    return { subtotal, tax, grandTotal };
};

// --- Render Functions ---
const renderMenuGrid = () => {
    if (!menuGridContainer) return;
    const filter = searchInput.value.toLowerCase();
    const activeCategory = categoryFilters.querySelector('.filter-btn.active');
    const categoryId = activeCategory ? activeCategory.dataset.categoryId : 'All';
    const menu = getMenu() || [];
    const filteredMenu = menu.filter(item =>
        item.IsAvailable &&
        (categoryId === 'All' || item.CategoryID == categoryId) &&
        item.ItemName.toLowerCase().includes(filter)
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
                    <button class="btn-icon btn-delete-item" data-item-id="${item.ItemID}"><i class="fas fa-trash-alt"></i></button>
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

    // --- BUG FIX: Provide immediate user feedback ---
    showNotification('Sending...', 'Submitting your order to the kitchen.', 'info');

    const orderData = {
        tableId: currentOrder.tableId,
        orderType: currentOrder.orderType,
        items: currentOrder.items.map(item => ({ itemId: item.ItemID, quantity: item.quantity }))
    };

    try {
        // console.log("Order creation :", orderData);
        const response = await apiService.createOrder(orderData);

        // --- BUG FIX: Check for success and provide feedback ---
        if (response.success) {
            showNotification('Success!', `Order #${response.data.OrderNumber} sent to the kitchen.`, 'success');
            const backButton = document.querySelector('#back-to-tables-btn, #back-to-parcels-btn');
            backButton?.click();
        } else {
             // Handle cases where the server returns success: false but not a network error.
            throw new Error(response.error || 'The server responded with an error.');
        }
    } catch (error) {
        // The apiService will automatically show an error notification on failure.
        // We just log it to the console for debugging.
        console.error("Failed to send order:", error);
    }
};


// --- Cart Management ---
const handleAddItem = (itemId) => {
    const existingItem = currentOrder.items.find(i => i.ItemID === itemId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        const menuItem = getMenu().find(i => i.ItemID === itemId);
        if (menuItem) currentOrder.items.push({ ...menuItem, quantity: 1 });
    }
    renderOrderSummary();
};

const handleRemoveItem = (itemId) => {
    const itemIndex = currentOrder.items.findIndex(i => i.ItemID === itemId);
    if (itemIndex > -1) {
        if (currentOrder.items[itemIndex].quantity > 1) {
            currentOrder.items[itemIndex].quantity--;
        } else {
            currentOrder.items.splice(itemIndex, 1);
        }
        renderOrderSummary();
    }
};

const handleDeleteItem = (itemId) => {
    currentOrder.items = currentOrder.items.filter(i => i.ItemID !== itemId);
    renderOrderSummary();
};

// --- Event Delegation ---
function handleOrderViewClick(e) {
    const target = e.target;
    const filterBtn = target.closest('.filter-btn');
    if (filterBtn) {
        categoryFilters.querySelector('.filter-btn.active')?.classList.remove('active');
        filterBtn.classList.add('active');
        renderMenuGrid();
        return;
    }
    const menuItemCard = target.closest('.menu-item-card');
    if (menuItemCard) {
        handleAddItem(parseInt(menuItemCard.dataset.itemId));
        return;
    }
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
    if (target.closest('[id^="send-to-kitchen-btn"]')) {
        handleSendToKitchen();
    }
}

// --- Initialization ---
export const initOrderInterface = (config, orderViewContainer) => {
    if (config.type === 'Table') {
        currentOrder = { tableId: config.source.TableID, orderType: 'DineIn', items: [] };
    } else {
        currentOrder = { tableId: null, orderType: 'Parcel', items: [] };
    }
    menuGridContainer = orderViewContainer.querySelector('#menu-grid-container');
    summaryContainer = orderViewContainer.querySelector('#current-order-summary');
    actionButtonsContainer = orderViewContainer.querySelector('.action-buttons');
    categoryFilters = orderViewContainer.querySelector('#category-filters');
    searchInput = orderViewContainer.querySelector('#menu-search-input');
    orderTitle = orderViewContainer.querySelector('#order-title, #parcel-order-title');
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
    renderMenuGrid();
    renderOrderSummary();
    orderViewContainer.removeEventListener('click', handleOrderViewClick);
    searchInput.removeEventListener('input', renderMenuGrid);
    orderViewContainer.addEventListener('click', handleOrderViewClick);
    searchInput.addEventListener('input', renderMenuGrid);
};

