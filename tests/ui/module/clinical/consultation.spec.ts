import { test, expect } from '../../../../src/ui/fixtures/clinicalFixture';
import { generateAllergyData, ALLERGENS, SEVERITY_LEVELS, REACTIONS } from '../../../../test-data/common/allergyData';
import { medicalFaker } from '../../../../test-data/common/investigationData';
import { diagnosisFaker } from '../../../../test-data/common/diagnosisData';
import {
  medicationFaker,
  MedicationData,
  DOSAGE_UNITS,
  FREQUENCIES,
  DURATION_UNITS,
  INSTRUCTIONS,
  ROUTES,
  STOP_REASONS,
} from '../../../../test-data/common/medicationData';
import { vaccinationFaker } from '../../../../test-data/common/vaccinationData';
import { vitalsFaker } from '../../../../test-data/common/vitalsData';

test.describe('Clinical Consultation Tests', { tag: ['@regression'] }, () => {
  test('Add and edit allergy with severity, reaction and note in consultation', async ({ clinicalSetup }) => {
    const { actions, page } = clinicalSetup;
    const allergyData = generateAllergyData(ALLERGENS.PENICILLIN, SEVERITY_LEVELS.MILD, REACTIONS.RASH);

    await expect(page).toHaveURL(/.*clinical\/.*/);
    await actions.clinical.addAllergyInConsultation(allergyData);
    await expect(page).toHaveURL(/.*clinical\/.*(?<!consultation)$/);
    await actions.clinical.verifyAllergyDisplayed(allergyData);

    const editedAllergyData = generateAllergyData(
      ALLERGENS.PENICILLIN,
      SEVERITY_LEVELS.SEVERE,
      REACTIONS.FEVER,
      'Patient allergy symptoms has increased.'
    );
    await actions.clinical.editAllergyInConsultation(allergyData.allergen, editedAllergyData);
    await actions.clinical.verifyAllergyDisplayed(editedAllergyData);
  });

  test('Order investigation in consultation', async ({ clinicalSetup }) => {
    const { actions, page } = clinicalSetup;
    const investigation = medicalFaker.investigation_single();
    const investigation_panel = medicalFaker.investigation_panel();
    const investigation_radiology = medicalFaker.investigation_radiology();

    await expect(page).toHaveURL(/.*clinical\/.*/);
    await actions.clinical.addInvestigationsInConsultation([
      investigation,
      investigation_panel,
      investigation_radiology,
    ]);
    await actions.clinical.verifyInvestigationOrProcedureDisplayed(investigation, 'Lab Investigations');
    await actions.clinical.verifyInvestigationOrProcedureDisplayed(investigation_panel, 'Lab Investigations');
    await actions.clinical.verifyInvestigationOrProcedureDisplayed(investigation_radiology, 'Radiology Investigations');
    await actions.clinical.continueConsultation();
    await actions.clinical.verifyProcedureAlreadyAdded(investigation_radiology);
    await actions.clinical.verifyProcedureAlreadyAdded(investigation_panel);
  });

  test('Order procedure in consultation', { tag: '@onlyStandard' }, async ({ clinicalSetup }) => {
    const { actions, page } = clinicalSetup;
    const procedure = medicalFaker.procedure();

    await expect(page).toHaveURL(/.*clinical\/.*/);
    await actions.clinical.startNewConsultation();
    await actions.clinical.addInvestigation(procedure);
    await actions.clinical.saveConsultation();
    await actions.clinical.verifyInvestigationOrProcedureDisplayed(procedure, 'Procedures');
    await actions.clinical.continueConsultation();
    await actions.clinical.verifyProcedureAlreadyAdded(procedure);
  });

  test('Add condition and diagnosis in consultation', async ({ clinicalSetup }) => {
    test.setTimeout(60000);
    const { actions, page } = clinicalSetup;
    const condition = diagnosisFaker.diagnosis();
    const diagnosis = diagnosisFaker.diagnosis();

    await expect(page).toHaveURL(/.*clinical\/.*/);
    await actions.clinical.addConditionAndDiagnosisInConsultation(condition, diagnosis);
    await actions.clinical.verifyConditionDisplayed(condition, 'Active');
    await actions.clinical.verifyDiagnosisDisplayed(diagnosis);
    await actions.clinical.markConditionAsInactive(condition);
    await actions.clinical.verifyConditionDisplayed(condition, 'Inactive');
  });

  test('Add and edit medication in consultation', async ({ clinicalSetup }) => {
    const { actions, page } = clinicalSetup;
    const medication = medicationFaker.medication();

    await expect(page).toHaveURL(/.*clinical\/.*/);
    await actions.clinical.addMedicationInConsultation(medication);
    await actions.clinical.verifyMedicationDisplayed(medication);

    const editedMedication: MedicationData = {
      ...medication,
      dosage: 2,
      dosageUnit: DOSAGE_UNITS.TABLET,
      frequency: FREQUENCIES.THRICE_A_DAY,
      duration: 5,
      durationUnit: DURATION_UNITS.DAYS,
      instructions: INSTRUCTIONS.AFTER_MEALS,
      route: ROUTES.ORAL,
    };
    await actions.clinical.editMedicationInConsultation(medication.name, editedMedication);
    await actions.clinical.verifyMedicationDetailsDisplayed(editedMedication);
  });

  test('Stop medication in consultation', async ({ clinicalSetup }) => {
    const { actions, page } = clinicalSetup;
    const medication = medicationFaker.medication();
    const stopReason = STOP_REASONS.REFUSED_TO_TAKE;
    const stopNote = 'Medication stopped as patient refused to take';

    await expect(page).toHaveURL(/.*clinical\/.*/);
    await actions.clinical.addMedicationInConsultation(medication);
    await actions.clinical.verifyMedicationDisplayed(medication);

    await actions.clinical.stopMedicationInConsultation(medication.name, stopReason, stopNote);
    await actions.clinical.verifyMedicationStopped(medication.name, stopReason);
  });

  test('Add vaccination in consultation', async ({ clinicalSetup }) => {
    const { actions, page } = clinicalSetup;
    const vaccination = vaccinationFaker.vaccination();

    await expect(page).toHaveURL(/.*clinical\/.*/);
    await actions.clinical.addVaccinationInConsultation(vaccination);

    await page.reload();
    await page.waitForLoadState('networkidle');

    await actions.clinical.verifyVaccinationDisplayed(vaccination);
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
});
