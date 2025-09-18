// js/order.js
import * as state from './state.js';
import { showBillModal } from './ui.js';
import { handleRouteChange } from './router.js';

let currentSource = null;

const updateActionButtonsState = (container) => {
    if (!currentSource || !container) return;
    const sendBtn = container.querySelector('[id^="send-to-kitchen-btn"]');
    const checkoutBtn = container.querySelector('[id^="checkout-btn"]');
    const generateBillBtn = container.querySelector('[id^="generate-bill-btn"]');
    
    if (sendBtn) sendBtn.disabled = currentSource.order.length === 0;
    if (checkoutBtn) checkoutBtn.disabled = currentSource.orderStatus !== 'ready' || currentSource.pendingBillItems.length === 0;
    if (generateBillBtn) generateBillBtn.disabled = currentSource.orderStatus !== 'billed';
};

const renderOrderSummary = (summaryContainer, actionButtonsContainer) => {
    if (!summaryContainer || !currentSource) return;

    if (currentSource.order.length === 0) {
        summaryContainer.innerHTML = `
            <div class="summary-header"><h3>Current Order</h3></div>
            <div class="order-empty"><i class="fas fa-receipt"></i><p>Click menu items to add them.</p></div>`;
        updateActionButtonsState(actionButtonsContainer);
        return;
    }

    const aggregatedOrder = currentSource.order.reduce((acc, item) => {
        if (!acc[item.id]) acc[item.id] = { ...item, qty: 0 };
        acc[item.id].qty += 1;
        return acc;
    }, {});
    
    let subtotal = 0;
    let orderItemsHtml = '';
    Object.values(aggregatedOrder).forEach(item => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;
        orderItemsHtml += `
            <div class="order-item-row" data-item-id="${item.id}">
                <div class="item-info"><span class="item-name">${item.name}</span><span class="item-price">₹${item.price.toFixed(2)}</span></div>
                <div class="item-actions">
                    <div class="quantity-controls">
                        <button class="btn-qty-minus" data-item-id="${item.id}">-</button>
                        <span class="item-qty">${item.qty}</span>
                        <button class="btn-qty-plus" data-item-id="${item.id}">+</button>
                    </div>
                    <button class="btn-icon btn-delete-item" data-item-id="${item.id}"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>`;
    });

    const gst = subtotal * 0.05;
    const grandTotal = subtotal + gst;

    summaryContainer.innerHTML = `
        <div class="summary-header"><h3>Current Order</h3></div>
        <div class="order-items-list">${orderItemsHtml}</div>
        <div class="order-totals">
            <div class="total-row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
            <div class="total-row"><span>GST (5%)</span><span>₹${gst.toFixed(2)}</span></div>
            <div class="total-row grand-total"><span>Grand Total</span><span>₹${grandTotal.toFixed(2)}</span></div>
        </div>`;
    
    updateActionButtonsState(actionButtonsContainer);
};

// THIS FUNCTION CONTAINS THE LOGIC FIX
const renderMenuGrid = (filter = '', category = 'All') => {
    const menuContainer = document.getElementById('menu-grid-container');
    if (!menuContainer) return;

    const menu = state.getMenu();
    menuContainer.innerHTML = '';
    
    // LOGIC FIX: Added 'item.isAvailable' to the filter condition.
    // Now, it only selects items that are available AND match the category/search.
    const filteredMenu = menu.filter(item => 
        item.isAvailable && 
        (category === 'All' || item.category === category) && 
        item.name.toLowerCase().includes(filter.toLowerCase())
    );

    if (filteredMenu.length === 0) {
        menuContainer.innerHTML = `<p style="padding: 20px; text-align: center;">No menu items found.</p>`;
        return;
    }
    
    // The rendering logic no longer needs to worry about unavailable items
    menuContainer.innerHTML = filteredMenu.map(item => `
        <div class="item-card menu-item-card" data-item-id="${item.id}">
            <div class="card-content">
                <h4 class="item-name">${item.name}</h4>
                <p class="item-price">₹${item.price.toFixed(2)}</p>
            </div>
        </div>`).join('');
};


export const initOrderInterface = (source, orderViewContainer) => {
    currentSource = source; 
    const menuSelectionPanel = orderViewContainer.querySelector('.menu-selection-panel');
    const menuGridContainer = menuSelectionPanel.querySelector('.menu-grid');
    const summaryContainer = orderViewContainer.querySelector('.order-summary');
    const actionButtonsContainer = orderViewContainer.querySelector('.action-buttons');
    
    const categories = ['All', ...new Set(state.getMenu().map(item => item.category))];
    const filtersContainer = menuSelectionPanel.querySelector('.category-filters');
    filtersContainer.innerHTML = categories.map(cat => `<button class="filter-btn ${cat === 'All' ? 'active' : ''}" data-category="${cat}">${cat}</button>`).join('');

    renderMenuGrid();
    renderOrderSummary(summaryContainer, actionButtonsContainer);

    const searchInput = menuSelectionPanel.querySelector('#menu-search-input');
    searchInput.addEventListener('input', () => {
        const activeFilter = filtersContainer.querySelector('.filter-btn.active');
        renderMenuGrid(searchInput.value, activeFilter.dataset.category);
    });

    filtersContainer.addEventListener('click', e => {
        if (e.target.classList.contains('filter-btn')) {
            filtersContainer.querySelector('.filter-btn.active').classList.remove('active');
            e.target.classList.add('active');
            renderMenuGrid(searchInput.value, e.target.dataset.category);
        }
    });

    menuGridContainer.addEventListener('click', e => {
        const card = e.target.closest('.menu-item-card');
        if (card) {
            const menuItem = state.getMenuItemById(parseInt(card.dataset.itemId));
            currentSource.order.push(menuItem);
            if (currentSource.name) currentSource.status = 'booked';
            renderOrderSummary(summaryContainer, actionButtonsContainer);
        }
    });

    summaryContainer.addEventListener('click', e => {
        const button = e.target.closest('button');
        if (!button) return;
        const itemId = parseInt(button.dataset.itemId);
        if (button.classList.contains('btn-qty-plus')) {
            currentSource.order.push(state.getMenuItemById(itemId));
        } else if (button.classList.contains('btn-qty-minus')) {
            const index = currentSource.order.findIndex(item => item.id === itemId);
            if (index > -1) currentSource.order.splice(index, 1);
        } else if (button.classList.contains('btn-delete-item')) {
            currentSource.order = currentSource.order.filter(item => item.id !== itemId);
        }
        if (currentSource.order.length === 0 && currentSource.pendingBillItems.length === 0 && currentSource.name) {
            currentSource.status = 'available';
        }
        renderOrderSummary(summaryContainer, actionButtonsContainer);
    });
    
    const getSourceId = () => currentSource.name ? `Table ${currentSource.name}` : `Parcel ${currentSource.token}`;
    
    actionButtonsContainer.querySelector('[id^="send-to-kitchen-btn"]').onclick = () => {
        if (currentSource.order.length > 0) {
            currentSource.pendingBillItems.push(...currentSource.order);
            state.addKitchenOrder({ id: Date.now(), table: getSourceId(), items: [...currentSource.order], timestamp: new Date().toLocaleTimeString(), status: 'pending' });
            currentSource.order = [];
            currentSource.orderStatus = 'cooking';
            alert(`Order for ${getSourceId()} sent to kitchen!`);
            renderOrderSummary(summaryContainer, actionButtonsContainer);
        }
    };
    
    actionButtonsContainer.querySelector('[id^="checkout-btn"]').onclick = () => {
        if (currentSource.pendingBillItems.length > 0) {
            showBillModal(currentSource.pendingBillItems, `Finalize for ${getSourceId()}`, true, () => {
                currentSource.orderStatus = 'billed';
                alert('Items confirmed. You can now generate the final bill.');
                updateActionButtonsState(actionButtonsContainer);
            });
        }
    };

    actionButtonsContainer.querySelector('[id^="generate-bill-btn"]').onclick = () => {
        if (currentSource.orderStatus === 'billed') {
            const total = currentSource.pendingBillItems.reduce((sum, item) => sum + item.price, 0) * 1.05;
            const newBill = { orderId: `ORD-${Date.now().toString().slice(-6)}`, dateTime: new Date().toLocaleString(), table: getSourceId(), items: [...currentSource.pendingBillItems], total: total };
            state.addBill(newBill);
            showBillModal(newBill.items, `Final Bill for ${getSourceId()}`, false, null, () => {
                if (currentSource.name) {
                    currentSource.order = []; currentSource.pendingBillItems = [];
                    currentSource.status = 'available'; currentSource.orderStatus = 'ordering';
                    state.updateTable(currentSource);
                } else {
                    state.removeParcelByToken(currentSource.token);
                }
                handleRouteChange();
            });
        }
    };
};