// js/parcel.js
import * as state from './state.js';
import { initOrderInterface } from './order.js';

let selectedParcelToken = null;

const calculateCardTotal = (parcel) => {
    const allItems = [...parcel.order, ...parcel.pendingBillItems];
    return allItems.reduce((sum, item) => sum + item.price, 0);
};

const renderParcelView = () => {
    state.syncState(); // Ensure we have the latest data
    const selectionView = document.getElementById("parcel-selection");
    const orderView = document.getElementById("parcel-order-view");

    if (selectedParcelToken) {
        const parcel = state.getParcelByToken(selectedParcelToken);
        if (!parcel) { // If parcel was deleted from another tab
            selectedParcelToken = null;
            renderParcelView();
            return;
        }
        selectionView.style.display = "none";
        orderView.style.display = "block";
        document.getElementById("parcel-order-title").textContent = `Order for Parcel ${parcel.token}`;
        initOrderInterface(parcel, orderView);

    } else {
        selectionView.style.display = "block";
        orderView.style.display = "none";
        
        const listContainer = document.getElementById("ongoing-parcels-list");
        listContainer.innerHTML = '';
        const ongoingParcels = state.getParcels();
        
        if (ongoingParcels.length > 0) {
            ongoingParcels.forEach(parcel => {
                const card = document.createElement("div");
                let statusClass = `status-${parcel.orderStatus}`;
                card.className = `item-card parcel-card ${statusClass}`;

                let statusText = parcel.orderStatus.charAt(0).toUpperCase() + parcel.orderStatus.slice(1);
                let detailsHtml = '<p class="availability">Ready for order</p>';

                if (parcel.pendingBillItems.length > 0 || parcel.order.length > 0) {
                     const total = calculateCardTotal(parcel);
                     const itemCount = parcel.order.length + parcel.pendingBillItems.length;
                     detailsHtml = `<div class="table-details"><span><i class="fas fa-list-ol"></i> ${itemCount} Items</span><span><i class="fas fa-rupee-sign"></i> ${total.toFixed(2)}</span></div>`;
                }

                card.innerHTML = `
                    <div class="table-card-header"><h4>Parcel ${parcel.token}</h4><span class="status-badge">${statusText}</span></div>
                    <div class="table-card-body"><i class="fas fa-box-open parcel-icon"></i>${detailsHtml}</div>`;

                card.addEventListener("click", () => {
                    selectedParcelToken = parcel.token;
                    renderParcelView();
                });
                listContainer.appendChild(card);
            });
        } else {
            listContainer.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; padding: 20px;">No ongoing parcel orders.</p>';
        }
    }
};

export const initParcelPage = () => {
    selectedParcelToken = null;

    // REAL-TIME UPDATE LOGIC
    const storageListener = () => {
        renderParcelView();
    };
    window.addEventListener('storage', storageListener);

    document.getElementById("new-parcel-order-btn")?.addEventListener("click", () => {
        selectedParcelToken = state.createParcel();
        renderParcelView();
    });
    document.getElementById("back-to-parcels-btn")?.addEventListener("click", () => {
        selectedParcelToken = null;
        renderParcelView();
    });
    
    renderParcelView();

    // Return a cleanup function
    return () => {
        window.removeEventListener('storage', storageListener);
    };
};