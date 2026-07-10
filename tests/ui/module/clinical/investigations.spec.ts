import { test, expect } from '../../../../src/ui/fixtures/apiClinicalFixture';
import {
  ANEMIA_PANEL_NAME,
  anemiaReportData,
  ATYPICAL_LYMPH_NAME,
  atypicalLymphReportData,
  ECHOCARDIOGRAM_NAME,
  echocardiogramReportData,
} from '../../../../test-data/common/labOrderData';
import { FhirApiHelper } from '../../../../src/utils/fhir-api-helper';
import { SERVICE_REQUEST_CATEGORIES } from '../../../../test-data/api/constants';

test.describe('Lab Orders', { tag: ['@regression'] }, () => {
  test('validate lab orders - order anemia panel and absolute atypical lymphocyte count and verify results', async ({
    clinicalSetup,
    request,
  }) => {
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
  });
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
