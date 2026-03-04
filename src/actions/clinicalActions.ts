import { expect } from '@playwright/test';
import { PageFactory } from '../pages/PageFactory';
import { AllergyData } from '../../test-data/allergyData';
import { MedicationData } from '../../test-data/medicationData';
import { VitalsData } from '../../test-data/vitalsData';
import { AdmissionLetterData } from '../../test-data/admissionLetterData';

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

  async addVitalsInConsultation(vitalsData: VitalsData) {
    await this.startNewConsultation();
    await this.bahmni.newConsultationPage.openVitalsForm();
    await this.bahmni.vitalsForm.waitForFormToLoad();
    await this.bahmni.vitalsForm.fillAndSaveVitals(vitalsData);
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

  async addAdmissionLetterInConsultation(admissionLetterData: AdmissionLetterData) {
    await this.startNewConsultation();
    await this.bahmni.newConsultationPage.searchAndOpenObservationForm('Admission Letter');
    await this.bahmni.admissionLetterForm.waitForFormToLoad();
    await this.bahmni.admissionLetterForm.fillAndSaveAdmissionLetter(admissionLetterData);
    await this.bahmni.newConsultationPage.saveConsultation();
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

  async verifyAllergyDisplayed(allergyData: AllergyData) {
    const allergens = await this.bahmni.clinicalPage.getDisplayedAllergens();
    expect(allergens.some((a) => a.toLowerCase().includes(allergyData.allergen.toLowerCase()))).toBe(true);
    const reactions = await this.bahmni.clinicalPage.getDisplayedAllergyReactions();
    expect(reactions.some((r) => r.toLowerCase().includes(allergyData.reaction.toLowerCase()))).toBe(true);
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
    expect(conditions.some((c) => c.toLowerCase().includes(conditionName.toLowerCase()))).toBe(true);
  }

  async verifyDiagnosisDisplayed(diagnosisName: string) {
    const diagnoses = await this.bahmni.clinicalPage.getDisplayedDiagnosisNames();
    expect(diagnoses.some((d) => d.toLowerCase().includes(diagnosisName.toLowerCase()))).toBe(true);
  }

  async verifyMedicationDisplayed(medication: MedicationData) {
    // The UI displays only the base drug name, stripping " (Form)- GenericName" suffix
    const displayName = medication.name.split(/\s+\(/)[0].toLowerCase();
    const medications = await this.bahmni.clinicalPage.getDisplayedMedicationNames();
    expect(medications.some((m) => m.toLowerCase().includes(displayName))).toBe(true);
  }

  async verifyVaccinationDisplayed(vaccination: MedicationData) {
    // The UI displays only the base drug name, stripping " (Form)- GenericName" suffix
    const displayName = vaccination.name.split(/\s+\(/)[0].toLowerCase();
    const vaccinations = await this.bahmni.clinicalPage.getDisplayedVaccinationNames();
    expect(vaccinations.some((v) => v.toLowerCase().includes(displayName))).toBe(true);
  }

  async verifyObservationsSection(pulse: string) {
    await this.bahmni.clinicalPage.navigateToSection('Basic Details');
    await expect(this.bahmni.clinicalPage.getBasicDetailsArticle()).toContainText(pulse);
  }

  async verifyVitalsFlowSheet(vitals: VitalsData) {
    await this.bahmni.clinicalPage.navigateToSection('Vitals Flow Sheet');
    const table = this.bahmni.clinicalPage.getVitalsFlowSheetTable();
    await expect(table).toContainText(vitals.pulse);
    await expect(table).toContainText(vitals.oxygenSaturation);
    await expect(table).toContainText(vitals.systolicBP);
    await expect(table).toContainText(vitals.diastolicBP);
  }

  async openObservationForm(formName: string) {
    await this.bahmni.clinicalPage.openObservationFormModal(formName);
  }

  async verifyVitalsData(vitalsData: VitalsData) {
    const modal = this.bahmni.vitalsForm.getFormModal();
    await expect(modal).toContainText(vitalsData.pulse);
    await expect(modal).toContainText(vitalsData.oxygenSaturation);
    await expect(modal).toContainText(vitalsData.temperature);
    await expect(modal).toContainText(vitalsData.systolicBP);
    await expect(modal).toContainText(vitalsData.diastolicBP);
  }

  async verifyAdmissionLetterData(admissionLetterData: AdmissionLetterData) {
    const modal = this.bahmni.admissionLetterForm.getFormModal();
    await expect(modal).toContainText(admissionLetterData.referringToHospital);
    await expect(modal).toContainText(admissionLetterData.comments);
    await expect(modal).toContainText(admissionLetterData.referredToDoctor);
  }

  async verifyDuplicateMedicationError() {
    const text = await this.bahmni.newConsultationPage.getDuplicateMedicationNotificationText();
    expect(text).toContain(DUPLICATE_DRUG_ERROR);
  }
}
