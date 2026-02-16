import { test, expect } from '../../src/fixtures/clinicalFixture';
import { generateAllergyData, ALLERGENS, SEVERITY_LEVELS, REACTIONS } from '../../test-data/allergyData';
import { medicalFaker } from '../../test-data/investigationData';
import { diagnosisFaker } from '../../test-data/diagnosisData';
import { medicationFaker } from '../../test-data/medicationData';
import { vaccinationFaker } from '../../test-data/vaccinationData';
import { admissionLetterFaker } from '../../test-data/admissionLetterData';

test.describe.serial('Clinical Consultation Tests', () => {
  test('Add allergy with severity and reaction in consultation', async ({ clinicalSetup }) => {
    const { bahmni, page } = clinicalSetup;
    const allergyData = generateAllergyData(ALLERGENS.PENICILLIN, SEVERITY_LEVELS.MILD, REACTIONS.RASH);

    await expect(page).toHaveURL(/.*clinical\/.*/);
    await bahmni.clinicalPage.clickNewConsultation();
    await bahmni.newConsultationPage.waitForNewConsultationPageToOpen();
    await bahmni.newConsultationPage.addAllergyWithDetails(
      allergyData.allergen,
      allergyData.severity,
      allergyData.reaction
    );
    await bahmni.newConsultationPage.saveConsultation();
    await expect(page).toHaveURL(/.*clinical\/.*(?<!consultation)$/);
    await bahmni.clinicalPage.verifyAllergyDisplayed(allergyData);
  });

  test('Order investigation and procedure in consultation', async ({ clinicalSetup }) => {
    const { bahmni, page } = clinicalSetup;
    const investigation = medicalFaker.investigation_single();
    const investigation_panel = medicalFaker.investigation_panel();
    const investigation_radiology = medicalFaker.investigation_radiology();

    const procedure = medicalFaker.procedure();
    await expect(page).toHaveURL(/.*clinical\/.*/);
    await bahmni.clinicalPage.clickNewConsultation();
    await bahmni.newConsultationPage.waitForNewConsultationPageToOpen();
    await bahmni.newConsultationPage.addInvestigation(investigation);
    await bahmni.newConsultationPage.addInvestigation(investigation_panel);
    await bahmni.newConsultationPage.addInvestigation(procedure);
    await bahmni.newConsultationPage.addInvestigation(investigation_radiology);
    await bahmni.newConsultationPage.saveConsultation();
    await bahmni.clinicalPage.verifyInvestigationOrProcedureDisplayed(procedure, 'Procedures');
    await bahmni.clinicalPage.verifyInvestigationOrProcedureDisplayed(investigation, 'Lab Investigations');
    await bahmni.clinicalPage.verifyInvestigationOrProcedureDisplayed(investigation_panel, 'Lab Investigations');
    await bahmni.clinicalPage.verifyInvestigationOrProcedureDisplayed(
      investigation_radiology,
      'Radiology Investigations'
    );
  });

  test('Add condition and diagnosis in consultation', async ({ clinicalSetup }) => {
    test.setTimeout(60000);
    const { bahmni, page } = clinicalSetup;
    const condition = diagnosisFaker.diagnosis();
    const diagnosis = diagnosisFaker.diagnosis();

    await expect(page).toHaveURL(/.*clinical\/.*/);
    await bahmni.clinicalPage.clickNewConsultation();
    await bahmni.newConsultationPage.waitForNewConsultationPageToOpen();
    await bahmni.newConsultationPage.addCondition(condition);
    await bahmni.newConsultationPage.addDiagnosis(diagnosis);
    await bahmni.newConsultationPage.saveDiagnosesAndConditions();
    await bahmni.clinicalPage.verifyConditionDisplayed(condition);
    await bahmni.clinicalPage.verifyDiagnosisDisplayed(diagnosis);
  });

  test('Add medication in consultation', async ({ clinicalSetup }) => {
    const { bahmni, page } = clinicalSetup;
    const medication = medicationFaker.medication();

    await expect(page).toHaveURL(/.*clinical\/.*/);
    await bahmni.clinicalPage.clickNewConsultation();
    await bahmni.newConsultationPage.waitForNewConsultationPageToOpen();
    await bahmni.newConsultationPage.addMedication(medication);
    await bahmni.newConsultationPage.saveConsultation();
    await bahmni.clinicalPage.verifyMedicationDisplayed(medication);
  });

  test('Add vaccination in consultation', async ({ clinicalSetup }) => {
    const { bahmni, page } = clinicalSetup;
    const vaccination = vaccinationFaker.vaccination();

    await expect(page).toHaveURL(/.*clinical\/.*/);
    await bahmni.clinicalPage.clickNewConsultation();
    await bahmni.newConsultationPage.waitForNewConsultationPageToOpen();
    await bahmni.newConsultationPage.addVaccination(vaccination);
    await bahmni.newConsultationPage.saveConsultation();

    // TODO: Remove this refresh once the bug is fixed - vaccinations don't display without refresh
    await page.reload();
    await page.waitForLoadState('networkidle');

    await bahmni.clinicalPage.verifyVaccinationDisplayed(vaccination);
  });

  test('Add admission letter observation form in consultation', async ({ clinicalSetup }) => {
    test.setTimeout(60000);
    const { bahmni, page } = clinicalSetup;
    const admissionLetterData = admissionLetterFaker.simpleAdmissionLetter();

    await expect(page).toHaveURL(/.*clinical\/.*/);
    await bahmni.clinicalPage.clickNewConsultation();
    await bahmni.newConsultationPage.waitForNewConsultationPageToOpen();
    await bahmni.newConsultationPage.searchAndOpenObservationForm('Admission Letter');
    await bahmni.admissionLetterForm.waitForFormToLoad();
    await bahmni.admissionLetterForm.fillAndSaveAdmissionLetter(admissionLetterData);
    await bahmni.newConsultationPage.saveConsultation();
    // TODO: Remove this refresh once the bug is fixed - forms don't display without refresh
    await page.reload();
    await page.waitForLoadState('networkidle');
    await bahmni.clinicalPage.verifyAndOpenObservationForm('Admission Letter');
    await bahmni.admissionLetterForm.verifyAdmissionLetterData(admissionLetterData);
    await bahmni.admissionLetterForm.closeModal();
  });
});
