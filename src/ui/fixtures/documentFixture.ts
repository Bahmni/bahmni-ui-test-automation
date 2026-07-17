// Test-scoped fixture: API patient + pre-uploaded documents, uploaded before dashboard nav so the documents widget sees them on first render.
import { test as base, Page } from '@playwright/test';
import { PageFactory } from '../pages/PageFactory';
import { ActionFactory } from '../actions/ActionFactory';
import { DocumentApiHelper } from '../../utils/document-api-helper';
import { createSharedClinicalContext, disposeSharedClinicalContext } from './sharedClinicalContext';

type DocumentFixtures = {
  documentSetup: {
    bahmni: PageFactory;
    actions: ActionFactory;
    page: Page;
    patientUuid: string;
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
    const ctx = await createSharedClinicalContext(browser, 'api', async ({ apiContext, patientUuid }) => {
      const documentApi = new DocumentApiHelper(apiContext);
      await documentApi.uploadAndRegisterDocuments(patientUuid, DOCUMENTS_TO_UPLOAD);
    });

    await use({ bahmni: ctx.bahmni, actions: ctx.actions, page: ctx.page, patientUuid: ctx.patientUuid });

    await disposeSharedClinicalContext(ctx);
  },
});

export { expect } from './expectExtensions';
export { DOCUMENT_IDENTIFIER, DOCUMENT_TYPE, TOTAL_DOCUMENTS };
