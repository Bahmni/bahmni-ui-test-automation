import { Page, expect } from '@playwright/test';

export interface AppointmentRow {
  appointmentNumber: string;
  service: string;
  reason: string;
  appointmentDate: string;
  appointmentSlot: string;
  status: string;
  provider: string;
}

export class AppointmentsDisplayControlPage {
  private readonly page: Page;

  private readonly selectors = {
    widgetCard: 'article:has(p:text-is("Appointments"))',
    upcomingTab: 'role=tab[name="Upcoming"]',
    pastTab: 'role=tab[name="Past"]',
  } as const;

  constructor(page: Page) {
    this.page = page;
  }

  async waitForWidgetToLoad() {
    await this.page.locator(this.selectors.widgetCard).waitFor({ state: 'visible', timeout: 10000 });
  }

  getWidgetCard() {
    return this.page.locator(this.selectors.widgetCard);
  }

  getUpcomingTab() {
    return this.page.locator(this.selectors.upcomingTab);
  }

  getPastTab() {
    return this.page.locator(this.selectors.pastTab);
  }

  async clickUpcomingTab() {
    await this.getUpcomingTab().click();
    await expect(this.getUpcomingTab()).toHaveAttribute('aria-selected', 'true');
  }

  async clickPastTab() {
    await this.getPastTab().click();
    await expect(this.getPastTab()).toHaveAttribute('aria-selected', 'true');
  }

  async getAppointmentRows(): Promise<AppointmentRow[]> {
    const activeTab = await this.getActiveTabName();
    const tabpanel = this.page.getByRole('tabpanel', { name: activeTab });
    const rows = tabpanel.locator('table tbody tr');
    await rows.first().waitFor({ state: 'visible', timeout: 5000 });
    const count = await rows.count();
    const appointments: AppointmentRow[] = [];

    for (let i = 0; i < count; i++) {
      const cells = rows.nth(i).locator('td');
      appointments.push({
        appointmentNumber: (await cells.nth(0).textContent())?.trim() || '',
        service: (await cells.nth(1).textContent())?.trim() || '',
        reason: (await cells.nth(2).textContent())?.trim() || '',
        appointmentDate: (await cells.nth(3).textContent())?.trim() || '',
        appointmentSlot: (await cells.nth(4).textContent())?.trim() || '',
        status: (await cells.nth(5).textContent())?.trim() || '',
        provider: (await cells.nth(6).textContent())?.trim() || '',
      });
    }
    return appointments;
  }

  async verifyUpcomingTabIsActive() {
    await expect(this.getUpcomingTab()).toHaveAttribute('aria-selected', 'true');
  }

  async verifyPastTabIsActive() {
    await expect(this.getPastTab()).toHaveAttribute('aria-selected', 'true');
  }

  async verifyAppointmentCount(expectedCount: number) {
    const activeTab = await this.getActiveTabName();
    const tabpanel = this.page.getByRole('tabpanel', { name: activeTab });
    const rows = tabpanel.locator('table tbody tr');
    await expect(rows).toHaveCount(expectedCount);
  }

  private async getActiveTabName(): Promise<string> {
    const upcomingSelected = await this.getUpcomingTab().getAttribute('aria-selected');
    return upcomingSelected === 'true' ? 'Upcoming' : 'Past';
  }
}
