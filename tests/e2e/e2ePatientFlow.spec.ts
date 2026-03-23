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

  await actions.auth.loginAsFrontDesk();
  const patientId = await actions.registration.registerPatientWithMandatoryDetails(patientData);
  await bahmni.createPatientPage.saveAndStartOPDVisit();
  await page.waitForLoadState('networkidle');

  await actions.auth.logout();

  await actions.auth.loginAsDoctor();
  await actions.clinical.navigateToClinicalFromHome(patientId);
  await actions.clinical.addAllergyInConsultation(allergyData);
  await actions.clinical.addConditionAndDiagnosisInConsultation(diagnosis, diagnosis);
  await actions.clinical.addMedicationInConsultation(medicationData);

  await actions.auth.logout();

  await actions.auth.loginAsClinicalRead();
  await actions.clinical.navigateToClinicalFromHome(patientId);
  await actions.clinical.verifyAllergyDisplayed(allergyData);
  await actions.clinical.verifyDiagnosisDisplayed(diagnosis);
  await actions.clinical.verifyMedicationDisplayed(medicationData);

  await actions.auth.logout();

  await context.close();
});
