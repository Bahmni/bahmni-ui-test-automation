import { test as baseTest } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import POManager from '../pages/bahmni/POManager.js';

export const test = baseTest.extend({
  authenticatedPage: async ({ browser }, use, testInfo) => {
    // Load env variables based on project metadata
    const currentEnv = testInfo.project.metadata?.env || 'dev';
    const envFile = path.resolve(process.cwd(), `.env.${currentEnv}`);
    dotenv.config({ path: envFile });
    const username = process.env.USERMAIL;
    const password = process.env.PASSWORD;

    if (!username || !password) {
      throw new Error('USERNAME or PASSWORD environment variable not set!');
    }
     

    if (!process.env.BASE_URL) {
      throw new Error(`BASE_URL is missing in ${envFile}`);
    }

    const storageFile = path.resolve(
      process.cwd(),
      `storageState.${currentEnv}.json`,
    );
    // Create a fresh context and login
    const context = await browser.newContext();
    const page = await context.newPage();

    const poManager = new POManager(page);
    const loginPage = poManager.getLoginPage();

    await page.goto(process.env.BASE_URL);
    await loginPage.validLogin(username, password);

    // Save fresh storage state
    await context.storageState({ path: storageFile });
    await page.close();

    // Provide a fresh page to the test
    const newPage = await context.newPage();
    await use(newPage);

    await context.close();
  },
});
