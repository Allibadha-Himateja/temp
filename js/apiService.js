// js/apiService.js

// Use 'http://localhost:3000' for your local development server.
const API_BASE_URL = 'http://localhost:3000/api';
let socket = null;

/**
 * A helper function to make API requests.
 * @param {string} endpoint - The API endpoint to call (e.g., '/menu').
 * @param {string} method - The HTTP method (e.g., 'GET', 'POST').
 * @param {object} [body] - The request body for POST or PUT requests.
 * @returns {Promise<any>} - The JSON response from the server.
 */
const apiRequest = async (endpoint, method = 'GET', body = null) => {
    const config = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        // The response needs to be parsed before we can check for custom success flags
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            // Use the error message from the backend response if it exists
            throw new Error(data.error || 'Something went wrong');
        }
        return data; // Return the full { success: true, data: ... } object
    } catch (error) {
        console.error(`API Error (${method} ${endpoint}):`, error);
        throw error; // Re-throw the error to be handled by the caller
    }
};

// --- API Service Object ---
export const apiService = {
    // -- Menu Endpoints --
    getMenu: () => apiRequest('/menu'),
    addMenuItem: (itemData) => apiRequest('/menu', 'POST', itemData),
    updateMenuItem: (id, itemData) => apiRequest(`/menu/${id}`, 'PUT', itemData),
    deleteMenuItem: (id) => apiRequest(`/menu/${id}`, 'DELETE'),
    toggleMenuItemAvailability: (id, isAvailable) => apiRequest(`/menu/${id}/availability`, 'PATCH', { isAvailable }),

    // -- Table Endpoints --
    getTables: () => apiRequest('/tables'),
    addTable: (name) => apiRequest('/tables', 'POST', { name }),
    updateTable: (id, tableData) => apiRequest(`/tables/${id}`, 'PUT', tableData),
    deleteTable: (id) => apiRequest(`/tables/${id}`, 'DELETE'),

    // -- Order Endpoints --
    createOrder: (orderData) => apiRequest('/orders', 'POST', orderData),
    updateOrder: (id, orderData) => apiRequest(`/orders/${id}`, 'PUT', orderData),
    // getOrders: () => apiRequest('/orders', 'GET'),
    getOrderById: (id) => apiRequest(`/orders/${id}`, 'GET'),
    getOrders: (status = null, orderType = null) => {
        const params = new URLSearchParams();
        if (status) {
            params.append('status', status);
        }
        if (orderType) {
            params.append('orderType', orderType);
        }
        const endpoint = `/orders${params.toString() ? '?' + params.toString() : ''}`;
        return apiRequest(endpoint);
    },

    // -- Kitchen Endpoints --
    getKitchenOrders: () => apiRequest('/kitchen/queue', 'GET'),
    updateKitchenOrderStatus: (id, status) => apiRequest(`/kitchen/queue/${id}`, 'PATCH', { status }),

    // -- Bill Endpoints --
    getBills: () => apiRequest('/bills'),
    generateBill: (orderId) => apiRequest('/bills/generate', 'POST', { orderId }),
};

// --- Socket Service ---
export const socketService = {
    connect: () => {
        if (socket && socket.connected) {
            return;
        }
        // Make sure you have the socket.io client library included in your index.html
        // e.g., <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
        socket = io('http://localhost:3000'); // Your server URL

        socket.on('connect', () => {
            console.log('🔌 Connected to Socket.IO server');
        });

        socket.on('disconnect', () => {
            console.log('🔌 Disconnected from Socket.IO server');
        });
    },

    disconnect: () => {
        if (socket) {
            socket.disconnect();
        }
    },

    on: (eventName, callback) => {
        if (socket) {
            socket.on(eventName, callback);
        }
    },

    emit: (eventName, data) => {
        if (socket) {
            socket.emit(eventName, data);
        }
    },
};
