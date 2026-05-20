import { Page } from '@playwright/test';
import { config } from '../../config/env.config';

/**
 * HomePage class for the redesigned Bahmni home page.
 * URL: ${BASE_URL}/bahmni-new/
 */
export class HomePage {
  private readonly page: Page;

  readonly MODULES = {
    REGISTRATION: 'Registration',
    PROGRAMS: 'Programs',
    CLINICAL: 'Clinical',
    RADIOLOGY_UPLOAD: 'Radiology Upload',
    PATIENT_DOCUMENTS: 'Patient Documents',
    BED_MANAGEMENT: 'Bed Management',
    ADMIN: 'Admin',
    REPORTS: 'Reports',
    OPERATION_THEATRE: 'Operation Theatre',
    ORDERS: 'Orders',
    IMPLEMENTER_INTERFACE: 'Implementer Interface',
    ATOMFEED_CONSOLE: 'AtomFeed Console',
    APPOINTMENT_SCHEDULING: 'Appointment Scheduling',
    LAB_ENTRY: 'Lab entry',
  } as const;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto(config.urls.dashboard);
    await this.page.waitForLoadState('networkidle');
  }

  async changeLocation(location: string) {
    await this.page.getByRole('combobox').selectOption(location);
  }

  async navigateToModule(moduleName: string) {
    const link = this.page.getByRole('link', { name: moduleName, exact: true });
    const button = this.page.getByRole('button', { name: moduleName, exact: true });
    await link.or(button).click();
  }

  async openUserMenu() {
    await this.page.getByRole('button', { name: 'User Menu' }).click();
  }

  async logout() {
    await this.openUserMenu();
    await this.page.getByTestId('logout-option').click();
  }

  async goToChangePassword() {
    await this.openUserMenu();
    await this.page.getByTestId('change-password-option').click();
  }
}
