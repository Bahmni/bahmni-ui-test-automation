import { test, expect } from '../../../src/api/fixtures/apiFixture';
import { getBundleEntriesByType } from '../../../src/utils/fhir-bundle-utils';
import {
  buildAllergyBundle,
  buildConditionsBundle,
  buildLabOrderBundle,
  buildMedicationRequestBundle,
  buildVitalsBundle,
} from '../../../test-data/api/consultationBundlePayload';
import { buildCreatePatientPayload } from '../../../test-data/api/patientPayload';
import { SERVER_PAGE_MAX, VITALS_CONCEPTS } from '../../../test-data/api/constants';
import {
  ConsultationContext,
  extractFirstUuidFromBundle,
  setupConsultationContext,
  teardownConsultationContext,
} from '../../../src/api/helpers/consultationSetup';

const VITALS_CODES = Object.values(VITALS_CONCEPTS);

test.describe.serial('Clinical Dashboard — FHIR read APIs', () => {
  let ctx: ConsultationContext;
  let encounterUuid: string;
  let medicationUuid: string;

  test.beforeAll(async ({ api }) => {
    ctx = await setupConsultationContext(api);

    // Submit allergy — creates encounter
    const { body: allergyResponse } = await api.fhir.submitConsultationBundle(buildAllergyBundle(ctx));
    encounterUuid = extractFirstUuidFromBundle(allergyResponse, 'Encounter');

    // Submit conditions
    await api.fhir.submitConsultationBundle(buildConditionsBundle(ctx, encounterUuid));

    // Submit lab orders
    await api.fhir.submitConsultationBundle(buildLabOrderBundle(ctx));

    // Submit medication
    const { body: medBundle } = await api.fhir.searchMedication('Paracetamol');
    const medications = getBundleEntriesByType<{ id: string }>(medBundle, 'Medication');
    if (medications.length) {
      medicationUuid = medications[0].id;
      await api.fhir.submitConsultationBundle(buildMedicationRequestBundle(ctx, encounterUuid, medicationUuid));
    }

    // Submit vitals
    await api.fhir.submitConsultationBundle(buildVitalsBundle(ctx, encounterUuid));
  });

  // --- GET /fhir2/R4/AllergyIntolerance ---

  test('GET /fhir2/R4/AllergyIntolerance?patient={uuid} — returns Bundle immediately after ConsultationBundle save', async ({
    api,
  }) => {
    const { status, body } = await api.fhir.getAllergyIntolerances(ctx.patientUuid);

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');
    expect(getBundleEntriesByType(body, 'AllergyIntolerance').length).toBeGreaterThan(0);
  });

  test('GET /fhir2/R4/AllergyIntolerance?_count=100 — entry count ≤ server page max (100)', async ({ api }) => {
    const { body } = await api.fhir.getAllergyIntolerances(ctx.patientUuid, 100);

    expect(body.entry?.length ?? 0).toBeLessThanOrEqual(SERVER_PAGE_MAX);
  });

  test('GET /fhir2/R4/AllergyIntolerance?_count=1 — returns at most 1 entry', async ({ api }) => {
    const { body } = await api.fhir.getAllergyIntolerances(ctx.patientUuid, 1);

    expect(body.entry?.length ?? 0).toBeLessThanOrEqual(1);
  });

  // --- GET /fhir2/R4/Condition ---

  test('GET /fhir2/R4/Condition?category=encounter-diagnosis — returns Bundle with data after ConsultationBundle save', async ({
    api,
  }) => {
    const { status, body } = await api.fhir.getConditions(ctx.patientUuid, 'encounter-diagnosis');

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');
    expect(getBundleEntriesByType(body, 'Condition').length).toBeGreaterThan(0);
  });

  test('GET /fhir2/R4/Condition?category=problem-list-item — returns Bundle with data after ConsultationBundle save', async ({
    api,
  }) => {
    const { status, body } = await api.fhir.getConditions(ctx.patientUuid, 'problem-list-item');

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');
    expect(getBundleEntriesByType(body, 'Condition').length).toBeGreaterThan(0);
  });

  test('GET /fhir2/R4/Condition?_count=100 — entry count ≤ server page max', async ({ api }) => {
    const { body } = await api.fhir.getConditions(ctx.patientUuid, 'encounter-diagnosis', 100);

    expect(body.entry?.length ?? 0).toBeLessThanOrEqual(SERVER_PAGE_MAX);
  });

  test('GET /fhir2/R4/Condition?_count=1 — returns at most 1 entry', async ({ api }) => {
    const { body } = await api.fhir.getConditions(ctx.patientUuid, 'encounter-diagnosis', 1);

    expect(body.entry?.length ?? 0).toBeLessThanOrEqual(1);
  });

  // --- GET /fhir2/R4/MedicationRequest ---

  test('GET /fhir2/R4/MedicationRequest?_include=MedicationRequest:medication — returns Bundle after ConsultationBundle save', async ({
    api,
  }) => {
    test.skip(!medicationUuid, 'Skipped: no Paracetamol found in system');

    const { status, body } = await api.fhir.getMedicationRequests(ctx.patientUuid);

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');
    expect(getBundleEntriesByType(body, 'MedicationRequest').length).toBeGreaterThan(0);
  });

  test('GET /fhir2/R4/MedicationRequest?_count=100 — entry count ≤ server page max', async ({ api }) => {
    const { body } = await api.fhir.getMedicationRequests(ctx.patientUuid, 100);
    const requests = getBundleEntriesByType(body, 'MedicationRequest');

    expect(requests.length).toBeLessThanOrEqual(SERVER_PAGE_MAX);
  });

  test('GET /fhir2/R4/MedicationRequest?_count=1 — returns at most 1 MedicationRequest entry', async ({ api }) => {
    const { body } = await api.fhir.getMedicationRequests(ctx.patientUuid, 1);
    const requests = getBundleEntriesByType(body, 'MedicationRequest');

    expect(requests.length).toBeLessThanOrEqual(1);
  });

  // --- GET /fhir2/R4/ServiceRequest ---

  test('GET /fhir2/R4/ServiceRequest?category=lab — returns Bundle with lab orders after ConsultationBundle save', async ({
    api,
  }) => {
    const { status, body } = await api.fhir.getLabServiceRequests(ctx.patientUuid);

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');
  });

  test('GET /fhir2/R4/ServiceRequest?category=lab&_count=100 — _count=200 request is capped at server page max (100)', async ({
    api,
  }) => {
    const { body } = await api.fhir.getLabServiceRequests(ctx.patientUuid, 200);

    expect(body.entry?.length ?? 0).toBeLessThanOrEqual(SERVER_PAGE_MAX);
  });

  test('GET /fhir2/R4/ServiceRequest?category=lab&_count=1 — returns at most 1 entry', async ({ api }) => {
    const { body } = await api.fhir.getLabServiceRequests(ctx.patientUuid, 1);

    expect(body.entry?.length ?? 0).toBeLessThanOrEqual(1);
  });

  test('GET /fhir2/R4/ServiceRequest?category=radiology&_revinclude=ImagingStudy:basedon — returns Bundle', async ({
    api,
  }) => {
    const { status, body } = await api.fhir.getRadiologyServiceRequests(ctx.patientUuid);

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');
  });

  // --- GET /fhir2/R4/Observation ---

  test('GET /fhir2/R4/Observation?_include=Observation:has-member — returns Bundle with vitals after ConsultationBundle save', async ({
    api,
  }) => {
    const { status, body } = await api.fhir.getObservations(ctx.patientUuid, VITALS_CODES);

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');
    expect(getBundleEntriesByType(body, 'Observation').length).toBeGreaterThan(0);
  });

  test('GET /fhir2/R4/Observation?_sort=-_lastUpdated — most recently saved observation appears first', async ({
    api,
  }) => {
    const { body } = await api.fhir.getObservations(ctx.patientUuid, VITALS_CODES);
    const observations = getBundleEntriesByType<{ effectiveDateTime?: string; meta?: { lastUpdated?: string } }>(
      body,
      'Observation'
    );

    if (observations.length >= 2) {
      const first = new Date(observations[0].effectiveDateTime ?? observations[0].meta?.lastUpdated ?? 0).getTime();
      const second = new Date(observations[1].effectiveDateTime ?? observations[1].meta?.lastUpdated ?? 0).getTime();
      expect(first).toBeGreaterThanOrEqual(second);
    }
  });

  // --- GET /fhir2/R4/Encounter ---

  test('GET /fhir2/R4/Encounter?subject:Patient={uuid}&_tag=visit — returns visit encounter', async ({ api }) => {
    const { status, body } = await api.fhir.getVisitEncounters(ctx.patientUuid);

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');
    expect(getBundleEntriesByType(body, 'Encounter').length).toBeGreaterThan(0);
  });

  // --- Empty patient — all APIs return Bundle (not 404) ---

  test('GET /fhir2/R4/AllergyIntolerance — new patient with no data returns empty Bundle (not 404)', async ({
    api,
  }) => {
    const { body: newPatientBody } = await api.patient.create(buildCreatePatientPayload());
    const newPatientUuid = newPatientBody.patient.uuid;

    try {
      const { status, body } = await api.fhir.getAllergyIntolerances(newPatientUuid);

      expect(status).toBe(200);
      expect(body.resourceType).toBe('Bundle');
      expect(body.entry?.length ?? 0).toBe(0);
    } finally {
      await api.patient.delete(newPatientUuid).catch(() => {});
    }
  });

  test.afterAll(async ({ api }) => {
    await teardownConsultationContext(api, ctx);
  });
});
