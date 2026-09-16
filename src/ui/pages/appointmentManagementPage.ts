import { Page } from '@playwright/test';

export class AppointmentManagementPage {
  private readonly page: Page;

  private readonly selectors = {
    appointmentsListTab: 'a:has-text("Appointments List")',
    listViewButton: 'a:has-text("List view")',
    missedButton: 'button:has-text("Missed")',
  } as const;

  constructor(page: Page) {
    this.page = page;
  }

  async switchToAppointmentsListTab(): Promise<void> {
    const tab = this.page.locator(this.selectors.appointmentsListTab);
    if ((await tab.count()) > 0) {
      await tab.click();
      await this.page.waitForTimeout(1000);
    }
  }

  async switchToListView(): Promise<void> {
    const listViewBtn = this.page.locator(this.selectors.listViewButton);
    if ((await listViewBtn.count()) > 0) {
      await listViewBtn.click();
      await this.page.waitForTimeout(1000);
    }
  }

  async findAndSelectAppointment(patientId: string, serviceName: string): Promise<void> {
    await this.switchToAppointmentsListTab();
    await this.switchToListView();

    const rows = this.page.locator('table tbody tr');
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const rowText = await row.textContent();

      if (rowText?.includes(patientId) && rowText?.includes(serviceName)) {
        await row.click();
        await this.page.waitForTimeout(500);
        return;
      }
    }

    throw new Error(`Appointment for patient "${patientId}" with service "${serviceName}" not found`);
  }

  async markAsMissed(): Promise<void> {
    const missedBtn = this.page.locator(this.selectors.missedButton);
    await missedBtn.click();
    await this.page.waitForTimeout(500);

    const yesBtn = this.page.locator('button:has-text("Yes")').first();
    if ((await yesBtn.count()) > 0) {
      await yesBtn.click();
      await this.page.waitForTimeout(1000);
    }

    const successToast = this.page
      .locator('.cds--toast-notification--success, .success-toast, [role="status"]')
      .first();
    await successToast.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

    await this.page.waitForTimeout(500);
  }

  async markAsCancelled(): Promise<void> {
    const cancelledBtn = this.page.locator('button:has-text("Cancel")').first();
    await cancelledBtn.click();
    await this.page.waitForTimeout(500);

    const yesBtn = this.page.locator('button:has-text("Yes")').first();
    if ((await yesBtn.count()) > 0) {
      await yesBtn.click();
      await this.page.waitForTimeout(1000);
    }

    const successToast = this.page
      .locator('.cds--toast-notification--success, .success-toast, [role="status"]')
      .first();
    await successToast.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

    await this.page.waitForTimeout(500);
  }
}
