import { Page } from '@playwright/test';

export class ClinicalPage {
  private readonly page: Page;

  private consultationStarted = false;

  // Tab options for medications and vaccinations
  readonly MEDICATION_TABS = {
    ACTIVE_SCHEDULED: 'Active & Scheduled',
    ALL: 'All',
  } as const;

  readonly CONDITION_TABS = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
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
    patientIdentifierText: 'p:has(span[aria-label="id-card"]) span:not([aria-label])',
    newConsultationButton: '[data-testid="consultation-action-button"]:has-text("New Consultation")',
    continueConsultationButton: '[data-testid="consultation-action-button"]:has-text("Continue Consultation")',

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
    medicationsTable: 'article:has(p:has-text("Medications")) table[aria-label="Medications table"]:visible',
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

  async clickNewConsultation() {
    await this.page.locator(this.selectors.newConsultationButton).click();
  }
  async clickContinueConsultation() {
    await this.page.locator(this.selectors.continueConsultationButton).click();
  }

  async clickConsultationAction(): Promise<'new' | 'continue'> {
    if (!this.consultationStarted) {
      await this.page.locator(this.selectors.newConsultationButton).click();
      this.consultationStarted = true;
      return 'new';
    }
    await this.page.locator(this.selectors.continueConsultationButton).click();
    return 'continue';
  }

  getNewConsultationButton() {
    return this.page.locator(this.selectors.newConsultationButton);
  }

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

  async switchMedicationTab(tab: 'Active & Scheduled' | 'All') {
    const medicationsArticle = this.page.locator('article:has(p:has-text("Medications"))');
    await medicationsArticle.getByRole('tab', { name: tab, exact: true }).first().click();
  }

  async toggleEncounter(date: string) {
    await this.page.locator(this.selectors.encounterButton(date)).first().click();
  }

  async toggleForm(formName: string) {
    await this.page.locator(this.selectors.formButton(formName)).click();
  }

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

  private getAllergyRow(allergenName: string) {
    return this.page
      .locator(this.selectors.allergiesTable)
      .locator('tbody tr')
      .filter({ hasText: allergenName })
      .first();
  }

  async clickEditAllergy(allergenName: string) {
    await this.navigateToSection('Allergies');
    const row = this.getAllergyRow(allergenName);
    await row.waitFor({ state: 'visible', timeout: 10000 });
    await row.locator('[data-testid^="edit-allergy-"]').click();
  }

  async getDisplayedAllergySeverity(allergenName: string): Promise<string> {
    const row = this.getAllergyRow(allergenName);
    return (await row.locator('[class*="Severity"]').first().textContent())?.trim() ?? '';
  }

  getAllergyNoteIcon(allergenName: string) {
    return this.getAllergyRow(allergenName).locator('[id="tooltip-icon-fa-file-lines"]');
  }

  getAllergyNoteToggleButton(allergenName: string) {
    return this.getAllergyRow(allergenName).locator('button.cds--toggletip-button');
  }

  getAllergyNoteContent(allergenName: string) {
    return this.getAllergyRow(allergenName).locator('.cds--toggletip-content');
  }

  async openAllergyNote(allergenName: string) {
    const button = this.getAllergyNoteToggleButton(allergenName);
    await button.waitFor({ state: 'visible', timeout: 10000 });
    await button.click();
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

  async switchConditionTab(tab: 'Active' | 'Inactive') {
    await this.navigateToSection('Conditions and Diagnoses');
    await this.page.getByRole('tab', { name: `${tab} Conditions`, exact: true }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async getDisplayedConditionNames(tab: 'Active' | 'Inactive' = 'Active'): Promise<string[]> {
    await this.switchConditionTab(tab);
    await this.page
      .locator(this.selectors.conditionsTable)
      .locator('tbody tr')
      .first()
      .waitFor({ state: 'visible', timeout: 10000 });
    return this.page.locator(this.selectors.conditionsTable).locator('tbody tr td:first-child').allTextContents();
  }

  async getDisplayedConditionStatus(conditionName: string, tab: 'Active' | 'Inactive' = 'Active'): Promise<string> {
    await this.switchConditionTab(tab);
    const row = this.page
      .locator(this.selectors.conditionsTable)
      .locator('tbody tr')
      .filter({ hasText: conditionName })
      .first();
    const cells = await row.locator('td').allTextContents();
    return cells.map((c) => c.trim()).find((c) => /^(Active|Inactive)$/i.test(c)) ?? '';
  }

  async markConditionAsInactive(conditionName: string) {
    await this.switchConditionTab('Active');
    const row = this.page
      .locator(this.selectors.conditionsTable)
      .locator('tbody tr')
      .filter({ hasText: conditionName })
      .first();
    await row.waitFor({ state: 'visible', timeout: 10000 });
    await row.hover();
    await row.getByText(/mark as inactive/i).click();
    const modal = this.page.locator('[data-testid="mark-inactive-confirm-modal"]');
    await modal.waitFor({ state: 'visible' });
    await modal.getByRole('button', { name: 'Yes', exact: true }).click();
    await modal.waitFor({ state: 'hidden' });
    await this.page.waitForLoadState('networkidle');
  }

  async getDisplayedDiagnosisNames(): Promise<string[]> {
    return this.getDisplayedNamesFromTable(this.selectors.diagnosesTable, 'Conditions and Diagnoses');
  }

  async getDisplayedMedicationNames(): Promise<string[]> {
    return this.getDisplayedNamesFromTable(this.selectors.medicationsTable, 'Medications');
  }

  getDisplayedMedicationRow(medicationName: string) {
    const displayName = medicationName.split(/\s+\(/)[0];
    return this.page
      .locator(this.selectors.medicationsTable)
      .locator('tbody tr')
      .filter({ has: this.page.locator(`td:first-child:has-text("${displayName}")`) })
      .first();
  }

  getMedicationsArticle() {
    return this.page.locator('article:has(p:has-text("Medications"))').first();
  }

  async expandMedicationEncounter(date: string): Promise<void> {
    const button = this.getMedicationsArticle().getByRole('button', { name: date }).first();
    await button.waitFor({ state: 'visible', timeout: 10000 });
    const expanded = await button.getAttribute('aria-expanded');
    if (expanded === 'false' || expanded === null) {
      await button.click();
    }
  }

  async waitForDashboardDataReady(): Promise<void> {
    await this.page.waitForURL(/.*clinical\/.*(?<!\/consultation)$/, { timeout: 10000 });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async reloadDashboard(): Promise<void> {
    await this.page.reload();
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async waitForMedicationRowToContain(medicationName: string, expected: string | RegExp): Promise<void> {
    const row = this.getDisplayedMedicationRow(medicationName);
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await this.page.locator(this.selectors.medicationsTable).locator('tbody tr').first().waitFor({
      state: 'visible',
      timeout: 15000,
    });
    await row.filter({ hasText: expected }).first().waitFor({ state: 'visible', timeout: 15000 });
  }

  async clickEditMedication(medicationName: string): Promise<void> {
    await this.navigateToSection('Medications');
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    const row = this.getDisplayedMedicationRow(medicationName);
    await row.waitFor({ state: 'visible', timeout: 10000 });
    // The row's overflow-menu trigger is only revealed on hover in this table.
    await row.hover();
    const overflowTrigger = row.locator('button.cds--overflow-menu').first();
    await overflowTrigger.waitFor({ state: 'visible', timeout: 15000 });
    await overflowTrigger.click();
    const editOption = this.page.locator('[data-testid^="medication-action-edit-"]').first();
    await editOption.waitFor({ state: 'visible', timeout: 10000 });
    await editOption.click();
  }

  async clickStopMedication(medicationName: string): Promise<void> {
    await this.navigateToSection('Medications');
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    const row = this.getDisplayedMedicationRow(medicationName);
    await row.waitFor({ state: 'visible', timeout: 10000 });
    // The row's overflow-menu trigger is only revealed on hover in this table.
    await row.hover();
    const overflowTrigger = row.locator('button.cds--overflow-menu').first();
    await overflowTrigger.waitFor({ state: 'visible', timeout: 15000 });
    await overflowTrigger.click();
    const stopOption = this.page.locator('[data-testid^="medication-action-stop-"]').first();
    await stopOption.waitFor({ state: 'visible', timeout: 10000 });
    await stopOption.click();
    await this.page.locator('[data-testid="stop-medication-form-tile"]').waitFor({ state: 'visible', timeout: 10000 });
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

  getLabResultRow(testName: string) {
    return this.page
      .locator('tr')
      .filter({ has: this.page.locator(`[data-testid$="-testName"]:has-text("${testName}")`) });
  }

  getLabResultValueCell(testName: string) {
    return this.getLabResultRow(testName).locator('[data-testid$="-result"] > div');
  }

  getLabReferenceRangeCell(testName: string) {
    return this.getLabResultRow(testName).locator('[data-testid$="-referenceRange"]');
  }

  async getPatientIdentifier(): Promise<string> {
    const el = this.page.locator(this.selectors.patientIdentifierText).first();
    await el.waitFor({ state: 'visible', timeout: 10000 });
    return ((await el.textContent()) ?? '').trim();
  }

  getRadiologyViewReportLink() {
    return this.page.getByText('View Report');
  }

  getRadiologyReportPanel() {
    return this.page.getByRole('dialog');
  }

  getRadiologyObservationValue(observationName: string) {
    return this.getRadiologyReportPanel().locator(`[data-testid^="observation-value-${observationName}"]`);
  }

  getRadiologyObservationLabel(observationName: string) {
    return this.getRadiologyReportPanel().locator(`[data-testid^="observation-label-${observationName}"]`);
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
    // Scope link click to the specific form's list item to avoid clicking a different form's link
    const formListItem = formsSection.locator(`li:has(button:has-text("${formName}"))`);
    const dateLink = formListItem.locator('a').first();
    await dateLink.scrollIntoViewIfNeeded();
    await dateLink.waitFor({ state: 'visible', timeout: 10000 });
    await dateLink.click();
    await this.page.locator('[data-testid="form-details-modal"]').waitFor({ state: 'visible', timeout: 5000 });
  }
}
