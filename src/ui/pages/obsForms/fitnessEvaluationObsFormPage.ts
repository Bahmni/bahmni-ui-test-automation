import { Page, expect } from '@playwright/test';

export class FitnessEvaluationObsFormPage {
  private readonly page: Page;

  private readonly selectors = {
    formHeading: 'h2:has-text("Fitness Evaluation")',
    saveFormButton: 'button:has-text("Save Form")',
    discardFormButton: 'button:has-text("Discard Form")',
    heightLabel: 'Height (cm) (cm)',
    weightLabel: 'Weight (kg) (kg)',
    pulseLabel: 'Pulse (beats/min)',
    supplementStatusNotesTextarea: 'textarea[placeholder="Notes"]',
    editFormHeading: 'h2:has-text("Edit Fitness Evaluation")',
    // Shared testid with other inline action panels (consultation pad, etc.) - :visible
    // narrows to the one actually on screen since an unrelated panel can share this testid.
    editDoneButton: '[data-testid="action-area-primary-button"]:visible',
  } as const;

  constructor(page: Page) {
    this.page = page;
  }

  async waitForFormToLoad() {
    await this.page.locator(this.selectors.formHeading).waitFor({ state: 'visible', timeout: 10000 });
    await this.page.locator(this.selectors.saveFormButton).waitFor({ state: 'visible', timeout: 10000 });
  }

  private numberInputByLabel(labelText: string) {
    // .first() guards against the edit panel transiently double-rendering the
    // same field while a previous encounter's fields are still settling.
    return this.page.locator(`.form-field-wrap:has(label:text-is("${labelText}")) input[type="number"]`).first();
  }

  async fillHeight(heightCm: string) {
    await this.numberInputByLabel(this.selectors.heightLabel).fill(heightCm);
  }

  async fillWeight(weightKg: string) {
    await this.numberInputByLabel(this.selectors.weightLabel).fill(weightKg);
  }

  async fillPulse(pulse: string) {
    await this.numberInputByLabel(this.selectors.pulseLabel).fill(pulse);
  }

  async selectSupplementStatus(status: string) {
    await this.page.getByRole('button', { name: status, exact: true }).first().click();
    if (status === 'Completed') {
      await expect(this.page.locator(this.selectors.supplementStatusNotesTextarea).first()).toBeVisible({
        timeout: 5000,
      });
    }
  }

  async selectPregnancyStatus(status: string) {
    await this.page.getByRole('button', { name: status, exact: true }).first().click();
  }

  async fillFitnessEvaluationForm(data: {
    heightCm: string;
    weightKg: string;
    pulse: string;
    supplementStatus: string;
    pregnancyStatus: string;
  }) {
    await this.fillHeight(data.heightCm);
    await this.fillWeight(data.weightKg);
    await this.fillPulse(data.pulse);
    await this.selectSupplementStatus(data.supplementStatus);
    await this.selectPregnancyStatus(data.pregnancyStatus);
  }

  async saveForm() {
    await this.page.locator(this.selectors.saveFormButton).click();
    await this.page.locator(this.selectors.formHeading).waitFor({ state: 'hidden', timeout: 10000 });
  }

  async fillAndSaveFitnessEvaluation(data: {
    heightCm: string;
    weightKg: string;
    pulse: string;
    supplementStatus: string;
    pregnancyStatus: string;
  }) {
    await this.fillFitnessEvaluationForm(data);
    await this.saveForm();
  }

  async waitForEditFormToLoad() {
    await this.page.locator(this.selectors.editFormHeading).waitFor({ state: 'visible', timeout: 10000 });
    await this.page.locator(this.selectors.editDoneButton).waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Clear a previously-selected value from a coded (dropdown) field, e.g. a
   * calculated field like "Height for age status" that gets auto-populated
   * once height/weight are filled.
   */
  async clearCodedField(labelText: string) {
    const clearButton = this.page
      .locator(`.form-field-wrap:has(label:text-is("${labelText}"))`)
      .getByRole('button', { name: 'Clear selected item' })
      .first();
    await clearButton.click();
  }

  async saveEditedForm() {
    await this.page.locator(this.selectors.editDoneButton).click();
    await this.page.locator(this.selectors.editFormHeading).waitFor({ state: 'hidden', timeout: 10000 });
    // Give the save request time to settle before the caller re-opens the view
    // modal, otherwise it can occasionally read back stale pre-edit values.
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  }

  getFormModal() {
    return this.page.locator('[data-testid="form-details-modal"]');
  }

  async closeModal() {
    await this.page.keyboard.press('Escape');
    const modal = this.page.locator('[data-testid="form-details-modal"]');
    await modal.waitFor({ state: 'hidden', timeout: 5000 });
  }
}
