import { getKitchenOrders, refreshState } from './state.js';
import { apiService, socketService } from './apiService.js';
import { showNotification } from './ui.js';


const markItemAsReady = async (queueId) => {
    try {
        // We use 'Completed' as the status to send to the backend service.
        await apiService.updateKitchenOrderStatus(queueId, 'Completed');
        showNotification('Success', 'Item marked as ready.', 'success');
        // The UI will update automatically via the socket event, 
        // but we can also manually refresh the state for instant feedback.
        await refreshState('kitchenOrders');
        renderKitchenOrders();
    } catch (error) {
        showNotification('API Error', `Could not update item status: ${error.message}`, 'error');
    }
};

const renderKitchenOrders = () => {
    refreshState('kitchenOrders'); // Ensure we have the latest data
    const kotContainer = document.getElementById('kot-display-area');
    if (!kotContainer) return;

    const pendingItems = getKitchenOrders();

    if (!pendingItems || pendingItems.length === 0) {
        kotContainer.innerHTML = `<p class="no-data-msg" style="grid-column: 1 / -1;">No pending kitchen orders.</p>`;
        return;
    }

    // Group items by OrderID to create a base for each ticket.
    const orders = pendingItems.reduce((acc, item) => {
        // If we haven't seen this OrderID yet, create a new ticket for it.
        if (!acc[item.OrderID]) {
            acc[item.OrderID] = {
                orderId: item.OrderID,
                orderNumber: item.OrderNumber,
                source: item.TableNumber ? `Table ${item.TableNumber}` : `Parcel`,
                createdAt: new Date(item.CreatedAt).toLocaleTimeString(),
                items: []
            };
        }
        // Add the current item to its corresponding order's item array.
        acc[item.OrderID].items.push(item);
        
        return acc;
    }, {});


    // Render a ticket for each grouped order.
    kotContainer.innerHTML = Object.values(orders).map(order => {
        // Unroll items based on their quantity.
        const itemsList = order.items.flatMap(item => {
            // --- BUG FIX ---
            // This handles the malformed data where ItemName is an array.
            // We now check if it's an array and, if so, take the first element.
            let itemName = item.ItemName;
            if (Array.isArray(itemName)) {
                itemName = itemName[0];
            }
            
            const individualItems = [];
            // Create a separate list item for each unit of quantity.
            for (let i = 0; i < item.Quantity; i++) {
                individualItems.push(`
                    <li class="kot-item-row" data-queue-id="${item.QueueID}">
                        <div class="item-details">
                            <span>${itemName} <strong>x1</strong></span>
                            ${/* Only show instructions on the first instance of the item */''}
                            ${ i === 0 && item.SpecialInstructions ? `<small class="instructions">Note: ${item.SpecialInstructions}</small>` : ''}
                        </div>
                        <button class="btn btn-ready" data-queue-id="${item.QueueID}">Ready</button>
                    </li>`
                );
            }
            return individualItems;
        }).join('');

        return `
            <div class="kot-ticket">
                <div class="kot-header">
                    <span class="table-name">${order.source}</span>
                    <span class="order-number">#${order.orderNumber}</span>
                    <span class="timestamp">${order.createdAt}</span>
                </div>
                <ul class="kot-items-list">${itemsList}</ul>
            </div>`;
    }).join('');
};

export const initKitchenPage = async () => {
    // 1. Initial data fetch and render
    await refreshState('kitchenOrders');
    renderKitchenOrders();

    // 2. Set up event delegation for "Ready" buttons
    const kotContainer = document.getElementById('kot-display-area');
    kotContainer?.addEventListener('click', (e) => {
        const readyButton = e.target.closest('.btn-ready');
        if (readyButton) {
            const queueId = parseInt(readyButton.dataset.queueId);
            markItemAsReady(queueId);
        }
    });

    // 3. Set up real-time listeners for socket events from the server
    const handleKitchenUpdate = async () => {
        console.log('Socket event received: kitchenUpdate. Refreshing kitchen view.');
        await refreshState('kitchenOrders');
        renderKitchenOrders();
    };

    socketService.on('kitchenUpdate', handleKitchenUpdate);
    socketService.on('newOrder', handleKitchenUpdate); // Also refresh when a new order comes in

    // 4. Return a cleanup function for the router
    return () => {
        // Remove the listeners when navigating away to prevent memory leaks
        socketService.off('kitchenUpdate', handleKitchenUpdate);
        socketService.off('newOrder', handleKitchenUpdate);
    };
};

