import { test, expect } from '../../../src/fixtures/clinicalFixture';
import {
  ANEMIA_PANEL_NAME,
  anemiaReportData,
  ATYPICAL_LYMPH_NAME,
  atypicalLymphReportData,
} from '../../../test-data/labOrderData';
import { FhirApiHelper } from '../../../src/utils/fhir-api-helper';

test.describe('Lab Orders', () => {
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
