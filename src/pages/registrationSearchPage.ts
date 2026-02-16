import { Page } from '@playwright/test';

/**
 * RegistrationSearchPage class for Bahmni patient search page
 * URL: https://docker.standard.mybahmni.in/bahmni-new/registration/search
 */
export class RegistrationSearchPage {
  private readonly page: Page;

  // Constants for search attributes (public as they may be used in tests)
  readonly SEARCH_ATTRIBUTES = {
    PHONE_NUMBER: 'Phone Number',
    PATIENT_ID: 'Patient ID',
    EMAIL: 'Email',
    // Add more attributes as they appear in the dropdown
  } as const;

  // Locator selectors
  private readonly selectors = {
    // Header elements
    homeLink: 'a:has-text("Home")',
    userButton: 'button[aria-label="user"]',
    createNewPatientButton: 'button:has-text("Create new patient")',

    // Search by name or ID section
    nameOrIdSearchBox: '#search-patient-searchbar',
    nameOrIdSearchButton: '#search-patient-search-button',

    // Advanced search section
    advancedSearchBox: '#advance-search-input',
    searchAttributeDropdown: '#downshift-_r_b_-toggle-button',
    advancedSearchButton: '#advance-search-button',

    // Search results - No IDs available, using role and text selectors
    searchResultRow: 'tr[role="row"]',
    patientNameLink: 'a[href*="/registration/patient"]',
  } as const;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Click on Create New Patient button
   */
  async clickCreateNewPatientBtn() {
    await this.page.locator(this.selectors.createNewPatientButton).click();
  }

  /**
   * Search patient by name or patient ID
   * @param searchTerm - Name or patient ID to search for
   */
  async searchByNameOrId(searchTerm: string) {
    await this.page.locator(this.selectors.nameOrIdSearchBox).fill(searchTerm);
    await this.page.locator(this.selectors.nameOrIdSearchButton).click();
  }

  /**
   * Search patient using advanced search
   * @param searchTerm - Search term (phone number, email, etc.)
   * @param attribute - Optional search attribute to select from dropdown
   */
  async advancedSearch(searchTerm: string, attribute?: string) {
    if (attribute) {
      await this.selectSearchAttribute(attribute);
    }
    await this.page.locator(this.selectors.advancedSearchBox).fill(searchTerm);
    await this.page.locator(this.selectors.advancedSearchButton).click();
  }

  /**
   * Select search attribute from dropdown
   * @param attribute - Attribute to select (e.g., Phone Number, Email)
   */
  async selectSearchAttribute(attribute: string) {
    await this.page.locator(this.selectors.searchAttributeDropdown).click();
    await this.page.locator(`li:has-text("${attribute}")`).click();
  }

  /**
   * Navigate back to home
   */
  async goToHome() {
    await this.page.locator(this.selectors.homeLink).click();
  }

  /**
   * Open patient record from search results by patient name
   * @param patientName - Full name or partial name of the patient
   */
  async openPatientByName(patientName: string) {
    await this.page.locator(`tr:has-text("${patientName}") a`).first().click();
  }

  /**
   * Search and open patient record
   * @param firstName - Patient first name
   * @param lastName - Patient last name
   */
  async searchAndOpenPatient(firstName: string, lastName?: string) {
    await this.searchByNameOrId(`${firstName} ${lastName}`);
    // Wait for search results to load
    await this.page.waitForLoadState('networkidle');
    await this.openPatientByName(firstName);
  }

  /**
   * Search and open patient record by patient ID
   * @param patientId - Patient ID to search for
   */
  async searchAndOpenPatientById(patientId: string) {
    await this.searchByNameOrId(patientId);
    // Wait for search results to load
    await this.page.waitForLoadState('networkidle');
    // Click the patient ID link in search results
    const patientLink = this.page.locator(`a:has-text("${patientId}")`);
    await patientLink.waitFor({ state: 'visible', timeout: 5000 });
    await patientLink.click();
  }

  /**
   * Verify user is on registration search page
   */
  async verifyPageLoaded() {
    await this.page.waitForURL(/.*registration\/search/);
    await this.page.locator(this.selectors.createNewPatientButton).waitFor();
  }
}
