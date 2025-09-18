// js/ui.js
const body = document.body;
const billModal = document.getElementById('bill-modal');
const mainContent = document.getElementById('main-content');
const navLinks = document.querySelectorAll('.nav-link');

export const initSidebar = () => {
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const closeBtn = document.getElementById('sidebar-close-btn');
    if (toggleBtn) toggleBtn.addEventListener('click', () => body.classList.toggle('sidebar-open'));
    if (closeBtn) closeBtn.addEventListener('click', () => body.classList.toggle('sidebar-open'));
    navLinks.forEach(link => link.addEventListener('click', () => {
        if (body.classList.contains('sidebar-open')) body.classList.remove('sidebar-open');
    }));
};

export const updateActiveNavLink = (page) => {
    navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
    });
};

export const renderPage = async (html) => {
    mainContent.innerHTML = html;
};

export const showBillModal = (items, title, isCheckout = false, confirmCallback = null, finalBillCloseCallback = null) => {
    const billDetailsContainer = document.getElementById('bill-details');
    const modalTitle = document.getElementById('bill-modal-title');
    const confirmBtn = document.getElementById('modal-confirm-bill-btn');
    const closeBtn = document.getElementById('modal-close-footer-btn');
    const printBtn = document.getElementById('modal-print-btn');

    const aggregatedItems = items.reduce((acc, item) => {
        if (!acc[item.name]) acc[item.name] = { ...item, qty: 0 };
        acc[item.name].qty += (item.qty || 1);
        return acc;
    }, {});

    let subtotal = 0;
    let itemsHtml = '';
    Object.values(aggregatedItems).forEach(data => {
        const amount = data.qty * data.price;
        subtotal += amount;
        itemsHtml += `<tr><td>${data.name}</td><td class="qty">${data.qty}</td><td class="rate">₹${data.price.toFixed(2)}</td><td class="amount">₹${amount.toFixed(2)}</td></tr>`;
    });

    const gst = subtotal * 0.05;
    const grandTotal = subtotal + gst;

    billDetailsContainer.innerHTML = `
        <div class="receipt">
            <div class="receipt-header"><h2>THE RESTAURANT COUNTER</h2><p>Thank you for your visit!</p></div>
            <table class="receipt-table">
                <thead><tr><th>Item</th><th class="qty">Qty</th><th class="rate">Rate</th><th class="amount">Amount</th></tr></thead>
                <tbody>${itemsHtml}</tbody>
            </table>
            <div class="receipt-summary">
                <div class="summary-item"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
                <div class="summary-item"><span>GST (5%)</span><span>₹${gst.toFixed(2)}</span></div>
                <div class="summary-total"><span>Grand Total</span><span>₹${grandTotal.toFixed(2)}</span></div>
            </div>
        </div>`;

    modalTitle.textContent = title;
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);

    if (isCheckout) {
        printBtn.style.display = 'none';
        newCloseBtn.textContent = 'Cancel';
        newConfirmBtn.style.display = 'block';
        newConfirmBtn.onclick = () => {
            if (confirmCallback) confirmCallback();
            closeBillModal();
        };
    } else {
        printBtn.style.display = 'block';
        newCloseBtn.textContent = 'Close';
        newConfirmBtn.style.display = 'none';
        newCloseBtn.onclick = () => {
             if (finalBillCloseCallback) finalBillCloseCallback();
             closeBillModal();
        };
    }
    
    billModal.classList.add('active');
};

export const closeBillModal = () => {
    billModal.classList.remove('active');
};

export const initBillModal = () => {
    document.getElementById('modal-close-btn')?.addEventListener('click', closeBillModal);
    billModal?.addEventListener('click', (e) => { if (e.target === billModal) closeBillModal(); });
    document.getElementById('modal-print-btn')?.addEventListener('click', () => {
        body.classList.add('printing-bill');
        window.print();
        body.classList.remove('printing-bill');
    });
};

// --- Formatting Utilities ---
export const formatCurrency = (amount) => `₹${parseFloat(amount).toFixed(2)}`;
export const formatDateTime = (dateString) => new Date(dateString).toLocaleString('en-IN');
export const formatTime = (dateString) => new Date(dateString).toLocaleTimeString('en-IN', { hour12: true, hour: '2-digit', minute: '2-digit' });

// --- Notification System ---
export const showNotification = (title, message, type = 'info') => {
    const container = document.getElementById('notification-container') || createNotificationContainer();
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-header">
            <strong>${title}</strong>
            <button class="close-btn">&times;</button>
        </div>
        <p>${message}</p>
        <div class="notification-timer"></div>
    `;
    
    container.appendChild(notification);
    
    const close = () => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    };

    notification.querySelector('.close-btn').onclick = close;
    setTimeout(close, 5000); // Auto-dismiss after 5 seconds
};

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    document.body.appendChild(container);
    return container;
}


