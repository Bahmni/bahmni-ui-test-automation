import { Page } from '@playwright/test';
import { MedicationData } from '../../../test-data/common/medicationData';

/**
 * NewConsultationPage class for Bahmni new consultation page
 * URL: https://docker.standard.mybahmni.in/bahmni-v2/clinical/{patientUuid}/consultation
 */
export class NewConsultationPage {
  private readonly page: Page;

  // Locator selectors
  private readonly selectors = {
    // Heading
    newConsultationHeading: 'h2:has-text("New Consultation")',
    continueConsultationHeading: 'h2:has-text("Continue Consultation")',

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
    medicationsSearchInput: '[data-testid="medication-search-combobox-test-id"]',
    medicationItemDosageInput: '[data-testid^="medication-dosage-input-"][data-testid$="-test-id"]',
    medicationItemDosageUnitDropdown: '[data-testid^="medication-dosage-unit-dropdown-"][data-testid$="-test-id"]',
    medicationItemFrequencyDropdown: '[data-testid^="medication-frequency-dropdown-"][data-testid$="-test-id"]',
    medicationItemDurationInput: '[data-testid^="medication-duration-input-"][data-testid$="-test-id"]',
    medicationItemDurationUnitDropdown: '[data-testid^="medication-duration-unit-dropdown-"][data-testid$="-test-id"]',
    medicationItemInstructionsDropdown: '[data-testid^="medication-instructions-dropdown-"][data-testid$="-test-id"]',
    medicationItemRouteDropdown: '[data-testid^="medication-route-dropdown-"][data-testid$="-test-id"]',
    medicationItemStatCheckbox: '[data-testid^="medication-stat-checkbox-"][data-testid$="-test-id"]',
    medicationItemPrnCheckbox: '[data-testid^="medication-prn-checkbox-"][data-testid$="-test-id"]',
    vaccinationsSearchInput: '[data-testid="vaccination-search-combobox-test-id"]',
    vaccinationItemDosageInput: '[data-testid^="vaccination-dosage-input-"][data-testid$="-test-id"]',
    vaccinationItemDosageUnitDropdown: '[data-testid^="vaccination-dosage-unit-dropdown-"][data-testid$="-test-id"]',
    vaccinationItemRouteDropdown: '[data-testid^="vaccination-route-dropdown-"][data-testid$="-test-id"]',
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
    // Shown instead of the consultation form when the visit has ended — shares
    // the doneButton's test-id but reads "Start visit" until clicked.
    startVisitButton: '[data-testid="action-area-primary-button"][aria-label="Start visit"]',

    // Toast notification (Carbon Design System) — scoped to the success
    // variant specifically, since an unrelated background error toast can
    // appear at the same time and would otherwise make this locator
    // ambiguous (strict-mode violation).
    saveSuccessToast: '.cds--toast-notification--success',
    saveSuccessToastCloseButton: 'button[title="close notification"]',

    // New Consultation button (on clinical page)
    newConsultationButton: '[data-testid="consultation-action-button"]',
  } as const;

  constructor(page: Page) {
    this.page = page;
  }

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

  async addAllergy(allergyName: string) {
    await this.page.locator(this.selectors.allergiesSearchInput).fill(allergyName);
    const option = this.page.locator(`li[role="option"]:has-text("${allergyName}")`).first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
  }

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

  async editAllergyDetails(severity: string, reaction: string, note?: string) {
    const severityCombobox = this.page.getByRole('combobox', { name: /severity/i });
    await severityCombobox.waitFor({ state: 'visible' });
    await severityCombobox.click();
    await this.page.getByRole('option', { name: severity, exact: true }).click();

    const reactionCombobox = this.page.getByRole('combobox', { name: /reaction/i });
    await reactionCombobox.waitFor({ state: 'visible' });
    await reactionCombobox.click();

    const selectedOptions = this.page.locator('li[role="option"][aria-selected="true"]');
    const selectedCount = await selectedOptions.count();
    for (let i = selectedCount - 1; i >= 0; i--) {
      await selectedOptions.nth(i).click();
    }

    await this.page.getByRole('option', { name: reaction, exact: true }).click();
    await this.page.keyboard.press('Escape');

    if (note !== undefined) {
      const addNoteLink = this.page.getByRole('link', { name: 'Add Note', exact: true });
      if (await addNoteLink.isVisible()) {
        await addNoteLink.click();
      }
      const noteInput = this.page.locator('[data-testid^="allergy-note-"]').first();
      await noteInput.waitFor({ state: 'visible' });
      await noteInput.fill(note);
    }
  }

  /**
   * Add an investigation or a procedure by searching and selecting
   * @param investigationName - Name of the investigation/procedure to add
   */
  async addInvestigation(investigationName: string) {
    await this.page.locator(this.selectors.investigationsSearchInput).fill(investigationName);
    const option = this.page.locator(`li[role="option"]:has-text("${investigationName}")`).first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
  }

  /**
   * Search the investigations/procedures combobox for a term, without selecting anything.
   * @param searchTerm - Name of the investigation/procedure to search for
   */
  async searchInvestigation(searchTerm: string) {
    await this.page.locator(this.selectors.investigationsSearchInput).fill(searchTerm);
  }

  /**
   * Wait for a fixed duration, e.g. to allow a debounced search to settle.
   * @param ms - Milliseconds to wait (default: 1000)
   */
  async waitForSearchDebounce(ms: number = 1000) {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Locator for the dropdown option showing an investigation/procedure as already added to this encounter.
   * @param investigationName - Name of the investigation/procedure
   */
  getAlreadyAddedOption(investigationName: string) {
    return this.page.locator(`li[role="option"]:has-text("${investigationName} (Already Added)")`).first();
  }

  /**
   * Close the investigations/procedures dropdown so it doesn't overlay/intercept subsequent clicks (e.g. Done button).
   */
  async closeInvestigationsDropdown() {
    await this.page.keyboard.press('Escape');
  } /**
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
   * Wait for the save success toast notification and dismiss it
   */
  async dismissSaveNotification() {
    const toast = this.page.locator(this.selectors.saveSuccessToast).first();
    await toast.waitFor({ state: 'visible', timeout: 20000 });
    await toast.locator(this.selectors.saveSuccessToastCloseButton).click();
    await toast.waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Click Done button to save all added diagnoses and conditions
   */
  async saveDiagnosesAndConditions() {
    const doneButton = this.page.locator(this.selectors.doneButton);
    await doneButton.waitFor({ state: 'visible', timeout: 5000 });
    await doneButton.click();
    await this.dismissSaveNotification();
    // Wait for navigation back to consultation page
    await this.page.waitForURL(/.*clinical\/.*(?<!\/consultation\/diagnoses)$/, { timeout: 10000 });
  }

  /**
   * Search for a medication by drug name and select the specified option.
   * Uses only the base drug name (text before dosage/form) for the search input.
   * @param medicationName - Full medication name to select from the dropdown
   */
  async searchAndSelectMedication(medicationName: string) {
    const searchTerm = medicationName.split(/\s+(?=\d|\()/)[0];
    await this.page.locator(this.selectors.medicationsSearchInput).fill(searchTerm);
    const option = this.page.locator(`li[role="option"]:has-text("${medicationName}")`).first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
  }

  async addMedication(medication: MedicationData) {
    await this.searchAndSelectMedication(medication.name);

    const dosageInput = this.page.locator(this.selectors.medicationItemDosageInput);
    await dosageInput.waitFor({ state: 'visible' });
    await dosageInput.fill(medication.dosage.toString());

    if (medication.dosageUnit) {
      await this.page.locator(this.selectors.medicationItemDosageUnitDropdown).getByRole('combobox').click();
      await this.page.getByRole('option', { name: medication.dosageUnit, exact: true }).click();
    }

    await this.page.locator(this.selectors.medicationItemFrequencyDropdown).getByRole('combobox').click();
    await this.page.getByRole('option', { name: medication.frequency, exact: true }).click();

    const durationInput = this.page.locator(this.selectors.medicationItemDurationInput);
    await durationInput.waitFor({ state: 'visible' });
    await durationInput.fill(medication.duration.toString());

    if (medication.durationUnit) {
      await this.page.locator(this.selectors.medicationItemDurationUnitDropdown).getByRole('combobox').click();
      await this.page.getByRole('option', { name: medication.durationUnit, exact: true }).click();
    }

    if (medication.instructions) {
      await this.page.locator(this.selectors.medicationItemInstructionsDropdown).getByRole('combobox').click();
      await this.page.getByRole('option', { name: medication.instructions, exact: true }).click();
    }

    if (medication.route) {
      await this.page.locator(this.selectors.medicationItemRouteDropdown).getByRole('combobox').click();
      await this.page.getByRole('option', { name: medication.route, exact: true }).click();
    }

    if (medication.isStat) {
      await this.page.locator(this.selectors.medicationItemStatCheckbox).check();
    }

    if (medication.isPrn) {
      await this.page.locator(this.selectors.medicationItemPrnCheckbox).check();
    }
  }

  /**
   * Update fields on a pre-loaded medication panel (e.g. after clicking Edit on the dashboard)
   * @param medication - Medication data object with updated field values
   */
  async editMedicationDetails(medication: MedicationData): Promise<void> {
    const dosageInput = this.page.locator(this.selectors.medicationItemDosageInput);
    await dosageInput.waitFor({ state: 'visible' });
    await dosageInput.fill(medication.dosage.toString());

    if (medication.dosageUnit) {
      await this.page.locator(this.selectors.medicationItemDosageUnitDropdown).getByRole('combobox').click();
      await this.page.getByRole('option', { name: medication.dosageUnit, exact: true }).click();
    }

    await this.page.locator(this.selectors.medicationItemFrequencyDropdown).getByRole('combobox').click();
    await this.page.getByRole('option', { name: medication.frequency, exact: true }).click();

    const durationInput = this.page.locator(this.selectors.medicationItemDurationInput);
    await durationInput.waitFor({ state: 'visible' });
    await durationInput.fill(medication.duration.toString());

    if (medication.durationUnit) {
      await this.page.locator(this.selectors.medicationItemDurationUnitDropdown).getByRole('combobox').click();
      await this.page.getByRole('option', { name: medication.durationUnit, exact: true }).click();
    }

    if (medication.instructions) {
      await this.page.locator(this.selectors.medicationItemInstructionsDropdown).getByRole('combobox').click();
      await this.page.getByRole('option', { name: medication.instructions, exact: true }).click();
    }

    if (medication.route) {
      await this.page.locator(this.selectors.medicationItemRouteDropdown).getByRole('combobox').click();
      await this.page.getByRole('option', { name: medication.route, exact: true }).click();
    }

    if (medication.isStat) {
      await this.page.locator(this.selectors.medicationItemStatCheckbox).check();
    }

    if (medication.isPrn) {
      await this.page.locator(this.selectors.medicationItemPrnCheckbox).check();
    }
  }

  async fillStopMedicationForm(reason: string, note: string, stopDate?: string): Promise<void> {
    const formTile = this.page.locator('[data-testid="stop-medication-form-tile"]');
    await formTile.waitFor({ state: 'visible', timeout: 10000 });

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const dateValue = stopDate ?? `${dd}/${mm}/${yyyy}`;
    await this.page.locator('[data-testid="stop-medication-date-input"]').fill(dateValue);
    // Dismiss any date-picker overlay left open by the fill above — it can still be
    // settling into place when the next click lands, intercepting it and leaving the
    // reason dropdown stuck open with no options rendered.
    await this.page.keyboard.press('Escape');

    await this.page.locator('[data-testid="stop-medication-reason-dropdown"]').getByRole('combobox').click();
    await this.page.getByRole('option', { name: reason, exact: true }).click();

    const addNoteLink = this.page.getByRole('link', { name: 'Add Note', exact: true });
    if (await addNoteLink.isVisible()) {
      await addNoteLink.click();
    }
    const noteTextarea = this.page.locator('#stop-medication-note');
    await noteTextarea.waitFor({ state: 'visible', timeout: 10000 });
    await noteTextarea.fill(note);
  }

  async addVaccination(vaccination: MedicationData) {
    await this.page.locator(this.selectors.vaccinationsSearchInput).fill(vaccination.name);
    const option = this.page.locator(`li[role="option"]:has-text("${vaccination.name}")`).first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();

    const dosageInput = this.page.locator(this.selectors.vaccinationItemDosageInput);
    await dosageInput.waitFor({ state: 'visible' });
    await dosageInput.fill(vaccination.dosage.toString());

    await this.page.locator(this.selectors.vaccinationItemDosageUnitDropdown).getByRole('combobox').click();
    await this.page.getByRole('option', { name: vaccination.dosageUnit, exact: true }).click();

    await this.page.locator(this.selectors.vaccinationItemRouteDropdown).getByRole('combobox').click();
    await this.page.getByRole('option', { name: vaccination.route, exact: true }).click();
  }

  async searchAndOpenObservationForm(formName: string) {
    await this.page.locator(this.selectors.observationFormsSearchInput).fill(formName);
    const option = this.page.locator(`li[role="option"]:has-text("${formName}")`).first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
  }

  async openHistoryAndExaminationForm() {
    await this.page.locator(this.selectors.historyExaminationForm).click();
  }

  async openVitalsForm() {
    await this.page.locator(this.selectors.vitalsForm).click();
  }

  async openPinnedForm(formName: string) {
    await this.page.locator(`[data-testid="pinned-form-${formName}"]`).click();
  }

  async cancelConsultation() {
    await this.page.locator(this.selectors.cancelButton).click();
  }

  async saveConsultation() {
    await this.page.locator(this.selectors.doneButton).click();
    await this.dismissSaveNotification();
    // Wait for navigation back to the clinical dashboard before proceeding
    await this.page.waitForURL(/.*clinical\/.*(?<!\/consultation)$/, { timeout: 10000 });
  }

  async startVisitIfPrompted(): Promise<void> {
    const startVisitButton = this.page.locator(this.selectors.startVisitButton);
    const promptShown = await startVisitButton
      .waitFor({ state: 'visible', timeout: 3000 })
      .then(() => true)
      .catch(() => false);
    if (promptShown) {
      await startVisitButton.click();
    }
  }

  async waitForNewConsultationPageToOpen() {
    await this.page.locator(this.selectors.newConsultationHeading).waitFor({
      state: 'visible',
      timeout: 10000,
    });
    await this.startVisitIfPrompted();
    await this.page.locator(this.selectors.doneButton).waitFor({
      state: 'visible',
      timeout: 10000,
    });
  }

  async waitForContinueConsultationPageToOpen() {
    await this.page.locator(this.selectors.continueConsultationHeading).waitFor({
      state: 'visible',
      timeout: 10000,
    });
    await this.page.locator(this.selectors.doneButton).waitFor({
      state: 'visible',
      timeout: 10000,
    });
  }
}
