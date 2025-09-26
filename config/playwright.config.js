const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  use: {
    baseURL: 'https://example.com', // Default base URL for tests
    browserName: 'chromium', // Browser to use
    headless: true, // Run tests in headless mode
    screenshot: 'on', // Capture screenshots on failure
    video: 'on', // Record video on failure
  },
  reporter: [['list'], ['html']], // Use list and HTML reporters
  timeout: 30000, // Set test timeout to 30 seconds
});