import { Page } from '@playwright/test';

/**
 * ClinicalPage class for Bahmni clinical dashboard page
 * URL: https://docker.standard.mybahmni.in/bahmni-new/clinical/{patientUuid}
 */
export class ClinicalPage {
  private readonly page: Page;

  // Tab options for medications and vaccinations
  readonly MEDICATION_TABS = {
    ACTIVE_SCHEDULED: 'Active & Scheduled',
    ALL: 'All',
  } as const;

  // Locator selectors
  private readonly selectors = {
    // Header elements - Using data-testid
    header: '[data-testid="header"]',
    breadcrumb: '[data-testid="breadcrumb"]',
    searchButton: '[data-testid="global-action-search"]',
    notificationsButton: '[data-testid="global-action-notifications"]',
    userButton: '[data-testid="global-action-user"]',
    homeLink: 'a:has-text("Home")',
    clinicalLink: 'a:has-text("Clinical")',

    // Sidebar navigation - Using data-testid
    sideNav: '[data-testid="side-nav"]',
    // Sidebar navigation links (using text-based as fallback since sidenav-item IDs are dynamic)
    basicDetailsLink: 'a:has-text("Basic Details")',
    allergiesLink: 'a:has-text("Allergies")',
    programsLink: 'a:has-text("Programs")',
    formsLink: 'a:has-text("Forms")',
    conditionsAndDiagnosesLink: 'a:has-text("Conditions and Diagnoses")',
    vaccinationsLink: 'a:has-text("Vaccinations")',
    medicationsLink: 'a:has-text("Medications")',
    proceduresLink: 'a:has-text("Procedures")',
    labInvestigationsLink: 'a:has-text("Lab Investigations")',
    radiologyInvestigationsLink: 'a:has-text("Radiology Investigations")',
    vitalsFlowSheetLink: 'a:has-text("Vitals Flow Sheet")',

    // Patient header elements
    // Using text-based selectors as no IDs are present
    patientName: 'div[class*="Patient Header"] p:first-child',
    patientId: 'p:has(img[alt="id-card"])',
    patientGender: 'p:has(img[alt="gender"])',
    patientAge: 'p:has(img[alt="age"])',
    newConsultationButton: '[data-testid="consultation-action-button"]',

    // Section headings
    // Using text-based selectors as no IDs are present
    basicDetailsHeading: 'article p:has-text("Basic Details")',
    allergiesHeading: 'article p:has-text("Allergies")',
    programsHeading: 'article p:has-text("Programs")',
    formsHeading: 'article p:has-text("Forms")',
    conditionsAndDiagnosesHeading: 'article p:has-text("Conditions and Diagnoses")',
    vaccinationsHeading: 'article p:has-text("Vaccinations")',
    medicationsHeading: 'article p:has-text("Medications")',
    proceduresHeading: 'article p:has-text("Procedures")',
    labInvestigationsHeading: 'article p:has-text("Lab Investigations")',
    radiologyInvestigationsHeading: 'article p:has-text("Radiology Investigations")',
    vitalsFlowSheetHeading: 'article p:has-text("Vitals Flow Sheet")',

    // Tables (using aria-label as data-testids are on headers, not tables)
    allergiesTable: 'table[aria-label="Allergies"]',
    programsTable: 'table[aria-label="Programs table"]',
    conditionsTable: 'table[aria-label="Conditions"]',
    diagnosesTable: 'table[aria-label="Diagnoses"]',
    vaccinationsTable: 'article:has(p:has-text("Vaccinations")) table[aria-label="Medications table"]',
    medicationsTable: 'article:has(p:has-text("Medications")) table[aria-label="Medications table"]',
    vitalsFlowSheetTable: 'table[aria-label="Vital Flow Sheet Table"]',

    // Table headers - Using data-testid
    tableHeader: (columnName: string) => `[data-testid="table-header-${columnName}"]`,

    // Medication tabs
    // Using role-based selectors as no IDs are present
    activeScheduledTab: 'tab:has-text("Active & Scheduled")',
    allTab: 'tab:has-text("All")',

    // Expandable buttons
    // Using role-based selectors as no IDs are present
    encounterButton: (date: string) => `button:has-text("${date}")`,
    formButton: (formName: string) => `button:has-text("${formName}")`,
  } as const;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific section by clicking the sidebar link
   * @param section - The section name to navigate to
   */
  async navigateToSection(
    section:
      | 'Basic Details'
      | 'Allergies'
      | 'Programs'
      | 'Forms'
      | 'Conditions and Diagnoses'
      | 'Vaccinations'
      | 'Medications'
      | 'Procedures'
      | 'Lab Investigations'
      | 'Radiology Investigations'
      | 'Vitals Flow Sheet'
  ) {
    const sectionMap = {
      'Basic Details': this.selectors.basicDetailsLink,
      Allergies: this.selectors.allergiesLink,
      Programs: this.selectors.programsLink,
      Forms: this.selectors.formsLink,
      'Conditions and Diagnoses': this.selectors.conditionsAndDiagnosesLink,
      Vaccinations: this.selectors.vaccinationsLink,
      Medications: this.selectors.medicationsLink,
      Procedures: this.selectors.proceduresLink,
      'Lab Investigations': this.selectors.labInvestigationsLink,
      'Radiology Investigations': this.selectors.radiologyInvestigationsLink,
      'Vitals Flow Sheet': this.selectors.vitalsFlowSheetLink,
    };

    await this.page.locator(sectionMap[section]).click();
  }

  /**
   * Click New Consultation button
   */
  async clickNewConsultation() {
    await this.page.locator(this.selectors.newConsultationButton).click();
  }

  /**
   * Get patient details from the header
   */
  async getPatientDetails() {
    const name = await this.page.locator(this.selectors.patientName).textContent();
    const id = await this.page.locator(this.selectors.patientId).textContent();
    const gender = await this.page.locator(this.selectors.patientGender).textContent();
    const age = await this.page.locator(this.selectors.patientAge).textContent();

    return {
      name: name?.trim(),
      id: id?.trim(),
      gender: gender?.trim(),
      age: age?.trim(),
    };
  }

  /**
   * Switch medication tab
   * @param tab - Tab name to switch to ('Active & Scheduled' or 'All')
   */
  async switchMedicationTab(tab: 'Active & Scheduled' | 'All') {
    if (tab === 'Active & Scheduled') {
      await this.page.locator(this.selectors.activeScheduledTab).first().click();
    } else {
      await this.page.locator(this.selectors.allTab).first().click();
    }
  }

  /**
   * Expand/collapse an encounter by date
   * @param date - Date of the encounter to expand/collapse
   */
  async toggleEncounter(date: string) {
    await this.page.locator(this.selectors.encounterButton(date)).first().click();
  }

  /**
   * Expand/collapse a form by name
   * @param formName - Name of the form to expand/collapse
   */
  async toggleForm(formName: string) {
    await this.page.locator(this.selectors.formButton(formName)).click();
  }

  /**
   * Get allergies data from the table
   */
  async getAllergies() {
    const table = this.page.locator(this.selectors.allergiesTable);
    const rows = table.locator('tbody tr');
    const count = await rows.count();

    const allergies = [];
    for (let i = 0; i < count; i++) {
      const allergen = await rows.nth(i).locator('td').nth(0).textContent();
      const reactions = await rows.nth(i).locator('td').nth(1).textContent();
      const recordedBy = await rows.nth(i).locator('td').nth(2).textContent();
      const status = await rows.nth(i).locator('td').nth(3).textContent();

      allergies.push({
        allergen: allergen?.trim(),
        reactions: reactions?.trim(),
        recordedBy: recordedBy?.trim(),
        status: status?.trim(),
      });
    }

    return allergies;
  }

  /**
   * Get programs data from the table
   */
  async getPrograms() {
    const table = this.page.locator(this.selectors.programsTable);
    const rows = table.locator('tbody tr');
    const count = await rows.count();

    const programs = [];
    for (let i = 0; i < count; i++) {
      const program = await rows.nth(i).locator('td').nth(0).textContent();
      const idNumber = await rows.nth(i).locator('td').nth(1).textContent();
      const startDate = await rows.nth(i).locator('td').nth(2).textContent();
      const endDate = await rows.nth(i).locator('td').nth(3).textContent();
      const outcome = await rows.nth(i).locator('td').nth(4).textContent();
      const status = await rows.nth(i).locator('td').nth(5).textContent();

      programs.push({
        program: program?.trim(),
        idNumber: idNumber?.trim(),
        startDate: startDate?.trim(),
        endDate: endDate?.trim(),
        outcome: outcome?.trim(),
        status: status?.trim(),
      });
    }

    return programs;
  }

  /**
   * Get medications data from the table
   */
  async getMedications() {
    const table = this.page.locator(this.selectors.medicationsTable);
    const rows = table.locator('tbody tr');
    const count = await rows.count();

    const medications = [];
    for (let i = 0; i < count; i++) {
      const medicine = await rows.nth(i).locator('td').nth(0).textContent();
      const dosage = await rows.nth(i).locator('td').nth(1).textContent();
      const instructions = await rows.nth(i).locator('td').nth(2).textContent();
      const startDate = await rows.nth(i).locator('td').nth(3).textContent();
      const orderedBy = await rows.nth(i).locator('td').nth(4).textContent();
      const orderedOn = await rows.nth(i).locator('td').nth(5).textContent();
      const status = await rows.nth(i).locator('td').nth(6).textContent();

      medications.push({
        medicine: medicine?.trim(),
        dosage: dosage?.trim(),
        instructions: instructions?.trim(),
        startDate: startDate?.trim(),
        orderedBy: orderedBy?.trim(),
        orderedOn: orderedOn?.trim(),
        status: status?.trim(),
      });
    }

    return medications;
  }

  /**
   * Check if a section is visible
   * @param section - The section name to check
   */
  async isSectionVisible(
    section:
      | 'Basic Details'
      | 'Allergies'
      | 'Programs'
      | 'Forms'
      | 'Conditions and Diagnoses'
      | 'Vaccinations'
      | 'Medications'
      | 'Procedures'
      | 'Lab Investigations'
      | 'Radiology Investigations'
      | 'Vitals Flow Sheet'
  ) {
    const sectionMap = {
      'Basic Details': this.selectors.basicDetailsHeading,
      Allergies: this.selectors.allergiesHeading,
      Programs: this.selectors.programsHeading,
      Forms: this.selectors.formsHeading,
      'Conditions and Diagnoses': this.selectors.conditionsAndDiagnosesHeading,
      Vaccinations: this.selectors.vaccinationsHeading,
      Medications: this.selectors.medicationsHeading,
      Procedures: this.selectors.proceduresHeading,
      'Lab Investigations': this.selectors.labInvestigationsHeading,
      'Radiology Investigations': this.selectors.radiologyInvestigationsHeading,
      'Vitals Flow Sheet': this.selectors.vitalsFlowSheetHeading,
    };

    return await this.page.locator(sectionMap[section]).isVisible();
  }

  private async getDisplayedNamesFromTable(
    tableSelector: string,
    section: Parameters<typeof this.navigateToSection>[0]
  ): Promise<string[]> {
    await this.navigateToSection(section);
    await this.page.locator(tableSelector).locator('tbody tr').first().waitFor({ state: 'visible', timeout: 10000 });
    return this.page.locator(tableSelector).locator('tbody tr td:first-child').allTextContents();
  }

  async getDisplayedAllergens(): Promise<string[]> {
    return this.getDisplayedNamesFromTable(this.selectors.allergiesTable, 'Allergies');
  }

  async getDisplayedAllergyReactions(): Promise<string[]> {
    await this.navigateToSection('Allergies');
    await this.page
      .locator(this.selectors.allergiesTable)
      .locator('tbody tr')
      .first()
      .waitFor({ state: 'visible', timeout: 10000 });
    return this.page.locator(this.selectors.allergiesTable).locator('tbody tr td:nth-child(2)').allTextContents();
  }

  async getAllergyRowCount(): Promise<number> {
    await this.navigateToSection('Allergies');
    return this.page.locator(this.selectors.allergiesTable).locator('tbody tr').count();
  }

  getSectionArticle(section: 'Lab Investigations' | 'Procedures' | 'Radiology Investigations') {
    return this.page
      .locator('article')
      .filter({ has: this.page.locator(`p:has-text("${section}")`) })
      .first();
  }

  async getDisplayedTextInSection(
    section: 'Lab Investigations' | 'Procedures' | 'Radiology Investigations'
  ): Promise<string | null> {
    await this.navigateToSection(section);
    return this.getSectionArticle(section).textContent();
  }

  async getDisplayedConditionNames(): Promise<string[]> {
    return this.getDisplayedNamesFromTable(this.selectors.conditionsTable, 'Conditions and Diagnoses');
  }

  async getDisplayedDiagnosisNames(): Promise<string[]> {
    return this.getDisplayedNamesFromTable(this.selectors.diagnosesTable, 'Conditions and Diagnoses');
  }

  async getDisplayedMedicationNames(): Promise<string[]> {
    return this.getDisplayedNamesFromTable(this.selectors.medicationsTable, 'Medications');
  }

  async getDisplayedVaccinationNames(): Promise<string[]> {
    return this.getDisplayedNamesFromTable(this.selectors.vaccinationsTable, 'Vaccinations');
  }

  getBasicDetailsArticle() {
    return this.page
      .locator('article')
      .filter({ has: this.page.locator('p:has-text("Basic Details")') })
      .first();
  }

  async getBasicDetailsArticleText(): Promise<string | null> {
    await this.navigateToSection('Basic Details');
    return this.getBasicDetailsArticle().textContent();
  }

  getVitalsFlowSheetTable() {
    return this.page.locator(this.selectors.vitalsFlowSheetTable);
  }

  async getVitalsFlowSheetTableText(): Promise<string | null> {
    await this.navigateToSection('Vitals Flow Sheet');
    await this.getVitalsFlowSheetTable().waitFor({ state: 'visible', timeout: 5000 });
    return this.getVitalsFlowSheetTable().textContent();
  }

  async openObservationFormModal(formName: string): Promise<void> {
    await this.navigateToSection('Forms');
    const formsSection = this.page.locator('article:has(p:has-text("Forms"))');
    const formButton = formsSection.locator(`button:has-text("${formName}")`);
    await formButton.waitFor({ state: 'visible', timeout: 5000 });
    const isExpanded = await formButton.getAttribute('aria-expanded');
    if (isExpanded === 'false' || isExpanded === null) {
      await formButton.click();
    }
    const dateLink = formsSection.locator('a').first();
    await dateLink.scrollIntoViewIfNeeded();
    await dateLink.waitFor({ state: 'visible', timeout: 10000 });
    await dateLink.click();
    await this.page.locator('[data-testid="form-details-modal"]').waitFor({ state: 'visible', timeout: 5000 });
  }
}
