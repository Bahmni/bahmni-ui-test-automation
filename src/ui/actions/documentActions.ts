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
