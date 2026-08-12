import { Page } from '@playwright/test';
import { config } from '../../config/env.config';

/**
 * ImplementerInterfacePage class for the Bahmni Form Builder (Implementer Interface)
 * URL: ${BASE_URL}/implementer-interface/#/form-builder
 */
export class ImplementerInterfacePage {
  private readonly page: Page;

  private readonly selectors = {
    importButton: 'button:has-text("Import")',
    importFileInput: '#formImportBtn',
    editFormLink: 'a:has(i.fa-pencil)',
    publishButton: 'button:has-text("Publish")',
    publishSuccessMessage: 'text=Form Successfully Published',
  } as const;

  constructor(page: Page) {
    this.page = page;
  }

  async gotoFormBuilder() {
    await this.page.goto(`${config.baseUrl}/implementer-interface/#/form-builder`);
    await this.page.locator(this.selectors.importButton).waitFor({ state: 'visible', timeout: 15000 });
  }

  async isFormPublished(formName: string): Promise<boolean> {
    const row = this.page.locator('tr').filter({ hasText: formName }).filter({ hasText: 'Published' });
    return (await row.count()) > 0;
  }

  private async getDraftEditHrefs(formName: string): Promise<string[]> {
    const links = this.page.locator('tr').filter({ hasText: formName }).locator(this.selectors.editFormLink);
    const count = await links.count();
    const hrefs: string[] = [];
    for (let i = 0; i < count; i++) {
      hrefs.push((await links.nth(i).getAttribute('href')) ?? '');
    }
    return hrefs;
  }

  async importForm(filePath: string, formName: string): Promise<string> {
    const hrefsBefore = await this.getDraftEditHrefs(formName);
    await this.page.locator(this.selectors.importButton).click();
    await this.page.locator(this.selectors.importFileInput).setInputFiles(filePath);

    const timeoutAt = Date.now() + 20000;
    while (Date.now() < timeoutAt) {
      const hrefsAfter = await this.getDraftEditHrefs(formName);
      const newHref = hrefsAfter.find((href) => !hrefsBefore.includes(href));
      if (newHref) {
        return newHref;
      }
      await this.page.waitForTimeout(500);
    }
    throw new Error(`Timed out waiting for a new "${formName}" form version to appear after import`);
  }

  async openFormEditor(editHref: string): Promise<void> {
    await this.page.locator(`a[href="${editHref}"]`).click();
  }

  async publishForm(): Promise<void> {
    const publishButton = this.page.getByRole('button', { name: 'Publish', exact: true });
    await publishButton.waitFor({ state: 'visible', timeout: 15000 });
    await publishButton.click();
    await this.page.locator(this.selectors.publishSuccessMessage).waitFor({ state: 'visible', timeout: 10000 });
  }

  private async waitForFormPublished(formName: string, timeout: number): Promise<boolean> {
    const pollIntervalMs = 2000;
    const attempts = Math.ceil(timeout / pollIntervalMs);
    for (let attempt = 0; attempt < attempts; attempt++) {
      await this.gotoFormBuilder();
      if (await this.isFormPublished(formName)) {
        return true;
      }
      await this.page.waitForTimeout(pollIntervalMs);
    }
    return false;
  }

  async ensureFormPublished(filePath: string, formName: string): Promise<void> {
    await this.gotoFormBuilder();
    if (await this.isFormPublished(formName)) {
      return;
    }
    try {
      const newFormEditHref = await this.importForm(filePath, formName);
      await this.openFormEditor(newFormEditHref);
      await this.publishForm();
      await this.gotoFormBuilder();
    } catch (error) {
      const publishedByAnotherWorker = await this.waitForFormPublished(formName, 30000);
      if (!publishedByAnotherWorker) {
        throw error;
      }
    }
  }
}
