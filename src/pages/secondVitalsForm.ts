import { Page } from '@playwright/test';

/**
 * SecondVitalsForm class for Bahmni Second Vitals observation form
 * This form is accessed from New Consultation > Observation Forms
 * Note: This form has the same fields as the Vitals form
 */
export class SecondVitalsForm {
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

  // Locator selectors
  private readonly selectors = {
    // Form heading and controls
    formHeading: 'h2:has-text("Second Vitals")',
    pinFormButton: 'generic[aria-label="Pin form"]',

    // Vital signs inputs with normal ranges
    pulseInput: 'spinbutton[aria-label="Pulse (beats/min)"]', // Normal: 60-100
    oxygenSaturationInput: 'spinbutton[aria-label="Arterial blood oxygen saturation (pulse oximeter) (%)"]', // Normal: >95
    respiratoryRateInput: 'spinbutton[aria-label="Respiratory rate"]', // Normal: 12-18
    temperatureInput: 'spinbutton[aria-label="Temperature (F)"]', // Normal: 95-99.6

    // Blood pressure
    systolicBPInput: 'spinbutton[aria-label="Systolic blood pressure (mmHg)"]', // Normal: 100-140
    diastolicBPInput: 'spinbutton[aria-label="Diastolic blood pressure (mmHg)"]', // Normal: 60-90

    // Body position buttons
    bodyPositionSitting: 'button:has-text("sitting")',
    bodyPositionRecumbent: 'button:has-text("recumbent")',
    bodyPositionUnknown: 'button:has-text("Unknown")',
    bodyPositionOther: 'button:has-text("Other")',
    bodyPositionStanding: 'button:has-text("standing")',
    bodyPositionFowlers: 'button:has-text("Fowler\'s position")',

    // Note text
    formNote: 'text=Note: Please save the Second Vitals form to record the observations .',

    // Action buttons
    discardFormButton: 'button:has-text("Discard Form")',
    saveFormButton: 'button:has-text("Save Form")',
  } as const;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Wait for the Second Vitals form to be visible
   */
  async waitForFormToLoad() {
    await this.page.locator(this.selectors.formHeading).waitFor({ state: 'visible', timeout: 10000 });
    await this.page.locator(this.selectors.saveFormButton).waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Click the Pin Form button to pin this form
   */
  async pinForm() {
    await this.page.locator(this.selectors.pinFormButton).click();
  }

  /**
   * Fill pulse (beats/min)
   * @param pulse - Pulse value (normal range: 60-100)
   */
  async fillPulse(pulse: string) {
    await this.page.locator(this.selectors.pulseInput).fill(pulse);
  }

  /**
   * Fill oxygen saturation (%)
   * @param oxygenSaturation - Oxygen saturation value (normal: >95)
   */
  async fillOxygenSaturation(oxygenSaturation: string) {
    await this.page.locator(this.selectors.oxygenSaturationInput).fill(oxygenSaturation);
  }

  /**
   * Fill respiratory rate
   * @param respiratoryRate - Respiratory rate value (normal range: 12-18)
   */
  async fillRespiratoryRate(respiratoryRate: string) {
    await this.page.locator(this.selectors.respiratoryRateInput).fill(respiratoryRate);
  }

  /**
   * Fill temperature (F)
   * @param temperature - Temperature value (normal range: 95-99.6)
   */
  async fillTemperature(temperature: string) {
    await this.page.locator(this.selectors.temperatureInput).fill(temperature);
  }

  /**
   * Fill systolic blood pressure (mmHg)
   * @param systolic - Systolic BP value (normal range: 100-140)
   */
  async fillSystolicBP(systolic: string) {
    await this.page.locator(this.selectors.systolicBPInput).fill(systolic);
  }

  /**
   * Fill diastolic blood pressure (mmHg)
   * @param diastolic - Diastolic BP value (normal range: 60-90)
   */
  async fillDiastolicBP(diastolic: string) {
    await this.page.locator(this.selectors.diastolicBPInput).fill(diastolic);
  }

  /**
   * Select body position for blood pressure
   * @param position - Body position from BODY_POSITION constants
   */
  async selectBodyPosition(position: string) {
    const positionSelector = `button:has-text("${position}")`;
    await this.page.locator(positionSelector).click();
  }

  /**
   * Fill the second vitals form with all measurements
   * @param vitalsData - Object containing vital signs data
   */
  async fillSecondVitalsForm(vitalsData: {
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
   * Save the second vitals form
   */
  async saveForm() {
    await this.page.locator(this.selectors.saveFormButton).click();
    // Wait for form heading to disappear (form closed)
    await this.page.locator(this.selectors.formHeading).waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Discard the second vitals form
   */
  async discardForm() {
    await this.page.locator(this.selectors.discardFormButton).click();
  }

  /**
   * Fill and save the second vitals form
   * @param vitalsData - Object containing vital signs data
   */
  async fillAndSaveSecondVitals(vitalsData: {
    pulse?: string;
    oxygenSaturation?: string;
    respiratoryRate?: string;
    temperature?: string;
    systolicBP?: string;
    diastolicBP?: string;
    bodyPosition?: string;
  }) {
    await this.fillSecondVitalsForm(vitalsData);
    await this.saveForm();
  }
}
