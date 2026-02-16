import { Page } from '@playwright/test';

/**
 * DeathNoteForm class for Bahmni Death Note observation form
 * This form is accessed from New Consultation > Observation Forms
 */
export class DeathNoteForm {
  private readonly page: Page;

  // Probable cause of death options
  public readonly PROBABLE_CAUSE = {
    INTRAPARTUM_MATERNAL_DEATH: 'Intrapartum maternal death',
    ANTEPARTUM_MATERNAL_DEATH: 'Antepartum Maternal Death',
    POSTPARTUM_MATERNAL_DEATH: 'Postpartum Maternal Death',
    POSTOPERATIVE_DEATH: 'Postoperative Death',
    NATURAL_DEATH_REPORTABLE: 'Natural Death Reportable to Medicolegal Authority',
    NATURAL_DEATH: 'Natural Death',
    OTHER: 'Other',
  } as const;

  // Brought in dead options
  public readonly BROUGHT_IN_DEAD = {
    YES: 'Yes',
    NO: 'No',
  } as const;

  // Locator selectors
  private readonly selectors = {
    // Form heading and controls
    formHeading: 'h2:has-text("Death Note")',
    pinFormButton: 'generic[aria-label="Pin form"]',

    // Form fields - no data-testid or id available, using label-based and text-based selectors
    dateOfDeathInput: 'textbox[aria-label="Date of death"]',

    // Probable cause of death buttons
    probableCauseIntrapartum: 'button:has-text("Intrapartum maternal death")',
    probableCauseAntepartum: 'button:has-text("Antepartum Maternal Death")',
    probableCausePostpartum: 'button:has-text("Postpartum Maternal Death")',
    probableCausePostoperative: 'button:has-text("Postoperative Death")',
    probableCauseNaturalReportable: 'button:has-text("Natural Death Reportable to Medicolegal Authority")',
    probableCauseNatural: 'button:has-text("Natural Death")',
    probableCauseOther: 'button:has-text("Other")',

    // Brought in dead buttons
    broughtInDeadYes: 'button:has-text("Yes")',
    broughtInDeadNo: 'button:has-text("No")',

    // Action buttons
    discardFormButton: 'button:has-text("Discard Form")',
    saveFormButton: 'button:has-text("Save Form")',
  } as const;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Wait for the Death Note form to be visible
   */
  async waitForFormToLoad() {
    await this.page.locator(this.selectors.formHeading).waitFor({ state: 'visible', timeout: 10000 });
    await this.page.locator(this.selectors.saveFormButton).waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Fill the date of death
   * @param dateOfDeath - Date in format (e.g., "10/02/2026")
   */
  async fillDateOfDeath(dateOfDeath: string) {
    await this.page.locator(this.selectors.dateOfDeathInput).fill(dateOfDeath);
  }

  /**
   * Select the probable cause of death
   * @param cause - Cause of death from PROBABLE_CAUSE constants
   */
  async selectProbableCauseOfDeath(cause: string) {
    const causeSelector = `button:has-text("${cause}")`;
    await this.page.locator(causeSelector).click();
  }

  /**
   * Select whether patient was brought in dead
   * @param broughtInDead - "Yes" or "No"
   */
  async selectBroughtInDead(broughtInDead: 'Yes' | 'No') {
    const selector = broughtInDead === 'Yes' ? this.selectors.broughtInDeadYes : this.selectors.broughtInDeadNo;
    await this.page.locator(selector).click();
  }

  /**
   * Fill the death note form with all details
   * @param deathNoteData - Object containing form data
   */
  async fillDeathNoteForm(deathNoteData: { dateOfDeath: string; probableCause: string; broughtInDead: 'Yes' | 'No' }) {
    await this.fillDateOfDeath(deathNoteData.dateOfDeath);
    await this.selectProbableCauseOfDeath(deathNoteData.probableCause);
    await this.selectBroughtInDead(deathNoteData.broughtInDead);
  }

  /**
   * Click the Pin Form button to pin this form
   */
  async pinForm() {
    await this.page.locator(this.selectors.pinFormButton).click();
  }

  /**
   * Save the death note form
   */
  async saveForm() {
    await this.page.locator(this.selectors.saveFormButton).click();
    // Wait for form to be saved and closed
    await this.page.locator(this.selectors.formHeading).waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Discard the death note form
   */
  async discardForm() {
    await this.page.locator(this.selectors.discardFormButton).click();
  }

  /**
   * Fill and save the death note form
   * @param deathNoteData - Object containing form data
   */
  async fillAndSaveDeathNote(deathNoteData: {
    dateOfDeath: string;
    probableCause: string;
    broughtInDead: 'Yes' | 'No';
  }) {
    await this.fillDeathNoteForm(deathNoteData);
    await this.saveForm();
  }
}
