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
  } as const;

  constructor(page: Page) {
    this.page = page;
  }

  async waitForFormToLoad() {
    await this.page.locator(this.selectors.formHeading).waitFor({ state: 'visible', timeout: 10000 });
    await this.page.locator(this.selectors.saveFormButton).waitFor({ state: 'visible', timeout: 10000 });
  }

  private numberInputByLabel(labelText: string) {
    return this.page.locator(`.form-field-wrap:has(label:text-is("${labelText}")) input[type="number"]`);
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
    await this.page.getByRole('button', { name: status, exact: true }).click();
    if (status === 'Completed') {
      await expect(this.page.locator(this.selectors.supplementStatusNotesTextarea)).toBeVisible({ timeout: 5000 });
    }
  }

  async selectPregnancyStatus(status: string) {
    await this.page.getByRole('button', { name: status, exact: true }).click();
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

  getFormModal() {
    return this.page.locator('[data-testid="form-details-modal"]');
  }

  async closeModal() {
    await this.page.keyboard.press('Escape');
    const modal = this.page.locator('[data-testid="form-details-modal"]');
    await modal.waitFor({ state: 'hidden', timeout: 5000 });
  }
}
