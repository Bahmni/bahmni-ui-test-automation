import { test, expect } from '../../../../src/ui/fixtures/apiClinicalFixture';
import {
  ANEMIA_PANEL_NAME,
  anemiaReportData,
  ATYPICAL_LYMPH_NAME,
  atypicalLymphReportData,
  ECHOCARDIOGRAM_NAME,
  echocardiogramReportData,
} from '../../../../test-data/common/labOrderData';
import {
  CBC_INVESTIGATION_NAME,
  CBC_ORDER_NAME,
  cbcPanelResults,
  TSH_INVESTIGATION_NAME,
  TSH_ORDER_NAME,
  tshResult,
} from '../../../../test-data/common/labEntryData';
import { FhirApiHelper } from '../../../../src/utils/fhir-api-helper';
import { SERVICE_REQUEST_CATEGORIES } from '../../../../test-data/api/constants';

test.describe('Lab Orders', { tag: ['@regression'] }, () => {
  test(
    'validate lab orders - order anemia panel and absolute atypical lymphocyte count and verify results',
    { tag: ['@onlyStandard'] },
    async ({ clinicalSetup, request }) => {
      const { actions, page } = clinicalSetup;
      const fhirApi = new FhirApiHelper(request);

      await expect(page).toHaveURL(/.*clinical\/.*/);

      await actions.clinical.addInvestigationsInConsultation([ANEMIA_PANEL_NAME, ATYPICAL_LYMPH_NAME]);
      await expect(page).toHaveURL(/.*clinical\/.*(?<!consultation)$/);

      const patientUuid = fhirApi.getPatientUuidFromUrl(page.url());
      const encounterUuid = await fhirApi.getLatestEncounterUuid(patientUuid);
      const [atypicalLymphServiceRequestUuid, anemiaServiceRequestUuid] = await fhirApi.getLatestServiceRequestUuids(
        patientUuid,
        SERVICE_REQUEST_CATEGORIES.lab
      );

      await fhirApi.postAnemiaReport(patientUuid, encounterUuid, anemiaServiceRequestUuid, anemiaReportData);
      await fhirApi.postAtypicalLymphReport(
        patientUuid,
        encounterUuid,
        atypicalLymphServiceRequestUuid,
        atypicalLymphReportData
      );

      await page.reload();
      await page.waitForLoadState('networkidle');

      await actions.clinical.verifyAnemiaLabResults(anemiaReportData);
      await actions.clinical.verifyAtypicalLymphLabResults(atypicalLymphReportData);
    }
  );

  test(
    'order lab tests and add reports from labentry and validate results in clinical',
    { tag: ['@onlyLite'] },
    async ({ clinicalSetup }) => {
      const { actions, page, bahmni } = clinicalSetup;

      await expect(page).toHaveURL(/.*clinical\/.*/);

      const patientId = await bahmni.clinicalPage.getPatientIdentifier();
      const clinicalUrl = page.url();

      await actions.clinical.addInvestigationsInConsultation([CBC_INVESTIGATION_NAME, TSH_INVESTIGATION_NAME]);
      await expect(page).toHaveURL(/.*clinical\/.*(?<!consultation)$/);

      await actions.labEntry.navigateToPatientLabEntry(patientId);
      await actions.labEntry.enterTshResult(tshResult);
      await actions.labEntry.verifyOrderRemovedFromPending(TSH_ORDER_NAME);
      await actions.labEntry.enterCbcResults(cbcPanelResults);
      await actions.labEntry.verifyOrderRemovedFromPending(CBC_ORDER_NAME);

      await page.goto(clinicalUrl);
      await page.waitForLoadState('networkidle');

      await actions.clinical.verifyCbcLabResults(cbcPanelResults);
      await actions.clinical.verifyTshLabResult(tshResult);
    }
  );
});

test.describe('Radiology Investigations', { tag: ['@regression', '@onlyStandard'] }, () => {
  test('validate radiology report - order echocardiogram and verify report results', async ({
    clinicalSetup,
    request,
  }) => {
    const { actions, page } = clinicalSetup;
    const fhirApi = new FhirApiHelper(request);

    await expect(page).toHaveURL(/.*clinical\/.*/);

    await actions.clinical.addInvestigationsInConsultation([ECHOCARDIOGRAM_NAME]);
    await expect(page).toHaveURL(/.*clinical\/.*(?<!consultation)$/);

    const patientUuid = fhirApi.getPatientUuidFromUrl(page.url());
    const encounterUuid = await fhirApi.getLatestEncounterUuid(patientUuid);
    const [echoServiceRequestUuid] = await fhirApi.getLatestServiceRequestUuids(
      patientUuid,
      SERVICE_REQUEST_CATEGORIES.radiology
    );

    await fhirApi.postEchocardiogramReport(
      patientUuid,
      encounterUuid,
      echoServiceRequestUuid,
      echocardiogramReportData
    );

    await page.reload();
    await page.waitForLoadState('networkidle');

    await actions.clinical.verifyRadiologyReport(echocardiogramReportData);
  });
});
