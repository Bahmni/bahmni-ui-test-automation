import { test } from '@playwright/test';
import { PageFactory } from '../../src/pages/PageFactory';
import { ActionFactory } from '../../src/actions/ActionFactory';
import { generatePatientData } from '../../test-data/patientData';
import { generateAllergyData, ALLERGENS, SEVERITY_LEVELS, REACTIONS } from '../../test-data/allergyData';
import { medicationFaker } from '../../test-data/medicationData';
import { diagnosisFaker } from '../../test-data/diagnosisData';

test('E2E patient flow', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const bahmni = new PageFactory(page);
  const actions = new ActionFactory(bahmni);

  const patientData = generatePatientData();
  const allergyData = generateAllergyData(ALLERGENS.PENICILLIN, SEVERITY_LEVELS.MILD, REACTIONS.RASH);
  const diagnosis = diagnosisFaker.diagnosis();
  const medicationData = medicationFaker.medication();

  // Step 1-3: Login as frontdesk, create patient with mandatory details, start OPD visit
  await actions.auth.loginAsFrontDesk();
  const patientId = await actions.registration.registerPatientWithMandatoryDetails(patientData);
  await bahmni.createPatientPage.saveAndStartOPDVisit();
  await page.waitForLoadState('networkidle');

  // Step 4: Logout as frontdesk
  await actions.auth.logout();

  // Step 5-7: Login as doctor, navigate to clinical, add allergy, diagnosis and medication
  await actions.auth.loginAsDoctor();
  await actions.clinical.navigateToClinicalFromHome(patientId);
  await actions.clinical.addAllergyInConsultation(allergyData);
  await actions.clinical.addConditionAndDiagnosisInConsultation(diagnosis, diagnosis);
  await actions.clinical.addMedicationInConsultation(medicationData);

  // Step 8: Logout as doctor
  await actions.auth.logout();

  // Step 9-12: Login as clinicalRead, navigate to clinical, verify data and button visibility
  await actions.auth.loginAsClinicalRead();
  await actions.clinical.navigateToClinicalFromHome(patientId);
  await actions.clinical.verifyAllergyDisplayed(allergyData);
  await actions.clinical.verifyDiagnosisDisplayed(diagnosis);
  await actions.clinical.verifyMedicationDisplayed(medicationData);
  // TODO: Uncomment once privilege story for hiding New Consultation button for read-only users is merged
  // await actions.clinical.verifyNewConsultationButtonNotVisible();

  // Step 13: Logout as clinicalRead
  await actions.auth.logout();

  await context.close();
});
