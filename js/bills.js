// js/bills.js
import * as state from './state.js';

const exportToCsv = (bills) => {
    if (bills.length === 0) return alert("No data to export.");
    const headers = ["Date/Time", "OrderID", "Source", "Details", "Total"];
    const rows = bills.map(bill => [
        `"${bill.dateTime}"`,
        `"${bill.orderId}"`,
        `"${bill.table}"`,
        `"${bill.items.map(i => `${i.name} (x${i.qty || 1})`).join("; ")}"`,
        bill.total
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "bills-report.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const initBillsPage = () => {
    const content = document.getElementById("bills-content");
    const bills = state.getBills();
    let html = '<table class="bills-table"><thead><tr><th>Date/Time</th><th>Order ID</th><th>Source</th><th>Items</th><th>Total</th></tr></thead><tbody>';
    
    if (bills.length === 0) {
        html += '<tr><td colspan="5" style="text-align:center; padding: 20px;">No bills available.</td></tr>';
    } else {
        [...bills].reverse().forEach(bill => {
            const itemsHtml = bill.items.map(item => `<li>${item.name}</li>`).join("");
            html += `<tr><td>${bill.dateTime}</td><td>${bill.orderId}</td><td>${bill.table}</td><td><ul>${itemsHtml}</ul></td><td>₹${bill.total.toFixed(2)}</td></tr>`;
        });
    }
    
    html += "</tbody></table>";
    content.innerHTML = html;

    document.getElementById("download-excel-btn")?.addEventListener("click", () => exportToCsv(bills));
    document.getElementById("print-bills-btn")?.addEventListener("click", () => window.print());
};