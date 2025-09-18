import { getBills } from './state.js';

const exportToCsv = (bills) => {
    if (bills.length === 0) {
        alert("No data to export.");
        return;
    }

    const headers = ["Bill Number", "Order Number", "Date", "Payment Method", "Status", "Total Amount"];
    const rows = bills.map(bill => [
        `"${bill.BillNumber}"`,
        `"${bill.OrderNumber}"`,
        `"${new Date(bill.CreatedAt).toLocaleString()}"`,
        `"${bill.PaymentMethod || 'N/A'}"`,
        `"${bill.PaymentStatus}"`,
        bill.TotalAmount
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
    const bills = getBills();

    let tableHtml = `
        <table class="bills-table">
            <thead>
                <tr>
                    <th>Bill Number</th>
                    <th>Order Number</th>
                    <th>Date/Time</th>
                    <th>Table</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>`;
    
    if (!bills || bills.length === 0) {
        tableHtml += '<tr><td colspan="7" class="no-data-msg">No bills available.</td></tr>';
    } else {
        // Sort bills by date, newest first
        const sortedBills = [...bills].sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
        
        sortedBills.forEach(bill => {
            tableHtml += `
                <tr>
                    <td>${bill.BillNumber}</td>
                    <td>${bill.OrderNumber}</td>
                    <td>${new Date(bill.CreatedAt).toLocaleString()}</td>
                    <td>${bill.TableNumber || 'Parcel'}</td>
                    <td>${bill.PaymentMethod || 'N/A'}</td>
                    <td><span class="status-badge status-${bill.PaymentStatus.toLowerCase()}">${bill.PaymentStatus}</span></td>
                    <td>₹${bill.TotalAmount.toFixed(2)}</td>
                </tr>`;
        });
    }
    
    tableHtml += "</tbody></table>";
    content.innerHTML = tableHtml;

    // Add event listeners after rendering
    document.getElementById("download-excel-btn")?.addEventListener("click", () => exportToCsv(bills));
    document.getElementById("print-bills-btn")?.addEventListener("click", () => window.print());
};
