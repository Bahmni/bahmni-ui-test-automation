import { Page } from '@playwright/test';

/**
 * MalariaForm class for Bahmni Malaria observation form
 * This form is accessed from New Consultation > Observation Forms
 */
export class MalariaForm {
  private readonly page: Page;

  public readonly RAPID_TEST_RESULT = {
    NEGATIVE: 'Negative',
    POSITIVE: 'Positive',
    INDETERMINATE: 'Indeterminate',
    POSITIVE_FALCIPARUM: 'Positive for Plasmodium falciparum',
    POSITIVE_VIVAX: 'Positive for Plasmodium vivax',
    POSITIVE_BOTH: 'Positive for both Plasmodium falciparum and Plasmodium vivax',
    NOT_PERFORMED: 'Procedure not performed',
  } as const;

  public readonly MALARIA_RISK = {
    NONE: 'None',
    LOW: 'Low',
    HIGH: 'High',
  } as const;

  public readonly PROBLEM_SEVERITY = {
    FATAL: 'Fatal',
    MODERATE: 'Moderate',
    MILD: 'Mild',
    SEVERE: 'Severe',
    MILD_TO_MODERATE: 'Mild to moderate',
    MODERATE_TO_SEVERE: 'Moderate to severe',
  } as const;

  public readonly SOURCE = {
    ACD: 'ACD - Active Case Detection',
    PCD: 'PCD - Passive Case Detection',
  } as const;

  private readonly selectors = {
    formHeading: 'h2:has-text("Malaria")',
    saveFormButton: 'button:has-text("Save Form")',
    discardFormButton: 'button:has-text("Discard Form")',
  } as const;

  constructor(page: Page) {
    this.page = page;
  }

  async waitForFormToLoad() {
    await this.page.locator(this.selectors.formHeading).waitFor({ state: 'visible', timeout: 10000 });
    await this.page.locator(this.selectors.saveFormButton).waitFor({ state: 'visible', timeout: 10000 });
    await this.page.getByRole('button', { name: 'Yes' }).first().waitFor({ state: 'visible', timeout: 20000 });
  }

  async selectMalarialProphylaxis(value: 'Yes' | 'No') {
    // First group of Yes/No buttons is Malarial prophylaxis
    const buttons = this.page.getByRole('button', { name: value });
    await buttons.first().click();
  }

  async selectAntiMalarialGiven(value: 'Yes' | 'No' | 'Unknown') {
    await this.page.getByRole('button', { name: value }).nth(1).click();
  }

  async selectRapidTestResult(result: string) {
    await this.page.getByRole('button', { name: result, exact: true }).click();
  }

  async selectMalariaRisk(risk: string) {
    await this.page.getByRole('button', { name: risk, exact: true }).click();
  }

  async selectSource(source: string) {
    await this.page.getByRole('button', { name: source, exact: true }).click();
  }

  async selectCurrentlyPregnant(value: 'Yes' | 'No') {
    // Last Yes/No group is Currently pregnant
    const buttons = this.page.getByRole('button', { name: value });
    await buttons.last().click();
  }

  async selectProblemSeverity(severity: string) {
    await this.page.getByRole('button', { name: severity, exact: true }).click();
  }

  async fillTreatmentStartDate(date: string) {
    await this.page.getByLabel('Date of death').fill(date);
  }

  async fillMalariaForm(data: {
    malarialProphylaxis: 'Yes' | 'No';
    antiMalarialGiven: 'Yes' | 'No' | 'Unknown';
    rapidTestResult: string;
    malariaRisk: string;
    source: string;
    currentlyPregnant: 'Yes' | 'No';
    problemSeverity: string;
    treatmentStartDate: string;
  }) {
    await this.selectMalarialProphylaxis(data.malarialProphylaxis);
    await this.selectAntiMalarialGiven(data.antiMalarialGiven);
    await this.selectRapidTestResult(data.rapidTestResult);
    await this.selectMalariaRisk(data.malariaRisk);
    await this.selectSource(data.source);
    await this.selectCurrentlyPregnant(data.currentlyPregnant);
    await this.selectProblemSeverity(data.problemSeverity);
    await this.fillTreatmentStartDate(data.treatmentStartDate);
  }

  async saveForm() {
    await this.page.locator(this.selectors.saveFormButton).click();
    await this.page.locator(this.selectors.formHeading).waitFor({ state: 'hidden', timeout: 10000 });
  }

  async fillAndSaveMalaria(data: {
    malarialProphylaxis: 'Yes' | 'No';
    antiMalarialGiven: 'Yes' | 'No' | 'Unknown';
    rapidTestResult: string;
    malariaRisk: string;
    source: string;
    currentlyPregnant: 'Yes' | 'No';
    problemSeverity: string;
    treatmentStartDate: string;
  }) {
    await this.fillMalariaForm(data);
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
