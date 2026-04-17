import { Page, expect } from '@playwright/test';

export class PatientDocumentsPage {
  private readonly page: Page;

  private readonly selectors = {
    sideNavLink: 'a:has-text("Patient Documents")',
    documentsTable: 'table[aria-label="Patient Documents"]',
    viewAttachmentLink: 'View attachment/s',
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
}
