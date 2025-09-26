const { test, expect } = require('@playwright/test');

test.describe('Bahmni Clinical Application E2E Tests', () => {
  // This block runs before each test, handling the initial login steps.
  test.beforeEach(async ({ page }) => {
    // Steps 1-4: Navigate, login, and select location
    await page.goto('https://bahnew.gdobahmni.click/');
    //Maximize  the window for better visibility
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.getByRole('link', { name: 'Clinical Service' }).click();
    await page.getByLabel('Username').fill('superman');
    await page.getByLabel('Password').fill('Admin123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByLabel('Location *').selectOption('Emergency Ward');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForLoadState('networkidle');
  });

  test('Full E2E flow to print patient navigation sections @e2e', async ({ page }) => {
    // Step 5 & 6: Click on Clinical
    await page.getByRole('link', { name: 'Clinical' }).click();

    // Step 7: Click on 'New - Active' tab
    await page.waitForLoadState('networkidle');
    await page.locator('//li[@class="tab-item"][1]/a').click();

    // Step 8: Select the first active patient
    await page.locator('//li[@class="active-patient"][1]').click();
    await page.waitForLoadState('networkidle');

    // Step 9: Get all side nav items and print their names
    const sideNavItems = await page.locator('//span[@class="cds--side-nav__link-text"]').allTextContents();
    expect(sideNavItems.length).toBeGreaterThan(0);
    
    console.log('--- Available Patient Dashboard Sections ---');
    sideNavItems.forEach(item => console.log(item));
    console.log('------------------------------------------');


    // // Step 10: Click on 'New Consultation'
    // await page.getByRole('link', { name: 'New Consultation' }).click(); 
    // await page.waitForLoadState('networkidle');
    
    


  });
});