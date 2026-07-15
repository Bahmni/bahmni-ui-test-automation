import { expect } from '../fixtures/expectExtensions';
import { PageFactory } from '../pages/PageFactory';
import { VitalsData } from '../../../test-data/common/vitalsData';
import { AdmissionLetterData } from '../../../test-data/common/admissionLetterData';
import { DeathNoteData } from '../../../test-data/common/deathNoteData';
import { DiabetesProgressData } from '../../../test-data/common/diabetesProgressData';
import { MalariaData } from '../../../test-data/common/malariaData';

export class ObservationActions {
  constructor(private readonly bahmni: PageFactory) {}

  private async startNewConsultation() {
    await this.bahmni.clinicalPage.clickNewConsultation();
    await this.bahmni.newConsultationPage.waitForNewConsultationPageToOpen();
  }

  async addVitalsInConsultation(vitalsData: VitalsData) {
    await this.startNewConsultation();
    await this.bahmni.newConsultationPage.openVitalsForm();
    await this.bahmni.vitalsForm.waitForFormToLoad();
    await this.bahmni.vitalsForm.fillAndSaveVitals(vitalsData);
    await this.bahmni.newConsultationPage.saveConsultation();
  }

  async addAdmissionLetterInConsultation(admissionLetterData: AdmissionLetterData) {
    await this.startNewConsultation();
    await this.bahmni.newConsultationPage.searchAndOpenObservationForm('Admission Letter');
    await this.bahmni.admissionLetterForm.waitForFormToLoad();
    await this.bahmni.admissionLetterForm.fillAndSaveAdmissionLetter(admissionLetterData);
    await this.bahmni.newConsultationPage.saveConsultation();
  }

  async addDeathNoteInConsultation(deathNoteData: DeathNoteData) {
    await this.startNewConsultation();
    await this.bahmni.newConsultationPage.searchAndOpenObservationForm('Death Note');
    await this.bahmni.deathNoteForm.waitForFormToLoad();
    await this.bahmni.deathNoteForm.fillAndSaveDeathNote(deathNoteData);
    await this.bahmni.newConsultationPage.saveConsultation();
  }

  async addDiabetesProgressInConsultation(data: DiabetesProgressData) {
    await this.startNewConsultation();
    await this.bahmni.newConsultationPage.searchAndOpenObservationForm('Diabetes Progress');
    await this.bahmni.diabetesProgressForm.waitForFormToLoad();
    await this.bahmni.diabetesProgressForm.fillAndSaveDiabetesProgress(data);
    await this.bahmni.newConsultationPage.saveConsultation();
  }

  async addMalariaInConsultation(malariaData: MalariaData) {
    await this.startNewConsultation();
    await this.bahmni.newConsultationPage.searchAndOpenObservationForm('Malaria');
    await this.bahmni.malariaForm.waitForFormToLoad();
    await this.bahmni.malariaForm.fillAndSaveMalaria(malariaData);
    await this.bahmni.newConsultationPage.saveConsultation();
  }

  async openObservationForm(formName: string) {
    await this.bahmni.clinicalPage.openObservationFormModal(formName);
  }

  async verifyVitalsFlowSheet(vitals: VitalsData) {
    await this.bahmni.clinicalPage.navigateToSection('Vitals Flow Sheet');
    const table = this.bahmni.clinicalPage.getVitalsFlowSheetTable();
    await expect(table).toContainText(vitals.pulse);
    await expect(table).toContainText(vitals.oxygenSaturation);
    await expect(table).toContainText(vitals.systolicBP);
    await expect(table).toContainText(vitals.diastolicBP);
  }

  async verifyObservationsSection(pulse: string) {
    await this.bahmni.clinicalPage.navigateToSection('Basic Details');
    await expect(this.bahmni.clinicalPage.getBasicDetailsArticle()).toContainText(pulse);
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

  async verifyDeathNoteData(deathNoteData: DeathNoteData) {
    const modal = this.bahmni.deathNoteForm.getFormModal();
    await expect(modal).toContainText(deathNoteData.probableCause);
  }

  async verifyDiabetesProgressData(data: DiabetesProgressData) {
    const modal = this.bahmni.diabetesProgressForm.getFormModal();
    await expect(modal).toContainText(data.lastA1CResult);
    await expect(modal).toContainText(data.footExamination);
    await expect(modal).toContainText(data.eyeExaminationFindings);
  }

  async verifyMalariaData(malariaData: MalariaData) {
    const modal = this.bahmni.malariaForm.getFormModal();
    await expect(modal).toContainText(malariaData.rapidTestResult);
    await expect(modal).toContainText(malariaData.malariaRisk);
    await expect(modal).toContainText(malariaData.problemSeverity);
  }
}
