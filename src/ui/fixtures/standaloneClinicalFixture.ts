// Test-scoped (not worker-scoped) API clinical setup - each test gets its own fresh patient/visit,
// created and disposed within that single test. Use this instead of apiClinicalFixture/observationFormFixture
// for a test that edits data it must have created itself, so it can't depend on another test having already
// run in the same worker (worker-scoped fixtures share one patient across whichever tests Playwright happens
// to schedule onto that worker, which is not execution-order-guaranteed under fullyParallel).
import { test as base, Page } from '@playwright/test';
import { PageFactory } from '../pages/PageFactory';
import { ActionFactory } from '../actions/ActionFactory';
import { ApiFactory } from '../../api/ApiFactory';
import { createSharedClinicalContext, disposeSharedClinicalContext } from './sharedClinicalContext';

type StandaloneClinicalFixtures = {
  clinicalSetup: {
    bahmni: PageFactory;
    actions: ActionFactory;
    page: Page;
    api: ApiFactory;
    patientUuid: string;
  };
};

export const test = base.extend<StandaloneClinicalFixtures>({
  clinicalSetup: async ({ browser }, use) => {
    const ctx = await createSharedClinicalContext(browser, 'api');
    const { bahmni, actions, page, api, patientUuid } = ctx;
    await use({ bahmni, actions, page, api, patientUuid });
    await disposeSharedClinicalContext(ctx);
  },
});

export { expect } from './expectExtensions';
