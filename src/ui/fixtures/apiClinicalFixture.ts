import { test as base, expect as baseExpect, BrowserContext, request } from '@playwright/test';
import { Page } from '@playwright/test';
import { PageFactory } from '../pages/PageFactory';
import { ActionFactory } from '../actions/ActionFactory';
import { ApiFactory } from '../../api/ApiFactory';
import {
  ConsultationContext,
  setupConsultationContext,
  teardownConsultationContext,
} from '../../api/helpers/consultationSetup';
import { config } from '../../config/env.config';
import { PatientData, generatePatientData } from '../../../test-data/common/patientData';

type SharedApiClinicalContext = {
  context: BrowserContext;
  page: Page;
  bahmni: PageFactory;
  actions: ActionFactory;
  patientUuid: string;
  consultationCtx: ConsultationContext;
};

type ApiClinicalFixtures = {
  clinicalSetup: {
    bahmni: PageFactory;
    actions: ActionFactory;
    page: Page;
    patientId: string;
    patientData: PatientData;
  };
};

type WorkerFixtures = {
  sharedApiClinicalContext: SharedApiClinicalContext;
};

export const test = base.extend<ApiClinicalFixtures, WorkerFixtures>({
  sharedApiClinicalContext: [
    async ({ browser }, use) => {
      const apiContext = await request.newContext({ ignoreHTTPSErrors: true });
      const api = new ApiFactory(apiContext);

      const consultationCtx = await setupConsultationContext(api);
      const { patientUuid } = consultationCtx;

      const context = await browser.newContext();
      const page = await context.newPage();
      const bahmni = new PageFactory(page);
      const actions = new ActionFactory(bahmni);

      await actions.auth.loginAsAdmin();
      await page.goto(`${config.baseUrl}/bahmni-v2/clinical/${patientUuid}`);
      await page.waitForLoadState('networkidle', { timeout: 20000 });

      await use({ context, page, bahmni, actions, patientUuid, consultationCtx });

      await teardownConsultationContext(api, consultationCtx);
      await apiContext.dispose();
      await context.close();
    },
    { scope: 'worker' },
  ],

  clinicalSetup: async ({ sharedApiClinicalContext }, use) => {
    const { page, bahmni, actions, patientUuid } = sharedApiClinicalContext;

    const currentUrl = page.url();
    const onClinicalDashboard = currentUrl.includes('/clinical/') && !currentUrl.includes('/consultation');
    if (!onClinicalDashboard) {
      await page.goto(`${config.baseUrl}/bahmni-v2/clinical/${patientUuid}`);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    }

    await use({
      bahmni,
      actions,
      page,
      patientId: patientUuid,
      patientData: generatePatientData(),
    });
  },
});

export const expect = baseExpect;
