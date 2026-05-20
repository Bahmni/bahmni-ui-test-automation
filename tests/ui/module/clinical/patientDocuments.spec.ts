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
});
