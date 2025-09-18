// js/home.js
import * as state from './state.js';

function renderRevenueChart() {
    const ctx = document.getElementById('revenue-chart')?.getContext('2d');
    if (!ctx) return;

    const bills = state.getBills();
    const last7DaysData = {};
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        last7DaysData[dateString] = 0;
    }

    bills.forEach(bill => {
        if (last7DaysData.hasOwnProperty(bill.date)) {
            last7DaysData[bill.date] += bill.total;
        }
    });

    const labels = Object.keys(last7DaysData).map(dateStr => 
        new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    const data = Object.values(last7DaysData);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Revenue (₹)',
                data: data,
                backgroundColor: 'rgba(0, 123, 255, 0.5)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { callback: (value) => '₹' + value } } }
        }
    });
}

// NEW FUNCTION to render top selling items
function renderTopSellingItems() {
    const container = document.getElementById('top-items-list-container');
    if (!container) return;

    const today = new Date().toISOString().split('T')[0];
    const todaysBills = state.getBills().filter(bill => bill.date === today);

    const itemCounts = {};
    todaysBills.flatMap(bill => bill.items).forEach(item => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + 1;
    });

    const sortedItems = Object.entries(itemCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 5);

    if (sortedItems.length === 0) {
        container.innerHTML = `<p class="no-data-msg">No sales recorded today.</p>`;
        return;
    }

    let listHtml = '<ol class="top-items-list">';
    sortedItems.forEach(([name, count]) => {
        listHtml += `<li><span class="item-name">${name}</span> <span class="item-count">${count} sold</span></li>`;
    });
    listHtml += '</ol>';
    container.innerHTML = listHtml;
}

export const initHomePage = () => {
    // Calculate stats
    const activeTables = state.getTables().filter(t => t.status === 'booked').length;
    const pendingParcels = state.getParcels().length; // New stat
    const pendingKOTs = state.getKitchenOrders().filter(k => k.status === 'pending').length;
    const today = new Date().toISOString().split('T')[0];
    const todaySales = state.getBills()
        .filter(bill => bill.date === today)
        .reduce((sum, bill) => sum + bill.total, 0);

    // Update stat cards
    document.getElementById('active-tables-count').textContent = activeTables;
    document.getElementById('pending-parcels-count').textContent = pendingParcels; // New stat
    document.getElementById('pending-kots-count').textContent = pendingKOTs;
    document.getElementById('total-sales-amount').textContent = `₹${todaySales.toFixed(2)}`;

    // Render recent bills
    const recentBillsContainer = document.getElementById('recent-bills-list');
    const bills = state.getBills();
    if (bills.length === 0) {
        recentBillsContainer.innerHTML = '<p class="no-data-msg">No bills generated yet.</p>';
    } else {
        const recentBills = [...bills].reverse().slice(0, 5);
        let billsHtml = '<table class="bills-table"><thead><tr><th>Order ID</th><th>Source</th><th>Total</th></tr></thead><tbody>';
        recentBills.forEach(bill => {
            billsHtml += `<tr><td>${bill.orderId}</td><td>${bill.table}</td><td>₹${bill.total.toFixed(2)}</td></tr>`;
        });
        billsHtml += '</tbody></table>';
        recentBillsContainer.innerHTML = billsHtml;
    }
    
    // Render dynamic components
    renderRevenueChart();
    renderTopSellingItems(); // New component
};