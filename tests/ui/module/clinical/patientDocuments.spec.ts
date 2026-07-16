import {
  test,
  expect,
  DOCUMENT_IDENTIFIER,
  DOCUMENT_TYPE,
  TOTAL_DOCUMENTS,
} from '../../../../src/ui/fixtures/documentFixture';

test.describe('Patient Document Tests', { tag: ['@regression'] }, () => {
  test('View uploaded patient documents in clinical dashboard', async ({ documentSetup }) => {
    const { bahmni, page } = documentSetup;

    await expect(page).toHaveURL(/.*clinical\/.*/);
    await bahmni.patientDocumentsPage.verifyDocumentDisplayed(DOCUMENT_IDENTIFIER, DOCUMENT_TYPE);
    await bahmni.patientDocumentsPage.openAttachment(DOCUMENT_IDENTIFIER);
    await bahmni.patientDocumentsPage.verifyAllAttachmentsDisplayed(TOTAL_DOCUMENTS);
  });

  test('Upload a document via the standalone patient-documents page and view it', async ({ documentSetup }) => {
    const { bahmni, actions, page, patientUuid } = documentSetup;
    const uploadFilePath = 'test-data/common/prescription.png';
    const uploadedDocumentType = 'Prescription';

    await actions.document.navigateToPatientDocumentsPage(patientUuid);
    await expect(page).toHaveURL(new RegExp(`patient-documents/${patientUuid}`));

    const visitLabels = await bahmni.patientDocumentsPage.getVisitLabels();
    const visitLabel = visitLabels[0];

    await actions.document.uploadDocumentForVisit(visitLabel, uploadFilePath);
    await actions.document.verifyDocumentDisplayedForVisit(visitLabel, uploadedDocumentType);
    await actions.document.openDocumentAndVerifyViewer(visitLabel, uploadedDocumentType);
  });
});
