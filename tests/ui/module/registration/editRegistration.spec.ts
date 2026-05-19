import { test, request } from '@playwright/test';
import { PageFactory } from '../../../../src/ui/pages/PageFactory';
import { ActionFactory } from '../../../../src/ui/actions/ActionFactory';
import { generatePatientData } from '../../../../test-data/common/patientData';
import { ApiFactory } from '../../../../src/api/ApiFactory';

test.describe('Edit patient registration tests', () => {
  const createdPatientIds: string[] = [];

  test.afterEach(async () => {
    if (createdPatientIds.length === 0) return;
    const apiContext = await request.newContext({ ignoreHTTPSErrors: true });
    const api = new ApiFactory(apiContext);
    try {
      for (const id of createdPatientIds) {
        const { body } = await api.patient.search(id);
        const uuid = body.results[0]?.uuid;
        if (uuid) await api.patient.delete(uuid);
      }
    } finally {
      createdPatientIds.length = 0;
      await apiContext.dispose();
    }
  });

  test('Edit patient and verify', async ({ page }) => {
    const bahmni = new PageFactory(page);
    const actions = new ActionFactory(bahmni);
    const originalData = generatePatientData();
    const editedData = generatePatientData();

    await actions.auth.loginAsAdmin();
    const patientId = await actions.registration.registerPatient(originalData);
    createdPatientIds.push(patientId);
    await bahmni.createPatientPage.verifySuccessNotification();

    await actions.registration.editPatient(editedData);
    await bahmni.createPatientPage.savePatient();
    await bahmni.createPatientPage.verifySuccessNotification();

    await actions.registration.searchAndOpenPatientByName(editedData.firstName, editedData.lastName);

    await actions.registration.verifyPatientBasicInformation(editedData);
    if (editedData.phoneNumber && editedData.email) {
      await actions.registration.verifyPatientContactInformation(editedData.phoneNumber, editedData.email);
    }
    if (editedData.address) {
      await actions.registration.verifyPatientAddressInformation(editedData.address);
    }
  });
});
