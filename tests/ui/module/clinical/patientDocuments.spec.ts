import {
  test,
  expect,
  DOCUMENT_IDENTIFIER,
  DOCUMENT_TYPE,
  TOTAL_DOCUMENTS,
} from '../../../../src/ui/fixtures/documentFixture';
import { generatePatientData } from '../../../../test-data/common/patientData';

test.describe('Patient Document Tests', { tag: ['@regression'] }, () => {
  test('View uploaded patient documents in clinical dashboard', async ({ documentSetup }) => {
    const { bahmni, page } = documentSetup;

    await expect(page).toHaveURL(/.*clinical\/.*/);
    await bahmni.patientDocumentsPage.verifyDocumentDisplayed(DOCUMENT_IDENTIFIER, DOCUMENT_TYPE);
    await bahmni.patientDocumentsPage.openAttachment(DOCUMENT_IDENTIFIER);
    await bahmni.patientDocumentsPage.verifyAllAttachmentsDisplayed(TOTAL_DOCUMENTS);
  });

  test('Upload a document via the standalone patient-documents page and view it', async ({ documentSetup }) => {
    const { bahmni, actions } = documentSetup;
    const uploadFilePath = 'test-data/common/prescription.png';
    const uploadedDocumentType = 'Prescription';

    // Registration → start OPD visit → Home → Patient Documents → select the patient.
    // The standalone patient-documents page depends on navigation state set by this
    // flow — a direct URL visit leaves its Documents section blank.
    await bahmni.homePage.goto();
    const patientData = generatePatientData();
    const patientId = await actions.registration.registerPatientWithMandatoryDetails(patientData);
    await bahmni.createPatientPage.saveAndStartOPDVisit();
    await actions.document.openPatientDocumentsForPatient(patientId);

    const visitLabels = await bahmni.patientDocumentsPage.getVisitLabels();
    const visitLabel = visitLabels[0];

    await actions.document.uploadDocumentForVisit(visitLabel, uploadFilePath, uploadedDocumentType);
    await actions.document.verifyDocumentDisplayedForVisit(visitLabel, uploadedDocumentType);
    await actions.document.openDocumentAndVerifyViewer(visitLabel, uploadedDocumentType);
  });
});
