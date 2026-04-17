import { expect } from '../fixtures/clinicalFixture';
import { PageFactory } from '../pages/PageFactory';
import { AllergyData } from '../../../test-data/common/allergyData';
import { MedicationData } from '../../../test-data/common/medicationData';
import {
  AnemiaReportData,
  AtypicalLymphReportData,
  EchocardiogramReportData,
} from '../../../test-data/common/labOrderData';

export class ClinicalActions {
  constructor(private readonly bahmni: PageFactory) {}

  async startNewConsultation() {
    await this.bahmni.clinicalPage.clickNewConsultation();
    await this.bahmni.newConsultationPage.waitForNewConsultationPageToOpen();
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

  async addMedicationInConsultation(medicationData: MedicationData) {
    await this.startNewConsultation();
    await this.bahmni.newConsultationPage.addMedication(medicationData);
    await this.bahmni.newConsultationPage.saveConsultation();
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

  async addConditionAndDiagnosisInConsultation(condition: string, diagnosis: string) {
    await this.startNewConsultation();
    await this.bahmni.newConsultationPage.addCondition(condition);
    await this.bahmni.newConsultationPage.addDiagnosis(diagnosis);
    await this.bahmni.newConsultationPage.saveDiagnosesAndConditions();
  }

  async navigateToPatientClinical(patientId: string) {
    await this.bahmni.createPatientPage.navigateToHomePage();
    await this.bahmni.homePage.navigateToModule(this.bahmni.homePage.MODULES.CLINICAL);
    await this.bahmni.activePatientsPage.selectTab('new-active');
    await this.bahmni.activePatientsPage.selectPatientById(patientId);
  }

  async navigateToClinicalFromHome(patientId: string) {
    await this.bahmni.homePage.navigateToModule(this.bahmni.homePage.MODULES.CLINICAL);
    await this.bahmni.activePatientsPage.selectTab('new-active');
    await this.bahmni.activePatientsPage.selectPatientById(patientId);
  }

  async verifyAllergyDisplayed(allergyData: AllergyData) {
    const allergens = await this.bahmni.clinicalPage.getDisplayedAllergens();
    expect(allergens).toContainItemMatching(allergyData.allergen);
    const reactions = await this.bahmni.clinicalPage.getDisplayedAllergyReactions();
    expect(reactions).toContainItemMatching(allergyData.reaction);
  }

  async verifyInvestigationOrProcedureDisplayed(
    name: string,
    section: 'Lab Investigations' | 'Procedures' | 'Radiology Investigations'
  ) {
    const displayName = name.replace(/ \(Panel\)$/, '');
    await this.bahmni.clinicalPage.navigateToSection(section);
    await expect(this.bahmni.clinicalPage.getSectionArticle(section)).toContainText(displayName);
  }

  async verifyConditionDisplayed(conditionName: string) {
    const conditions = await this.bahmni.clinicalPage.getDisplayedConditionNames();
    expect(conditions).toContainItemMatching(conditionName);
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
}
