import { Page, expect } from '@playwright/test';

export class PatientDocumentsPage {
  private readonly page: Page;

  private readonly selectors = {
    sideNavLink: 'a:has-text("Patient Documents")',
    documentsTable: 'table[aria-label="Patient Documents"]',
    viewAttachmentLink: 'View attachment/s',
    // Standalone /bahmni-v2/patient-documents/{uuid} page
    patientName: '[data-testid="patient-name"]',
    patientIdentifierRow: 'p:has([aria-label="id-card"])',
    patientGenderRow: 'p:has([aria-label="gender"])',
    patientAgeRow: 'p:has([aria-label="age"])',
    documentsSection: 'section[aria-label="Documents"]',
    visitAccordionItem: '.cds--accordion__item',
    visitAccordionHeading: '.cds--accordion__heading',
    visitAccordionTitle: '.cds--accordion__title',
    documentRow: '[class*="docRow"]',
    documentTypeCell: '[class*="typeCell"]',
    documentTypeLabel: '.cds--list-box__label',
    documentThumbnailButton: 'button[data-testid$="-test-id"]',
    uploadFileInput: '[data-testid="document-file-input"]',
    viewerModal: '#modalIdForActionAreaLayout',
    viewerModalImage: '[data-testid$="-modal-image-test-id"]',
    viewerModalCloseButton: 'button[aria-label="Close"]',
    // Files staged for upload — one row per file, shown above the file input until Saved or discarded.
    pendingDocumentRow: '[data-testid="pending-document-row"]',
    saveDocumentsButton: '[data-testid="save-documents"]',
    backToSearchButton: '[data-testid="back-to-search"]',
    unsavedDocumentsModal: '[data-testid="unsaved-documents-modal"]',
    toastNotification: '.cds--toast-notification',
    // Legacy /bahmni/document-upload/...#/search page (reached via the Patient Documents
    // home tile) — the Active Patients list here filters live as you type.
    activePatientSearchInput: '#patientIdentifier',
    activePatientListItem: 'li.active-patient',
  } as const;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateToDocumentsSection() {
    await this.page.locator(this.selectors.sideNavLink).click();
  }

  async verifyDocumentDisplayed(identifier: string, documentType: string) {
    await this.navigateToDocumentsSection();
    const table = this.page.locator(this.selectors.documentsTable);
    await table.waitFor({ state: 'visible', timeout: 10000 });
    const row = table.locator('tbody tr').filter({ hasText: identifier });
    await expect(row).toBeVisible();
    await expect(row.locator('td').nth(1)).toHaveText(documentType);
  }

  async openAttachment(identifier: string) {
    const table = this.page.locator(this.selectors.documentsTable);
    const row = table.locator('tbody tr').filter({ hasText: identifier });
    await row.getByText(this.selectors.viewAttachmentLink).click();
  }

  async verifyAllAttachmentsDisplayed(totalDocuments: number) {
    const dialog = this.page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByRole('heading', { level: 2 })).toBeVisible();

    for (let i = 1; i <= totalDocuments; i++) {
      await expect(dialog.getByText(`${i}/${totalDocuments}`)).toBeVisible();
    }
  }

  async searchAndSelectPatient(patientId: string): Promise<void> {
    await this.page.locator(this.selectors.activePatientSearchInput).fill(patientId);
    const result = this.page.locator(this.selectors.activePatientListItem).filter({ hasText: patientId }).first();
    await result.waitFor({ state: 'visible', timeout: 10000 });
    await result.click();
  }

  private getVisitAccordionItem(visitLabel: string) {
    return this.page.locator(this.selectors.visitAccordionItem).filter({ hasText: visitLabel });
  }

  private getDocumentRow(visitLabel: string, documentType: string) {
    return this.getVisitAccordionItem(visitLabel).locator(this.selectors.documentRow).filter({ hasText: documentType });
  }

  async getPatientName(): Promise<string> {
    return (await this.page.locator(this.selectors.patientName).textContent())?.trim() ?? '';
  }

  async getPatientIdentifier(): Promise<string> {
    return (
      (await this.page.locator(this.selectors.patientIdentifierRow).locator('span').last().textContent())?.trim() ?? ''
    );
  }

  async getPatientGender(): Promise<string> {
    return (
      (await this.page.locator(this.selectors.patientGenderRow).locator('span').last().textContent())?.trim() ?? ''
    );
  }

  async getPatientAge(): Promise<string> {
    return (await this.page.locator(this.selectors.patientAgeRow).locator('span').last().textContent())?.trim() ?? '';
  }

  async getVisitLabels(): Promise<string[]> {
    const titles = this.page.locator(this.selectors.visitAccordionTitle);
    // allTextContents() doesn't auto-wait — the standalone page's visit accordion
    // renders after its own data fetch, which can still be in flight past networkidle.
    await titles.first().waitFor({ state: 'visible', timeout: 10000 });
    return titles.allTextContents();
  }

  async expandVisit(visitLabel: string) {
    const heading = this.getVisitAccordionItem(visitLabel).locator(this.selectors.visitAccordionHeading);
    if ((await heading.getAttribute('aria-expanded')) !== 'true') {
      await heading.click();
    }
  }

  async getDocumentTypesForVisit(visitLabel: string): Promise<string[]> {
    return this.getVisitAccordionItem(visitLabel)
      .locator(this.selectors.documentTypeCell)
      .locator(this.selectors.documentTypeLabel)
      .allTextContents();
  }

  async openDocument(visitLabel: string, documentType: string) {
    const row = this.getDocumentRow(visitLabel, documentType);
    await row.waitFor({ state: 'visible', timeout: 10000 });
    await row.locator(this.selectors.documentThumbnailButton).click();
  }

  async getViewerImageSrc(): Promise<string | null> {
    const modal = this.page.locator(this.selectors.viewerModal);
    await modal.waitFor({ state: 'visible', timeout: 10000 });
    return modal.locator(this.selectors.viewerModalImage).getAttribute('src');
  }

  async closeViewer() {
    const modal = this.page.locator(this.selectors.viewerModal);
    await modal.locator(this.selectors.viewerModalCloseButton).click();
    await modal.waitFor({ state: 'hidden', timeout: 10000 });
  }

  async selectFilesForVisit(visitLabel: string, filePaths: string[]) {
    const item = this.getVisitAccordionItem(visitLabel);
    await item.locator(this.selectors.uploadFileInput).setInputFiles(filePaths);
  }

  private getPendingDocumentRows(visitLabel: string) {
    return this.getVisitAccordionItem(visitLabel).locator(this.selectors.pendingDocumentRow);
  }

  async getPendingDocumentCount(visitLabel: string): Promise<number> {
    return this.getPendingDocumentRows(visitLabel).count();
  }

  async discardPendingDocument(visitLabel: string, index: number) {
    const row = this.getPendingDocumentRows(visitLabel).nth(index);
    await row.getByRole('button', { name: 'Discard' }).click();
  }

  async selectDocumentTypeForPendingFile(visitLabel: string, index: number, documentType: string) {
    const row = this.getPendingDocumentRows(visitLabel).nth(index);
    await row.getByRole('combobox').click();
    await this.page.getByRole('option', { name: documentType, exact: true }).click();
  }

  // Saving is page-level, not per-visit: one "Save" button commits every visit's
  // pending files in a single click.
  async saveDocuments() {
    const saveButton = this.page.locator(this.selectors.saveDocumentsButton);
    await saveButton.waitFor({ state: 'visible', timeout: 10000 });
    await saveButton.click();
  }

  async clickBackToSearch() {
    await this.page.locator(this.selectors.backToSearchButton).click();
  }

  getUnsavedDocumentsModal() {
    return this.page.locator(this.selectors.unsavedDocumentsModal);
  }

  async stayOnUnsavedDocuments() {
    const modal = this.getUnsavedDocumentsModal();
    await modal.getByRole('button', { name: 'Stay' }).click();
    await modal.waitFor({ state: 'hidden', timeout: 10000 });
  }

  async leaveUnsavedDocuments() {
    await this.getUnsavedDocumentsModal().getByRole('button', { name: 'Leave' }).click();
  }

  async verifyToastVisible(title: string, message?: string, timeout = 15000) {
    const toast = this.page.locator(this.selectors.toastNotification).filter({ hasText: title }).first();
    await toast.waitFor({ state: 'visible', timeout });
    if (message) {
      await expect(toast).toContainText(message);
    }
  }

  async uploadDocument(visitLabel: string, filePath: string, documentType?: string) {
    await this.selectFilesForVisit(visitLabel, [filePath]);
    if (documentType) {
      await this.selectDocumentTypeForPendingFile(visitLabel, 0, documentType);
    }
    await this.saveDocuments();
  }
}
