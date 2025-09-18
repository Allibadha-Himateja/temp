import { getMenu, getTables, refreshState } from './state.js';
import { apiService } from './apiService.js';
import { showNotification } from './ui.js';

// --- Module State ---
let modal, modalTitle, editItemIdInput, itemNameInput, itemCategoryInput, itemPriceInput, itemAvailabilityInput;

// --- Modal Functions ---
const openModal = (mode = 'add', item = null) => {
    const form = document.getElementById('menu-item-form');
    form.reset();
    editItemIdInput.value = '';

    if (mode === 'edit' && item) {
        modalTitle.textContent = 'Edit Menu Item';
        editItemIdInput.value = item.ItemID;
        itemNameInput.value = item.ItemName;
        itemCategoryInput.value = item.CategoryID;
        itemPriceInput.value = item.RegularPrice;
        itemAvailabilityInput.checked = item.IsAvailable;
    } else {
        modalTitle.textContent = 'Add New Menu Item';
    }
    modal.classList.add('active');
};

const closeModal = () => {
    modal.classList.remove('active');
};

// --- API Call Handlers ---
const handleSaveItem = async () => {
    const id = editItemIdInput.value ? parseInt(editItemIdInput.value) : null;
    const itemData = {
        itemName: itemNameInput.value.trim(),
        categoryId: parseInt(itemCategoryInput.value),
        regularPrice: parseFloat(itemPriceInput.value),
        isAvailable: itemAvailabilityInput.checked,
        // Add other fields from your DB schema as needed
    };

    if (!itemData.itemName || !itemData.categoryId || isNaN(itemData.regularPrice)) {
        showNotification('Validation Error', 'Please fill all fields correctly.', 'error');
        return;
    }

    try {
        if (id) {
            await apiService.updateMenuItem(id, itemData);
            showNotification('Success', `Updated "${itemData.itemName}"`);
        } else {
            await apiService.addMenuItem(itemData);
            showNotification('Success', `Added "${itemData.itemName}" to the menu.`);
        }
        
        closeModal();
        await refreshState('menu');
        renderMenuList();
    } catch (error) {
        showNotification('API Error', `Could not save item: ${error.message}`, 'error');
    }
};

const handleAddTable = async (event) => {
    event.preventDefault();
    const nameInput = document.getElementById("new-table-name");
    const tableName = nameInput.value.trim().toUpperCase();

    if (!tableName) {
        showNotification('Validation Error', 'Table name cannot be empty.', 'error');
        return;
    }

    try {
        await apiService.addTable(tableName);
        showNotification('Success', `Table "${tableName}" added.`);
        nameInput.value = "";
        await refreshState('tables');
        renderTableList();
    } catch (error) {
        showNotification('API Error', `Could not add table: ${error.message}`, 'error');
    }
};

const handleDeleteTable = async (tableId, tableName) => {
    if (confirm(`Are you sure you want to delete table "${tableName}"?`)) {
        try {
            await apiService.deleteTable(tableId);
            showNotification('Success', `Table "${tableName}" deleted.`);
            await refreshState('tables');
            renderTableList();
        } catch (error) {
            showNotification('API Error', `Could not delete table: ${error.message}`, 'error');
        }
    }
};

const handleDeleteMenuItem = async (itemId, itemName) => {
     if (confirm(`Are you sure you want to delete "${itemName}"?`)) {
        try {
            await apiService.deleteMenuItem(itemId);
            showNotification('Success', `"${itemName}" has been deleted.`);
            await refreshState('menu');
            renderMenuList();
        } catch (error) {
            showNotification('API Error', `Could not delete item: ${error.message}`, 'error');
        }
    }
};

const handleToggleAvailability = async (itemId, isAvailable) => {
    try {
        await apiService.toggleMenuItemAvailability(itemId, { isAvailable });
        await refreshState('menu');
        renderMenuList();
    } catch (error) {
        showNotification('API Error', `Could not update availability: ${error.message}`, 'error');
        // Re-render to revert the toggle visually on failure
        renderMenuList();
    }
};


// --- UI Rendering ---
const renderTableList = () => {
    const tableGridContainer = document.getElementById("table-grid-container");
    if (!tableGridContainer) return;
    tableGridContainer.innerHTML = "";
    getTables().forEach(table => {
        const card = document.createElement("div");
        card.className = "item-card table-card status-available"; // Status can be enhanced later

        card.innerHTML = `
            <div class="table-card-header">
                <h4>${table.TableNumber}</h4>
                <div class="header-actions">
                    <button class="btn-icon btn-delete-table" data-id="${table.TableID}" data-name="${table.TableNumber}" title="Delete Table">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            <div class="table-card-body">
                <i class="fas fa-chair table-icon"></i>
                 <p>Capacity: ${table.Capacity}</p>
            </div>
        `;
        tableGridContainer.appendChild(card);
    });
};

const renderMenuList = () => {
    const menuListContainer = document.getElementById("menu-list-container");
    if (!menuListContainer) return;
    
    const menu = getMenu();
    menuListContainer.innerHTML = ""; // Simplified for now, can be grouped by category later
    
    menu.forEach(item => {
        const itemHtml = `
            <div class="item-card menu-item-card ${!item.IsAvailable ? 'item-unavailable' : ''}">
                <div class="card-main-content">
                    <div class="card-actions">
                        <button class="btn-icon btn-edit-item" data-id="${item.ItemID}" title="Edit Item"><i class="fas fa-pencil-alt"></i></button>
                        <button class="btn-icon btn-delete-item" data-id="${item.ItemID}" data-name="${item.ItemName}" title="Delete Item"><i class="fas fa-trash-alt"></i></button>
                    </div>
                    <div class="card-content">
                        <h4 class="item-name">${item.ItemName}</h4>
                        <p class="item-price">₹${item.RegularPrice.toFixed(2)}</p>
                    </div>
                </div>
                <div class="card-footer">
                    <label class="toggle-switch">
                        <input class="availability-toggle" type="checkbox" data-id="${item.ItemID}" ${item.IsAvailable ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                    <span>${item.IsAvailable ? 'Available' : 'Unavailable'}</span>
                </div>
            </div>`;
        menuListContainer.innerHTML += itemHtml;
    });
};


// --- Page Initialization ---
export const initUpdatePage = () => {
    // Cache DOM elements
    modal = document.getElementById('menu-item-modal');
    modalTitle = document.getElementById('modal-title');
    editItemIdInput = document.getElementById('edit-item-id');
    itemNameInput = document.getElementById('item-name');
    itemCategoryInput = document.getElementById('item-category');
    itemPriceInput = document.getElementById('item-price');
    itemAvailabilityInput = document.getElementById('item-availability');

    // Event Listeners
    document.querySelectorAll(".accordion-header").forEach(header => {
        header.addEventListener("click", () => header.parentElement.classList.toggle("active"));
    });

    document.getElementById("add-table-form")?.addEventListener("submit", handleAddTable);

    document.getElementById("table-grid-container")?.addEventListener("click", e => {
        const deleteBtn = e.target.closest('.btn-delete-table');
        if (deleteBtn) {
            handleDeleteTable(parseInt(deleteBtn.dataset.id), deleteBtn.dataset.name);
        }
    });

    const menuListContainer = document.getElementById('menu-list-container');
    menuListContainer?.addEventListener('click', (event) => {
        const editBtn = event.target.closest('.btn-edit-item');
        if (editBtn) {
            const item = getMenu().find(i => i.ItemID === parseInt(editBtn.dataset.id));
            openModal('edit', item);
        }
        const deleteBtn = event.target.closest('.btn-delete-item');
        if (deleteBtn) {
            handleDeleteMenuItem(parseInt(deleteBtn.dataset.id), deleteBtn.dataset.name);
        }
    });

    menuListContainer?.addEventListener('change', (event) => {
        if (event.target.classList.contains('availability-toggle')) {
            const itemId = parseInt(event.target.dataset.id);
            handleToggleAvailability(itemId, event.target.checked);
        }
    });

    document.getElementById('show-add-item-modal-btn')?.addEventListener('click', () => openModal('add'));
    document.getElementById('modal-save')?.addEventListener('click', handleSaveItem);
    document.getElementById('modal-close')?.addEventListener('click', closeModal);
    document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // Initial Render
    renderTableList();
    renderMenuList();
};
