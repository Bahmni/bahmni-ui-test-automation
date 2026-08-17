import { Page } from '@playwright/test';

/**
 * HistoryAndExaminationForm class for Bahmni History and Examination observation form
 * This form is accessed from New Consultation > Observation Forms
 */
export class HistoryAndExaminationForm {
  private readonly page: Page;

  // Duration units
  public readonly DURATION_UNITS = {
    HOURS: 'Hours',
    DAYS: 'Days',
    WEEKS: 'Weeks',
    MONTHS: 'Months',
    YEARS: 'Years',
  } as const;

  // Smoking status options
  public readonly SMOKING_STATUS = {
    UNKNOWN: 'Unknown if ever smoked',
    CURRENT_EVERY_DAY: 'Current every day smoker',
    FORMER: 'Former smoker',
    CURRENT_LIGHT: 'Current light tobacco smoker',
    CURRENT_HEAVY: 'Current heavy tobacco smoker',
    SMOKER: 'Smoker',
    CURRENT_SOME_DAY: 'Current some day smoker',
    NEVER: 'Never smoker',
  } as const;

  // Locator selectors
  private readonly selectors = {
    // Form heading
    formHeading: 'h2:has-text("History and Examination")',

    // Chief Complaint section - the combobox/spinbutton carry no distinguishing
    // aria-label of their own, but each is the only one of its kind on this form.
    chiefComplaintDropdownName: 'Choose an item',

    // Duration unit buttons
    durationUnitHours: 'button:has-text("Hours")',
    durationUnitDays: 'button:has-text("Days")',
    durationUnitWeeks: 'button:has-text("Weeks")',
    durationUnitMonths: 'button:has-text("Months")',
    durationUnitYears: 'button:has-text("Years")',

    // History of present illness
    historyOfPresentIllnessLabel: 'History of present illness',

    // Smoking status buttons
    smokingStatusUnknown: 'button:has-text("Unknown if ever smoked")',
    smokingStatusCurrentEveryDay: 'button:has-text("Current every day smoker")',
    smokingStatusFormer: 'button:has-text("Former smoker")',
    smokingStatusCurrentLight: 'button:has-text("Current light tobacco smoker")',
    smokingStatusCurrentHeavy: 'button:has-text("Current heavy tobacco smoker")',
    smokingStatusSmoker: 'button:has-text("Smoker")',
    smokingStatusCurrentSomeDay: 'button:has-text("Current some day smoker")',
    smokingStatusNever: 'button:has-text("Never smoker")',

    // Consultation Images/Videos
    uploadVideoButton: 'button:has-text("Upload Video")',

    // Action buttons
    discardFormButton: 'button:has-text("Discard Form")',
    saveFormButton: 'button:has-text("Save Form")',

    editFormHeading: 'h2:has-text("Edit History and Examination")',
    // Shared testid with other inline action panels (consultation pad, etc.) - :visible
    // narrows to the one actually on screen since an unrelated panel can share this testid.
    editDoneButton: '[data-testid="action-area-primary-button"]:visible',
  } as const;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Wait for the History and Examination form to be visible
   */
  async waitForFormToLoad() {
    await this.page.locator(this.selectors.formHeading).waitFor({ state: 'visible', timeout: 10000 });
    await this.page.locator(this.selectors.saveFormButton).waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Select chief complaint from dropdown
   * @param complaint - Chief complaint text
   */
  async selectChiefComplaint(complaint: string) {
    const combobox = this.page.getByRole('combobox', { name: this.selectors.chiefComplaintDropdownName }).first();
    await combobox.click();
    await combobox.fill(complaint);
    const option = this.page.locator(`li[role="option"]:has-text("${complaint}")`).first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
  }

  /**
   * Fill the sign/symptom duration
   * @param duration - Duration value
   */
  async fillDuration(duration: string) {
    await this.page.getByRole('spinbutton').first().fill(duration);
  }

  /**
   * Select duration unit
   * @param unit - Duration unit (Hours, Days, Weeks, Months, Years)
   */
  async selectDurationUnit(unit: string) {
    const unitSelector = `button:has-text("${unit}")`;
    await this.page.locator(unitSelector).first().click();
  }

  /**
   * Fill history of present illness
   * @param history - History text
   */
  async fillHistoryOfPresentIllness(history: string) {
    await this.page.getByRole('textbox', { name: this.selectors.historyOfPresentIllnessLabel }).first().fill(history);
  }

  /**
   * Select smoking status
   * @param status - Smoking status from SMOKING_STATUS constants
   */
  async selectSmokingStatus(status: string) {
    const statusSelector = `button:has-text("${status}")`;
    await this.page.locator(statusSelector).first().click();
  }

  /**
   * Fill the history and examination form with basic details
   * @param formData - Object containing form data
   */
  async fillHistoryAndExaminationForm(formData: {
    chiefComplaint?: string;
    duration?: string;
    durationUnit?: string;
    historyOfPresentIllness?: string;
    smokingStatus?: string;
  }) {
    if (formData.chiefComplaint) {
      await this.selectChiefComplaint(formData.chiefComplaint);
    }

    if (formData.duration) {
      await this.fillDuration(formData.duration);
    }

    if (formData.durationUnit) {
      await this.selectDurationUnit(formData.durationUnit);
    }

    if (formData.historyOfPresentIllness) {
      await this.fillHistoryOfPresentIllness(formData.historyOfPresentIllness);
    }

    if (formData.smokingStatus) {
      await this.selectSmokingStatus(formData.smokingStatus);
    }
  }

  /**
   * Save the history and examination form
   */
  async saveForm() {
    await this.page.locator(this.selectors.saveFormButton).click();
    // Wait for form to be saved and closed
    await this.page.locator(this.selectors.formHeading).waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Discard the history and examination form
   */
  async discardForm() {
    await this.page.locator(this.selectors.discardFormButton).click();
  }

  /**
   * Fill and save the history and examination form
   * @param formData - Object containing form data
   */
  async fillAndSaveHistoryAndExamination(formData: {
    chiefComplaint?: string;
    duration?: string;
    durationUnit?: string;
    historyOfPresentIllness?: string;
    smokingStatus?: string;
  }) {
    await this.fillHistoryAndExaminationForm(formData);
    await this.saveForm();
  }

  getFormModal() {
    return this.page.locator('[data-testid="form-details-modal"]');
  }

  async closeModal() {
    await this.page.keyboard.press('Escape');
    const modal = this.page.locator('[data-testid="form-details-modal"]');
    await modal.waitFor({ state: 'hidden', timeout: 5000 });
  }

  async waitForEditFormToLoad() {
    await this.page.locator(this.selectors.editFormHeading).waitFor({ state: 'visible', timeout: 10000 });
    await this.page.locator(this.selectors.editDoneButton).waitFor({ state: 'visible', timeout: 10000 });
  }

  async saveEditedForm() {
    await this.page.locator(this.selectors.editDoneButton).click();
    await this.page.locator(this.selectors.editFormHeading).waitFor({ state: 'hidden', timeout: 10000 });
    // Give the save request time to settle before the caller re-opens the view
    // modal, otherwise it can occasionally read back stale pre-edit values.
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  }
}
