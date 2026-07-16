import { expect } from '@playwright/test';
import { PageFactory } from '../pages/PageFactory';

export class DocumentActions {
  constructor(private readonly bahmni: PageFactory) {}

  async navigateToPatientDocumentsPage(patientUuid: string) {
    await this.bahmni.patientDocumentsPage.goto(patientUuid);
  }

  async uploadDocumentForVisit(visitLabel: string, filePath: string) {
    await this.bahmni.patientDocumentsPage.expandVisit(visitLabel);
    await this.bahmni.patientDocumentsPage.uploadDocument(visitLabel, filePath);
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
