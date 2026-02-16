import { Page, expect } from '@playwright/test';

/**
 * AdmissionLetterForm class for Bahmni Admission Letter observation form
 * This form is accessed from New Consultation > Observation Forms
 */
export class AdmissionLetterForm {
  private readonly page: Page;

  // Locator selectors
  private readonly selectors = {
    // Form heading and controls
    formHeading: 'h2:has-text("Admission Letter")',
    pinFormButton: 'generic[aria-label="Pin form"]',

    // Form fields - using text-based selectors to find textarea elements
    referringToHospitalInput: 'textarea',
    commentsInput: 'textarea',
    referredToDoctorInput: 'textarea',

    // Action buttons
    discardFormButton: 'button:has-text("Discard Form")',
    saveFormButton: 'button:has-text("Save Form")',

    // Note text
    formNote: 'text=Note : Please navigate to print section in Patient Dashboard to print the certificates.',
  } as const;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Wait for the Admission Letter form to be visible
   */
  async waitForFormToLoad() {
    await this.page.locator(this.selectors.formHeading).waitFor({ state: 'visible', timeout: 10000 });
    await this.page.locator(this.selectors.saveFormButton).waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Fill the admission letter form with all required details
   * @param admissionData - Object containing form data
   */
  async fillAdmissionLetterForm(admissionData: {
    referringToHospital: string;
    comments: string;
    referredToDoctor: string;
  }) {
    // Fill fields using nth() since all are textareas without unique identifiers
    const textareas = this.page.locator('textarea');

    await textareas.nth(0).fill(admissionData.referringToHospital);
    await textareas.nth(1).fill(admissionData.comments);
    await textareas.nth(2).fill(admissionData.referredToDoctor);
  }

  /**
   * Click the Pin Form button to pin this form
   */
  async pinForm() {
    await this.page.locator(this.selectors.pinFormButton).click();
  }

  /**
   * Save the admission letter form
   */
  async saveForm() {
    await this.page.locator(this.selectors.saveFormButton).click();
    // Wait for form to be saved and closed
    await this.page.locator(this.selectors.formHeading).waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Discard the admission letter form
   */
  async discardForm() {
    await this.page.locator(this.selectors.discardFormButton).click();
  }

  /**
   * Fill and save the admission letter form
   * @param admissionData - Object containing form data
   */
  async fillAndSaveAdmissionLetter(admissionData: {
    referringToHospital: string;
    comments: string;
    referredToDoctor: string;
  }) {
    await this.fillAdmissionLetterForm(admissionData);
    await this.saveForm();
  }

  /**
   * Verify the admission letter form data is displayed correctly in the modal
   * Note: Modal should already be open before calling this method
   * The modal displays data in read-only format with labels and values
   * @param admissionData - Expected form data to verify
   */
  async verifyAdmissionLetterData(admissionData: {
    referringToHospital: string;
    comments: string;
    referredToDoctor: string;
  }) {
    // Get the modal
    const modal = this.page.locator('[data-testid="form-details-modal"]');
    await modal.waitFor({ state: 'visible', timeout: 5000 });
    await expect(modal.locator(`text=${admissionData.referringToHospital}`)).toBeVisible();
    await expect(modal.locator(`text=${admissionData.comments}`)).toBeVisible();
    await expect(modal.locator(`text=${admissionData.referredToDoctor}`)).toBeVisible();
  }

  /**
   * Close the admission letter modal
   */
  async closeModal() {
    // Press Escape key to close the modal
    await this.page.keyboard.press('Escape');

    // Verify modal is closed
    const modal = this.page.locator('[data-testid="form-details-modal"]');
    await modal.waitFor({ state: 'hidden', timeout: 5000 });
  }
}
