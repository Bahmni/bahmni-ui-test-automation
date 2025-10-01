import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('homepage', () => {
  // 2
  test('should not have any automatically detectable WCAG A or AA violations', async ({
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
    // await page.getByRole('link', { name: 'New - Active (1)' }).click();

    // await page.getByRole('img').click();
    page.click('//li[@class="tab-item"][1]/a');
    page.click('//li[@class="active-patient"][1]');

    //Scanning for WCAG violations
    await page.locator('//div[@class="layout--QBvp5"]').waitFor();
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
