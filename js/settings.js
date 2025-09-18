// js/settings.js
export const initSettingsPage = () => {
    const themeSelect = document.getElementById('theme');
    const defaultPageSelect = document.getElementById('default-page');
    const clearDataBtn = document.getElementById('clear-data-btn');

    themeSelect.value = localStorage.getItem('theme') || 'light';
    defaultPageSelect.value = localStorage.getItem('defaultPage') || 'home';

    document.getElementById('save-settings-btn')?.addEventListener('click', () => {
        const selectedTheme = themeSelect.value;
        const selectedDefaultPage = defaultPageSelect.value;
        
        localStorage.setItem('theme', selectedTheme);
        localStorage.setItem('defaultPage', selectedDefaultPage);
        
        document.body.className = selectedTheme === 'dark' ? 'dark-mode' : '';
        alert('Settings saved!');
    });

    clearDataBtn?.addEventListener('click', () => {
        if (confirm("Are you sure you want to delete all data?\nThis action cannot be undone.")) {
            localStorage.clear();
            alert("All data has been cleared. The application will now reload.");
            location.reload();
        }
    });
};

export const applyTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
};