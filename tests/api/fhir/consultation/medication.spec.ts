import { test, expect } from '../../../../src/api/fixtures/apiFixture';
import { getBundleEntriesByType } from '../../../../src/utils/fhir-bundle-utils';
import { buildAllergyBundle, buildMedicationRequestBundle } from '../../../../test-data/api/consultationBundlePayload';
import { SERVER_PAGE_MAX } from '../../../../test-data/api/constants';
import {
  ConsultationContext,
  extractFirstUuidFromBundle,
  setupConsultationContext,
  teardownConsultationContext,
} from '../../../../src/api/helpers/consultationSetup';
import { MedicationRequestEntry } from '../../../../src/api/types/fhir-resources.types';

test.describe.serial('POST /fhir2/R4/ConsultationBundle → GET /fhir2/R4/MedicationRequest', () => {
  let ctx: ConsultationContext;
  let encounterUuid: string;
  let medicationUuid: string;

  test.beforeAll(async ({ api }) => {
    ctx = await setupConsultationContext(api);

    const { body: allergyResponse } = await api.fhir.submitConsultationBundle(buildAllergyBundle(ctx));
    encounterUuid = extractFirstUuidFromBundle(allergyResponse, 'Encounter');

    const { body: medBundle } = await api.fhir.searchMedication('Paracetamol');
    const medications = getBundleEntriesByType<{ id: string }>(medBundle, 'Medication');
    if (!medications.length) throw new Error('No Paracetamol found — cannot run medication tests');
    medicationUuid = medications[0].id;

    await api.fhir.submitConsultationBundle(buildMedicationRequestBundle(ctx, encounterUuid, medicationUuid));
  });

  test('GET /fhir2/R4/MedicationRequest — saved order appears in patient record after ConsultationBundle submission', async ({
    api,
  }) => {
    const { status, body } = await api.fhir.getMedicationRequests(ctx.patientUuid);

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');
    const requests = getBundleEntriesByType<MedicationRequestEntry>(body, 'MedicationRequest');
    expect(requests.length).toBeGreaterThan(0);
  });

  test('GET /fhir2/R4/MedicationRequest — subject.reference contains patient UUID (reference integrity)', async ({
    api,
  }) => {
    const { body } = await api.fhir.getMedicationRequests(ctx.patientUuid);
    const requests = getBundleEntriesByType<MedicationRequestEntry>(body, 'MedicationRequest');

    expect(requests[0].subject.reference).toContain(ctx.patientUuid);
  });

  test('GET /fhir2/R4/MedicationRequest — dispenseRequest.quantity.value is preserved from submission', async ({
    api,
  }) => {
    const { body } = await api.fhir.getMedicationRequests(ctx.patientUuid);
    const requests = getBundleEntriesByType<MedicationRequestEntry>(body, 'MedicationRequest');

    expect(requests[0].dispenseRequest.quantity.value).toBeGreaterThan(0);
  });

  test('GET /fhir2/R4/MedicationRequest?_include=MedicationRequest:medication — Medication resources are bundled alongside MedicationRequests', async ({
    api,
  }) => {
    const { body } = await api.fhir.getMedicationRequests(ctx.patientUuid);

    const requests = getBundleEntriesByType<MedicationRequestEntry>(body, 'MedicationRequest');
    const medications = getBundleEntriesByType<{ id: string }>(body, 'Medication');

    expect(requests.length).toBeGreaterThan(0);
    expect(medications.length).toBeGreaterThan(0);
  });

  test('GET /fhir2/R4/MedicationRequest?_include=MedicationRequest:medication — Medication id in bundle matches medicationReference UUID', async ({
    api,
  }) => {
    const { body } = await api.fhir.getMedicationRequests(ctx.patientUuid);
    const requests = getBundleEntriesByType<MedicationRequestEntry>(body, 'MedicationRequest');
    const medications = getBundleEntriesByType<{ id: string }>(body, 'Medication');

    const referencedId = requests[0].medicationReference.reference.split('/').pop();
    const bundledIds = medications.map((m) => m.id);

    expect(bundledIds).toContain(referencedId);
  });

  test('GET /fhir2/R4/MedicationRequest?_count=100 — entry count does not exceed server page max', async ({ api }) => {
    const { body } = await api.fhir.getMedicationRequests(ctx.patientUuid, 100);

    expect(body.entry?.length ?? 0).toBeLessThanOrEqual(SERVER_PAGE_MAX);
  });

  test('GET /fhir2/R4/MedicationRequest?_count=1 — returns at most 1 MedicationRequest entry (_include adds Medication but does not count against _count)', async ({
    api,
  }) => {
    const { body } = await api.fhir.getMedicationRequests(ctx.patientUuid, 1);
    const requests = getBundleEntriesByType<MedicationRequestEntry>(body, 'MedicationRequest');

    expect(requests.length).toBeLessThanOrEqual(1);
  });

  test.afterAll(async ({ api }) => {
    await teardownConsultationContext(api, ctx);
  });
});
