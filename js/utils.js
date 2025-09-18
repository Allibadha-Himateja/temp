// js/utils.js

/**
 * Gets the local date in YYYY-MM-DD format.
 * @param {Date} date - The date to format (defaults to now).
 * @returns {string} The formatted date string.
 */
export const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
