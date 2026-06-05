import { test as base, expect as baseExpect, BrowserContext, request } from '@playwright/test';
import { PageFactory } from '../pages/PageFactory';
import { ActionFactory } from '../actions/ActionFactory';
import { generatePatientData, PatientData } from '../../../test-data/common/patientData';
import { ApiFactory } from '../../api/ApiFactory';
import { Page } from '@playwright/test';

type SharedClinicalContext = {
  context: BrowserContext;
  page: Page;
  bahmni: PageFactory;
  actions: ActionFactory;
  patientData: PatientData;
  patientId: string;
  patientUuid: string;
};

type ClinicalFixtures = {
  clinicalSetup: {
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

      // API context shared by setup (UUID lookup) and teardown (patient delete)
      const apiContext = await request.newContext({ ignoreHTTPSErrors: true });
      const api = new ApiFactory(apiContext);

      // Login and create patient (only once per worker)
      await actions.auth.loginAsAdmin();
      const patientId = await actions.registration.registerPatientWithMandatoryDetails(patientData);

      // Start OPD visit
      await bahmni.createPatientPage.saveAndStartOPDVisit();
      await bahmni.createPatientPage.navigateToDashboard();

      // Resolve patient UUID via API — required for teardown and available to tests
      const { body: searchBody } = await api.patient.search(patientId);
      const patientUuid = searchBody.entry?.[0]?.resource.id;
      if (!patientUuid) {
        throw new Error(`Patient not found by ID "${patientId}" — cannot proceed with clinical setup`);
      }

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
        patientUuid,
      });

      // Teardown: delete patient in OpenMRS. Use try/finally so apiContext and
      // browser context are always released, while letting a delete failure
      // propagate and fail the run loudly.
      try {
        await api.patient.delete(patientUuid);
      } finally {
        await apiContext.dispose();
        await context.close();
      }
    },
    { scope: 'worker' },
  ],

  // Test-scoped fixture: uses shared context, ensures we're on clinical page
  clinicalSetup: async ({ sharedClinicalContext }, use) => {
    const { page, bahmni, actions, patientData, patientId } = sharedClinicalContext;

    const currentUrl = page.url();
    const onClinicalDashboard = currentUrl.includes('/clinical/') && !currentUrl.includes('/consultation');
    if (!onClinicalDashboard) {
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
