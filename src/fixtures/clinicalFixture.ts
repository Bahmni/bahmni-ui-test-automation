import { test as base, expect as baseExpect, BrowserContext } from '@playwright/test';
import { PageFactory } from '../pages/PageFactory';
import { ActionFactory } from '../actions/ActionFactory';
import { generatePatientData, PatientData } from '../../test-data/patientData';
import { Page } from '@playwright/test';

type SharedClinicalContext = {
  context: BrowserContext;
  page: Page;
  bahmni: PageFactory;
  actions: ActionFactory;
  patientData: PatientData;
  patientId: string;
};

type ClinicalFixtures = {
  clinicalSetup: {
    bahmni: PageFactory;
    actions: ActionFactory;
    patientData: PatientData;
    patientId: string;
    page: Page;
  };
  isolatedClinicalSetup: {
    bahmni: PageFactory;
    actions: ActionFactory;
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
      const actions = new ActionFactory(bahmni);
      const patientData = generatePatientData();

      // Login and create patient (only once per worker)
      await actions.auth.loginAsAdmin();
      const patientId = await actions.registration.registerPatientWithMandatoryDetails(patientData);

      // Start OPD visit
      await bahmni.createPatientPage.saveAndStartOPDVisit();
      await page.waitForLoadState('networkidle');

      // Navigate to Clinical module (only once per worker)
      await actions.clinical.navigateToPatientClinical(patientId);

      // Wait for clinical page to load fully
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      // Provide shared context to all tests
      await use({
        context,
        page,
        bahmni,
        actions,
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
    const { page, bahmni, actions, patientData, patientId } = sharedClinicalContext;

    // Ensure we're on the clinical dashboard (not in a consultation)
    const currentUrl = page.url();
    if (currentUrl.includes('/consultation')) {
      await actions.clinical.navigateToPatientClinical(patientId);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    }

    // Provide the setup context to the test
    await use({
      bahmni,
      actions,
      patientData,
      patientId,
      page,
    });

    // No teardown needed - keeping session alive for next test
  },

  // Test-scoped fixture: creates a fresh patient and context per test for full isolation
  isolatedClinicalSetup: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const bahmni = new PageFactory(page);
    const actions = new ActionFactory(bahmni);
    const patientData = generatePatientData();

    await actions.auth.loginAsAdmin();
    const patientId = await actions.registration.registerPatientWithMandatoryDetails(patientData);

    await bahmni.createPatientPage.saveAndStartOPDVisit();
    await page.waitForLoadState('networkidle');

    await actions.clinical.navigateToPatientClinical(patientId);
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    await use({ bahmni, actions, patientData, patientId, page });

    await context.close();
  },
});

export const expect = baseExpect.extend({
  toContainItemMatching(received: string[], expected: string) {
    const match = received.some((item) => item.toLowerCase().includes(expected.toLowerCase()));
    return {
      pass: match,
      message: () =>
        match
          ? `Expected list not to contain item matching "${expected}", but found it in: [${received.join(', ')}]`
          : `Expected list to contain item matching "${expected}", but got: [${received.join(', ')}]`,
    };
  },
});
