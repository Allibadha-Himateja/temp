// js/tables.js
import * as state from './state.js';
import { initOrderInterface } from './order.js';

let selectedTableName = null;

const calculateCardTotal = (table) => {
    const allItems = [...table.order, ...table.pendingBillItems];
    return allItems.reduce((sum, item) => sum + item.price, 0);
};

const renderTablesView = () => {
    state.syncState(); // Ensure we have the latest data
    const selectionView = document.getElementById("table-selection-view");
    const orderView = document.getElementById("order-taking-view");
    
    if (selectedTableName) {
        const table = state.getTableByName(selectedTableName);
        if (!table) { // If table was deleted from another tab
            selectedTableName = null;
            renderTablesView();
            return;
        }
        selectionView.style.display = "none";
        orderView.style.display = "block";
        document.getElementById("order-title").textContent = `Order for Table ${table.name}`;
        initOrderInterface(table, orderView);

    } else {
        selectionView.style.display = "block";
        orderView.style.display = "none";
        
        const tablesContainer = document.getElementById("tables-container");
        tablesContainer.innerHTML = '';
        state.getTables().forEach(table => {
            const card = document.createElement("div");
            let statusClass = table.status === 'booked' ? 'status-booked' : 'status-available';
            if (table.orderStatus === 'billed') statusClass = 'status-billed';
            card.className = `item-card table-card ${statusClass}`;
            
            let statusText = 'Available';
            let detailsHtml = '<p class="availability">Ready for guests</p>';

            if (table.status === 'booked') {
                statusText = 'Occupied';
                const total = calculateCardTotal(table);
                const itemCount = table.order.length + table.pendingBillItems.length;
                detailsHtml = `<div class="table-details"><span><i class="fas fa-list-ol"></i> ${itemCount} Items</span><span><i class="fas fa-rupee-sign"></i> ${total.toFixed(2)}</span></div>`;
            } else if (table.orderStatus === 'billed') {
                statusText = 'Billed';
                const total = calculateCardTotal(table);
                detailsHtml = `<div class="table-details"><span><i class="fas fa-check"></i> Ready to Pay</span><span><i class="fas fa-rupee-sign"></i> ${total.toFixed(2)}</span></div>`;
            }

            card.innerHTML = `
                <div class="table-card-header"><h4>${table.name}</h4><span class="status-badge">${statusText}</span></div>
                <div class="table-card-body"><i class="fas fa-chair table-icon"></i>${detailsHtml}</div>`;
            
            card.addEventListener("click", () => {
                selectedTableName = table.name;
                renderTablesView();
            });
            tablesContainer.appendChild(card);
        });
    }
};

export const initTablesPage = () => {
    selectedTableName = null;
    
    // REAL-TIME UPDATE LOGIC
    const storageListener = () => {
        renderTablesView();
    };
    window.addEventListener('storage', storageListener);

    document.getElementById("back-to-tables-btn")?.addEventListener("click", () => {
        selectedTableName = null;
        renderTablesView();
    });
    
    renderTablesView();

    // Return a cleanup function
    return () => {
        window.removeEventListener('storage', storageListener);
    };
};