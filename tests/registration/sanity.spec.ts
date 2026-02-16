import { test, expect } from '@playwright/test';
import { PageFactory } from '../../src/pages/PageFactory';
import { config } from '../../src/config/env.config';
import { generatePatientData } from '../../test-data/patientData';

test.describe('Bahmni sanity Tests', () => {
  test('Register and verify patient details', async ({ page }) => {
    const bahmni = new PageFactory(page);
    const adminUser = config.getUser('admin');
    const patientData = generatePatientData();

    await bahmni.loginPage.goto();
    await bahmni.loginPage.login(adminUser.username, adminUser.password);
    await bahmni.locationPage.selectLocation(config.defaults.location);
    await bahmni.homePage.navigateToModule(bahmni.homePage.MODULES.REGISTRATION_NEW);
    await bahmni.registrationSearchPage.clickCreateNewPatientBtn();

    await bahmni.createPatientPage.createPatient({
      firstName: patientData.firstName,
      lastName: patientData.lastName,
      gender: patientData.gender,
      dateOfBirth: patientData.dateOfBirth,
      middleName: patientData.middleName,
      phoneNumber: patientData.phoneNumber,
      email: patientData.email,
    });

    await bahmni.createPatientPage.uploadPhoto('patient-photo.png');

    await bahmni.createPatientPage.fillAddressInformation(patientData.address);

    await bahmni.createPatientPage.savePatient();

    await expect(page).toHaveURL(/.*registration\/patient\/[a-f0-9-]+/);

    // Capture the generated patient ID
    const patientId = await bahmni.createPatientPage.getPatientId();
    await expect(patientId).toBeTruthy();

    await bahmni.createPatientPage.clickSearchPatient();
    await bahmni.registrationSearchPage.searchAndOpenPatientById(patientId);

    await expect(page).toHaveURL(/.*registration\/patient\/[a-f0-9-]+/);

    await bahmni.createPatientPage.verifyBasicInformation(patientData);
    await bahmni.createPatientPage.verifyContactInformation(patientData.phoneNumber, patientData.email);
    await bahmni.createPatientPage.verifyAddressInformation(patientData.address);
  });

  test('Verify patient relationship', async ({ page }) => {
    const bahmni = new PageFactory(page);
    const adminUser = config.getUser('admin');
    const patientData1 = generatePatientData();
    const patientData2 = generatePatientData();

    await bahmni.loginPage.goto();
    await bahmni.loginPage.login(adminUser.username, adminUser.password);
    await bahmni.locationPage.selectLocation(config.defaults.location);
    await bahmni.homePage.navigateToModule(bahmni.homePage.MODULES.REGISTRATION_NEW);
    await bahmni.registrationSearchPage.clickCreateNewPatientBtn();

    await bahmni.createPatientPage.createPatient({
      firstName: patientData1.firstName,
      lastName: patientData1.lastName,
      gender: patientData1.gender,
      dateOfBirth: patientData1.dateOfBirth,
    });

    await bahmni.createPatientPage.savePatient();
    await bahmni.createPatientPage.navigateToHomePage();
    await bahmni.homePage.navigateToModule(bahmni.homePage.MODULES.REGISTRATION_NEW);
    await bahmni.registrationSearchPage.clickCreateNewPatientBtn();

    await bahmni.createPatientPage.createPatient({
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

    await bahmni.createPatientPage.verifyRelationship('Father', patientData1.firstName + ' ' + patientData1.lastName);

    // Click patient link which opens in new tab and returns new page instance
    const patient1Page = await bahmni.createPatientPage.clickPatientLink();

    // Verify relationship on the opened patient's record (new tab)
    await patient1Page.verifyRelationship('Son', patientData2.firstName + ' ' + patientData2.lastName);
  });
});
