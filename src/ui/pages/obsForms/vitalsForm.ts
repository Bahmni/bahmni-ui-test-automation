import { Page } from '@playwright/test';

/**
 * VitalsForm class for Bahmni Vitals observation form
 * This form is accessed from New Consultation > Observation Forms
 */
export class VitalsForm {
  private readonly page: Page;

  // Body position options for blood pressure
  public readonly BODY_POSITION = {
    SITTING: 'sitting',
    RECUMBENT: 'recumbent',
    UNKNOWN: 'Unknown',
    OTHER: 'Other',
    STANDING: 'standing',
    FOWLERS: "Fowler's position",
  } as const;

  // Notes button indices (0-based, order in the form):
  // 0 - Pulse, 1 - Oxygen Saturation, 2 - Respiratory Rate,
  // 3 - Temperature, 4 - Systolic BP, 5 - Diastolic BP, 6 - Body position
  private readonly NOTES_FIELD_INDEX = {
    PULSE: 0,
    TEMPERATURE: 3,
    SYSTOLIC_BP: 4,
    DIASTOLIC_BP: 5,
  } as const;

  // Locator selectors
  private readonly selectors = {
    // Form heading
    formHeading: 'h2:has-text("Vitals")',

    // Vital signs accessible names (used with getByRole)
    pulseLabel: 'Pulse (beats/min)', // Normal: 60-100
    oxygenSaturationLabel: 'Arterial blood oxygen saturation (pulse oximeter) (%)', // Normal: >95
    respiratoryRateLabel: 'Respiratory rate', // Normal: 12-18
    temperatureLabel: 'Temperature (F)', // Normal: 95-99.86

    // Blood pressure accessible names (used with getByRole)
    systolicBPLabel: 'Systolic blood pressure (mmHg)', // Normal: 100-140
    diastolicBPLabel: 'Diastolic blood pressure (mmHg)', // Normal: 60-90

    // Notes toggle link (same class for all fields; aria-expanded="true" when open)
    notesToggleButton: 'a.ds-obs-add-note-link',
    notesToggleButtonActive: 'a.ds-obs-add-note-link[aria-expanded="true"]',

    // Notes textarea (appears when notes link is clicked)
    notesTextarea: 'textarea',

    // Body position buttons
    bodyPositionSitting: 'button:has-text("sitting")',
    bodyPositionRecumbent: 'button:has-text("recumbent")',
    bodyPositionUnknown: 'button:has-text("Unknown")',
    bodyPositionOther: 'button:has-text("Other")',
    bodyPositionStanding: 'button:has-text("standing")',
    bodyPositionFowlers: 'button:has-text("Fowler\'s position")',

    // Note text
    formNote: 'text=Note: Please save the Vitals form to record the observations .',

    // Action buttons
    discardFormButton: 'button:has-text("Discard Form")',
    saveFormButton: 'button:has-text("Save Form")',

    editFormHeading: 'h2:has-text("Edit Vitals")',
    // Shared testid with other inline action panels (consultation pad, etc.) - :visible
    // narrows to the one actually on screen since an unrelated panel can share this testid.
    editDoneButton: '[data-testid="action-area-primary-button"]:visible',
  } as const;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Wait for the Vitals form to be visible
   */
  async waitForFormToLoad() {
    await this.page.locator(this.selectors.formHeading).waitFor({ state: 'visible', timeout: 10000 });
    await this.page.locator(this.selectors.saveFormButton).waitFor({ state: 'visible', timeout: 10000 });
  }

  private numberInputByLabel(labelText: string) {
    // .first() guards against the edit panel transiently double-rendering the
    // same field while a previous encounter's fields are still settling.
    return this.page.locator(`.form-field-wrap:has(label:text-is("${labelText}")) input[type="number"]`).first();
  }

  /**
   * Fill pulse (beats/min)
   * @param pulse - Pulse value (normal range: 60-100)
   */
  async fillPulse(pulse: string) {
    await this.numberInputByLabel(this.selectors.pulseLabel).fill(pulse);
  }

  /**
   * Fill oxygen saturation (%)
   * @param oxygenSaturation - Oxygen saturation value (normal: >95)
   */
  async fillOxygenSaturation(oxygenSaturation: string) {
    await this.numberInputByLabel(this.selectors.oxygenSaturationLabel).fill(oxygenSaturation);
  }

  /**
   * Fill respiratory rate
   * @param respiratoryRate - Respiratory rate value (normal range: 12-18)
   */
  async fillRespiratoryRate(respiratoryRate: string) {
    await this.numberInputByLabel(this.selectors.respiratoryRateLabel).fill(respiratoryRate);
  }

  /**
   * Fill temperature (F)
   * @param temperature - Temperature value (normal range: 95-99.86)
   */
  async fillTemperature(temperature: string) {
    await this.numberInputByLabel(this.selectors.temperatureLabel).fill(temperature);
  }

  /**
   * Fill systolic blood pressure (mmHg)
   * @param systolic - Systolic BP value (normal range: 100-140)
   */
  async fillSystolicBP(systolic: string) {
    await this.numberInputByLabel(this.selectors.systolicBPLabel).fill(systolic);
  }

  /**
   * Fill diastolic blood pressure (mmHg)
   * @param diastolic - Diastolic BP value (normal range: 60-90)
   */
  async fillDiastolicBP(diastolic: string) {
    await this.numberInputByLabel(this.selectors.diastolicBPLabel).fill(diastolic);
  }

  /**
   * Select body position for blood pressure
   * @param position - Body position from BODY_POSITION constants
   */
  async selectBodyPosition(position: string) {
    const positionSelector = `button:has-text("${position}")`;
    await this.page.locator(positionSelector).first().click();
  }

  /**
   * Add a note to a field by clicking its notes icon, filling the textarea,
   * verifying the note is displayed, then closing the textarea.
   * @param fieldIndex - 0-based index of the notes toggle button in the form
   * @param note - Note text to enter
   */
  async addNote(fieldIndex: number, note: string) {
    const notesButton = this.page.locator(this.selectors.notesToggleButton).nth(fieldIndex);

    // Click to open the notes textarea
    await notesButton.click();

    // Wait for the textarea to appear and fill it
    const textarea = this.page.locator(this.selectors.notesTextarea).first();
    await textarea.waitFor({ state: 'visible', timeout: 5000 });
    await textarea.fill(note);

    // Click the active notes button to close the textarea
    await this.page.locator(this.selectors.notesToggleButtonActive).click();
    await textarea.waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Fill notes for pulse, temperature, systolic BP, and diastolic BP fields
   * @param notes - Object containing note text for each field
   */
  async fillNotes(notes: { pulse?: string; temperature?: string; systolicBP?: string; diastolicBP?: string }) {
    if (notes.pulse) {
      await this.addNote(this.NOTES_FIELD_INDEX.PULSE, notes.pulse);
    }
    if (notes.temperature) {
      await this.addNote(this.NOTES_FIELD_INDEX.TEMPERATURE, notes.temperature);
    }
    if (notes.systolicBP) {
      await this.addNote(this.NOTES_FIELD_INDEX.SYSTOLIC_BP, notes.systolicBP);
    }
    if (notes.diastolicBP) {
      await this.addNote(this.NOTES_FIELD_INDEX.DIASTOLIC_BP, notes.diastolicBP);
    }
  }

  /**
   * Fill the vitals form with all measurements
   * @param vitalsData - Object containing vital signs data
   */
  async fillVitalsForm(vitalsData: {
    pulse?: string;
    oxygenSaturation?: string;
    respiratoryRate?: string;
    temperature?: string;
    systolicBP?: string;
    diastolicBP?: string;
    bodyPosition?: string;
  }) {
    if (vitalsData.pulse) {
      await this.fillPulse(vitalsData.pulse);
    }

    if (vitalsData.oxygenSaturation) {
      await this.fillOxygenSaturation(vitalsData.oxygenSaturation);
    }

    if (vitalsData.respiratoryRate) {
      await this.fillRespiratoryRate(vitalsData.respiratoryRate);
    }

    if (vitalsData.temperature) {
      await this.fillTemperature(vitalsData.temperature);
    }

    if (vitalsData.systolicBP) {
      await this.fillSystolicBP(vitalsData.systolicBP);
    }

    if (vitalsData.diastolicBP) {
      await this.fillDiastolicBP(vitalsData.diastolicBP);
    }

    if (vitalsData.bodyPosition) {
      await this.selectBodyPosition(vitalsData.bodyPosition);
    }
  }

  /**
   * Save the vitals form
   */
  async saveForm() {
    await this.page.locator(this.selectors.saveFormButton).click();
    // Wait for form heading to disappear (form closed)
    await this.page.locator(this.selectors.formHeading).waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Discard the vitals form
   */
  async discardForm() {
    await this.page.locator(this.selectors.discardFormButton).click();
  }

  /**
   * Fill vitals values, add notes, then save the form
   * @param vitalsData - Object containing vital signs data and optional notes
   */
  async fillAndSaveVitals(vitalsData: {
    pulse?: string;
    oxygenSaturation?: string;
    respiratoryRate?: string;
    temperature?: string;
    systolicBP?: string;
    diastolicBP?: string;
    bodyPosition?: string;
    notes?: { pulse?: string; temperature?: string; systolicBP?: string; diastolicBP?: string };
  }) {
    await this.fillVitalsForm(vitalsData);
    if (vitalsData.notes) {
      await this.fillNotes(vitalsData.notes);
    }
    await this.saveForm();
  }

  async waitForEditFormToLoad() {
    await this.page.locator(this.selectors.editFormHeading).waitFor({ state: 'visible', timeout: 10000 });
    await this.page.locator(this.selectors.editDoneButton).waitFor({ state: 'visible', timeout: 10000 });
  }

  async saveEditedForm() {
    await this.page.locator(this.selectors.editDoneButton).click();
    await this.page.locator(this.selectors.editFormHeading).waitFor({ state: 'hidden', timeout: 20000 });
    // Give the save request time to settle before the caller re-opens the view
    // modal, otherwise it can occasionally read back stale pre-edit values.
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  }

  getFormModal() {
    return this.page.locator('[data-testid="form-details-modal"]');
  }

  /**
   * Values outside the form's configured normal range are rendered by the
   * view-form modal with an "abnormalValue" CSS module class (shown as red
   * text). The class name suffix is a build-time hash, so match on the
   * stable "abnormalValue" prefix instead of the full class.
   */
  getAbnormalValueElements() {
    return this.getFormModal().locator('[class*="abnormalValue"]');
  }

  async getFormModalText(): Promise<string | null> {
    await this.getFormModal().waitFor({ state: 'visible', timeout: 5000 });
    return this.getFormModal().textContent();
  }

  /**
   * Close the vitals modal
   */
  async closeModal() {
    await this.page.keyboard.press('Escape');
    const modal = this.page.locator('[data-testid="form-details-modal"]');
    await modal.waitFor({ state: 'hidden', timeout: 5000 });
  }
}
