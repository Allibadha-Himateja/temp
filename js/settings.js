import { showNotification } from './ui.js';

export const initSettingsPage = () => {
    const themeSelect = document.getElementById('theme');
    const defaultPageSelect = document.getElementById('default-page');
    const saveBtn = document.getElementById('save-settings-btn');

    // Load saved settings from localStorage
    themeSelect.value = localStorage.getItem('theme') || 'light';
    defaultPageSelect.value = localStorage.getItem('defaultPage') || 'home';

    // Save settings to localStorage when the button is clicked
    saveBtn?.addEventListener('click', () => {
        const selectedTheme = themeSelect.value;
        const selectedDefaultPage = defaultPageSelect.value;
        
        localStorage.setItem('theme', selectedTheme);
        localStorage.setItem('defaultPage', selectedDefaultPage);
        
        // Apply the theme immediately
        document.body.className = selectedTheme === 'dark' ? 'dark-mode' : '';
        
        showNotification('Success', 'Your settings have been saved.');
    });
};

/**
 * Applies the saved theme when the application first loads.
 * This function is called from main.js.
 */
export const applyTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
};
