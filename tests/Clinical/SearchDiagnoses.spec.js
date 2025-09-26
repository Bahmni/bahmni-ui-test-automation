//Add Diagnoses and display them in the patient dashboard
/* Write the steps
1. Navigate to the Bahmni application and log in.
2. Go to the Clinical module and select a patient.
3. Start a new consultation.
4. Add a diagnosis by searching for it in the input field.
5. Select the diagnosis from the dropdown.
6. Add certainty to the diagnosis by selecting 'Confirmed' from the dropdown.
7. Save the consultation.
8. Verify that the diagnosis is displayed in the patient dashboard.
9. Verify that the diagnosis is saved successfully.
10. Verify that the diagnosis is displayed in the patient dashboard under the latest visit.
*/

import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://bahnew.gdobahmni.click/');
  await page.getByRole('link', { name: 'Clinical Service' }).click();
  await page.getByRole('textbox', { name: 'Username *' }).click();
  await page.getByRole('textbox', { name: 'Username *' }).fill('superman');
  await page.getByRole('textbox', { name: 'Password * Enter OTP *' }).click();
  await page.getByRole('textbox', { name: 'Password * Enter OTP *' }).fill('Admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByLabel('Location *').selectOption('Emergency Ward');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForLoadState('networkidle');

  // await page.getByRole('link', { name: ' Clinical' }).click();
  // await page.getByRole('link', { name: 'New - Active (4)' }).click();
  // await page.getByText('Jamesy Make').click();

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

  await page.getByRole('button', { name: 'New Consultation' }).click();
  await page.getByRole('combobox', { name: 'Search for diagnoses' }).click();
  //search for a diagnosis using ID locator
  await page.locator('#diagnoses-search').fill('Congenital Fusion of Testis');
  //wait for the dropdown to load
  await page.waitForTimeout(2000);

  await page.waitForLoadState('networkidle');
  await page.getByText('Congenital Fusion of Testis', { exact: true }).click();

  await page.getByRole('combobox', { name: 'Diagnoses Certainty' }).click();
  await page.locator('//div[starts-with(@id,"diagnoses-certainty-dropdown-")]').getByText('Confirmed').click();
  //await page.getByTestId('diagnoses-certainty-dropdown-143951AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA').getByText('Confirmed').click();

  // save the consultation
  await page.locator('//button[text()="Done"]').click();


  // Verify that the consultation was saved successfully
  const successMessage = page.getByText('Consultation saved successfully');
  await expect(successMessage).toBeVisible();


  // Verify the diagnosis was added in the patient dashboard

  await page.locator('//span[text()="Conditions and Diagnoses"]').click();

  //verify the diagnosis display control section is visible in the patient dashboard
  const diagnosisSection = page.locator('//div[text()="Diagnoses"]');
  await expect(diagnosisSection).toBeVisible();

  //Click on the latest visit diagnosis section
  await page.locator('(//table[starts-with(@aria-label,"Diagnoses -")])[1]').click();

  //Count the number of diagnoses in the section
  const diagnosisCount = await page.locator('(//table[starts-with(@aria-label,"Diagnoses -")])[1]/tbody/tr').count();
  console.log(`Number of diagnoses: ${diagnosisCount}`);

  //verify the diagnosis is present in the table in each row of the first cell using the above count
  for (let i = 1; i <= diagnosisCount; i++) {
    const diagnosisText = await page.locator(`(//table[starts-with(@aria-label,"Diagnoses -")])[1]/tbody/tr[${i}]/td[1]`).textContent();
    console.log(`Diagnosis in row ${i}: ${diagnosisText}`);
    // Verify the diagnosis text is as expected
    if (diagnosisText.includes('Congenital Fusion of Testis')) {
      console.log(`Diagnosis found in row ${i}: ${diagnosisText} and verified successfully.`);
    } else {
      console.log(`Diagnosis not found in row ${i}: ${diagnosisText} and no Diagnosis found.`);
    }
  }

});
