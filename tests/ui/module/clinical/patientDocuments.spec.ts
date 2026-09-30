import {
  test,
  expect,
  DOCUMENT_IDENTIFIER,
  DOCUMENT_TYPE,
  TOTAL_DOCUMENTS,
} from '../../../../src/ui/fixtures/documentFixture';
import { generatePatientData } from '../../../../test-data/common/patientData';
import { createOversizedFile, removeGeneratedFile } from '../../../../src/utils/testFileGenerator';
import { PageFactory } from '../../../../src/ui/pages/PageFactory';
import { ActionFactory } from '../../../../src/ui/actions/ActionFactory';

const MAX_UPLOAD_SIZE_MB = 5;

// Registration → start OPD visit → Home → Patient Documents → select the patient.
// The standalone patient-documents page depends on navigation state set by this
// flow — a direct URL visit leaves its Documents section blank.
async function openPatientDocumentsForNewPatient(bahmni: PageFactory, actions: ActionFactory): Promise<string> {
  await bahmni.homePage.goto();
  const patientId = await actions.registration.registerPatientWithMandatoryDetails(generatePatientData());
  await bahmni.createPatientPage.saveAndStartOPDVisit();
  await actions.document.openPatientDocumentsForPatient(patientId);
  const visitLabels = await bahmni.patientDocumentsPage.getVisitLabels();
  return visitLabels[0];
}

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

    const visitLabel = await openPatientDocumentsForNewPatient(bahmni, actions);

    await actions.document.uploadDocumentForVisit(visitLabel, uploadFilePath, uploadedDocumentType);
    await actions.document.verifyDocumentDisplayedForVisit(visitLabel, uploadedDocumentType);
    await actions.document.openDocumentAndVerifyViewer(visitLabel, uploadedDocumentType);
  });

  test('Upload two documents together for a visit and see a success toast', async ({ documentSetup }) => {
    const { bahmni, actions } = documentSetup;

    const visitLabel = await openPatientDocumentsForNewPatient(bahmni, actions);

    await actions.document.selectFilesForVisit(visitLabel, [
      'test-data/common/prescription.png',
      'test-data/common/patientHistory.pdf',
    ]);
    await actions.document.verifyPendingDocumentCount(visitLabel, 2);

    await actions.document.saveDocuments();

    await actions.document.verifySuccessToast('2 documents were saved successfully.');
    await actions.document.verifyPendingDocumentCount(visitLabel, 0);
  });

  test('Reject an invalid-format file and an oversized file while accepting a valid one', async ({ documentSetup }) => {
    const { bahmni, actions } = documentSetup;

    const visitLabel = await openPatientDocumentsForNewPatient(bahmni, actions);
    const oversizedFilePath = createOversizedFile(MAX_UPLOAD_SIZE_MB + 1);

    try {
      await actions.document.selectFilesForVisit(visitLabel, [
        'test-data/common/prescription.png',
        'test-data/common/invalid-document.txt',
        oversizedFilePath,
      ]);

      // Only the valid file makes it into the pending list; the other two are rejected client-side.
      await actions.document.verifyErrorToast(
        'Unsupported file type',
        'Supported file types are images, videos and PDF.'
      );
      await actions.document.verifyErrorToast(
        'File too large',
        `File size exceeds the maximum allowed limit of ${MAX_UPLOAD_SIZE_MB}MB.`
      );
      await actions.document.verifyPendingDocumentCount(visitLabel, 1);

      await actions.document.saveDocuments();
      await actions.document.verifySuccessToast('The document was saved successfully.');
    } finally {
      removeGeneratedFile(oversizedFilePath);
    }
  });

  test('Discard a pending document and handle the unsaved-documents confirmation on Back to search', async ({
    documentSetup,
  }) => {
    const { bahmni, actions, page } = documentSetup;

    const visitLabel = await openPatientDocumentsForNewPatient(bahmni, actions);

    await actions.document.selectFilesForVisit(visitLabel, [
      'test-data/common/prescription.png',
      'test-data/common/patient-photo.png',
      'test-data/common/patientHistory.pdf',
    ]);
    await actions.document.verifyPendingDocumentCount(visitLabel, 3);

    await actions.document.discardPendingDocument(visitLabel, 1);
    await actions.document.verifyPendingDocumentCount(visitLabel, 2);

    // Back to search with unsaved documents pending → confirmation dialog → Stay keeps
    // the page and the pending documents untouched.
    await bahmni.patientDocumentsPage.clickBackToSearch();
    await actions.document.verifyUnsavedDocumentsConfirmationVisible();
    await bahmni.patientDocumentsPage.stayOnUnsavedDocuments();
    await actions.document.verifyPendingDocumentCount(visitLabel, 2);

    // Back to search again → confirmation dialog → Leave discards the pending documents
    // and navigates back to patient search.
    await bahmni.patientDocumentsPage.clickBackToSearch();
    await actions.document.verifyUnsavedDocumentsConfirmationVisible();
    await bahmni.patientDocumentsPage.leaveUnsavedDocuments();
    await expect(page.locator('#patientIdentifier')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Patient Document Tests — insufficient privilege', { tag: ['@regression'] }, () => {
  // FrontDesk has module access to Patient Documents (app:document-upload / app:patient-documents)
  // and can register a patient and start a visit, but its role is not granted the FHIR
  // "Add DocumentReference" / "Edit DocumentReference" privileges (see test-data/common/roles.csv —
  // only SuperAdmin has them). Confirmed directly against the backend: fetching existing documents
  // and uploading the raw file both succeed regardless of role, but the final save (a FHIR
  // EncounterBundle transaction containing the DocumentReference) is rejected with 400 and the
  // widget surfaces that as a generic "Bad Request" error — see getFormattedError's non-FHIR
  // fallback in @bahmni/services, which doesn't special-case this OperationOutcome.
  test('User without Add/Edit DocumentReference privilege gets a save-failed toast and keeps the pending document', async ({
    page,
  }) => {
    const bahmni = new PageFactory(page);
    const actions = new ActionFactory(bahmni);

    await actions.auth.loginAsFrontDesk();
    const visitLabel = await openPatientDocumentsForNewPatient(bahmni, actions);

    await actions.document.selectFilesForVisit(visitLabel, ['test-data/common/prescription.png']);
    await actions.document.verifyPendingDocumentCount(visitLabel, 1);

    await actions.document.saveDocuments();

    await actions.document.verifyErrorToast(
      'Save failed',
      'Invalid input parameters. Please check your request and try again.'
    );
    await actions.document.verifyPendingDocumentCount(visitLabel, 1);
  });
});
