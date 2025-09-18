// js/kitchen.js
import * as state from './state.js';

const renderKitchenOrders = () => {
    const kotContainer = document.getElementById('kot-display-area');
    if (!kotContainer) return;

    kotContainer.innerHTML = '';
    const pendingOrders = state.getKitchenOrders().filter(order => order.status !== 'completed');
    
    if (pendingOrders.length === 0) {
        kotContainer.innerHTML = `<p style="text-align: center; padding: 20px;">No pending kitchen orders.</p>`;
        return;
    }

    pendingOrders.forEach(order => {
        const ticket = document.createElement('div');
        ticket.className = 'kot-ticket';
        
        const aggregatedItems = {};
        order.items.forEach(item => {
            if (aggregatedItems[item.name]) {
                aggregatedItems[item.name].qty++;
            } else {
                aggregatedItems[item.name] = { ...item, qty: 1 };
            }
        });

        const itemsList = Object.values(aggregatedItems).map(item => 
            `<li>${item.name} <strong>x${item.qty}</strong></li>`
        ).join('');
        
        ticket.innerHTML = `
            <div class="kot-header">
                <span class="table-name">${order.table}</span>
                <span class="timestamp">${order.timestamp}</span>
            </div>
            <ul class="kot-items-list">${itemsList}</ul>
            <div class="kot-actions">
                <button class="btn" data-id="${order.id}">Mark as Ready</button>
            </div>`;
        
        ticket.querySelector('.kot-actions .btn').addEventListener('click', (e) => {
            markOrderAsReady(parseInt(e.target.dataset.id));
        });
        
        kotContainer.appendChild(ticket);
    });
};

const markOrderAsReady = (orderId) => {
    const kitchenOrder = state.getKitchenOrders().find(o => o.id === orderId);
    if (!kitchenOrder) return;

    let source;
    if (kitchenOrder.table.startsWith('Table')) {
        source = state.getTableByName(kitchenOrder.table.replace('Table ', ''));
    } else {
        source = state.getParcelByToken(kitchenOrder.table.replace('Parcel ', ''));
    }

    if (source) {
        source.orderStatus = 'ready';
        if (source.name) state.updateTable(source);
        if (source.token) state.updateParcel(source);
        alert(`Order for ${kitchenOrder.table} is ready for checkout!`);
    }

    state.removeKitchenOrder(orderId);
    renderKitchenOrders();
};

export const initKitchenPage = () => {
    // REAL-TIME UPDATE LOGIC
    const storageListener = () => {
        renderKitchenOrders();
    };
    window.addEventListener('storage', storageListener);

    renderKitchenOrders();

    // Return a cleanup function for the router to call when we navigate away
    return () => {
        window.removeEventListener('storage', storageListener);
    };
};
