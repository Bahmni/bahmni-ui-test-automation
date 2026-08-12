import { Page } from '@playwright/test';

export class LabEntryHomePage {
  private readonly page: Page;

  private readonly selectors = {
    activePatientHeading: 'h2:has-text("Active Patient List")',
    patientRowLink: (patientId: string) => `a[href^="/lab/patient/"]:has-text("${patientId}")`,
  } as const;

  constructor(page: Page) {
    this.page = page;
  }

  async waitForActivePatientList() {
    // Lab Entry is a separate module load from the clinical dashboard, so give
    // it a chance to finish navigating before checking for its heading.
    await this.page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await this.page.locator(this.selectors.activePatientHeading).waitFor({ state: 'visible', timeout: 20000 });
  }

  async openPatient(patientId: string) {
    const link = this.page.locator(this.selectors.patientRowLink(patientId)).first();
    await link.waitFor({ state: 'visible', timeout: 15000 });
    await link.click();
    await this.page.waitForURL(/\/lab\/patient\/[a-f0-9-]+/, { timeout: 15000 });
    await this.page.waitForLoadState('networkidle');
  }
}
