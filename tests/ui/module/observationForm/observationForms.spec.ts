import { test as base } from '@playwright/test';
import { test, expect } from '../../../../src/ui/fixtures/apiClinicalFixture';
import { test as fitnessEvaluationTest } from '../../../../src/ui/fixtures/observationFormFixture';
import { PageFactory } from '../../../../src/ui/pages/PageFactory';
import { ActionFactory } from '../../../../src/ui/actions/ActionFactory';
import { admissionLetterFaker } from '../../../../test-data/common/admissionLetterData';
import { deathNoteFaker } from '../../../../test-data/common/deathNoteData';
import { diabetesProgressFaker } from '../../../../test-data/common/diabetesProgressData';
import { malariaFaker } from '../../../../test-data/common/malariaData';
import { vitalsFaker } from '../../../../test-data/common/vitalsData';
import { fitnessEvaluationFaker } from '../../../../test-data/common/fitnessEvaluationData';
import { historyAndExaminationFaker } from '../../../../test-data/common/historyAndExaminationData';

test.describe('Observation form Tests', { tag: ['@regression'] }, () => {
  test('Add admission letter observation form in consultation', async ({ clinicalSetup }) => {
    test.setTimeout(60000);
    const { actions, bahmni, page } = clinicalSetup;
    const admissionLetterData = admissionLetterFaker.simpleAdmissionLetter();

    await expect(page).toHaveURL(/.*clinical\/.*/);
    await actions.observation.addAdmissionLetterInConsultation(admissionLetterData);
    await actions.observation.openObservationForm('Admission Letter');
    await actions.observation.verifyAdmissionLetterData(admissionLetterData);
    await bahmni.admissionLetterForm.closeModal();
  });

  test('Add vitals observation form in consultation', async ({ clinicalSetup }) => {
    test.setTimeout(60000);
    const { actions, bahmni, page } = clinicalSetup;
    const vitalsData = vitalsFaker.normalVitals();

    await expect(page).toHaveURL(/.*clinical\/.*/);
    await actions.observation.addVitalsInConsultation(vitalsData);
    await actions.observation.verifyObservationsSection(vitalsData.pulse);
    await actions.observation.verifyVitalsFlowSheet(vitalsData);
    await actions.observation.openObservationForm('Vitals');
    await actions.observation.verifyVitalsData(vitalsData);
    await bahmni.vitalsForm.closeModal();
  });

  test('Add vitals with abnormal values and verify they are highlighted in the view modal', async ({
    clinicalSetup,
  }) => {
    test.setTimeout(60000);
    const { actions, bahmni, page } = clinicalSetup;
    const vitalsData = vitalsFaker.abnormalVitals();

    await expect(page).toHaveURL(/.*clinical\/.*/);
    await actions.observation.addSecondVitalsInConsultation(vitalsData);
    await actions.observation.openObservationForm('Second Vitals');
    await actions.observation.verifyAbnormalVitalsHighlighted(
      [vitalsData.pulse, vitalsData.temperature, vitalsData.systolicBP],
      vitalsData.oxygenSaturation
    );
    await bahmni.secondVitalsForm.closeModal();
  });

  test('Add death note observation form in consultation', async ({ clinicalSetup }) => {
    test.setTimeout(90000);
    const { actions, bahmni, page } = clinicalSetup;
    const deathNoteData = deathNoteFaker.simpleDeathNote();

    await expect(page).toHaveURL(/.*clinical\/.*/);
    await actions.observation.addDeathNoteInConsultation(deathNoteData);
    await actions.observation.openObservationForm('Death Note');
    await actions.observation.verifyDeathNoteData(deathNoteData);
    await bahmni.deathNoteForm.closeModal();
  });

  test('Add diabetes progress observation form in consultation', async ({ clinicalSetup }) => {
    test.setTimeout(90000);
    const { actions, bahmni, page } = clinicalSetup;
    const diabetesProgressData = diabetesProgressFaker.simpleProgress();

    await expect(page).toHaveURL(/.*clinical\/.*/);
    await actions.observation.addDiabetesProgressInConsultation(diabetesProgressData);
    await actions.observation.openObservationForm('Diabetes Progress');
    await actions.observation.verifyDiabetesProgressData(diabetesProgressData);
    await bahmni.diabetesProgressForm.closeModal();
  });

  test('Add malaria observation form in consultation', async ({ clinicalSetup }) => {
    test.setTimeout(90000);
    const { actions, bahmni, page } = clinicalSetup;
    const malariaData = malariaFaker.simpleMalaria();

    await expect(page).toHaveURL(/.*clinical\/.*/);
    await actions.observation.addMalariaInConsultation(malariaData);
    await actions.observation.openObservationForm('Malaria');
    await actions.observation.verifyMalariaData(malariaData);
    await bahmni.malariaForm.closeModal();
  });

  base('Import and publish Fitness Evaluation form', { tag: ['@regression'] }, async ({ page }) => {
    base.setTimeout(60000);
    const bahmni = new PageFactory(page);
    const actions = new ActionFactory(bahmni);

    await actions.auth.loginAsAdmin();
    await actions.observation.ensureFitnessEvaluationFormPublished();

    expect(await bahmni.implementerInterfacePage.isFormPublished('Fitness Evaluation')).toBe(true);
  });

  fitnessEvaluationTest(
    'Add fitness evaluation observation form in consultation',
    { tag: ['@regression'] },
    async ({ clinicalSetup }) => {
      fitnessEvaluationTest.setTimeout(90000);
      const { actions, bahmni, page, api, patientUuid } = clinicalSetup;
      const fitnessEvaluationData = fitnessEvaluationFaker.simpleFitnessEvaluation();

      const { body: patient } = await api.patient.getById(patientUuid);
      const expectedFirstName = patient.name[0].given[0];
      const expectedLastName = patient.name[0].family;

      await expect(page).toHaveURL(/.*clinical\/.*/);
      await actions.observation.addFitnessEvaluationInConsultation(fitnessEvaluationData);
      await actions.observation.openObservationForm('Fitness Evaluation');
      await actions.observation.verifyFitnessEvaluationData(fitnessEvaluationData);
      await actions.observation.verifyFitnessEvaluationPatientName(expectedFirstName, expectedLastName);
      await bahmni.fitnessEvaluationObsFormPage.closeModal();
    }
  );

  // The logged-in test user is an admin/superuser and therefore already holds the
  // "Edit Conditions" privilege required to edit a previously saved observation form.
  fitnessEvaluationTest(
    'Fill pending fields in Fitness Evaluation form and verify saved values',
    { tag: ['@regression'] },
    async ({ clinicalSetup }) => {
      fitnessEvaluationTest.setTimeout(90000);
      const { actions, bahmni, page } = clinicalSetup;
      const fitnessEvaluationData = fitnessEvaluationFaker.simpleFitnessEvaluation();

      await expect(page).toHaveURL(/.*clinical\/.*/);
      await actions.observation.addFitnessEvaluationInConsultation(fitnessEvaluationData);
      await actions.observation.openObservationForm('Fitness Evaluation');
      await actions.observation.verifyFitnessEvaluationData(fitnessEvaluationData);
      await bahmni.fitnessEvaluationObsFormPage.closeModal();
    }
  );

  fitnessEvaluationTest(
    'Edit Fitness Evaluation form observations and verify updated values',
    { tag: ['@regression'] },
    async ({ clinicalSetup }) => {
      fitnessEvaluationTest.setTimeout(90000);
      const { actions, bahmni, page } = clinicalSetup;
      const editedFitnessEvaluationData = fitnessEvaluationFaker.editedFitnessEvaluation();
      const clearedFieldLabel = 'Height for age status';

      await expect(page).toHaveURL(/.*clinical\/.*/);
      await actions.observation.editFitnessEvaluationInConsultation(editedFitnessEvaluationData, clearedFieldLabel);
      await actions.observation.openObservationForm('Fitness Evaluation');
      await actions.observation.verifyFitnessEvaluationDataUpdated(editedFitnessEvaluationData, clearedFieldLabel);
      await bahmni.fitnessEvaluationObsFormPage.closeModal();
    }
  );

  // Edits the entry created by "Add vitals observation form in consultation" above -
  // the "Vitals" quick-add tile is only offered once per visit, so this test can't
  // add its own fresh Vitals entry once that earlier test has already used it.
  test('Edit Vitals form observations and verify updated values', async ({ clinicalSetup }) => {
    test.setTimeout(90000);
    const { actions, bahmni, page } = clinicalSetup;
    const editedVitalsData = vitalsFaker.editedVitals();

    await expect(page).toHaveURL(/.*clinical\/.*/);
    await actions.observation.editVitalsInConsultation(editedVitalsData);
    await actions.observation.openObservationForm('Vitals');
    await actions.observation.verifyVitalsDataUpdated(editedVitalsData);
    await bahmni.vitalsForm.closeModal();
  });

  // Navigates to the edit panel from the view-observation modal's pencil "Edit"
  // icon, instead of the Forms table's Actions-column Edit button used above.
  test('Edit History and Examination form observations from the view modal and verify updated values', async ({
    clinicalSetup,
  }) => {
    test.setTimeout(90000);
    const { actions, bahmni, page } = clinicalSetup;
    const historyData = historyAndExaminationFaker.simpleHistoryAndExamination();
    const editedHistoryData = historyAndExaminationFaker.editedHistoryAndExamination();

    await expect(page).toHaveURL(/.*clinical\/.*/);
    await actions.observation.addHistoryAndExaminationInConsultation(historyData);
    await actions.observation.editHistoryAndExaminationInConsultation(editedHistoryData);
    await actions.observation.openObservationForm('History and Examination');
    await actions.observation.verifyHistoryAndExaminationData(editedHistoryData);
    await bahmni.historyAndExaminationForm.closeModal();
  });
});
