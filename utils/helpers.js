/**
 * Generates a random string of a specified length.
 * Useful for creating unique identifiers, test data, etc.
 * @param {number} length - The desired length of the random string.
 * @returns {string} A random alphanumeric string.
 */
function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

/**
 * Formats a JavaScript Date object into a YYYY-MM-DD string.
 * Useful for date inputs or comparisons.
 * @param {Date} date - The Date object to format.
 * @returns {string} The formatted date string (e.g., "2023-10-27").
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * A simple utility to introduce a delay.
 * Use sparingly, prefer Playwright's built-in waits.
 * @param {number} milliseconds - The duration to wait in milliseconds.
 * @returns {Promise<void>}
 */
async function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

/**
 * Scrolls an element into view.
 * @param {import('@playwright/test').Page} page - The Playwright page object.
 * @param {string} selector - The CSS selector or XPath for the element.
 */
async function scrollElementIntoView(page, selector) {
  await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (element) {
      element.scrollIntoView();
    }
  }, selector);
}

module.exports = {
  generateRandomString,
  formatDate,
  delay,
  scrollElementIntoView,
};