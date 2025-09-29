import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('Accessibility test for example.com', async ({ page }) => {
  // Navigate to the website
  // await page.goto('https://example.com');
  await page.goto(
    'https://bahnew.gdobahmni.click/bahmni/home/index.html#/login',
  );

  // Run Axe accessibility analysis
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

  // Log the results
  console.log('Accessibility Violations:', accessibilityScanResults.violations);

  // Assert that there are no violations
  expect(accessibilityScanResults.violations).toEqual([]);
});
