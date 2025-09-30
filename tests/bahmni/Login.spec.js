import { expect } from '@playwright/test';
import { test } from '../../fixtures/authFixtures';


test('View change Location after login', async ({
  authenticatedPage,
}) => {
  await authenticatedPage.goto(
    'https://demo.standard.mybahmni.in/bahmni/home/index.html#/loginLocation',
  );
  await expect(authenticatedPage.locator('.reg-header')).toHaveText(
    'Select login location',
  );

  const dropdown = authenticatedPage.locator('#location');
  await dropdown.selectOption('Emergency');
  await authenticatedPage.locator('text="Continue"').click();
});
