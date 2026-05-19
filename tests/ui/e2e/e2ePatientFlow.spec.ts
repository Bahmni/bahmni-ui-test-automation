import { test, request } from '@playwright/test';
import { PageFactory } from '../../../src/ui/pages/PageFactory';
import { ActionFactory } from '../../../src/ui/actions/ActionFactory';
import { generatePatientData } from '../../../test-data/common/patientData';
import { generateAllergyData, ALLERGENS, SEVERITY_LEVELS, REACTIONS } from '../../../test-data/common/allergyData';
import { medicationFaker } from '../../../test-data/common/medicationData';
import { diagnosisFaker } from '../../../test-data/common/diagnosisData';
import { ApiFactory } from '../../../src/api/ApiFactory';

test.describe('E2E patient flow', () => {
  let createdPatientId: string | null = null;

  test.afterEach(async () => {
    if (!createdPatientId) return;
    const apiContext = await request.newContext({ ignoreHTTPSErrors: true });
    const api = new ApiFactory(apiContext);
    try {
      const { body } = await api.patient.search(createdPatientId);
      const uuid = body.results[0]?.uuid;
      if (uuid) await api.patient.delete(uuid);
    } finally {
      createdPatientId = null;
      await apiContext.dispose();
    }
  });

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
    createdPatientId = patientId;
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
});
