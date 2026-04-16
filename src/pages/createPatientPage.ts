import { Page, expect } from '@playwright/test';
import * as path from 'path';

/**
 * CreatePatientPage class for Bahmni create new patient page
 * URL: https://docker.standard.mybahmni.in/bahmni-new/registration/patient/new
 */
export class CreatePatientPage {
  private readonly page: Page;

  // Constants for gender options (public as they may be used in tests)
  readonly GENDER = {
    MALE: 'Male',
    FEMALE: 'Female',
    OTHER: 'Other',
  } as const;

  // Constants for visit type options (public as they may be used in tests)
  readonly VISIT_TYPE = {
    EMERGENCY: 'Start EMERGENCY visit',
    IPD: 'Start IPD visit',
    SPECIAL_OPD: 'Start Special OPD visit',
    FOLLOW_UP: 'Start Follow Up visit',
  } as const;

  // Locator selectors
  private readonly selectors = {
    // Header elements
    homeLink: 'a:has-text("Home")',
    searchPatientLink: 'a:has-text("Registration")',

    // Photo upload - No IDs available
    uploadPhotoButton: 'button:has-text("Upload photo")',
    capturePhotoButton: 'button:has-text("Capture photo")',

    // Patient ID format - Dynamic ID
    patientIdFormatDropdown: 'button[role="combobox"]:has-text("ABC")',

    // Basic information
    firstNameInput: '#first-name',
    middleNameInput: '#middle-name',
    lastNameInput: '#last-name',
    genderDropdown: 'button[role="combobox"]:has-text("Select")',

    // Age fields
    yearsAgeInput: '#age-years',
    monthsAgeInput: '#age-months',
    daysAgeInput: '#age-days',

    // Date of birth
    dateOfBirthInput: '#date-of-birth',
    estimatedCheckbox: '#accuracy',
    birthTimeInput: '#birth-time',

    // Address information
    houseNumberInput: '#address1',
    localitySectorInput: '#address2',
    cityVillageInput: '#cityVillage',
    pinCodeDropdown: '#postalCode',
    districtDropdown: '#countyDistrict',
    stateDropdown: '#stateProvince',

    // Contact information - UUIDs as IDs
    phoneNumberInput: 'input[placeholder="Phone number"]',
    alternatePhoneInput: 'input[placeholder="Alternate phone number"]',

    // Additional information
    emailInput: 'input[placeholder="Email"]',

    // Additional identifiers - Dynamic IDs with identifier prefix
    drivingLicenceInput: 'input[placeholder="Driving Licence"]',
    nationalIdInput: 'input[placeholder="National ID"]',
    passportInput: 'input[placeholder="Passport"]',

    // Relationships
    addAnotherRelationshipButton: 'button:has-text("Add another")',
    relationshipTypeComboBox: '[data-testid="new-relationship-type-combobox"]',
    patientSearchComboBox: '[data-testid="new-relationship-patient-search-combobox"]',
    existingRelationshipType: '[data-testid="existing-relationship-type"]',
    existingRelationshipPatientLink: '[data-testid="existing-relationship-patient-link"]',

    // Action buttons
    saveButton: 'button:has-text("Save")',
    startOPDVisitButton: '#visit-button',
    visitTypeDropdown: 'button[role="combobox"]:has(img[alt="Open menu"])',
    backToSearchButton: 'button:has-text("Back to search patient")',
  } as const;

  constructor(page: Page) {
    this.page = page;
  }

  private async expandSectionIfCollapsed(sectionTitle: string, signalSelector: string) {
    const signal = this.page.locator(signalSelector);
    if (!(await signal.isVisible())) {
      const button = this.page.getByRole('button', { name: sectionTitle, exact: true });
      await button.scrollIntoViewIfNeeded();
      await button.click();
      await signal.waitFor({ state: 'visible' });
    }
  }

  /**
   * Fill basic patient information
   * @param firstName - Patient's first name
   * @param lastName - Patient's last name
   * @param gender - Patient's gender
   * @param dateOfBirth - Date of birth in dd/mm/yyyy format
   * @param middleName - Optional middle name
   */
  async fillBasicInformation(
    firstName: string,
    lastName: string,
    gender: string,
    dateOfBirth: string,
    middleName?: string
  ) {
    await this.page.evaluate(() => window.scrollTo(0, 0));
    await this.page.locator(this.selectors.firstNameInput).fill(firstName);
    await this.page.locator(this.selectors.lastNameInput).fill(lastName);

    if (middleName) {
      await this.page.locator(this.selectors.middleNameInput).fill(middleName);
    }

    await this.selectGender(gender);
    await this.page.locator(this.selectors.dateOfBirthInput).fill(dateOfBirth);
    await this.page.keyboard.press('Escape');
  }

  /**
   * Select gender from dropdown
   * @param gender - Gender to select
   */
  async selectGender(gender: string) {
    await this.page.getByRole('combobox', { name: /gender/i }).click();
    await this.page.getByRole('option', { name: gender, exact: true }).click();
  }

  /**
   * Fill age in years, months, and days
   * @param years - Years
   * @param months - Months (optional)
   * @param days - Days (optional)
   * @param estimated - Whether age is estimated (optional)
   */
  async fillAge(years: number, months?: number, days?: number, estimated?: boolean) {
    await this.page.locator(this.selectors.yearsAgeInput).fill(years.toString());

    if (months !== undefined) {
      await this.page.locator(this.selectors.monthsAgeInput).fill(months.toString());
    }

    if (days !== undefined) {
      await this.page.locator(this.selectors.daysAgeInput).fill(days.toString());
    }

    if (estimated) {
      await this.page.locator(this.selectors.estimatedCheckbox).check();
    }
  }

  /**
   * Fill address information from bottom to top
   * @param address - Address object with fields
   */
  async fillAddressInformation(address: {
    state: string;
    district: string;
    pinCode: string;
    city: string;
    locality: string;
    houseNumber: string;
  }) {
    await this.expandSectionIfCollapsed('Address information', this.selectors.stateDropdown);

    await this.page.locator(this.selectors.stateDropdown).click();
    await this.page.locator(this.selectors.stateDropdown).fill(address.state);
    await this.page.getByRole('option', { name: address.state, exact: true }).click();

    await this.page.locator(this.selectors.districtDropdown).click();
    await this.page.locator(this.selectors.districtDropdown).fill(address.district);
    await this.page.locator(`li[role="option"]:has-text("${address.district}")`).first().click();

    await this.page.locator(this.selectors.pinCodeDropdown).click();
    await this.page.locator(this.selectors.pinCodeDropdown).fill(address.pinCode);
    await this.page.locator(`li[role="option"]:has-text("${address.pinCode}")`).first().click();

    await this.page.locator(this.selectors.cityVillageInput).fill(address.city);
    await this.page.locator(this.selectors.localitySectorInput).fill(address.locality);
    await this.page.locator(this.selectors.houseNumberInput).fill(address.houseNumber);
  }

  /**
   * Fill contact information
   * @param phoneNumber - Phone number
   * @param alternatePhone - Alternate phone number (optional)
   */
  async fillContactInformation(phoneNumber: string, alternatePhone?: string) {
    await this.expandSectionIfCollapsed('Contact information', this.selectors.phoneNumberInput);
    await this.page.getByRole('textbox', { name: /^Phone number$/i }).fill(phoneNumber);

    if (alternatePhone) {
      await this.page.getByRole('textbox', { name: /Alternate phone/i }).fill(alternatePhone);
    }
  }

  /**
   * Fill email address
   * @param email - Email address
   */
  async fillEmail(email: string) {
    await this.expandSectionIfCollapsed('Additional information', this.selectors.emailInput);
    await this.page.getByRole('textbox', { name: /Email/i }).fill(email);
  }

  /**
   * Upload patient photo
   * @param photoName - Name of photo file in test-data folder
   */
  async uploadPhoto(photoName: string) {
    const photoPath = path.join(__dirname, '..', '..', 'test-data', photoName);
    await this.page.locator(this.selectors.uploadPhotoButton).click();
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.waitFor({ state: 'attached' });
    await this.page.setInputFiles('input[type="file"]', photoPath);
    const confirmButton = this.page.getByRole('button', { name: /confirm/i });
    await confirmButton.waitFor({ state: 'visible' });
    await confirmButton.click();
  }

  /**
   * Add relationship for patient
   * @param relationshipType - Type of relationship (e.g., "Father/ Son", "Husband/ Wife")
   * @param relatedPersonName - Name of the related person to search for
   */
  async addRelationshipForPatient(relationshipType: string, relatedPersonName: string) {
    await this.expandSectionIfCollapsed('Relationship information', this.selectors.relationshipTypeComboBox);

    // Click relationship type combobox
    await this.page.locator(this.selectors.relationshipTypeComboBox).click();

    // Search and select relationship type
    await this.page.keyboard.type(relationshipType);
    const relationshipOption = this.page.getByRole('option', { name: relationshipType });
    await relationshipOption.waitFor({ state: 'visible', timeout: 5000 });
    await relationshipOption.click();

    // Click patient search combobox
    await this.page.locator(this.selectors.patientSearchComboBox).click();

    // Search and select patient
    await this.page.keyboard.type(relatedPersonName);
    const patientOption = this.page.getByRole('option').first();
    await patientOption.waitFor({ state: 'visible', timeout: 5000 });
    await patientOption.click();
  }

  /**
   * Fill additional identifiers
   * @param identifiers - Object containing identifier fields
   */
  async fillAdditionalIdentifiers(identifiers: { drivingLicence: string; nationalId: string; passport: string }) {
    await this.expandSectionIfCollapsed('Additional information', this.selectors.drivingLicenceInput);
    await this.page.locator(this.selectors.drivingLicenceInput).fill(identifiers.drivingLicence);
    await this.page.locator(this.selectors.nationalIdInput).fill(identifiers.nationalId);
    await this.page.locator(this.selectors.passportInput).fill(identifiers.passport);
  }

  async navigateToHomePage() {
    await this.page.locator(this.selectors.homeLink).click();
  }

  /**
   * Complete patient registration flow
   * @param patientData - Object containing all patient information
   */
  async createPatient(patientData: {
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    middleName?: string;
    phoneNumber?: string;
    email?: string;
  }) {
    await this.fillBasicInformation(
      patientData.firstName,
      patientData.lastName,
      patientData.gender,
      patientData.dateOfBirth,
      patientData.middleName
    );

    if (patientData.phoneNumber) {
      await this.fillContactInformation(patientData.phoneNumber);
    }

    if (patientData.email) {
      await this.fillEmail(patientData.email);
    }
  }

  async getFirstName(): Promise<string> {
    return this.page.locator(this.selectors.firstNameInput).inputValue();
  }
  async getMiddleName(): Promise<string> {
    return this.page.locator(this.selectors.middleNameInput).inputValue();
  }
  async getLastName(): Promise<string> {
    return this.page.locator(this.selectors.lastNameInput).inputValue();
  }
  async getGender(): Promise<string | null> {
    return this.page.getByRole('combobox', { name: /gender/i }).textContent();
  }
  async getDateOfBirth(): Promise<string> {
    return this.page.locator(this.selectors.dateOfBirthInput).inputValue();
  }
  async getPhoneNumber(): Promise<string> {
    await this.expandSectionIfCollapsed('Contact information', this.selectors.phoneNumberInput);
    return this.page.getByRole('textbox', { name: /^Phone number$/i }).inputValue();
  }
  async getEmail(): Promise<string> {
    await this.expandSectionIfCollapsed('Additional information', this.selectors.emailInput);
    return this.page.getByRole('textbox', { name: /Email/i }).inputValue();
  }
  async getHouseNumber(): Promise<string> {
    await this.expandSectionIfCollapsed('Address information', this.selectors.houseNumberInput);
    return this.page.locator(this.selectors.houseNumberInput).inputValue();
  }
  async getLocality(): Promise<string> {
    await this.expandSectionIfCollapsed('Address information', this.selectors.houseNumberInput);
    return this.page.locator(this.selectors.localitySectorInput).inputValue();
  }
  async getCity(): Promise<string> {
    await this.expandSectionIfCollapsed('Address information', this.selectors.houseNumberInput);
    return this.page.locator(this.selectors.cityVillageInput).inputValue();
  }
  async getPinCode(): Promise<string> {
    await this.expandSectionIfCollapsed('Address information', this.selectors.houseNumberInput);
    return this.page.locator(this.selectors.pinCodeDropdown).inputValue();
  }
  async getDistrict(): Promise<string> {
    await this.expandSectionIfCollapsed('Address information', this.selectors.houseNumberInput);
    return this.page.locator(this.selectors.districtDropdown).inputValue();
  }
  async getState(): Promise<string> {
    await this.expandSectionIfCollapsed('Address information', this.selectors.houseNumberInput);
    return this.page.locator(this.selectors.stateDropdown).inputValue();
  }
  async getRelationshipType(): Promise<string | null> {
    return this.page.locator(this.selectors.existingRelationshipType).textContent();
  }
  async getRelationshipPatientName(): Promise<string | null> {
    return this.page.locator(this.selectors.existingRelationshipPatientLink).textContent();
  }

  /**
   * Click on the patient link in relationships section
   * Opens patient record in a new tab and switches to it
   * @returns New CreatePatientPage instance for the opened tab
   */
  async clickPatientLink() {
    // Wait for new page to open when clicking the link
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.page.locator(this.selectors.existingRelationshipPatientLink).click(),
    ]);

    // Wait for the new page to load
    await newPage.waitForLoadState('domcontentloaded');

    // Return new page instance for the opened tab
    return new CreatePatientPage(newPage);
  }

  /**
   * Click search patient link
   */
  async clickSearchPatient() {
    await this.page.locator(this.selectors.searchPatientLink).click();
  }

  /**
   * Save the patient
   */
  async savePatient() {
    await this.page.locator(this.selectors.saveButton).click();
  }

  async verifySuccessNotification() {
    await expect(this.page.getByText('Patient saved successfully')).toBeVisible();
  }

  /**
   * Get the generated patient ID after saving
   * @returns Patient ID string
   */
  async getPatientId(): Promise<string> {
    // Wait for the page to settle after save
    await this.page.waitForURL(/.*registration\/patient\/[a-f0-9-]+/);
    // Scroll to top where patient ID is displayed
    await this.page.evaluate(() => window.scrollTo(0, 0));
    // Extract patient ID from the page header (format: "Patient ID : ABC200049")
    const patientIdLocator = this.page.locator('text=/Patient ID\\s*:\\s*ABC\\d+/');
    await patientIdLocator.waitFor({ timeout: 5000 });
    const patientIdText = await patientIdLocator.textContent();
    const match = patientIdText?.match(/ABC\d+/);
    return match ? match[0] : '';
  }

  /**
   * Save and start OPD visit
   */
  async saveAndStartOPDVisit() {
    await this.page.locator(this.selectors.startOPDVisitButton).click();
  }

  /**
   * Select visit type from dropdown and start visit
   * @param visitType - Visit type to select
   */
  async selectVisitTypeAndStart(visitType: string) {
    await this.page.locator(this.selectors.visitTypeDropdown).click();
    await this.page.locator(`li[role="option"]:has-text("${visitType}")`).click();
  }

  /**
   * Go back to search patient page
   */
  async backToSearch() {
    await this.page.locator(this.selectors.backToSearchButton).click();
  }
}
