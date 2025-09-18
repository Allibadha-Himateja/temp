import { getTables, refreshState } from './state.js';
import { initOrderInterface } from './order.js';
import { socketService } from './apiService.js';

// --- Module State ---
let selectedTable = null;
let orderInterfaceCleanup = null; // To clean up order interface listeners

// --- View Toggling ---
const showView = (view) => {
    const selectionView = document.getElementById("table-selection-view");
    const orderView = document.getElementById("order-taking-view");

    if (view === 'order') {
        selectionView.style.display = "none";
        orderView.style.display = "block";
    } else {
        // Clean up any existing order interface before hiding it
        if (orderInterfaceCleanup) orderInterfaceCleanup();
        selectionView.style.display = "block";
        orderView.style.display = "none";
    }
};

// --- Rendering ---
const renderTablesView = () => {
    const tablesContainer = document.getElementById("tables-container");
    if (!tablesContainer) return;

    const tables = getTables();
    if (!tables) {
        tablesContainer.innerHTML = '<p class="loading-msg">Loading tables...</p>';
        return;
    }

    if (tables.length === 0) {
        tablesContainer.innerHTML = '<p class="no-data-msg">No tables found. Add them in the "Update" page.</p>';
        return;
    }

    tablesContainer.innerHTML = tables.map(table => {
        // Correctly use the 'Status' property from the backend
        const status = table.Status || 'Available';
        const statusClass = `status-${status.toLowerCase()}`;
        
        let statusText = status;
        let detailsHtml = '<p class="availability">Ready for guests</p>';

        // Check if the table has an active order linked to it
        if (status === 'Occupied' && table.CurrentOrderID) {
            statusText = 'Occupied';
            const total = table.TotalAmount || 0;
            const orderNum = table.OrderNumber || 'N/A';
            detailsHtml = `
                <div class="table-details">
                    <span><i class="fas fa-receipt"></i> #${orderNum}</span>
                    <span><i class="fas fa-rupee-sign"></i> ${total.toFixed(2)}</span>
                </div>`;
        }
        
        return `
            <div class="item-card table-card ${statusClass}" data-table-number="${table.TableNumber}">
                <div class="table-card-header">
                    <h4>${table.TableNumber}</h4>
                    <span class="status-badge">${statusText}</span>
                </div>
                <div class="table-card-body">
                    <i class="fas fa-chair table-icon"></i>
                    ${detailsHtml}
                </div>
            </div>
        `;
    }).join('');
};

// --- Initialization ---
export const initTablesPage = async () => {
    selectedTable = null;
    
    // 1. Initial Render
    await refreshState('tables'); // Get the latest data when the page loads
    renderTablesView();
    showView('list');

    // 2. Event Delegation for Table Clicks
    const tablesContainer = document.getElementById("tables-container");
    tablesContainer?.addEventListener("click", (e) => {
        const card = e.target.closest('.table-card');
        if (card) {
            const tableNumber = card.dataset.tableNumber;
            selectedTable = getTables().find(t => t.TableNumber == tableNumber);
            
            // --- LOGIC CORRECTION ---
            // This now allows entry for ANY table, not just available ones.
            // The logic to handle an existing order will be built into order.js next.
            if (selectedTable) {
                const orderView = document.getElementById("order-taking-view");
                orderInterfaceCleanup = initOrderInterface({ type: 'Table', source: selectedTable }, orderView);
                showView('order');
            }
        }
    });

    // 3. Back Button Listener
    document.getElementById("back-to-tables-btn")?.addEventListener("click", () => {
        selectedTable = null;
        showView('list');
        // Refresh the table list in case an order was just created or updated
        refreshState('tables').then(renderTablesView);
    });
    
    // 4. Real-time updates with Socket.IO
    const handleTableUpdate = async () => {
        console.log('Socket event received: tableStatusUpdate or newOrder. Refreshing tables.');
        await refreshState('tables');
        renderTablesView();
    };

    socketService.on('tableStatusUpdate', handleTableUpdate);
    socketService.on('newOrder', handleTableUpdate);

    // 5. Return a cleanup function for the router
    return () => {
        // Remove socket listeners when navigating away to prevent memory leaks
        socketService.off('tableStatusUpdate', handleTableUpdate);
        socketService.off('newOrder', handleTableUpdate);
        if (orderInterfaceCleanup) orderInterfaceCleanup();
    };
};

