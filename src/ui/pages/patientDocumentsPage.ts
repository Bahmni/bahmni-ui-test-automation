import { Page, expect } from '@playwright/test';
import { config } from '../../config/env.config';

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

  // Standalone /bahmni-v2/patient-documents/{uuid} page

  async goto(patientUuid: string) {
    await this.page.goto(`${config.baseUrl}/bahmni-v2/patient-documents/${patientUuid}`);
    await this.page.waitForLoadState('networkidle', { timeout: 20000 });
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
    return this.page.locator(this.selectors.visitAccordionTitle).allTextContents();
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

  /**
   * Selecting a file renders a pending row (thumbnail + document-type combobox,
   * defaulted from the file name) that must be confirmed with Save before it
   * appears in the documents table.
   */
  async uploadDocument(visitLabel: string, filePath: string) {
    const item = this.getVisitAccordionItem(visitLabel);
    await item.locator(this.selectors.uploadFileInput).setInputFiles(filePath);
    const saveButton = item.getByRole('button', { name: 'Save' });
    await saveButton.waitFor({ state: 'visible', timeout: 10000 });
    await saveButton.click();
  }
}
