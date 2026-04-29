import { test, expect } from '../../../../src/api/fixtures/apiFixture';
import { getBundleEntriesByType } from '../../../../src/utils/fhir-bundle-utils';
import { buildAnemiaPanelOrderBundle, buildLabOrderBundle } from '../../../../test-data/api/consultationBundlePayload';
import { LAB_CONCEPTS, SERVER_PAGE_MAX } from '../../../../test-data/api/constants';
import {
  ConsultationContext,
  extractFirstUuidFromBundle,
  setupConsultationContext,
  teardownConsultationContext,
} from '../../../../src/api/helpers/consultationSetup';
import { ServiceRequestEntry, DiagnosticReportEntry } from '../../../../src/api/types/fhir-resources.types';
import { FhirApiHelper } from '../../../../src/utils/fhir-api-helper';
import { anemiaReportData } from '../../../../test-data/common/labOrderData';

test.describe.serial('POST /fhir2/R4/ConsultationBundle → GET /fhir2/R4/ServiceRequest (lab)', () => {
  let ctx: ConsultationContext;
  let encounterUuid: string;

  test.beforeAll(async ({ api }) => {
    ctx = await setupConsultationContext(api);
    const { body } = await api.fhir.submitConsultationBundle(buildLabOrderBundle(ctx));
    encounterUuid = extractFirstUuidFromBundle(body, 'Encounter');
  });

  // --- ServiceRequest persistence ---

  test('GET /fhir2/R4/ServiceRequest?category=lab — lab orders appear after ConsultationBundle submission', async ({
    api,
  }) => {
    const { status, body } = await api.fhir.getLabServiceRequests(ctx.patientUuid);

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');
    const orders = getBundleEntriesByType<ServiceRequestEntry>(body, 'ServiceRequest');
    expect(orders.length).toBeGreaterThan(0);
  });

  test('GET /fhir2/R4/ServiceRequest (no category filter) — both submitted lab concept codes are persisted', async ({
    api,
  }) => {
    const { body } = await api.fhir.getServiceRequests(ctx.patientUuid, 100);
    const orders = getBundleEntriesByType<ServiceRequestEntry>(body, 'ServiceRequest');
    const codes = orders.map((o) => o.code.coding[0].code);

    expect(codes).toContain(LAB_CONCEPTS.haemoglobin);
    expect(codes).toContain(LAB_CONCEPTS.plateletCount);
  });

  test('GET /fhir2/R4/ServiceRequest?category=lab — subject.reference contains patient UUID (reference integrity)', async ({
    api,
  }) => {
    const { body } = await api.fhir.getLabServiceRequests(ctx.patientUuid);
    const orders = getBundleEntriesByType<ServiceRequestEntry>(body, 'ServiceRequest');

    orders.forEach((o) => expect(o.subject.reference).toContain(ctx.patientUuid));
  });

  test('GET /fhir2/R4/ServiceRequest?category=lab&encounter={uuid} — returns only orders for that encounter', async ({
    api,
  }) => {
    const { body } = await api.fhir.getLabServiceRequests(ctx.patientUuid, 100, encounterUuid);
    const orders = getBundleEntriesByType<ServiceRequestEntry>(body, 'ServiceRequest');

    orders.forEach((o) => expect(o.encounter.reference).toContain(encounterUuid));
  });

  test('GET /fhir2/R4/ServiceRequest?category=lab&encounter={uuid} — returns empty bundle for non-existent encounter', async ({
    api,
  }) => {
    const differentEncounterUuid = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    const { body } = await api.fhir.getLabServiceRequests(ctx.patientUuid, 100, differentEncounterUuid);
    const orders = getBundleEntriesByType<ServiceRequestEntry>(body, 'ServiceRequest');

    expect(orders.length).toBe(0);
  });

  // --- Note preservation ---

  test('GET /fhir2/R4/ServiceRequest (no category filter) — note.text is preserved from submission', async ({
    api,
  }) => {
    const { body } = await api.fhir.getServiceRequests(ctx.patientUuid, 100);
    const orders = getBundleEntriesByType<ServiceRequestEntry>(body, 'ServiceRequest');
    const haemoglobinOrder = orders.find((o) => o.code?.coding?.[0]?.code === LAB_CONCEPTS.haemoglobin);

    expect(haemoglobinOrder?.note?.[0]?.text).toBe('haemoglobin test');
  });

  // --- Pagination / Limits ---

  test('GET /fhir2/R4/ServiceRequest?category=lab&_count=100 — entry count does not exceed server page max', async ({
    api,
  }) => {
    const { body } = await api.fhir.getLabServiceRequests(ctx.patientUuid, 100);

    expect(body.entry?.length ?? 0).toBeLessThanOrEqual(SERVER_PAGE_MAX);
  });

  test('GET /fhir2/R4/ServiceRequest?category=lab&_count=1 — returns at most 1 entry', async ({ api }) => {
    const { body } = await api.fhir.getLabServiceRequests(ctx.patientUuid, 1);

    expect(body.entry?.length ?? 0).toBeLessThanOrEqual(1);
  });

  test.afterAll(async ({ api }) => {
    await teardownConsultationContext(api, ctx);
  });
});

/**
 * Verifies the full DiagnosticReport flow:
 * 1. Order the Anemia panel via ConsultationBundle (creates Encounter + ServiceRequest)
 * 2. Submit the report via $submit-bundle (using the proven `FhirApiHelper.postAnemiaReport`
 *    which builds a panel-aware bundle the server accepts)
 * 3. Search by based-on to retrieve the saved DiagnosticReport's UUID
 * 4. Fetch the complete bundle via $fetch-bundle (DiagnosticReport + Observations + Encounter)
 *
 * This mirrors the production flow used by the UI, where ServiceRequests come from the consultation
 * save and reports are submitted with reference to those orders.
 */
test.describe.serial('Lab order → POST $submit-bundle → GET $fetch-bundle (Anemia panel)', () => {
  let ctx: ConsultationContext;
  let consultationEncounterUuid: string;
  let anemiaServiceRequestUuid: string;
  let diagnosticReportUuid: string;

  test.beforeAll(async ({ api, request }) => {
    ctx = await setupConsultationContext(api);

    // 1. Order the Anemia panel — creates a consultation Encounter and a single lab ServiceRequest
    const { body } = await api.fhir.submitConsultationBundle(buildAnemiaPanelOrderBundle(ctx));
    consultationEncounterUuid = extractFirstUuidFromBundle(body, 'Encounter');

    const serviceRequests = getBundleEntriesByType<ServiceRequestEntry>(body, 'ServiceRequest');
    const anemiaOrder = serviceRequests.find((sr) => sr.code?.coding?.[0]?.code === LAB_CONCEPTS.anemiaPanel);
    if (!anemiaOrder) throw new Error('Anemia panel ServiceRequest not in ConsultationBundle response');
    anemiaServiceRequestUuid = anemiaOrder.id;

    // 2. Submit the DiagnosticReport using the existing FhirApiHelper (used by UI tests)
    const fhirApi = new FhirApiHelper(request);
    await fhirApi.postAnemiaReport(
      ctx.patientUuid,
      consultationEncounterUuid,
      anemiaServiceRequestUuid,
      anemiaReportData
    );
  });

  test('GET /fhir2/R4/DiagnosticReport?patient={uuid}&based-on={serviceRequestUuid} — saved report is retrievable by based-on', async ({
    api,
  }) => {
    const { status, body } = await api.fhir.getDiagnosticReports(ctx.patientUuid, anemiaServiceRequestUuid);

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');
    const reports = getBundleEntriesByType<DiagnosticReportEntry>(body, 'DiagnosticReport');
    expect(reports.length).toBe(1);
    expect(reports[0].id).toBeTruthy();
    diagnosticReportUuid = reports[0].id;
  });

  test('GET /fhir2/R4/DiagnosticReport — basedOn[0].reference contains the originating ServiceRequest UUID (reference integrity)', async ({
    api,
  }) => {
    const { body } = await api.fhir.getDiagnosticReports(ctx.patientUuid, anemiaServiceRequestUuid);
    const reports = getBundleEntriesByType<DiagnosticReportEntry>(body, 'DiagnosticReport');

    expect(reports[0].basedOn[0].reference).toContain(anemiaServiceRequestUuid);
  });

  test('GET /fhir2/R4/DiagnosticReport — subject.reference contains patient UUID (reference integrity)', async ({
    api,
  }) => {
    const { body } = await api.fhir.getDiagnosticReports(ctx.patientUuid, anemiaServiceRequestUuid);
    const reports = getBundleEntriesByType<DiagnosticReportEntry>(body, 'DiagnosticReport');

    expect(reports[0].subject.reference).toContain(ctx.patientUuid);
  });

  test('GET /fhir2/R4/DiagnosticReport/{drUuid}/$fetch-bundle — returns Bundle containing the DiagnosticReport and its Observations', async ({
    api,
  }) => {
    const { status, body } = await api.fhir.getDiagnosticReportBundle(diagnosticReportUuid);

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');

    const reports = getBundleEntriesByType<DiagnosticReportEntry>(body, 'DiagnosticReport');
    const observations = getBundleEntriesByType(body, 'Observation');

    expect(reports.length).toBe(1);
    expect(reports[0].id).toBe(diagnosticReportUuid);
    expect(observations.length).toBeGreaterThan(0);
  });

  test('GET /fhir2/R4/DiagnosticReport/{drUuid}/$fetch-bundle — DiagnosticReport.encounter references the consultation encounter', async ({
    api,
  }) => {
    const { body } = await api.fhir.getDiagnosticReportBundle(diagnosticReportUuid);
    const reports = getBundleEntriesByType<DiagnosticReportEntry & { encounter?: { reference: string } }>(
      body,
      'DiagnosticReport'
    );

    expect(reports[0].encounter?.reference).toContain(consultationEncounterUuid);
  });

  test('GET /fhir2/R4/DiagnosticReport/{drUuid}/$fetch-bundle — included Observations have subject reference to the same patient', async ({
    api,
  }) => {
    const { body } = await api.fhir.getDiagnosticReportBundle(diagnosticReportUuid);
    const observations = getBundleEntriesByType<{ subject: { reference: string } }>(body, 'Observation');

    observations.forEach((o) => expect(o.subject.reference).toContain(ctx.patientUuid));
  });

  test('GET /fhir2/R4/ServiceRequest — status of the order remains active after DiagnosticReport is submitted (no auto-transition)', async ({
    api,
  }) => {
    const { body } = await api.fhir.getServiceRequests(ctx.patientUuid, 100);
    const orders = getBundleEntriesByType<ServiceRequestEntry>(body, 'ServiceRequest');
    const anemiaOrder = orders.find((o) => o.id === anemiaServiceRequestUuid);

    expect(anemiaOrder).toBeDefined();
    expect(anemiaOrder?.status).toBe('active');
  });

  test.afterAll(async ({ api }) => {
    await teardownConsultationContext(api, ctx);
  });
});
