import { Page } from '@playwright/test';

/**
 * ActivePatientsPage class for Bahmni Clinical module active patients page
 * URL: https://localhost/bahmni/clinical/#/default/patient/search
 */
export class ActivePatientsPage {
  private readonly page: Page;

  // Tab options
  readonly TABS = {
    ACTIVE: 'Active',
    NEW_ACTIVE: 'new-active',
    TO_ADMIT: 'To Admit',
    TO_DISCHARGE: 'To Discharge',
  } as const;

  // Locator selectors
  private readonly selectors = {
    // Tab buttons
    activeTab: 'a:has-text("Active")',
    newActiveTab: 'a:has-text("New - Active")',
    toAdmitTab: 'a:has-text("To Admit")',
    toDischargeTab: 'a:has-text("To Discharge")',

    // Patient cards
    patientCard: 'article.patient',
    patientCardIdentifier: 'p.patient-id',
    patientCardName: 'p.patient-name',

    // Search
    searchBox: 'input[type="text"]',
  } as const;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Select a tab by name
   * @param tab - Tab name to select
   */
  async selectTab(tab: string) {
    const tabMap = {
      Active: this.selectors.activeTab,
      'new-active': this.selectors.newActiveTab,
      'To Admit': this.selectors.toAdmitTab,
      'To Discharge': this.selectors.toDischargeTab,
    };

    const selector = tabMap[tab as keyof typeof tabMap];
    if (selector) {
      await this.page.locator(selector).click();
      // Wait for patient list to load after tab change
      await this.waitForPatientList();
    }
  }

  /**
   * Click on a patient by patient ID
   * @param patientId - Patient ID to click
   */
  async selectPatientById(patientId: string) {
    await this.waitForPatientList();
    // Click on the patient ID text which will open the patient's clinical page
    await this.page.getByText(patientId, { exact: true }).click();
  }

  /**
   * Click on a patient by name
   * @param patientName - Patient name to click
   */
  async selectPatientByName(patientName: string) {
    await this.waitForPatientList();
    await this.page.getByText(patientName).first().click();
  }

  /**
   * Search for a patient
   * @param searchTerm - Search term (name or ID)
   */
  async searchPatient(searchTerm: string) {
    await this.page.locator(this.selectors.searchBox).fill(searchTerm);
    // Wait for search results to load
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for patient list to load
   */
  async waitForPatientList() {
    // Wait for any patient card to appear (they have patient IDs starting with ABC)
    await this.page.locator('text=/ABC\\d+/').first().waitFor({ timeout: 10000 });
  }
}
