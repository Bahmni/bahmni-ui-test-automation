import { Page } from '@playwright/test';

/**
 * HomePage class for Bahmni dashboard/home page
 * URL: https://docker.standard.mybahmni.in/bahmni/home/index.html#/dashboard
 */
export class HomePage {
  private readonly page: Page;

  // Constants for module names (public as they may be used in tests)
  readonly MODULES = {
    REGISTRATION: 'Registration',
    PROGRAMS: 'Programs',
    CLINICAL: 'Clinical',
    REGISTRATION_NEW: 'Registration New',
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

  // Locator selectors
  private readonly selectors = {
    // Header elements - no IDs available, using role/text based selectors
    locationDropdown: 'select', // Only one select element on the page
    userInfoButton: 'button.btn-user-info',
    logoutLink: 'a:has-text("Logout")',
    changePasswordLink: 'a:has-text("Change Password")',

    // Module links - using class and text combination
    moduleLink: (moduleName: string) => `a.button.app:has-text("${moduleName}")`,
  } as const;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Change location from the dropdown
   * @param location - Location to select
   */
  async changeLocation(location: string) {
    await this.page.locator(this.selectors.locationDropdown).selectOption(location);
  }

  /**
   * Click on a module to navigate to it
   * @param moduleName - Name of the module to navigate to
   */
  async navigateToModule(moduleName: string) {
    await this.page.locator(this.selectors.moduleLink(moduleName)).click();
  }

  /**
   * Open user menu
   */
  async openUserMenu() {
    await this.page.locator(this.selectors.userInfoButton).click();
  }

  /**
   * Logout from the application
   */
  async logout() {
    await this.openUserMenu();
    await this.page.locator(this.selectors.logoutLink).click();
  }

  /**
   * Navigate to change password
   */
  async goToChangePassword() {
    await this.openUserMenu();
    await this.page.locator(this.selectors.changePasswordLink).click();
  }

  /**
   * Verify user is on dashboard
   */
  async verifyDashboardLoaded() {
    await this.page.waitForURL(/.*dashboard/);
  }
}
