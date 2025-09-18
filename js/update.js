import * as state from './state.js';

let modal, modalTitle, editItemIdInput, itemNameInput, itemCategoryInput, itemPriceInput;

const openModal = (mode = 'add', item = null) => {
    if (mode === 'edit' && item) {
        modalTitle.textContent = 'Edit Menu Item';
        editItemIdInput.value = item.id;
        itemNameInput.value = item.name;
        itemCategoryInput.value = item.category;
        itemPriceInput.value = item.price;
    } else {
        modalTitle.textContent = 'Add New Menu Item';
        document.getElementById('menu-item-form').reset();
        editItemIdInput.value = '';
    }
    modal.classList.add('active');
};

const closeModal = () => {
    modal.classList.remove('active');
};

const handleSaveItem = () => {
    const id = parseInt(editItemIdInput.value);
    const itemData = {
        name: itemNameInput.value.trim(),
        category: itemCategoryInput.value.trim(),
        price: parseFloat(itemPriceInput.value)
    };

    if (!itemData.name || !itemData.category || isNaN(itemData.price)) {
        alert("Please fill all fields correctly.");
        return;
    }

    if (id) {
        state.updateMenuItem({ id, ...itemData });
    } else {
        state.addMenuItem(itemData);
    }
    
    closeModal();
    renderMenuList();
};

const renderTableList = () => {
    const tableGridContainer = document.getElementById("table-grid-container");
    if (!tableGridContainer) return;
    tableGridContainer.innerHTML = "";
    state.getTables().forEach((table, index) => {
        const card = document.createElement("div");
        card.className = "item-card table-card status-available";

        card.innerHTML = `
            <div class="table-card-header">
                <h4>${table.name}</h4>
                <div class="header-actions">
                    <span class="status-badge">Editable</span>
                    <button class="btn-icon btn-delete-table" data-index="${index}" title="Delete Table">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            <div class="table-card-body">
                <i class="fas fa-chair table-icon"></i>
            </div>
        `;
        tableGridContainer.appendChild(card);
    });
};

const renderMenuList = () => {
    const menuListContainer = document.getElementById("menu-list-container");
    if (!menuListContainer) return;
    
    const groupedMenu = state.getMenu().reduce((acc, item) => {
        (acc[item.category] = acc[item.category] || []).push(item);
        return acc;
    }, {});

    menuListContainer.innerHTML = "";
    for (const category in groupedMenu) {
        let categoryHtml = `<div class="menu-list-group"><h3 class="category-title">${category}</h3><div class="item-grid">`;
        groupedMenu[category].forEach(item => {
            categoryHtml += `
                <div class="item-card menu-item-card ${!item.isAvailable ? 'item-unavailable' : ''}">
                    <div class="card-main-content">
                        <div class="card-actions">
                            <button class="btn-icon btn-edit-item" data-id="${item.id}" title="Edit Item"><i class="fas fa-pencil-alt"></i></button>
                            <button class="btn-icon btn-delete-item" data-id="${item.id}" title="Delete Item"><i class="fas fa-trash-alt"></i></button>
                        </div>
                        <div class="card-content">
                            <h4 class="item-name">${item.name}</h4>
                            <p class="item-price">₹${item.price.toFixed(2)}</p>
                        </div>
                    </div>
                    <div class="card-footer">
                        <label class="toggle-switch">
                            <input class="availability-toggle" type="checkbox" data-id="${item.id}" ${item.isAvailable ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                        <span>${item.isAvailable ? 'Available' : 'Unavailable'}</span>
                    </div>
                </div>`;
        });
        categoryHtml += `</div></div>`;
        menuListContainer.innerHTML += categoryHtml;
    }
};

export const initUpdatePage = () => {
    modal = document.getElementById('menu-item-modal');
    modalTitle = document.getElementById('modal-title');
    editItemIdInput = document.getElementById('edit-item-id');
    itemNameInput = document.getElementById('item-name');
    itemCategoryInput = document.getElementById('item-category');
    itemPriceInput = document.getElementById('item-price');

    document.querySelectorAll(".accordion-header").forEach(header => {
        header.addEventListener("click", () => header.parentElement.classList.toggle("active"));
    });

    document.getElementById("add-table-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const nameInput = document.getElementById("new-table-name");
        if (state.addTable(nameInput.value.trim().toUpperCase())) {
            nameInput.value = "";
            renderTableList();
        } else {
            alert("Invalid or duplicate table name.");
        }
    });

    document.getElementById("table-grid-container")?.addEventListener("click", e => {
        const deleteBtn = e.target.closest('.btn-delete-table');
        if (deleteBtn) {
            const tableIndex = deleteBtn.dataset.index;
            const tableName = state.getTables()[tableIndex].name;
            if (confirm(`Are you sure you want to delete table "${tableName}"?`)) {
                state.removeTable(tableIndex);
                renderTableList();
            }
        }
    });

    document.getElementById('show-add-item-modal-btn')?.addEventListener('click', () => openModal('add'));
    
    const menuListContainer = document.getElementById('menu-list-container');
    menuListContainer?.addEventListener('click', (event) => {
        const editBtn = event.target.closest('.btn-edit-item');
        if (editBtn) {
            const item = state.getMenuItemById(parseInt(editBtn.dataset.id));
            openModal('edit', item);
        }
        const deleteBtn = event.target.closest('.btn-delete-item');
        if (deleteBtn) {
            const item = state.getMenuItemById(parseInt(deleteBtn.dataset.id));
            if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
                state.removeMenuItem(item.id);
                renderMenuList();
            }
        }
    });

    // Event listener for the toggle switch
    menuListContainer?.addEventListener('change', (event) => {
        if (event.target.classList.contains('availability-toggle')) {
            const itemId = parseInt(event.target.dataset.id);
            state.toggleMenuItemAvailability(itemId);
            renderMenuList(); // Re-render to update the "Available/Unavailable" text
        }
    });

    document.getElementById('modal-save')?.addEventListener('click', handleSaveItem);
    document.getElementById('modal-close')?.addEventListener('click', closeModal);
    document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => { if(e.target === modal) closeModal() });

    renderTableList();
    renderMenuList();
};