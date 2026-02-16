import { Page } from '@playwright/test';
import { MedicationData } from '../../test-data/medicationData';

/**
 * NewConsultationPage class for Bahmni new consultation page
 * URL: https://docker.standard.mybahmni.in/bahmni-new/clinical/{patientUuid}/consultation
 */
export class NewConsultationPage {
  private readonly page: Page;

  // Locator selectors
  private readonly selectors = {
    // Heading
    newConsultationHeading: 'h2:has-text("New Consultation")',

    // Encounter information - All disabled/read-only fields
    locationCombobox: 'combobox[aria-label="Location"]',
    encounterTypeCombobox: 'combobox[aria-label="Encounter Type"]',
    visitTypeCombobox: 'combobox[aria-label="Visit Type"]',
    participantsCombobox: 'combobox[aria-label="Participant(s)"]',
    encounterDateInput: '[data-testid="encounter-date-picker-input"]',

    // Search inputs - Using data-testid
    allergiesSearchInput: '[data-testid="allergies-search-combobox"]',
    investigationsSearchInput: '[data-testid="investigations-search-combobox"]',
    diagnosesSearchInput: '[data-testid="diagnoses-search-combobox"]',
    medicationsSearchInput: '[data-testid="medications-search-combobox"]',
    vaccinationsSearchInput: '[data-testid="vaccinations-search-combobox"]',
    observationFormsSearchInput: '[data-testid="observation-forms-search-combobox"]',

    // Diagnosis/Condition action buttons
    addAsConditionLink: '[data-testid="add-as-condition-link"]',

    // Observation form cards - Using data-testid
    historyExaminationForm: '[data-testid="pinned-form-History and Examination"]',
    vitalsForm: '[data-testid="pinned-form-Vitals"]',

    // Section labels
    allergiesLabel: 'text=Allergies',
    investigationsLabel: 'text=Order Investigations/Procedures',
    diagnosesLabel: 'text=Conditions and Diagnoses',
    medicationsLabel: 'text=Prescribe medication',
    vaccinationsLabel: 'text=Vaccinations',
    observationFormsLabel: 'text=Observation Forms',
    defaultFormsLabel: 'text=Default and Pinned Forms',

    // Action buttons - Using data-testid
    cancelButton: '[data-testid="action-area-secondary-button"]',
    doneButton: '[data-testid="action-area-primary-button"]',

    // New Consultation button (on clinical page)
    newConsultationButton: '[data-testid="consultation-action-button"]',
  } as const;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Get encounter information (read-only fields)
   */
  async getEncounterInfo() {
    const location = await this.page.locator(this.selectors.locationCombobox).textContent();
    const encounterType = await this.page.locator(this.selectors.encounterTypeCombobox).textContent();
    const visitType = await this.page.locator(this.selectors.visitTypeCombobox).textContent();
    const participants = await this.page.locator(this.selectors.participantsCombobox).textContent();
    const encounterDate = await this.page.locator(this.selectors.encounterDateInput).getAttribute('placeholder');

    return {
      location: location?.trim(),
      encounterType: encounterType?.trim(),
      visitType: visitType?.trim(),
      participants: participants?.trim(),
      encounterDate: encounterDate?.trim(),
    };
  }

  /**
   * Add an allergy by searching and selecting
   * @param allergyName - Name of the allergy to add
   */
  async addAllergy(allergyName: string) {
    await this.page.locator(this.selectors.allergiesSearchInput).fill(allergyName);
    const option = this.page.locator(`li[role="option"]:has-text("${allergyName}")`).first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
  }

  /**
   * Add an allergy with severity and reaction
   * @param allergyName - Name of the allergy to add
   * @param severity - Severity level (Mild, Moderate, Severe)
   * @param reaction - Reaction type
   */
  async addAllergyWithDetails(allergyName: string, severity: string, reaction: string) {
    // Search and select allergen
    await this.addAllergy(allergyName);

    // Select severity
    const severityCombobox = this.page.getByRole('combobox', { name: /severity/i });
    await severityCombobox.waitFor({ state: 'visible' });
    await severityCombobox.click();
    await this.page.getByRole('option', { name: severity, exact: true }).click();

    // Select reaction
    const reactionCombobox = this.page.getByRole('combobox', { name: /reaction/i });
    await reactionCombobox.waitFor({ state: 'visible' });
    await reactionCombobox.click();
    await this.page.getByRole('option', { name: reaction, exact: true }).click();

    // Press Escape to close any open dropdowns
    await this.page.keyboard.press('Escape');
  }

  /**
   * Add an investigation/procedure by searching and selecting
   * @param investigationName - Name of the investigation/procedure to add
   */
  async addInvestigation(investigationName: string) {
    await this.page.locator(this.selectors.investigationsSearchInput).fill(investigationName);
    const option = this.page.locator(`li[role="option"]:has-text("${investigationName}")`).first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
  }

  /**
   * Add a diagnosis by searching, selecting, and choosing certainty
   * @param diagnosisName - Name of the diagnosis to add
   * @param certainty - Diagnosis certainty (default: 'Confirmed')
   */
  async addDiagnosis(diagnosisName: string, certainty: string = 'Confirmed') {
    const searchInput = this.page.locator(this.selectors.diagnosesSearchInput);
    await searchInput.clear();
    await searchInput.fill(diagnosisName);
    const option = this.page.locator(`li[role="option"]:has-text("${diagnosisName}")`).first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();

    // Select diagnosis certainty (Confirmed/Provisional)
    const certaintyCombobox = this.page.getByRole('combobox').filter({ hasText: 'Select' }).last();
    await certaintyCombobox.waitFor({ state: 'visible' });
    await certaintyCombobox.click();
    await this.page.getByRole('option', { name: certainty, exact: true }).click();
  }

  /**
   * Add a condition by searching, selecting, clicking "Add as Condition", and filling duration
   * @param diagnosisName - Name of the diagnosis to add as condition
   * @param duration - Duration value (default: '1')
   * @param unit - Duration unit (default: 'Years')
   */
  async addCondition(diagnosisName: string, duration: string = '1', unit: string = 'Years') {
    const searchInput = this.page.locator(this.selectors.diagnosesSearchInput);
    await searchInput.clear();
    await searchInput.fill(diagnosisName);
    const option = this.page.locator(`li[role="option"]:has-text("${diagnosisName}")`).first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();

    // Click "Add as Condition" link to mark this item as condition
    const addAsConditionLink = this.page.locator(this.selectors.addAsConditionLink);
    await addAsConditionLink.waitFor({ state: 'visible' });
    await addAsConditionLink.click();

    // Fill in duration value
    const durationInput = this.page.getByPlaceholder(/Enter duration/i);
    await durationInput.waitFor({ state: 'visible' });
    await durationInput.fill(duration);

    // Select duration unit
    const unitCombobox = this.page.getByRole('combobox', { name: /unit/i });
    await unitCombobox.waitFor({ state: 'visible' });
    await unitCombobox.click();
    await this.page.getByRole('option', { name: unit, exact: true }).click();
  }

  /**
   * Click Done button to save all added diagnoses and conditions
   */
  async saveDiagnosesAndConditions() {
    const doneButton = this.page.locator(this.selectors.doneButton);
    await doneButton.waitFor({ state: 'visible', timeout: 5000 });
    await doneButton.click();
    // Wait for navigation back to consultation page
    await this.page.waitForURL(/.*clinical\/.*(?<!\/consultation\/diagnoses)$/, { timeout: 10000 });
  }

  /**
   * Add a medication with complete prescription details
   * @param medication - Medication data object with all required fields
   */
  async addMedication(medication: MedicationData) {
    // Search and select medication
    await this.page.locator(this.selectors.medicationsSearchInput).fill(medication.name);
    const option = this.page.locator(`li[role="option"]:has-text("${medication.name}")`).first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();

    // Fill dosage
    const dosageInput = this.page.getByRole('spinbutton', { name: 'Dosage' });
    await dosageInput.waitFor({ state: 'visible' });
    await dosageInput.clear();
    await dosageInput.fill(medication.dosage.toString());

    // Select dosage unit if different from default
    if (medication.dosageUnit) {
      const dosageUnitCombobox = this.page.getByRole('combobox', { name: 'Dosage Unit' });
      await dosageUnitCombobox.click();
      await this.page.getByRole('option', { name: medication.dosageUnit, exact: true }).click();
    }

    // Select frequency
    const frequencyCombobox = this.page.getByRole('combobox', { name: 'Frequency' });
    await frequencyCombobox.waitFor({ state: 'visible' });
    await frequencyCombobox.click();
    await this.page.getByRole('option', { name: medication.frequency, exact: true }).click();

    // Fill duration
    const durationInput = this.page.getByRole('spinbutton', { name: 'Duration' });
    await durationInput.waitFor({ state: 'visible' });
    await durationInput.clear();
    await durationInput.fill(medication.duration.toString());

    // Select duration unit if different from default
    if (medication.durationUnit) {
      const durationUnitCombobox = this.page.getByRole('combobox', { name: 'Duration Unit' });
      await durationUnitCombobox.click();
      await this.page.getByRole('option', { name: medication.durationUnit, exact: true }).click();
    }

    // Select instructions if different from default
    if (medication.instructions) {
      const instructionsCombobox = this.page.getByRole('combobox', { name: 'Medication Instructions' });
      await instructionsCombobox.click();
      await this.page.getByRole('option', { name: medication.instructions, exact: true }).click();
    }

    // Select route if different from default
    if (medication.route) {
      const routeCombobox = this.page.getByRole('combobox', { name: 'Route' });
      await routeCombobox.click();
      await this.page.getByRole('option', { name: medication.route, exact: true }).click();
    }

    // Check STAT if required
    if (medication.isStat) {
      await this.page.getByRole('checkbox', { name: 'STAT' }).check();
    }

    // Check PRN if required
    if (medication.isPrn) {
      await this.page.getByRole('checkbox', { name: 'PRN' }).check();
    }
  }

  /**
   * Add a vaccination with complete prescription details
   * Note: For vaccinations, STAT is auto-enabled and frequency/duration are auto-populated
   * @param vaccination - Vaccination data object with required fields
   */
  async addVaccination(vaccination: MedicationData) {
    // Search and select vaccination
    await this.page.locator(this.selectors.vaccinationsSearchInput).fill(vaccination.name);
    const option = this.page.locator(`li[role="option"]:has-text("${vaccination.name}")`).first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();

    // Fill dosage
    const dosageInput = this.page.getByRole('spinbutton', { name: 'Dosage' });
    await dosageInput.waitFor({ state: 'visible' });
    await dosageInput.clear();
    await dosageInput.fill(vaccination.dosage.toString());

    // Select dosage unit
    const dosageUnitCombobox = this.page.getByRole('combobox', { name: 'Dosage Unit' });
    await dosageUnitCombobox.waitFor({ state: 'visible' });
    await dosageUnitCombobox.click();
    await this.page.getByRole('option', { name: vaccination.dosageUnit, exact: true }).click();

    // Select route (required field)
    const routeCombobox = this.page.getByRole('combobox', { name: 'Route' });
    await routeCombobox.waitFor({ state: 'visible' });
    await routeCombobox.click();
    await this.page.getByRole('option', { name: vaccination.route, exact: true }).click();

    // Note: Instructions uses default value "As directed"
    // Note: STAT checkbox is auto-enabled for vaccinations
    // Note: Frequency, Duration, Duration Unit are auto-populated and disabled
  }

  /**
   * Search and open an observation form
   * @param formName - Name of the observation form to open
   */
  async searchAndOpenObservationForm(formName: string) {
    await this.page.locator(this.selectors.observationFormsSearchInput).fill(formName);
    const option = this.page.locator(`li[role="option"]:has-text("${formName}")`).first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
  }

  /**
   * Open History and Examination form
   */
  async openHistoryAndExaminationForm() {
    await this.page.locator(this.selectors.historyExaminationForm).click();
  }

  /**
   * Open Vitals form
   */
  async openVitalsForm() {
    await this.page.locator(this.selectors.vitalsForm).click();
  }

  /**
   * Open a specific pinned form by name
   * @param formName - Name of the form to open
   */
  async openPinnedForm(formName: string) {
    await this.page.locator(`[data-testid="pinned-form-${formName}"]`).click();
  }

  /**
   * Cancel the consultation
   */
  async cancelConsultation() {
    await this.page.locator(this.selectors.cancelButton).click();
  }

  /**
   * Save the consultation
   */
  async saveConsultation() {
    await this.page.locator(this.selectors.doneButton).click();
  }

  /**
   * Wait for New Consultation page to be visible
   */
  async waitForNewConsultationPageToOpen() {
    await this.page.locator(this.selectors.newConsultationHeading).waitFor({
      state: 'visible',
      timeout: 10000,
    });
    await this.page.locator(this.selectors.doneButton).waitFor({
      state: 'visible',
      timeout: 10000,
    });
  }
}
