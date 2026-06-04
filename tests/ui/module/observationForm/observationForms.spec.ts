import { test, expect } from '../../../../src/ui/fixtures/clinicalFixture';
import { admissionLetterFaker } from '../../../../test-data/common/admissionLetterData';
import { deathNoteFaker } from '../../../../test-data/common/deathNoteData';
import { diabetesProgressFaker } from '../../../../test-data/common/diabetesProgressData';
import { malariaFaker } from '../../../../test-data/common/malariaData';
import { vitalsFaker } from '../../../../test-data/common/vitalsData';

//Refactor required for form2control change
test.describe.skip('Observation form Tests', () => {
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
});
