// js/state.js
import { getLocalDateString } from './utils.js';

const initialState = {
    tables: [
        { name: 'T1', status: 'available', order: [], orderStatus: 'ordering', pendingBillItems: [] },
        { name: 'T2', status: 'available', order: [], orderStatus: 'ordering', pendingBillItems: [] },
        { name: 'T3', status: 'available', order: [], orderStatus: 'ordering', pendingBillItems: [] },
    ],
    parcelOrders: [],
    menu: [
        // ADDED isAvailable property to each item
        { id: 1, name: 'Spring Rolls', category: 'Appetizers', price: 250, isAvailable: true },
        { id: 2, name: 'Garlic Bread', category: 'Appetizers', price: 180, isAvailable: true },
        { id: 3, name: 'Chicken Wings', category: 'Appetizers', price: 320, isAvailable: true },
        { id: 4, name: 'Pasta Carbonara', category: 'Main Course', price: 450, isAvailable: true },
        { id: 5, name: 'Grilled Chicken', category: 'Main Course', price: 550, isAvailable: true },
        { id: 6, name: 'Veg Biryani', category: 'Main Course', price: 350, isAvailable: true },
        { id: 7, name: 'Fish Curry', category: 'Main Course', price: 480, isAvailable: true },
        { id: 8, name: 'Cheesecake', category: 'Desserts', price: 300, isAvailable: true },
        { id: 9, name: 'Chocolate Brownie', category: 'Desserts', price: 220, isAvailable: true },
        { id: 10, name: 'Iced Tea', category: 'Beverages', price: 120, isAvailable: true },
        { id: 11, name: 'Coffee', category: 'Beverages', price: 150, isAvailable: true },
    ],
    bills: [],
    kitchenOrders: []
};

let appState = JSON.parse(localStorage.getItem('restaurantState')) || initialState;

const saveState = () => {
    localStorage.setItem('restaurantState', JSON.stringify(appState));
};

export const getState = () => appState;
export const syncState = () => {
    appState = JSON.parse(localStorage.getItem('restaurantState')) || initialState;
};
// ... (getTables, addTable, etc. remain the same)
export const getTables = () => appState.tables;
export const getTableByName = (name) => appState.tables.find(t => t.name === name);
export const addTable = (name) => {
    if (name && !appState.tables.some(t => t.name === name)) {
        appState.tables.push({ name, status: "available", order: [], orderStatus: "ordering", pendingBillItems: [] });
        saveState();
        return true;
    }
    return false;
};
export const removeTable = (index) => {
    appState.tables.splice(index, 1);
    saveState();
};
export const updateTable = (updatedTable) => {
    const index = appState.tables.findIndex(t => t.name === updatedTable.name);
    if (index !== -1) { appState.tables[index] = updatedTable; saveState(); }
};
export const getParcels = () => appState.parcelOrders;
export const getParcelByToken = (token) => appState.parcelOrders.find(p => p.token === token);
export const createParcel = () => {
    const token = `P${Math.floor(100 + 900 * Math.random())}`;
    appState.parcelOrders.push({ token, order: [], orderStatus: "ordering", pendingBillItems: [] });
    saveState();
    return token;
};
export const removeParcelByToken = (token) => {
    appState.parcelOrders = appState.parcelOrders.filter(p => p.token !== token);
    saveState();
};
export const updateParcel = (updatedParcel) => {
    const index = appState.parcelOrders.findIndex(p => p.token === updatedParcel.token);
    if (index !== -1) { appState.parcelOrders[index] = updatedParcel; saveState(); }
};

export const getMenu = () => appState.menu;
export const getMenuItemById = (id) => appState.menu.find(item => item.id === id);
export const addMenuItem = (item) => {
    appState.menu.push({ id: Date.now(), ...item, isAvailable: true }); // New items are available by default
    saveState();
};
export const updateMenuItem = (updatedItem) => {
    const index = appState.menu.findIndex(item => item.id === updatedItem.id);
    if(index !== -1) { Object.assign(appState.menu[index], updatedItem); saveState(); }
};
export const removeMenuItem = (id) => {
    appState.menu = appState.menu.filter(item => item.id !== id);
    saveState();
};

// NEW FUNCTION to toggle item availability
export const toggleMenuItemAvailability = (id) => {
    const item = appState.menu.find(item => item.id === id);
    if (item) {
        item.isAvailable = !item.isAvailable;
        saveState();
    }
};

// ... (getKitchenOrders, addBill, etc. remain the same)
export const getKitchenOrders = () => appState.kitchenOrders;
export const addKitchenOrder = (order) => {
    appState.kitchenOrders.push(order);
    saveState();
};
export const removeKitchenOrder = (id) => {
    appState.kitchenOrders = appState.kitchenOrders.filter(o => o.id !== id);
    saveState();
};
export const getBills = () => appState.bills;
export const addBill = (bill) => {
    const billWithDate = { ...bill, date: getLocalDateString() };
    appState.bills.push(billWithDate);
    saveState();
};