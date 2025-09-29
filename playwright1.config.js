// @ts-check
import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Default load .env (optional fallback)
dotenv.config();

export default defineConfig({
  testDir: './tests/bahmni',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  reporter: 'html',

  projects: [
    {
      name: 'Safari',
      use: {
        ...devices['iPhone 11'],
        browserName: 'webkit',
        headless: false,
        screenshot: 'only-on-failure',
        trace: 'on',
        video: 'retain-on-failure',
      },
    },
    {
      name: 'chrome-dev',
      use: {
        ...devices['Desktop Chrome'],
        browserName: 'chromium',
        headless: false,
        screenshot: 'only-on-failure',
        trace: 'on',
        video: 'retain-on-failure',
      },

      metadata: {
        env: 'dev', 
        
      },
    },
    {
      name: 'chrome-qa',
      use: {
        ...devices['Desktop Chrome'],
        browserName: 'chromium',
        headless: false,
        screenshot: 'only-on-failure',
        trace: 'on',
        video: 'retain-on-failure',
      },

      metadata: {
        env: 'qa',
        
      },
    },
  ],
});
