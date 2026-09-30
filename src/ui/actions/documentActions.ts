import { expect } from '@playwright/test';
import { PageFactory } from '../pages/PageFactory';

export class DocumentActions {
  constructor(private readonly bahmni: PageFactory) {}

  async openPatientDocumentsForPatient(patientId: string) {
    await this.bahmni.homePage.goto();
    await this.bahmni.homePage.navigateToModule(this.bahmni.homePage.MODULES.PATIENT_DOCUMENTS);
    await this.bahmni.patientDocumentsPage.searchAndSelectPatient(patientId);
  }

  async uploadDocumentForVisit(visitLabel: string, filePath: string, documentType?: string) {
    await this.bahmni.patientDocumentsPage.expandVisit(visitLabel);
    await this.bahmni.patientDocumentsPage.uploadDocument(visitLabel, filePath, documentType);
  }

  async selectFilesForVisit(visitLabel: string, filePaths: string[]) {
    await this.bahmni.patientDocumentsPage.expandVisit(visitLabel);
    await this.bahmni.patientDocumentsPage.selectFilesForVisit(visitLabel, filePaths);
  }

  async saveDocuments() {
    await this.bahmni.patientDocumentsPage.saveDocuments();
  }

  async verifyPendingDocumentCount(visitLabel: string, expectedCount: number) {
    const count = await this.bahmni.patientDocumentsPage.getPendingDocumentCount(visitLabel);
    expect(count).toBe(expectedCount);
  }

  async discardPendingDocument(visitLabel: string, index: number) {
    const before = await this.bahmni.patientDocumentsPage.getPendingDocumentCount(visitLabel);
    await this.bahmni.patientDocumentsPage.discardPendingDocument(visitLabel, index);
    await expect(async () => {
      expect(await this.bahmni.patientDocumentsPage.getPendingDocumentCount(visitLabel)).toBe(before - 1);
    }).toPass({ timeout: 10000 });
  }

  async verifySuccessToast(message: string) {
    await this.bahmni.patientDocumentsPage.verifyToastVisible('Document saved', message);
  }

  async verifyErrorToast(title: string, message?: string) {
    await this.bahmni.patientDocumentsPage.verifyToastVisible(title, message);
  }

  async verifyUnsavedDocumentsConfirmationVisible() {
    const modal = this.bahmni.patientDocumentsPage.getUnsavedDocumentsModal();
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Unsaved documents');
  }

  async verifyDocumentDisplayedForVisit(visitLabel: string, documentType: string) {
    await this.bahmni.patientDocumentsPage.expandVisit(visitLabel);
    const documentTypes = await this.bahmni.patientDocumentsPage.getDocumentTypesForVisit(visitLabel);
    expect(documentTypes).toContainEqual(documentType);
  }

  async openDocumentAndVerifyViewer(visitLabel: string, documentType: string) {
    await this.bahmni.patientDocumentsPage.openDocument(visitLabel, documentType);
    const imageSrc = await this.bahmni.patientDocumentsPage.getViewerImageSrc();
    expect(imageSrc).toBeTruthy();
    await this.bahmni.patientDocumentsPage.closeViewer();
  }

  async verifyPatientDetailsDisplayed(patientName: string, identifier: string) {
    const displayedName = await this.bahmni.patientDocumentsPage.getPatientName();
    expect(displayedName).toBe(patientName);
    const displayedIdentifier = await this.bahmni.patientDocumentsPage.getPatientIdentifier();
    expect(displayedIdentifier).toBe(identifier);
  }
}
