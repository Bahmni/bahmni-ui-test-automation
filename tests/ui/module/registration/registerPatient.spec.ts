import { test, expect, request } from '@playwright/test';
import { PageFactory } from '../../../../src/ui/pages/PageFactory';
import { ActionFactory } from '../../../../src/ui/actions/ActionFactory';
import { generatePatientData } from '../../../../test-data/common/patientData';
import { ApiFactory } from '../../../../src/api/ApiFactory';

test.describe('Patient registration tests', { tag: ['@regression'] }, () => {
  const createdPatientIds: string[] = [];

  test.afterEach(async () => {
    if (createdPatientIds.length === 0) return;
    const apiContext = await request.newContext({ ignoreHTTPSErrors: true });
    const api = new ApiFactory(apiContext);
    try {
      for (const id of createdPatientIds) {
        const { body } = await api.patient.search(id);
        const uuid = body.entry?.[0]?.resource.id;
        if (uuid) await api.patient.delete(uuid);
      }
    } finally {
      createdPatientIds.length = 0;
      await apiContext.dispose();
    }
  });

  test('Register and verify patient details', async ({ page }) => {
    const bahmni = new PageFactory(page);
    const actions = new ActionFactory(bahmni);
    const patientData = generatePatientData();

    await actions.auth.loginAsAdmin();
    await bahmni.homePage.navigateToModule(bahmni.homePage.MODULES.REGISTRATION);
    await bahmni.registrationSearchPage.clickCreateNewPatientBtn();

    await bahmni.createPatientPage.fillPatientDetails({
      firstName: patientData.firstName,
      lastName: patientData.lastName,
      gender: patientData.gender,
      dateOfBirth: patientData.dateOfBirth,
      middleName: patientData.middleName,
      phoneNumber: patientData.phoneNumber,
      email: patientData.email,
      address: patientData.address,
    });

    await bahmni.createPatientPage.uploadPhoto('patient-photo.png');
    await bahmni.createPatientPage.savePatient();
    await bahmni.createPatientPage.verifySuccessNotification();

    await expect(page).toHaveURL(/.*registration\/patient\/[a-f0-9-]+/);
    const patientId = await bahmni.createPatientPage.getPatientId();
    createdPatientIds.push(patientId);
    await expect(patientId).toBeTruthy();

    await actions.registration.searchAndOpenPatient(patientId);

    await expect(page).toHaveURL(/.*registration\/patient\/[a-f0-9-]+/);
    await actions.registration.verifyPatientBasicInformation(patientData);
    if (patientData.phoneNumber && patientData.email) {
      await actions.registration.verifyPatientContactInformation(patientData.phoneNumber, patientData.email);
    }
    if (patientData.address) {
      await actions.registration.verifyPatientAddressInformation(patientData.address);
    }
  });

  test.skip('Verify patient relationship', async ({ page }) => {
    const bahmni = new PageFactory(page);
    const actions = new ActionFactory(bahmni);
    const patientData1 = generatePatientData();
    const patientData2 = generatePatientData();

    await actions.auth.loginAsAdmin();
    await bahmni.homePage.navigateToModule(bahmni.homePage.MODULES.REGISTRATION);
    await bahmni.registrationSearchPage.clickCreateNewPatientBtn();

    await bahmni.createPatientPage.fillPatientDetails({
      firstName: patientData1.firstName,
      lastName: patientData1.lastName,
      gender: patientData1.gender,
      dateOfBirth: patientData1.dateOfBirth,
    });

    await bahmni.createPatientPage.savePatient();
    await bahmni.createPatientPage.verifySuccessNotification();
    const patientId1 = await bahmni.createPatientPage.getPatientId();
    createdPatientIds.push(patientId1);

    await bahmni.createPatientPage.navigateToHomePage();
    await bahmni.homePage.navigateToModule(bahmni.homePage.MODULES.REGISTRATION);
    await bahmni.registrationSearchPage.clickCreateNewPatientBtn();

    await bahmni.createPatientPage.fillPatientDetails({
      firstName: patientData2.firstName,
      lastName: patientData2.lastName,
      gender: patientData2.gender,
      dateOfBirth: patientData2.dateOfBirth,
    });

    await bahmni.createPatientPage.addRelationshipForPatient(
      'Father/ Son',
      patientData1.firstName + ' ' + patientData1.lastName
    );
    await bahmni.createPatientPage.savePatient();
    await bahmni.createPatientPage.verifySuccessNotification();
    const patientId2 = await bahmni.createPatientPage.getPatientId();
    createdPatientIds.push(patientId2);

    await actions.registration.verifyPatientRelationship(
      'Father',
      patientData1.firstName + ' ' + patientData1.lastName
    );

    const patient1Page = await bahmni.createPatientPage.clickPatientLink();

    const relType = await patient1Page.getRelationshipType();
    expect(relType?.trim()).toContain('Son');
    const relName = await patient1Page.getRelationshipPatientName();
    expect(relName?.trim()).toContain(patientData2.firstName + ' ' + patientData2.lastName);
  });
});
