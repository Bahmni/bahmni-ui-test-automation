import { expect } from '../fixtures/expectExtensions';
import { PageFactory } from '../pages/PageFactory';
import { VitalsData } from '../../../test-data/common/vitalsData';
import { AdmissionLetterData } from '../../../test-data/common/admissionLetterData';
import { DeathNoteData } from '../../../test-data/common/deathNoteData';
import { DiabetesProgressData } from '../../../test-data/common/diabetesProgressData';
import { MalariaData } from '../../../test-data/common/malariaData';
import { FitnessEvaluationData } from '../../../test-data/common/fitnessEvaluationData';
import { HistoryAndExaminationData } from '../../../test-data/common/historyAndExaminationData';

export class ObservationActions {
  constructor(private readonly bahmni: PageFactory) {}

  private async startNewConsultation() {
    const mode = await this.bahmni.clinicalPage.clickConsultationAction();
    if (mode === 'continue') {
      await this.bahmni.newConsultationPage.waitForContinueConsultationPageToOpen();
    } else {
      await this.bahmni.newConsultationPage.waitForNewConsultationPageToOpen();
    }
  }

  async addVitalsInConsultation(vitalsData: VitalsData) {
    await this.startNewConsultation();
    await this.bahmni.newConsultationPage.openVitalsForm();
    await this.bahmni.vitalsForm.waitForFormToLoad();
    await this.bahmni.vitalsForm.fillAndSaveVitals(vitalsData);
    await this.bahmni.newConsultationPage.saveConsultation();
  }

  async addSecondVitalsInConsultation(vitalsData: VitalsData) {
    await this.startNewConsultation();
    await this.bahmni.newConsultationPage.searchAndOpenObservationForm('Second Vitals');
    await this.bahmni.secondVitalsForm.waitForFormToLoad();
    await this.bahmni.secondVitalsForm.fillAndSaveSecondVitals(vitalsData);
    await this.bahmni.newConsultationPage.saveConsultation();
  }

  async addHistoryAndExaminationInConsultation(data: HistoryAndExaminationData) {
    await this.startNewConsultation();
    await this.bahmni.newConsultationPage.openHistoryAndExaminationForm();
    await this.bahmni.historyAndExaminationForm.waitForFormToLoad();
    await this.bahmni.historyAndExaminationForm.fillAndSaveHistoryAndExamination(data);
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

  async ensureFitnessEvaluationFormPublished() {
    await this.bahmni.implementerInterfacePage.ensureFormPublished(
      'test-data/common/Fitness_Evaluation_1.json',
      'Fitness Evaluation'
    );
  }

  async addFitnessEvaluationInConsultation(data: FitnessEvaluationData) {
    await this.startNewConsultation();
    await this.bahmni.newConsultationPage.searchAndOpenObservationForm('Fitness Evaluation');
    await this.bahmni.fitnessEvaluationObsFormPage.waitForFormToLoad();
    await this.bahmni.fitnessEvaluationObsFormPage.fillAndSaveFitnessEvaluation(data);
    await this.bahmni.newConsultationPage.saveConsultation();
  }

  async openObservationForm(formName: string) {
    await this.bahmni.clinicalPage.openObservationFormModal(formName);
  }

  async editFitnessEvaluationInConsultation(data: FitnessEvaluationData, fieldToClear: string) {
    await this.bahmni.clinicalPage.editObservationForm('Fitness Evaluation');
    await this.bahmni.fitnessEvaluationObsFormPage.waitForEditFormToLoad();
    await this.bahmni.fitnessEvaluationObsFormPage.fillFitnessEvaluationForm(data);
    await this.bahmni.fitnessEvaluationObsFormPage.clearCodedField(fieldToClear);
    await this.bahmni.fitnessEvaluationObsFormPage.saveEditedForm();
  }

  async editVitalsInConsultation(data: VitalsData) {
    await this.bahmni.clinicalPage.editObservationForm('Vitals');
    await this.bahmni.vitalsForm.waitForEditFormToLoad();
    await this.bahmni.vitalsForm.fillVitalsForm(data);
    await this.bahmni.vitalsForm.saveEditedForm();
  }

  async editHistoryAndExaminationInConsultation(data: HistoryAndExaminationData) {
    await this.bahmni.clinicalPage.openObservationFormModal('History and Examination');
    await this.bahmni.clinicalPage.editObservationFormFromModal();
    await this.bahmni.historyAndExaminationForm.waitForEditFormToLoad();
    await this.bahmni.historyAndExaminationForm.fillHistoryAndExaminationForm(data);
    await this.bahmni.historyAndExaminationForm.saveEditedForm();
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

  async verifyAbnormalVitalsHighlighted(abnormalValues: string[], normalValue: string) {
    const abnormalElements = this.bahmni.vitalsForm.getAbnormalValueElements();
    for (const value of abnormalValues) {
      await expect(abnormalElements.filter({ hasText: value }).first()).toBeVisible();
    }
    await expect(abnormalElements.filter({ hasText: normalValue })).toHaveCount(0);
  }

  async verifyVitalsDataUpdated(vitalsData: VitalsData) {
    const modal = this.bahmni.vitalsForm.getFormModal();
    await expect(modal).toContainText(vitalsData.pulse);
    await expect(modal).toContainText(vitalsData.oxygenSaturation);
    await expect(modal).toContainText(vitalsData.temperature);
    await expect(modal).toContainText(vitalsData.systolicBP);
    await expect(modal).toContainText(vitalsData.diastolicBP);
  }

  async verifyHistoryAndExaminationData(data: HistoryAndExaminationData) {
    const modal = this.bahmni.historyAndExaminationForm.getFormModal();
    if (data.historyOfPresentIllness) {
      await expect(modal).toContainText(data.historyOfPresentIllness);
    }
    if (data.smokingStatus) {
      await expect(modal).toContainText(data.smokingStatus);
    }
    if (data.additionalChiefComplaint) {
      await expect(modal).toContainText(data.additionalChiefComplaint);
    }
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

  async verifyFitnessEvaluationData(data: FitnessEvaluationData) {
    const modal = this.bahmni.fitnessEvaluationObsFormPage.getFormModal();
    await expect(modal).toContainText(data.heightCm);
    await expect(modal).toContainText(data.weightKg);
    await expect(modal).toContainText(data.pulse);
  }

  async verifyFitnessEvaluationPatientName(firstName: string, lastName: string) {
    const modal = this.bahmni.fitnessEvaluationObsFormPage.getFormModal();
    await expect(modal).toContainText(firstName);
    await expect(modal).toContainText(lastName);
  }

  async verifyFitnessEvaluationDataUpdated(data: FitnessEvaluationData, clearedFieldLabel: string) {
    const modal = this.bahmni.fitnessEvaluationObsFormPage.getFormModal();
    await expect(modal).toContainText(data.heightCm);
    await expect(modal).toContainText(data.weightKg);
    await expect(modal).toContainText(data.pulse);
    await expect(modal).not.toContainText(clearedFieldLabel);
  }
}
