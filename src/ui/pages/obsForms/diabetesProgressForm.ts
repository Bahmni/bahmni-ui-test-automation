import { Page } from '@playwright/test';

/**
 * DiabetesProgressForm class for Bahmni Diabetes Progress observation form
 * This form is accessed from New Consultation > Observation Forms
 * Fields: Date of last patient visit, Last HbA1c Date, Last known A1C Result,
 *         Foot examination, Last eye exam date, Eye examination findings
 */
export class DiabetesProgressForm {
  private readonly page: Page;

  private readonly selectors = {
    formHeading: 'h2:has-text("Diabetes Progress")',
    saveFormButton: 'button:has-text("Save Form")',
    discardFormButton: 'button:has-text("Discard Form")',
  } as const;

  constructor(page: Page) {
    this.page = page;
  }

  async waitForFormToLoad() {
    await this.page.locator(this.selectors.formHeading).waitFor({ state: 'visible', timeout: 10000 });
    await this.page.locator(this.selectors.saveFormButton).waitFor({ state: 'visible', timeout: 10000 });
    await this.page
      .getByRole('textbox', { name: 'Date of last patient visit' })
      .waitFor({ state: 'visible', timeout: 20000 });
  }

  async fillLastPatientVisitDate(date: string) {
    await this.page.getByRole('textbox', { name: 'Date of last patient visit' }).fill(date);
  }

  async fillLastHbA1cDate(date: string) {
    await this.page.getByRole('textbox', { name: 'Last HbA1c Date' }).fill(date);
  }

  async fillLastA1CResult(result: string) {
    await this.page.getByRole('textbox', { name: 'Last known A1C Result' }).fill(result);
  }

  async fillFootExamination(findings: string) {
    await this.page.getByRole('textbox', { name: 'Foot examination' }).fill(findings);
  }

  async fillLastEyeExamDate(date: string) {
    await this.page.getByRole('textbox', { name: 'Last eye exam date' }).fill(date);
  }

  async fillEyeExaminationFindings(findings: string) {
    await this.page.getByRole('textbox', { name: 'Eye examination findings (text)' }).fill(findings);
  }

  async fillDiabetesProgressForm(data: {
    lastPatientVisitDate: string;
    lastHbA1cDate: string;
    lastA1CResult: string;
    footExamination: string;
    lastEyeExamDate: string;
    eyeExaminationFindings: string;
  }) {
    await this.fillLastPatientVisitDate(data.lastPatientVisitDate);
    await this.fillLastHbA1cDate(data.lastHbA1cDate);
    await this.fillLastA1CResult(data.lastA1CResult);
    await this.fillFootExamination(data.footExamination);
    await this.fillLastEyeExamDate(data.lastEyeExamDate);
    await this.fillEyeExaminationFindings(data.eyeExaminationFindings);
  }

  async saveForm() {
    await this.page.locator(this.selectors.saveFormButton).click();
    await this.page.locator(this.selectors.formHeading).waitFor({ state: 'hidden', timeout: 10000 });
  }

  async fillAndSaveDiabetesProgress(data: {
    lastPatientVisitDate: string;
    lastHbA1cDate: string;
    lastA1CResult: string;
    footExamination: string;
    lastEyeExamDate: string;
    eyeExaminationFindings: string;
  }) {
    await this.fillDiabetesProgressForm(data);
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
