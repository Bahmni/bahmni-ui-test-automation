import { expect } from '../fixtures/expectExtensions';
import { PageFactory } from '../pages/PageFactory';
import { AllergyData } from '../../../test-data/common/allergyData';
import { MedicationData } from '../../../test-data/common/medicationData';
import {
  AnemiaReportData,
  AtypicalLymphReportData,
  EchocardiogramReportData,
} from '../../../test-data/common/labOrderData';
import { CbcPanelResults, LabValueEntry } from '../../../test-data/common/labEntryData';

export class ClinicalActions {
  constructor(private readonly bahmni: PageFactory) {}

  async startNewConsultation() {
    await this.bahmni.clinicalPage.clickNewConsultation();
    await this.bahmni.newConsultationPage.waitForNewConsultationPageToOpen();
  }

  async continueConsultation() {
    await this.bahmni.clinicalPage.clickContinueConsultation();
  }

  async addAllergyInConsultation(allergyData: AllergyData) {
    await this.startNewConsultation();
    await this.bahmni.newConsultationPage.addAllergyWithDetails(
      allergyData.allergen,
      allergyData.severity,
      allergyData.reaction
    );
    await this.bahmni.newConsultationPage.saveConsultation();
  }

  async editAllergyInConsultation(allergenName: string, newAllergyData: AllergyData) {
    await this.bahmni.clinicalPage.clickEditAllergy(allergenName);
    await this.bahmni.newConsultationPage.editAllergyDetails(
      newAllergyData.severity,
      newAllergyData.reaction,
      newAllergyData.note
    );
    await this.bahmni.newConsultationPage.saveConsultation();
  }

  async addMedicationInConsultation(medicationData: MedicationData) {
    await this.startNewConsultation();
    await this.bahmni.newConsultationPage.addMedication(medicationData);
    await this.bahmni.newConsultationPage.saveConsultation();
  }

  /**
   * Edits an existing medication on the consultation by opening its row's
   * overflow menu, updating the form fields, and saving the consultation.
   */
  async editMedicationInConsultation(originalMedicationName: string, newMedication: MedicationData): Promise<void> {
    await this.bahmni.clinicalPage.clickEditMedication(originalMedicationName);
    await this.bahmni.newConsultationPage.editMedicationDetails(newMedication);
    await this.bahmni.newConsultationPage.saveConsultation();
    await this.bahmni.clinicalPage.waitForDashboardDataReady();
  }

  async addVaccinationInConsultation(vaccinationData: MedicationData) {
    await this.startNewConsultation();
    await this.bahmni.newConsultationPage.addVaccination(vaccinationData);
    await this.bahmni.newConsultationPage.saveConsultation();
  }

  async addInvestigationsInConsultation(investigations: string[]) {
    await this.startNewConsultation();
    for (const investigation of investigations) {
      await this.bahmni.newConsultationPage.addInvestigation(investigation);
    }
    await this.bahmni.newConsultationPage.saveConsultation();
  }
  async addInvestigation(investigationName: string) {
    await this.bahmni.newConsultationPage.addInvestigation(investigationName);
  }

  async verifyOrderAlreadyAdded(investigationName: string) {
    await this.bahmni.newConsultationPage.searchInvestigation(investigationName);
    const option = this.bahmni.newConsultationPage.getAlreadyAddedOption(investigationName);
    await this.bahmni.newConsultationPage.waitForSearchDebounce(3000);
    await expect(option).toBeVisible();
    await expect(option).toHaveAttribute('disabled', '');
    await this.bahmni.newConsultationPage.closeInvestigationsDropdown();
  }

  async saveConsultation() {
    await this.bahmni.newConsultationPage.saveConsultation();
  }

  async cancelConsultation() {
    await this.bahmni.newConsultationPage.cancelConsultation();
  }

  async addConditionAndDiagnosisInConsultation(condition: string, diagnosis: string) {
    await this.startNewConsultation();
    await this.bahmni.newConsultationPage.addCondition(condition);
    await this.bahmni.newConsultationPage.addDiagnosis(diagnosis);
    await this.bahmni.newConsultationPage.saveDiagnosesAndConditions();
  }

  async navigateToPatientClinical(patientId: string) {
    await this.bahmni.homePage.goto();
    await this.bahmni.homePage.navigateToModule(this.bahmni.homePage.MODULES.CLINICAL);
    await this.bahmni.activePatientsPage.selectPatientById(patientId);
  }

  async navigateToClinicalFromHome(patientId: string) {
    await this.bahmni.homePage.navigateToModule(this.bahmni.homePage.MODULES.CLINICAL);
    await this.bahmni.activePatientsPage.selectPatientById(patientId);
  }

  async verifyAllergyDisplayed(allergyData: AllergyData) {
    const allergens = await this.bahmni.clinicalPage.getDisplayedAllergens();
    expect(allergens).toContainItemMatching(allergyData.allergen);
    const reactions = await this.bahmni.clinicalPage.getDisplayedAllergyReactions();
    expect(reactions).toContainItemMatching(allergyData.reaction);
    const severity = await this.bahmni.clinicalPage.getDisplayedAllergySeverity(allergyData.allergen);
    expect(severity.toLowerCase()).toBe(allergyData.severity.toLowerCase());
    if (allergyData.note !== undefined) {
      await this.bahmni.clinicalPage.openAllergyNote(allergyData.allergen);
      await expect(this.bahmni.clinicalPage.getAllergyNoteContent(allergyData.allergen)).toHaveText(allergyData.note);
    }
  }

  async verifyOrderDisplayed(name: string, section: 'Lab Investigations' | 'Procedures' | 'Radiology Investigations') {
    const displayName = name.replace(/ \(Panel\)$/, '');
    await this.bahmni.clinicalPage.navigateToSection(section);
    await expect(this.bahmni.clinicalPage.getSectionArticle(section)).toContainText(displayName);
  }

  async verifyConditionDisplayed(conditionName: string, tab: 'Active' | 'Inactive' = 'Active') {
    const conditions = await this.bahmni.clinicalPage.getDisplayedConditionNames(tab);
    expect(conditions).toContainItemMatching(conditionName);
    const status = await this.bahmni.clinicalPage.getDisplayedConditionStatus(conditionName, tab);
    expect(status.toLowerCase()).toBe(tab.toLowerCase());
  }

  async markConditionAsInactive(conditionName: string) {
    await this.bahmni.clinicalPage.markConditionAsInactive(conditionName);
  }

  async verifyDiagnosisDisplayed(diagnosisName: string) {
    const diagnoses = await this.bahmni.clinicalPage.getDisplayedDiagnosisNames();
    expect(diagnoses).toContainItemMatching(diagnosisName);
  }

  async verifyMedicationDisplayed(medication: MedicationData) {
    const displayName = medication.name.split(/\s+\(/)[0];
    const medications = await this.bahmni.clinicalPage.getDisplayedMedicationNames();
    expect(medications).toContainItemMatching(displayName);
  }

  /**
   * Verifies that the medication row in the Medications section displays the
   * expected dosage, frequency, duration, duration unit, and instructions.
   */
  async verifyMedicationDetailsDisplayed(medication: MedicationData): Promise<void> {
    const displayName = medication.name.split(/\s+\(/)[0];
    await this.bahmni.clinicalPage.navigateToSection('Medications');
    await this.bahmni.clinicalPage.waitForMedicationRowToContain(displayName, medication.frequency);
    const row = this.bahmni.clinicalPage.getDisplayedMedicationRow(displayName);
    await expect(row).toContainText(displayName);
    await expect(row).toContainText(medication.dosage.toString());
    await expect(row).toContainText(medication.frequency);
    await expect(row).toContainText(medication.duration.toString());
    await expect(row).toContainText(new RegExp(medication.durationUnit, 'i'));
    await expect(row).toContainText(medication.instructions);
  }

  /**
   * Stops an existing medication on the consultation by opening its row's
   * overflow menu, filling the stop form (date defaults to today), and saving.
   */
  async stopMedicationInConsultation(medicationName: string, reason: string, note: string): Promise<void> {
    await this.bahmni.clinicalPage.clickStopMedication(medicationName);
    await this.bahmni.newConsultationPage.fillStopMedicationForm(reason, note);
    await this.bahmni.newConsultationPage.saveConsultation();
    await this.bahmni.clinicalPage.waitForDashboardDataReady();
  }

  /**
   * Verifies that the medication appears as stopped under the All tab of the
   * Medications section with the expected stop reason.
   */
  async verifyMedicationStopped(medicationName: string, reason: string): Promise<void> {
    const displayName = medicationName.split(/\s+\(/)[0];
    await this.bahmni.clinicalPage.navigateToSection('Medications');
    await this.bahmni.clinicalPage.switchMedicationTab('All');

    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const yyyy = today.getFullYear();
    const todayLabel = `${mm}/${dd}/${yyyy}`;
    await this.bahmni.clinicalPage.expandMedicationEncounter(todayLabel);

    const article = this.bahmni.clinicalPage.getMedicationsArticle();
    await expect(article).toContainText(displayName);
    await expect(article).toContainText(/Stopped/i);
    await expect(article).toContainText(reason);
  }

  async verifyVaccinationDisplayed(vaccination: MedicationData) {
    const displayName = vaccination.name.split(/\s+\(/)[0];
    const vaccinations = await this.bahmni.clinicalPage.getDisplayedVaccinationNames();
    expect(vaccinations).toContainItemMatching(displayName);
  }

  async verifyAnemiaLabResults(reportData: AnemiaReportData) {
    await this.bahmni.clinicalPage.navigateToSection('Lab Investigations');

    const haemoglobinCell = this.bahmni.clinicalPage.getLabResultValueCell('Haemoglobin');
    await expect(haemoglobinCell).toContainText(reportData.haemoglobin.value.toString());
    await expect(haemoglobinCell).toContainText(reportData.haemoglobin.unit);
    await expect(haemoglobinCell).toHaveClass(/abnormalResult/);
    await expect(this.bahmni.clinicalPage.getLabReferenceRangeCell('Haemoglobin')).toHaveText('10.4 - 17.8');

    const hematocritCell = this.bahmni.clinicalPage.getLabResultValueCell('Hematocrit');
    await expect(hematocritCell).toContainText(reportData.hematocrit.value.toString());
    await expect(hematocritCell).toContainText(reportData.hematocrit.unit);
    await expect(hematocritCell).toHaveClass(/abnormalResult/);
    await expect(this.bahmni.clinicalPage.getLabReferenceRangeCell('Hematocrit')).toHaveText('32.3 - 51.9');

    const plateletsCell = this.bahmni.clinicalPage.getLabResultValueCell('Platelets');
    await expect(plateletsCell).toContainText(reportData.platelets.value.toString());
    await expect(plateletsCell).toContainText(reportData.platelets.unit);
    await expect(plateletsCell).toHaveClass(/abnormalResult/);
    await expect(this.bahmni.clinicalPage.getLabReferenceRangeCell('Platelets')).toHaveText('134 - 419');

    const sickleCellCell = this.bahmni.clinicalPage.getLabResultValueCell('Sickle cell screening test');
    await expect(sickleCellCell).toContainText(reportData.sickleCellTest);
    await expect(sickleCellCell).toHaveClass(/abnormalResult/);

    const reticulocytesCell = this.bahmni.clinicalPage.getLabResultValueCell('Reticulocytes (%)');
    await expect(reticulocytesCell).toContainText(reportData.reticulocytes.value.toString());
    await expect(reticulocytesCell).toContainText(reportData.reticulocytes.unit);
    await expect(reticulocytesCell).not.toHaveClass(/abnormalResult/);
  }

  async verifyAtypicalLymphLabResults(reportData: AtypicalLymphReportData) {
    await this.bahmni.clinicalPage.navigateToSection('Lab Investigations');

    const cell = this.bahmni.clinicalPage.getLabResultValueCell('Absolute atypical lymphocyte count');
    await expect(cell).toContainText(reportData.atypicalLymphCount.value.toString());
    await expect(cell).toContainText(reportData.atypicalLymphCount.unit);
    await expect(cell).not.toHaveClass(/abnormalResult/);
    await expect(this.bahmni.clinicalPage.getLabReferenceRangeCell('Absolute atypical lymphocyte count')).toHaveText(
      '1 - 50'
    );
  }

  async verifyRadiologyReport(reportData: EchocardiogramReportData) {
    await this.bahmni.clinicalPage.navigateToSection('Radiology Investigations');
    await expect(this.bahmni.clinicalPage.getRadiologyViewReportLink()).toBeVisible();
    await this.bahmni.clinicalPage.getRadiologyViewReportLink().click();
    const reportPanel = this.bahmni.clinicalPage.getRadiologyReportPanel();
    await reportPanel.waitFor({ state: 'visible' });

    await expect(this.bahmni.clinicalPage.getRadiologyObservationValue('Summary')).toContainText(reportData.summary);
    await expect(this.bahmni.clinicalPage.getRadiologyObservationValue('Impression')).toContainText(
      reportData.impression
    );
    await expect(this.bahmni.clinicalPage.getRadiologyObservationValue('Radiology Notes')).toContainText(
      reportData.radiologyNotes
    );
    await expect(this.bahmni.clinicalPage.getRadiologyObservationValue('Ejection Fraction')).toContainText(
      reportData.ejectionFraction.value.toString()
    );
    await expect(this.bahmni.clinicalPage.getRadiologyObservationValue('Echocardiogram comment')).toContainText(
      reportData.echocardiogramComment
    );
    await expect(
      this.bahmni.clinicalPage.getRadiologyObservationValue('Left ventricular systolic function')
    ).toContainText(reportData.leftVentricularSystolicFunction);
    await expect(
      this.bahmni.clinicalPage.getRadiologyObservationValue(
        'Left ventricular volume estimated from ultrasound (qualitative)'
      )
    ).toContainText(reportData.leftVentricularVolume);
    await expect(
      this.bahmni.clinicalPage.getRadiologyObservationValue('Heart and great vessels examination (text)')
    ).toContainText(reportData.heartAndGreatVessels);
    await expect(this.bahmni.clinicalPage.getRadiologyObservationValue('No pericardial effusion')).toContainText(
      reportData.noPericardialEffusion
    );
    await expect(this.bahmni.clinicalPage.getRadiologyObservationValue('Radiology results')).toContainText(
      reportData.radiologyResults
    );
    await expect(this.bahmni.clinicalPage.getRadiologyObservationValue('Cardiac examination (text)')).toContainText(
      reportData.cardiacExamination
    );
    await expect(
      this.bahmni.clinicalPage.getRadiologyObservationValue('Improvement seen on echocardiogram')
    ).toContainText(reportData.improvementSeen);
    await expect(
      this.bahmni.clinicalPage.getRadiologyObservationValue('Combined right and left lateral ventricular size (mm)')
    ).toContainText(reportData.combinedVentricularSize.value.toString());
    await expect(
      this.bahmni.clinicalPage.getRadiologyObservationValue('Evidence of cardiac enlargement')
    ).toContainText(reportData.evidenceOfCardiacEnlargement);
    await expect(this.bahmni.clinicalPage.getRadiologyObservationValue('Abnormal heart sounds')).toContainText(
      reportData.abnormalHeartSounds
    );

    await expect(this.bahmni.clinicalPage.getRadiologyObservationValue('Ejection Fraction')).toHaveClass(
      /_abnormalValue_/
    );
    await expect(
      this.bahmni.clinicalPage.getRadiologyObservationValue('Heart and great vessels examination (text)')
    ).toHaveClass(/_abnormalValue_/);
    await expect(this.bahmni.clinicalPage.getRadiologyObservationValue('Abnormal heart sounds')).toHaveClass(
      /_abnormalValue_/
    );
  }

  async verifyNewConsultationButtonNotVisible() {
    await expect(this.bahmni.clinicalPage.getNewConsultationButton()).not.toBeVisible();
  }

  async verifyCbcLabResults(reportData: CbcPanelResults) {
    await this.bahmni.clinicalPage.navigateToSection('Lab Investigations');

    const hematocritCell = this.bahmni.clinicalPage.getLabResultValueCell('Hematocrit');
    await expect(hematocritCell).toContainText(reportData.hematocrit.value.toString());
    await expect(hematocritCell).toContainText(reportData.hematocrit.unit);
    await expect(hematocritCell).not.toHaveClass(/abnormalResult/);
    await expect(this.bahmni.clinicalPage.getLabReferenceRangeCell('Hematocrit')).toHaveText('32.3 - 51.9');

    const haemoglobinCell = this.bahmni.clinicalPage.getLabResultValueCell('Haemoglobin');
    await expect(haemoglobinCell).toContainText(reportData.haemoglobin.value.toString());
    await expect(haemoglobinCell).toContainText(reportData.haemoglobin.unit);
    await expect(haemoglobinCell).toHaveClass(/abnormalResult/);
    await expect(this.bahmni.clinicalPage.getLabReferenceRangeCell('Haemoglobin')).toHaveText('10.4 - 17.8');

    const mchcCell = this.bahmni.clinicalPage.getLabResultValueCell('Mean cell hemoglobin concentration');
    await expect(mchcCell).toContainText(reportData.mchc.value.toString());
    await expect(mchcCell).toContainText(reportData.mchc.unit);
    await expect(mchcCell).not.toHaveClass(/abnormalResult/);
    await expect(this.bahmni.clinicalPage.getLabReferenceRangeCell('Mean cell hemoglobin concentration')).toHaveText(
      '33 - 37'
    );

    const mchCell = this.bahmni.clinicalPage.getLabResultValueCell('Mean corpuscular hemoglobin');
    await expect(mchCell).toContainText(reportData.mch.value.toString());
    await expect(mchCell).toContainText(reportData.mch.unit);
    await expect(mchCell).not.toHaveClass(/abnormalResult/);
    await expect(this.bahmni.clinicalPage.getLabReferenceRangeCell('Mean corpuscular hemoglobin')).toHaveText(
      '26 - 34'
    );

    const mcvCell = this.bahmni.clinicalPage.getLabResultValueCell('Mean corpuscular volume');
    await expect(mcvCell).toContainText(reportData.mcv.value.toString());
    await expect(mcvCell).toContainText(reportData.mcv.unit);
    await expect(mcvCell).not.toHaveClass(/abnormalResult/);
    await expect(this.bahmni.clinicalPage.getLabReferenceRangeCell('Mean corpuscular volume')).toHaveText('80 - 100');

    const plateletsCell = this.bahmni.clinicalPage.getLabResultValueCell('Platelets');
    await expect(plateletsCell).toContainText(reportData.platelets.value.toString());
    await expect(plateletsCell).toContainText(reportData.platelets.unit);
    await expect(plateletsCell).toHaveClass(/abnormalResult/);
    await expect(this.bahmni.clinicalPage.getLabReferenceRangeCell('Platelets')).toHaveText('134 - 419');

    const rbcCell = this.bahmni.clinicalPage.getLabResultValueCell('Red blood cells');
    await expect(rbcCell).toContainText(reportData.rbc.value.toString());
    await expect(rbcCell).toContainText(reportData.rbc.unit);
    await expect(rbcCell).not.toHaveClass(/abnormalResult/);
    await expect(this.bahmni.clinicalPage.getLabReferenceRangeCell('Red blood cells')).toHaveText('4 - 6.1');

    const rdwCell = this.bahmni.clinicalPage.getLabResultValueCell('Red cell distribution width');
    await expect(rdwCell).toContainText(reportData.rdw.value.toString());
    await expect(rdwCell).toContainText(reportData.rdw.unit);
    await expect(rdwCell).not.toHaveClass(/abnormalResult/);
    await expect(this.bahmni.clinicalPage.getLabReferenceRangeCell('Red cell distribution width')).toHaveText(
      '10 - 20'
    );

    const wbcCell = this.bahmni.clinicalPage.getLabResultValueCell('White blood cells');
    await expect(wbcCell).toContainText(reportData.wbc.value.toString());
    await expect(wbcCell).toContainText(reportData.wbc.unit);
    await expect(wbcCell).toHaveClass(/abnormalResult/);
    await expect(this.bahmni.clinicalPage.getLabReferenceRangeCell('White blood cells')).toHaveText('4 - 11');

    const neutrophilsCell = this.bahmni.clinicalPage.getLabResultValueCell('Neutrophils (%) - microscopic exam');
    await expect(neutrophilsCell).toContainText(reportData.neutrophils.value.toString());
    await expect(neutrophilsCell).toContainText(reportData.neutrophils.unit);
    await expect(neutrophilsCell).not.toHaveClass(/abnormalResult/);

    const lymphocytesCell = this.bahmni.clinicalPage.getLabResultValueCell('Lymphocytes (%) - microscopic exam');
    await expect(lymphocytesCell).toContainText(reportData.lymphocytes.value.toString());
    await expect(lymphocytesCell).toContainText(reportData.lymphocytes.unit);
    await expect(lymphocytesCell).not.toHaveClass(/abnormalResult/);

    const mixedCell = this.bahmni.clinicalPage.getLabResultValueCell(
      'Combined % of monocytes, eosinophils and basophils'
    );
    await expect(mixedCell).toContainText(reportData.mixed.value.toString());
    await expect(mixedCell).toContainText(reportData.mixed.unit);
    await expect(mixedCell).not.toHaveClass(/abnormalResult/);
    await expect(
      this.bahmni.clinicalPage.getLabReferenceRangeCell('Combined % of monocytes, eosinophils and basophils')
    ).toHaveText('1 - 10');
  }

  async verifyTshLabResult(reportData: LabValueEntry) {
    await this.bahmni.clinicalPage.navigateToSection('Lab Investigations');

    const tshCell = this.bahmni.clinicalPage.getLabResultValueCell('Thyroid stimulating hormone test');
    await expect(tshCell).toContainText(reportData.value.toString());
    await expect(tshCell).toContainText(reportData.unit);
    await expect(tshCell).not.toHaveClass(/abnormalResult/);
  }
}
