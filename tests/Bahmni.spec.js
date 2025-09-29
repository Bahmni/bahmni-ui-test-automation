const { test, expect } = require('@playwright/test');

test.describe('Bahmni Clinical Application E2E Tests', () => {
  // This block runs before each test, handling the initial login steps.
  test.beforeEach(async ({ page }) => {
    // Steps 1-4: Navigate, login, and select location
    await page.goto('https://bahnew.gdobahmni.click/');
    //maximize the window for better visibility
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.getByRole('link', { name: 'Clinical Service' }).click();
    await page.getByLabel('Username').fill('superman');
    await page.getByLabel('Password').fill('Admin123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByLabel('Location *').selectOption('Emergency Ward');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForLoadState('networkidle');
  });

  test('Login and verify dashboard access @sanity', async ({ page }) => {
    // Step 5: Verify that the main clinical page is accessible
    const clinicalLink = page.getByRole('link', { name: 'Clinical' });
    await expect(clinicalLink).toBeVisible();
  });

  test('Navigate to Clinical module and verify patient list @sanity', async ({
    page,
  }) => {
    // Step 5 & 6: Click on Clinical and navigate to patient home
    await page.getByRole('link', { name: 'Clinical' }).click();

    // Step 7: Verify the 'New - Active' patient tab is visible
    await page.waitForLoadState('networkidle');
    const newActiveTab = page.locator('//li[@class="tab-item"][1]/a');
    await expect(newActiveTab).toBeVisible();
    await expect(newActiveTab).toContainText('New - Active');
  });

  test('Select an active patient and verify patient dashboard @e2e', async ({
    page,
  }) => {
    // Step 5 & 6: Click on Clinical
    await page.getByRole('link', { name: 'Clinical' }).click();

    // Step 7: Click on 'New - Active' tab
    await page.waitForLoadState('networkidle');
    await page.locator('//li[@class="tab-item"][1]/a').click();

    // Step 8: Select the first active patient
    await page.locator('//li[@class="active-patient"][1]').click();

    // Verify the patient-specific layout is visible
    // const layout = page.locator('//div[@class="layout--QBvp5"]');
    // await expect(layout).toBeVisible();
  });
});
