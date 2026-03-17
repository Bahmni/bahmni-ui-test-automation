import { expect } from '../fixtures/clinicalFixture';
import { PageFactory } from '../pages/PageFactory';
import { AllergyData } from '../../test-data/allergyData';
import { MedicationData } from '../../test-data/medicationData';

const DUPLICATE_DRUG_ERROR =
  'One or more drugs you are trying to order are already active. Please change the start date of the conflicting drug or remove them from the new prescription.';

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

  async searchMedicationInNewConsultation(medicationName: string) {
    await this.startNewConsultation();
    await this.bahmni.newConsultationPage.searchAndSelectMedication(medicationName);
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
    // The UI displays panel investigations without the " (Panel)" suffix
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
    // The UI displays only the base drug name, stripping " (Form)- GenericName" suffix
    const displayName = medication.name.split(/\s+\(/)[0];
    const medications = await this.bahmni.clinicalPage.getDisplayedMedicationNames();
    expect(medications).toContainItemMatching(displayName);
  }

  async verifyVaccinationDisplayed(vaccination: MedicationData) {
    // The UI displays only the base drug name, stripping " (Form)- GenericName" suffix
    const displayName = vaccination.name.split(/\s+\(/)[0];
    const vaccinations = await this.bahmni.clinicalPage.getDisplayedVaccinationNames();
    expect(vaccinations).toContainItemMatching(displayName);
  }

  async verifyNewConsultationButtonNotVisible() {
    await expect(this.bahmni.clinicalPage.getNewConsultationButton()).not.toBeVisible();
  }

  async verifyDuplicateMedicationError() {
    const text = await this.bahmni.newConsultationPage.getDuplicateMedicationNotificationText();
    expect(text).toContain(DUPLICATE_DRUG_ERROR);
  }
}
