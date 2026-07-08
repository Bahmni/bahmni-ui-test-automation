import { test as base, expect, request } from '@playwright/test';
import { PageFactory } from '../pages/PageFactory';
import { ActionFactory } from '../actions/ActionFactory';
import { DocumentApiHelper } from '../../utils/document-api-helper';
import { ApiFactory } from '../../api/ApiFactory';
import { config } from '../../config/env.config';
import { setupConsultationContext, teardownConsultationContext } from '../../api/helpers/consultationSetup';

type DocumentFixtures = {
  documentSetup: {
    bahmni: PageFactory;
    actions: ActionFactory;
    page: import('@playwright/test').Page;
  };
};

const DOCUMENT_IDENTIFIER = 'patientImageAndHistory';
const DOCUMENT_TYPE = 'Patient File';
const TOTAL_DOCUMENTS = 2;

const DOCUMENTS_TO_UPLOAD = [
  {
    fileName: 'PatientHistory',
    filePath: 'test-data/common/patientHistory.pdf',
    fileType: 'pdf',
    format: 'pdf',
    contentType: 'application/pdf',
  },
  {
    fileName: 'Prescription',
    filePath: 'test-data/common/prescription.png',
    fileType: 'image',
    format: 'png',
    contentType: 'image/png',
  },
];

export const test = base.extend<DocumentFixtures>({
  documentSetup: async ({ browser }, use) => {
    const apiContext = await request.newContext({ ignoreHTTPSErrors: true });
    const api = new ApiFactory(apiContext);

    const consultationCtx = await setupConsultationContext(api);
    const { patientUuid } = consultationCtx;

    const documentApi = new DocumentApiHelper(apiContext);
    await documentApi.uploadAndRegisterDocuments(patientUuid, DOCUMENTS_TO_UPLOAD);

    const context = await browser.newContext();
    const page = await context.newPage();
    const bahmni = new PageFactory(page);
    const actions = new ActionFactory(bahmni);

    await actions.auth.loginAsAdmin();
    await page.goto(`${config.baseUrl}/bahmni-v2/clinical/${patientUuid}`);
    await page.waitForLoadState('networkidle', { timeout: 20000 });

    await use({ bahmni, actions, page });

    try {
      await teardownConsultationContext(api, consultationCtx);
    } finally {
      await apiContext.dispose();
      await context.close();
    }
  },
});

export { expect };
export { DOCUMENT_IDENTIFIER, DOCUMENT_TYPE, TOTAL_DOCUMENTS };
