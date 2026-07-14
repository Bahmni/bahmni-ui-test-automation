// Worker-scoped fixture with UI-based patient setup — one patient per worker, reused across every test.
import { test as base, Page } from '@playwright/test';
import { PageFactory } from '../pages/PageFactory';
import { ActionFactory } from '../actions/ActionFactory';
import {
  SharedClinicalContext,
  createSharedClinicalContext,
  disposeSharedClinicalContext,
  ensureOnClinicalDashboard,
} from './sharedClinicalContext';

type ClinicalFixtures = {
  clinicalSetup: {
    bahmni: PageFactory;
    actions: ActionFactory;
    page: Page;
  };
};

type WorkerFixtures = {
  sharedClinicalContext: SharedClinicalContext;
};

export const test = base.extend<ClinicalFixtures, WorkerFixtures>({
  sharedClinicalContext: [
    async ({ browser }, use) => {
      const ctx = await createSharedClinicalContext(browser, 'ui');
      await use(ctx);
      await disposeSharedClinicalContext(ctx);
    },
    { scope: 'worker' },
  ],

  clinicalSetup: async ({ sharedClinicalContext }, use) => {
    await ensureOnClinicalDashboard(sharedClinicalContext);
    const { bahmni, actions, page } = sharedClinicalContext;
    await use({ bahmni, actions, page });
  },
});

export { expect } from './expectExtensions';
