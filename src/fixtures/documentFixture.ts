import { test as base, expect } from '@playwright/test';
import { PageFactory } from '../pages/PageFactory';
import { ActionFactory } from '../actions/ActionFactory';
import { generatePatientData, PatientData } from '../../test-data/patientData';
import { DocumentApiHelper } from '../utils/document-api-helper';

type DocumentFixtures = {
  documentSetup: {
    bahmni: PageFactory;
    actions: ActionFactory;
    patientData: PatientData;
    patientId: string;
    page: import('@playwright/test').Page;
  };
};

const DOCUMENT_IDENTIFIER = 'patientImageAndHistory';
const DOCUMENT_TYPE = 'Patient File';
const TOTAL_DOCUMENTS = 2;

const DOCUMENTS_TO_UPLOAD = [
  { fileName: 'PatientHistory', filePath: 'test-data/patientHistory.pdf', fileType: 'pdf', format: 'pdf', contentType: 'application/pdf' },
  { fileName: 'Prescription', filePath: 'test-data/prescription.png', fileType: 'image', format: 'png', contentType: 'image/png' },
];

export const test = base.extend<DocumentFixtures>({
  documentSetup: async ({ browser, playwright }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const bahmni = new PageFactory(page);
    const actions = new ActionFactory(bahmni);
    const patientData = generatePatientData();

    await actions.auth.loginAsAdmin();
    const patientId = await actions.registration.registerPatientWithMandatoryDetails(patientData);
    await bahmni.createPatientPage.saveAndStartOPDVisit();
    await page.waitForLoadState('networkidle');

    const apiContext = await playwright.request.newContext();
    const documentApi = new DocumentApiHelper(apiContext);
    const patientUuid = await getPatientUuid(apiContext, patientId);

    await documentApi.uploadAndRegisterDocuments(patientUuid, DOCUMENTS_TO_UPLOAD);

    await actions.clinical.navigateToPatientClinical(patientId);
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    await use({ bahmni, actions, patientData, patientId, page });

    await apiContext.dispose();
    await context.close();
  },
});

async function getPatientUuid(
  apiContext: import('@playwright/test').APIRequestContext,
  patientId: string
): Promise<string> {
  const { config } = await import('../config/env.config');
  const { username, password } = config.users.admin;
  const encoded = Buffer.from(`${username}:${password}`).toString('base64');

  const response = await apiContext.get(`${config.baseUrl}/openmrs/ws/rest/v1/patient?q=${patientId}&v=default`, {
    headers: { Authorization: `Basic ${encoded}` },
  });
  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`Patient not found with ID: ${patientId}`);
  }
  return data.results[0].uuid;
}

export { expect };
export { DOCUMENT_IDENTIFIER, DOCUMENT_TYPE, TOTAL_DOCUMENTS };
