// Worker-scoped fixture with API-based patient setup — skips the UI registration form for specs that don't exercise it.
import { test as base, Page } from '@playwright/test';
import { PageFactory } from '../pages/PageFactory';
import { ActionFactory } from '../actions/ActionFactory';
import {
  SharedClinicalContext,
  createSharedClinicalContext,
  disposeSharedClinicalContext,
  ensureOnClinicalDashboard,
} from './sharedClinicalContext';

type ApiClinicalFixtures = {
  clinicalSetup: {
    bahmni: PageFactory;
    actions: ActionFactory;
    page: Page;
  };
};

type WorkerFixtures = {
  sharedApiClinicalContext: SharedClinicalContext;
};

export const test = base.extend<ApiClinicalFixtures, WorkerFixtures>({
  sharedApiClinicalContext: [
    async ({ browser }, use) => {
      const ctx = await createSharedClinicalContext(browser, 'api');
      await use(ctx);
      await disposeSharedClinicalContext(ctx);
    },
    { scope: 'worker' },
  ],

  clinicalSetup: async ({ sharedApiClinicalContext }, use) => {
    await ensureOnClinicalDashboard(sharedApiClinicalContext);
    const { bahmni, actions, page } = sharedApiClinicalContext;
    await use({ bahmni, actions, page });
  },
});

export { expect } from './expectExtensions';
