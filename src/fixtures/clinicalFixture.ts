import { test as base, BrowserContext } from '@playwright/test';
import { PageFactory } from '../pages/PageFactory';
import { config } from '../config/env.config';
import { generatePatientData, PatientData } from '../../test-data/patientData';
import { Page } from '@playwright/test';

type SharedClinicalContext = {
  context: BrowserContext;
  page: Page;
  bahmni: PageFactory;
  patientData: PatientData;
  patientId: string;
};

type ClinicalFixtures = {
  clinicalSetup: {
    bahmni: PageFactory;
    patientData: PatientData;
    patientId: string;
    page: Page;
  };
};

type WorkerFixtures = {
  sharedClinicalContext: SharedClinicalContext;
};

/**
 * Clinical test fixture with shared patient and session across all tests in a worker
 *
 * Two fixtures:
 * 1. sharedClinicalContext (worker-scoped): Creates patient once, logs in once, maintains session
 * 2. clinicalSetup (test-scoped): Uses the shared context, ensures we're on clinical page
 *
 * Use with test.describe.serial() for maximum efficiency - login happens once for all tests
 */
export const test = base.extend<ClinicalFixtures, WorkerFixtures>({
  // Worker-scoped fixture: creates patient once per worker and maintains the session
  sharedClinicalContext: [
    async ({ browser }, use) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      const bahmni = new PageFactory(page);
      const adminUser = config.getUser('admin');
      const patientData = generatePatientData();

      // Login and navigate to registration (only once!)
      await bahmni.loginPage.goto();
      await bahmni.loginPage.login(adminUser.username, adminUser.password);
      await bahmni.locationPage.selectLocation(config.defaults.location);
      await bahmni.homePage.navigateToModule(bahmni.homePage.MODULES.REGISTRATION_NEW);
      await bahmni.registrationSearchPage.clickCreateNewPatientBtn();

      // Create patient with basic information
      await bahmni.createPatientPage.createPatient({
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        gender: patientData.gender,
        dateOfBirth: patientData.dateOfBirth,
        middleName: patientData.middleName,
      });

      // Save patient
      await bahmni.createPatientPage.savePatient();

      // Get the patient ID
      await page.waitForURL(/.*registration\/patient\/[a-f0-9-]+/);
      const patientId = await bahmni.createPatientPage.getPatientId();

      // Start OPD visit
      await bahmni.createPatientPage.saveAndStartOPDVisit();
      await page.waitForLoadState('networkidle');

      // Navigate to Clinical module (only once!)
      await bahmni.createPatientPage.navigateToHomePage();
      await bahmni.homePage.navigateToModule(bahmni.homePage.MODULES.CLINICAL);

      // Select new-active tab and click on patient
      await bahmni.activePatientsPage.selectTab('new-active');
      await bahmni.activePatientsPage.waitForPatientList();
      await bahmni.activePatientsPage.selectPatientById(patientId);

      // Wait for clinical page to load fully
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      // Provide shared context to all tests
      await use({
        context,
        page,
        bahmni,
        patientData,
        patientId,
      });

      // Cleanup: close the context after all tests
      await context.close();
    },
    { scope: 'worker' },
  ],

  // Test-scoped fixture: uses shared context, ensures we're on clinical page
  clinicalSetup: async ({ sharedClinicalContext }, use) => {
    const { page, bahmni, patientData, patientId } = sharedClinicalContext;

    // Ensure we're on the clinical dashboard (not in a consultation)
    const currentUrl = page.url();
    if (currentUrl.includes('/consultation')) {
      // If we're in a consultation, navigate back to clinical dashboard
      await bahmni.createPatientPage.navigateToHomePage();
      await bahmni.homePage.navigateToModule(bahmni.homePage.MODULES.CLINICAL);
      await bahmni.activePatientsPage.selectTab('new-active');
      await bahmni.activePatientsPage.waitForPatientList();
      await bahmni.activePatientsPage.selectPatientById(patientId);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    }

    // Provide the setup context to the test
    await use({
      bahmni,
      patientData,
      patientId,
      page,
    });

    // No teardown needed - keeping session alive for next test
  },
});

export { expect } from '@playwright/test';
