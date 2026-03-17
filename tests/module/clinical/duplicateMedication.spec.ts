import { test, expect } from '../../../src/fixtures/clinicalFixture';
import {
  DUPLICATE_MEDICATION_PAIRS,
  DOSAGE_UNITS,
  FREQUENCIES,
  DURATION_UNITS,
  INSTRUCTIONS,
  ROUTES,
} from '../../../test-data/medicationData';
import { faker } from '@faker-js/faker';

test.describe.serial('Duplicate Medication Tests', () => {
  test('Adding an active medication in different dosage in a new consultation shows duplicate error', async ({
    isolatedClinicalSetup,
  }) => {
    const { actions, bahmni, page } = isolatedClinicalSetup;

    const pair = faker.helpers.arrayElement(DUPLICATE_MEDICATION_PAIRS);

    const firstMedication = {
      name: pair.firstDosage,
      dosage: 1,
      dosageUnit: DOSAGE_UNITS.TABLET,
      frequency: FREQUENCIES.TWICE_A_DAY,
      duration: 5,
      durationUnit: DURATION_UNITS.DAYS,
      instructions: INSTRUCTIONS.AFTER_MEALS,
      route: ROUTES.ORAL,
    };

    // Step 1: Add first dosage in consultation and save
    await expect(page).toHaveURL(/.*clinical\/.*/);
    await actions.clinical.addMedicationInConsultation(firstMedication);
    await expect(page).toHaveURL(/.*clinical\/.*(?<!consultation)$/);
    await actions.clinical.verifyMedicationDisplayed(firstMedication);

    // Step 2: Open a new consultation and search for a different dosage of the same drug
    await actions.clinical.searchMedicationInNewConsultation(pair.secondDosage);

    // Step 3: Verify the duplicate medication error message is displayed
    await actions.clinical.verifyDuplicateMedicationError();

    // Cancel the second consultation to restore clean state
    await bahmni.newConsultationPage.cancelConsultation();
    await page.waitForURL(/.*clinical\/.*(?<!consultation)$/, { timeout: 10000 });
  });
});
