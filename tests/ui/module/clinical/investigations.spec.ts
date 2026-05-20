import { test, expect } from '../../../../src/ui/fixtures/clinicalFixture';
import {
  ANEMIA_PANEL_NAME,
  anemiaReportData,
  ATYPICAL_LYMPH_NAME,
  atypicalLymphReportData,
  ECHOCARDIOGRAM_NAME,
  echocardiogramReportData,
} from '../../../../test-data/common/labOrderData';
import { FhirApiHelper } from '../../../../src/utils/fhir-api-helper';

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
      2
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

test.describe('Radiology Investigations', { tag: ['@regression'] }, () => {
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
    const [echoServiceRequestUuid] = await fhirApi.getLatestServiceRequestUuids(patientUuid, 1);

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
