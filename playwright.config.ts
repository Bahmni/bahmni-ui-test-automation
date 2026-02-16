import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as dotenv from 'dotenv';

/**
 * Read environment variables from file.
 * Load environment based on NODE_ENV (default: dev)
 * Usage: NODE_ENV=local npx playwright test
 */
const env = process.env.NODE_ENV || 'dev';
dotenv.config({ path: path.resolve(process.cwd(), `.env.${env}`) });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  /* Global setup file - runs once before all tests */
  globalSetup: require.resolve('./global-setup'),

  /* Global teardown file - runs once after all tests */
  globalTeardown: require.resolve('./global-teardown'),

  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    [
      'allure-playwright',
      {
        resultsDir: 'reports/allure-results',
        detail: true,
        suiteTitle: true,
        environmentInfo: {
          'Node Version': process.version,
          Environment: env,
          'Base URL': process.env.BASE_URL || 'https://docker.standard.mybahmni.in',
        },
      },
    ],
    ['html', { outputFolder: 'reports/html-report', open: 'never' }],
    ['json', { outputFile: 'reports/test-results.json' }],
    ['list'],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'https://docker.standard.mybahmni.in',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    /* Maximum time each action such as `click()` can take */
    actionTimeout: parseInt(process.env.TIMEOUT || '30000'),

    /* Navigation timeout */
    navigationTimeout: parseInt(process.env.TIMEOUT || '30000'),

    /* Headless mode */
    headless: process.env.HEADLESS === 'true',

    /* Slow motion */
    launchOptions: {
      slowMo: parseInt(process.env.SLOW_MO || '0'),
    },

    /* Viewport */
    viewport: {
      width: parseInt(process.env.VIEWPORT_WIDTH || '1920'),
      height: parseInt(process.env.VIEWPORT_HEIGHT || '1080'),
    },

    /* Ignore HTTPS errors (useful for localhost with self-signed certificates) */
    ignoreHTTPSErrors: process.env.IGNORE_HTTPS_ERRORS === 'true',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against tablet viewports */
    // {
    //   name: 'iPad Pro',
    //   use: { ...devices['iPad Pro'] },
    // },
  ],

  /* Output folder for test artifacts */
  outputDir: 'test-results/',
});
