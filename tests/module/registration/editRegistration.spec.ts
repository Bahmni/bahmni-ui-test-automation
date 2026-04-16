import { test } from '@playwright/test';
import { PageFactory } from '../../../src/pages/PageFactory';
import { ActionFactory } from '../../../src/actions/ActionFactory';
import { generatePatientData } from '../../../test-data/patientData';

test.describe('Edit patient registration tests', () => {
  test('Edit patient and verify', async ({ page }) => {
    const bahmni = new PageFactory(page);
    const actions = new ActionFactory(bahmni);
    const originalData = generatePatientData();
    const editedData = generatePatientData();

    await actions.auth.loginAsAdmin();
    await actions.registration.registerPatient(originalData);
    await bahmni.createPatientPage.verifySuccessNotification();

    await actions.registration.editPatient(editedData);
    await bahmni.createPatientPage.savePatient();
    await bahmni.createPatientPage.verifySuccessNotification();

    await actions.registration.searchAndOpenPatientByName(editedData.firstName, editedData.lastName);

    await actions.registration.verifyPatientBasicInformation(editedData);
    await actions.registration.verifyPatientContactInformation(editedData.phoneNumber, editedData.email);
    await actions.registration.verifyPatientAddressInformation(editedData.address);
  });
});
