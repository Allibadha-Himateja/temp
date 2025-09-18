// js/home.js
import { getTables, getKitchenOrders, getBills } from './state.js';

function renderRevenueChart() {
    const ctx = document.getElementById('revenue-chart')?.getContext('2d');
    if (!ctx) return;

    const bills = getBills() || [];
    const last7DaysData = {};
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        last7DaysData[dateString] = 0;
    }

    bills.forEach(bill => {
        const billDate = new Date(bill.CreatedAt).toISOString().split('T')[0];
        if (last7DaysData.hasOwnProperty(billDate)) {
            last7DaysData[billDate] += bill.TotalAmount;
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

function renderTopSellingItems() {
    const container = document.getElementById('top-items-list-container');
    if (!container) return;

    const today = new Date().toISOString().split('T')[0];
    const todaysBills = (getBills() || []).filter(bill => new Date(bill.CreatedAt).toISOString().split('T')[0] === today);

    // This logic needs to be adapted once order items are fetched with bills
    if (todaysBills.length === 0) {
        container.innerHTML = `<p class="no-data-msg">No sales recorded today.</p>`;
        return;
    }
    container.innerHTML = `<p class="no-data-msg">Top items feature coming soon!</p>`;
}

export const initHomePage = () => {
    // Calculate stats
    const tables = getTables() || [];
    const kitchenOrders = getKitchenOrders() || [];
    const bills = getBills() || [];

    const activeTables = tables.filter(t => t.Status === 'Occupied').length;
    const pendingKOTs = kitchenOrders.filter(k => k.Status === 'Queued' || k.Status === 'InProgress').length;
    const today = new Date().toISOString().split('T')[0];
    const todaySales = bills
        .filter(bill => new Date(bill.CreatedAt).toISOString().split('T')[0] === today)
        .reduce((sum, bill) => sum + bill.TotalAmount, 0);

    // Update stat cards
    document.getElementById('active-tables-count').textContent = activeTables;
    document.getElementById('pending-kots-count').textContent = pendingKOTs;
    document.getElementById('total-sales-amount').textContent = `₹${todaySales.toFixed(2)}`;

    // Render recent bills
    const recentBillsContainer = document.getElementById('recent-bills-list');
    if (bills.length === 0) {
        recentBillsContainer.innerHTML = '<p class="no-data-msg">No bills generated yet.</p>';
    } else {
        const recentBills = [...bills].reverse().slice(0, 5);
        let billsHtml = '<table class="bills-table"><thead><tr><th>Order ID</th><th>Source</th><th>Total</th></tr></thead><tbody>';
        recentBills.forEach(bill => {
            // We need to fetch table number based on order, this is a placeholder
            billsHtml += `<tr><td>${bill.OrderID}</td><td>Table/Parcel</td><td>₹${bill.TotalAmount.toFixed(2)}</td></tr>`;
        });
        billsHtml += '</tbody></table>';
        recentBillsContainer.innerHTML = billsHtml;
    }

    // Render dynamic components
    renderRevenueChart();
    renderTopSellingItems();
};
