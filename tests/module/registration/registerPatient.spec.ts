import { test, expect } from '@playwright/test';
import { PageFactory } from '../../../src/ui/pages/PageFactory';
import { ActionFactory } from '../../../src/ui/actions/ActionFactory';
import { generatePatientData } from '../../../test-data/common/patientData';

test.describe('Patient registration tests', () => {
  test('Register and verify patient details', async ({ page }) => {
    const bahmni = new PageFactory(page);
    const actions = new ActionFactory(bahmni);
    const patientData = generatePatientData();

    await actions.auth.loginAsAdmin();
    await bahmni.homePage.navigateToModule(bahmni.homePage.MODULES.REGISTRATION_NEW);
    await bahmni.registrationSearchPage.clickCreateNewPatientBtn();

    await bahmni.createPatientPage.fillPatientDetails({
      firstName: patientData.firstName,
      lastName: patientData.lastName,
      gender: patientData.gender,
      dateOfBirth: patientData.dateOfBirth,
      middleName: patientData.middleName,
      phoneNumber: patientData.phoneNumber,
      email: patientData.email,
    });

    await bahmni.createPatientPage.uploadPhoto('patient-photo.png');
    await bahmni.createPatientPage.savePatient();
    await bahmni.createPatientPage.verifySuccessNotification();

    await expect(page).toHaveURL(/.*registration\/patient\/[a-f0-9-]+/);
    const patientId = await bahmni.createPatientPage.getPatientId();
    await expect(patientId).toBeTruthy();

    await actions.registration.searchAndOpenPatient(patientId);

    await expect(page).toHaveURL(/.*registration\/patient\/[a-f0-9-]+/);
    await actions.registration.verifyPatientBasicInformation(patientData);
    await actions.registration.verifyPatientContactInformation(patientData.phoneNumber!, patientData.email!);
    await actions.registration.verifyPatientAddressInformation(patientData.address!);
  });

  test('Verify patient relationship', async ({ page }) => {
    const bahmni = new PageFactory(page);
    const actions = new ActionFactory(bahmni);
    const patientData1 = generatePatientData();
    const patientData2 = generatePatientData();

    await actions.auth.loginAsAdmin();
    await bahmni.homePage.navigateToModule(bahmni.homePage.MODULES.REGISTRATION_NEW);
    await bahmni.registrationSearchPage.clickCreateNewPatientBtn();

    await bahmni.createPatientPage.fillPatientDetails({
      firstName: patientData1.firstName,
      lastName: patientData1.lastName,
      gender: patientData1.gender,
      dateOfBirth: patientData1.dateOfBirth,
    });

    await bahmni.createPatientPage.savePatient();
    await bahmni.createPatientPage.verifySuccessNotification();
    await bahmni.createPatientPage.navigateToHomePage();
    await bahmni.homePage.navigateToModule(bahmni.homePage.MODULES.REGISTRATION_NEW);
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
