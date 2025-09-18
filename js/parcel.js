import { initOrderInterface } from './order.js';
import { apiService } from './apiService.js';
import { showNotification } from './ui.js';

let orderInterfaceCleanup = null;

/**
 * Toggles between the list of parcels and the order creation view.
 * @param {'list' | 'order'} view - The view to display.
 * @param {object|null} parcelData - Data for an existing parcel to load into the order view.
 */
const showView = (view, parcelData = null) => {
    const selectionView = document.getElementById("parcel-selection");
    const orderView = document.getElementById("parcel-order-view");

    if (view === 'order') {
        selectionView.style.display = "none";
        orderView.style.display = "block";
        const orderConfig = parcelData ? 
            { type: 'Parcel', source: parcelData } : 
            { type: 'Parcel' };
        orderInterfaceCleanup = initOrderInterface(orderConfig, orderView);
    } else {
        if(orderInterfaceCleanup) orderInterfaceCleanup();
        selectionView.style.display = "block";
        orderView.style.display = "none";
    }
};

/**
 * Renders the list of ongoing parcel orders.
 */
const renderParcelList = async () => {
    const listContainer = document.getElementById("ongoing-parcels-list");
    if (!listContainer) return;
    listContainer.innerHTML = '<p class="loading-msg">Loading ongoing parcels...</p>';

    try {
        const response = await apiService.getOrders(null, 'Parcel');
        
        // --- BUG FIX: Safely handle the API response ---
        // Check if response.data is an array before trying to use it.
        const parcelsWithItems = Array.isArray(response.data) ? response.data : [];
        const ongoingParcels = parcelsWithItems.filter(p => p.Status !== 'Completed' && p.Status !== 'Cancelled');

        if (ongoingParcels.length === 0) {
            listContainer.innerHTML = '<p class="no-data-msg">No ongoing parcel orders.</p>';
            return;
        }

        listContainer.innerHTML = ongoingParcels.map(order => {
            const itemsHtml = order.items.map(item =>
                `<li>${item.ItemName} <strong>x${item.Quantity}</strong></li>`
            ).join('');

            return `
                <div class="item-card parcel-card status-${order.Status.toLowerCase()}" data-order-id="${order.OrderID}">
                    <div class="table-card-header">
                        <h4>Parcel #${order.OrderNumber}</h4>
                        <span class="status-badge">${order.Status}</span>
                    </div>
                    <div class="parcel-card-body">
                        <ul class="item-list">${itemsHtml}</ul>
                    </div>
                    <div class="parcel-card-footer">
                        <span>Total:</span>
                        <span class="total-amount">₹${(order.FinalAmount || 0).toFixed(2)}</span>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        listContainer.innerHTML = '<p class="error-msg">Failed to load parcels. Please try again.</p>';
        console.error("Error rendering parcel list:", error);
    }
};


const setupEventListeners = () => {
    const newParcelBtn = document.getElementById("new-parcel-order-btn");
    const backBtn = document.getElementById("back-to-parcels-btn");
    const listContainer = document.getElementById("ongoing-parcels-list");

    newParcelBtn?.addEventListener("click", () => {
        showView('order');
    });

    backBtn?.addEventListener("click", () => {
        showView('list');
        renderParcelList(); // Refresh the list
    });
    
    listContainer?.addEventListener('click', async (e) => {
        const card = e.target.closest('.parcel-card');
        if (card) {
            const orderId = card.dataset.orderId;
            showNotification('Loading...', `Fetching details for order #${orderId}.`);
            try {
                const response = await apiService.getOrderById(orderId);
                if(response.data){
                     showView('order', response.data);
                } else {
                    throw new Error('Order data not found in response.');
                }
            } catch (error) {
                showNotification('Error', 'Failed to load parcel details.', 'error');
            }
        }
    });
};

/**
 * Initializes the parcel page.
 */
export const initParcelPage = () => {
    renderParcelList();
    setupEventListeners();
    
    return () => {
        if(orderInterfaceCleanup) orderInterfaceCleanup();
        console.log('Parcel page cleaned up.');
    };
};

