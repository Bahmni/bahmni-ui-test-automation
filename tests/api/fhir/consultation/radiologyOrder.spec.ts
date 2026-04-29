import { test, expect } from '../../../../src/api/fixtures/apiFixture';
import { getBundleEntriesByType } from '../../../../src/utils/fhir-bundle-utils';
import { buildLabOrderBundle } from '../../../../test-data/api/consultationBundlePayload';
import { SERVER_PAGE_MAX } from '../../../../test-data/api/constants';
import {
  ConsultationContext,
  setupConsultationContext,
  teardownConsultationContext,
} from '../../../../src/api/helpers/consultationSetup';
import { ServiceRequestEntry } from '../../../../src/api/types/fhir-resources.types';

test.describe.serial('GET /fhir2/R4/ServiceRequest?category=radiology&_revinclude=ImagingStudy:basedon', () => {
  let ctx: ConsultationContext;

  test.beforeAll(async ({ api }) => {
    ctx = await setupConsultationContext(api);
    // Create a visit encounter with lab orders — radiology orders require radiology concept codes
    // which depend on system configuration. These tests verify the API structure and filtering.
    await api.fhir.submitConsultationBundle(buildLabOrderBundle(ctx));
  });

  test('GET /fhir2/R4/ServiceRequest?category=radiology returns resourceType Bundle', async ({ api }) => {
    const { status, body } = await api.fhir.getRadiologyServiceRequests(ctx.patientUuid);

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');
  });

  test('GET /fhir2/R4/ServiceRequest?category=radiology&_revinclude=ImagingStudy:basedon — when no imaging study exists, bundle contains no ImagingStudy entries', async ({
    api,
  }) => {
    const { body } = await api.fhir.getRadiologyServiceRequests(ctx.patientUuid);
    const imagingStudies = getBundleEntriesByType(body, 'ImagingStudy');

    expect(imagingStudies.length).toBe(0);
  });

  test('GET /fhir2/R4/ServiceRequest?category=radiology — lab orders do NOT appear in radiology category', async ({
    api,
  }) => {
    const { body } = await api.fhir.getRadiologyServiceRequests(ctx.patientUuid);
    const radiologyOrders = getBundleEntriesByType<ServiceRequestEntry>(body, 'ServiceRequest');

    // Lab orders submitted via buildLabOrderBundle should not appear under radiology category
    expect(radiologyOrders.length).toBe(0);
  });

  test('GET /fhir2/R4/ServiceRequest?category=radiology&encounter={uuid} — encounter-scoped query returns empty bundle when no radiology orders exist', async ({
    api,
  }) => {
    const { body: visitBundle } = await api.fhir.getVisitEncounters(ctx.patientUuid);
    const visitEncounters = getBundleEntriesByType<{ id: string }>(visitBundle, 'Encounter');
    const encounterUuid = visitEncounters[0]?.id ?? ctx.visitEncounterUuid;

    const { status, body } = await api.fhir.getRadiologyServiceRequests(ctx.patientUuid, 100, encounterUuid);

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');
    const orders = getBundleEntriesByType<ServiceRequestEntry>(body, 'ServiceRequest');
    expect(orders.length).toBe(0);
  });

  test('GET /fhir2/R4/ServiceRequest?category=radiology&_count=100 — _count=200 request is served within server page max of 100', async ({
    api,
  }) => {
    const { body } = await api.fhir.getRadiologyServiceRequests(ctx.patientUuid, 200);

    expect(body.entry?.length ?? 0).toBeLessThanOrEqual(SERVER_PAGE_MAX);
  });

  test.afterAll(async ({ api }) => {
    await teardownConsultationContext(api, ctx);
  });
});
