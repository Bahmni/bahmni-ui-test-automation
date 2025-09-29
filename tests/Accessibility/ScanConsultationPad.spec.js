const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default; // 1

test.describe('homepage', () => {
  // 2
  test('navigation menu should not have automatically detectable accessibility violations', async ({
    page,
  }) => {
    await page.goto('https://bahnew.gdobahmni.click/'); //3
    //maximize the browser window
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.getByRole('link', { name: 'Clinical Service' }).click();
    await page.getByRole('textbox', { name: 'Username *' }).click();
    await page.getByRole('textbox', { name: 'Username *' }).fill('superman');
    await page.getByRole('textbox', { name: 'Username *' }).press('Tab');
    await page
      .getByRole('textbox', { name: 'Password * Enter OTP *' })
      .fill('Admin123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByLabel('Location *').selectOption('Emergency Ward');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('link', { name: ' Clinical' }).click();
    //await page.getByRole('link', { name: 'New - Active (1)' }).click();
    //await page.getByRole('img').click();
    page.click('//li[@class="tab-item"][1]/a');
    page.click('//li[@class="active-patient"][1]');

    //await page.goto('https://bahnew.gdobahmni.click/bahmni-new/clinical/58493859-63f7-48b6-bd0b-698d5a119a21', { waitUntil: 'networkidle' });

    //Configuring axe to scan a specific part of a page
    await page.locator('//div[@class="layout--QBvp5"]').waitFor();

    await page.click('//button[text()="New Consultation"]');

    //await page.locator('//div[@class="actionArea--SMp9u"]').waitFor();
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('.actionArea--SMp9u')
      .analyze();

    const size = accessibilityScanResults.violations;
    console.log('Size of the violation array is: ' + size);
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
