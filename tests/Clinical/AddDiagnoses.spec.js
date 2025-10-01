import { expect, test } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://bahnew.gdobahmni.click/');
  await page.getByRole('link', { name: 'Clinical Service' }).click();
  await page.getByRole('textbox', { name: 'Username *' }).click();
  await page.getByRole('textbox', { name: 'Username *' }).fill('superman');
  await page.getByRole('textbox', { name: 'Password * Enter OTP *' }).click();
  await page
    .getByRole('textbox', { name: 'Password * Enter OTP *' })
    .fill('Admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByLabel('Location *').selectOption('object:30');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('link', { name: ' Clinical' }).click();

  // Step 7: Click on 'New - Active' tab
  await page.waitForLoadState('networkidle');
  await page.locator('//li[@class="tab-item"][1]/a').click();

  // Step 8: Select the first active patient
  await page.locator('//li[@class="active-patient"][1]').click();
  await page.waitForLoadState('networkidle');

  // Step 9: Get all side nav items and print their names
  const sideNavItems = await page
    .locator('//span[@class="cds--side-nav__link-text"]')
    .allTextContents();
  expect(sideNavItems.length).toBeGreaterThan(0);

  console.log('--- Available Patient Dashboard Sections ---');
  sideNavItems.forEach((item) => console.log(item));
  console.log('------------------------------------------');

  await page.getByRole('button', { name: 'New Consultation' }).click();
  await page.getByRole('combobox', { name: 'Search for diagnoses' }).click();
  //search for a diagnosis using ID locator
  await page.locator('#diagnoses-search').fill('Congenital Fusion of Testis');
  await page.getByText('Congenital Fusion of Testis', { exact: true }).click();
  //await page.locator('//ul[@id="downshift-«r5n»-menu"]/li[0]').click();
  //await page.locator('//ul[@id="downshift-«r5n»-menu"]/li[0]').click();

  //Clear the input field before entering the diagnosis
  await page.locator('#diagnoses-search').fill('');
  // Fill the input field with the diagnosis name
  await page.locator('#diagnoses-search').fill('ectopic testis');

  await page.getByRole('option').first().click();

  //Add certainty to the diagnosis
  // Get all the "Certainty" dropdowns that have appeared
  const certaintyDropdowns = await page
    .getByRole('combobox', { name: 'Diagnoses Certainty' })
    .all();
  console.log(`Found ${certaintyDropdowns.length} diagnoses to update.`);

  // Loop through each dropdown and set its value to 'Confirmed'
  for (const dropdown of certaintyDropdowns) {
    await dropdown.click();
    // After clicking the dropdown, the 'Confirmed' option should be visible
    await page.getByRole('option', { name: 'Confirmed' }).click();
  }

  //Add certainty to the diagnosis
  //count the certainity for diagnosis, get the no of diagnosis available
  const certaintyCount = await page
    .locator('//div[@data-testid="selected-item"]')
    .count();
  console.log(`Number of certainty options: ${certaintyCount}`);
  //select the certainity dropdown for each diagnosis
  for (let i = 0; i < certaintyCount; i++) {
    await page
      .locator(`//div[starts-with(@id,'diagnoses-certainty-dropdown-')][${i}]`)
      .getByText('Confirmed')
      .click();
  }

  //wait for the dropdown to appear completely
  //await page.waitForSelector('//ul[@id="downshift-«r5n»-menu"]', { state: 'visible' });
  // Click the first li element under the ul
  //await page.locator('//ul[@id="downshift-«r5n»-menu"]/li[1]').click();
  // get the size of the li elements under the ul with id downshift-«r5n»-menu
  //count the number of li elements under the ul with id downshift-«r5n»-menu
  const liCount = await page
    .locator('//ul[@id="downshift-«r5n»-menu"]/li')
    .count();
  console.log(`Number of li elements: ${liCount}`);
  if (liCount > 0) {
    // Click the first li element if it exists
    await page.locator('//ul[@id="downshift-«r5n»-menu"]/li[1]').click();
  } else {
    console.log('No li elements found under the specified ul.');
  }

  // await page.getByRole('combobox', { name: 'Diagnoses Certainty' }).click();
  // await page.getByTestId('diagnoses-certainty-dropdown-143951AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA').getByText('Confirmed').click();

  // save the consultation
  await page.locator('//button[text()="Done"]').click();

  // Verify that the consultation was saved successfully
  const successMessage = page.getByText('Consultation saved successfully');
  await expect(successMessage).toBeVisible();

  // Pause the script to keep the browser open for inspection

  await page.pause();
});
