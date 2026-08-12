import { test as base, Page } from '@playwright/test';
import { PageFactory } from '../pages/PageFactory';
import { ActionFactory } from '../actions/ActionFactory';
import { ApiFactory } from '../../api/ApiFactory';
import { config } from '../../config/env.config';
import {
  SharedClinicalContext,
  createSharedClinicalContext,
  disposeSharedClinicalContext,
  ensureOnClinicalDashboard,
} from './sharedClinicalContext';

type ObservationFormFixtures = {
  clinicalSetup: {
    bahmni: PageFactory;
    actions: ActionFactory;
    page: Page;
    api: ApiFactory;
    patientUuid: string;
  };
};

type WorkerFixtures = {
  sharedObservationFormContext: SharedClinicalContext;
};

export const test = base.extend<ObservationFormFixtures, WorkerFixtures>({
  sharedObservationFormContext: [
    async ({ browser }, use) => {
      const ctx = await createSharedClinicalContext(browser, 'api');
      await ctx.actions.observation.ensureFitnessEvaluationFormPublished();
      await ctx.page.goto(`${config.baseUrl}/bahmni-v2/clinical/${ctx.patientUuid}`);
      await ctx.page.waitForLoadState('networkidle');

      await use(ctx);
      await disposeSharedClinicalContext(ctx);
    },
    { scope: 'worker' },
  ],

  clinicalSetup: async ({ sharedObservationFormContext }, use) => {
    await ensureOnClinicalDashboard(sharedObservationFormContext);
    const { bahmni, actions, page, api, patientUuid } = sharedObservationFormContext;
    await use({ bahmni, actions, page, api, patientUuid });
  },
});

export { expect } from './expectExtensions';
