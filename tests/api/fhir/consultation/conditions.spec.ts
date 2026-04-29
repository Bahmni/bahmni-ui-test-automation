import { test, expect } from '../../../../src/api/fixtures/apiFixture';
import { getBundleEntriesByType } from '../../../../src/utils/fhir-bundle-utils';
import {
  buildAllergyBundle,
  buildDiagnosisBundle,
  buildProblemListBundle,
} from '../../../../test-data/api/consultationBundlePayload';
import { CONDITION_CODES, SERVER_PAGE_MAX } from '../../../../test-data/api/constants';
import {
  ConsultationContext,
  extractFirstUuidFromBundle,
  setupConsultationContext,
  teardownConsultationContext,
} from '../../../../src/api/helpers/consultationSetup';
import { ConditionEntry } from '../../../../src/api/types/fhir-resources.types';

test.describe.serial('POST /fhir2/R4/ConsultationBundle → GET /fhir2/R4/Condition', () => {
  let ctx: ConsultationContext;
  let encounterUuid: string;

  test.beforeAll(async ({ api }) => {
    ctx = await setupConsultationContext(api);
    const { body: allergyResponse } = await api.fhir.submitConsultationBundle(buildAllergyBundle(ctx));
    encounterUuid = extractFirstUuidFromBundle(allergyResponse, 'Encounter');
  });

  // --- Save & validate (separate tests for diagnosis and problem-list-item) ---

  test('POST /fhir2/R4/ConsultationBundle (encounter-diagnosis only) — saves diagnosis and response contains Condition with correct code, category, status and references', async ({
    api,
  }) => {
    const { status, body } = await api.fhir.submitConsultationBundle(buildDiagnosisBundle(ctx, encounterUuid));

    expect([200, 201]).toContain(status);
    const conditions = getBundleEntriesByType<ConditionEntry>(body, 'Condition');
    expect(conditions.length).toBe(1);

    const diagnosis = conditions[0];
    expect(diagnosis.code.coding[0].code).toBe(CONDITION_CODES.malaria);
    expect(diagnosis.category[0].coding[0].code).toBe('encounter-diagnosis');
    expect(diagnosis.subject.reference).toContain(ctx.patientUuid);
    expect(diagnosis.encounter?.reference).toContain(encounterUuid);
  });

  test('POST /fhir2/R4/ConsultationBundle (problem-list-item only) — saves problem-list-item and response contains Condition with onsetDateTime preserved', async ({
    api,
  }) => {
    const { status, body } = await api.fhir.submitConsultationBundle(buildProblemListBundle(ctx, encounterUuid));

    expect([200, 201]).toContain(status);
    const conditions = getBundleEntriesByType<ConditionEntry & { onsetDateTime?: string }>(body, 'Condition');
    const problem = conditions.find((c) => c.code.coding[0].code === CONDITION_CODES.anaemia);

    expect(problem).toBeDefined();
    expect(problem?.category[0].coding[0].code).toBe('problem-list-item');
    expect(problem?.clinicalStatus?.coding[0].code).toBe('active');
    expect(problem?.subject.reference).toContain(ctx.patientUuid);
    expect(problem?.onsetDateTime).toBeDefined();
  });

  // --- Encounter Diagnosis ---

  test('GET /fhir2/R4/Condition?category=encounter-diagnosis — saved diagnosis is retrievable after ConsultationBundle submission', async ({
    api,
  }) => {
    const { status, body } = await api.fhir.getConditions(ctx.patientUuid, 'encounter-diagnosis');

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');
    const conditions = getBundleEntriesByType<ConditionEntry>(body, 'Condition');
    expect(conditions.length).toBeGreaterThan(0);
  });

  test('GET /fhir2/R4/Condition?category=encounter-diagnosis — code.coding[0].code matches submitted diagnosis code', async ({
    api,
  }) => {
    const { body } = await api.fhir.getConditions(ctx.patientUuid, 'encounter-diagnosis');
    const conditions = getBundleEntriesByType<ConditionEntry>(body, 'Condition');
    const codes = conditions.map((c) => c.code.coding[0].code);

    expect(codes).toContain(CONDITION_CODES.malaria);
  });

  test('GET /fhir2/R4/Condition?category=encounter-diagnosis — subject.reference contains patient UUID (reference integrity)', async ({
    api,
  }) => {
    const { body } = await api.fhir.getConditions(ctx.patientUuid, 'encounter-diagnosis');
    const conditions = getBundleEntriesByType<ConditionEntry>(body, 'Condition');

    conditions.forEach((c) => {
      expect(c.subject.reference).toContain(ctx.patientUuid);
    });
  });

  test('GET /fhir2/R4/Condition?category=encounter-diagnosis — encounter.reference contains correct encounter UUID (reference integrity)', async ({
    api,
  }) => {
    const { body } = await api.fhir.getConditions(ctx.patientUuid, 'encounter-diagnosis');
    const conditions = getBundleEntriesByType<ConditionEntry>(body, 'Condition');

    conditions.forEach((c) => {
      expect(c.encounter?.reference).toContain(encounterUuid);
    });
  });

  // --- Problem List ---

  test('GET /fhir2/R4/Condition?category=problem-list-item — saved problem is retrievable after ConsultationBundle submission', async ({
    api,
  }) => {
    const { status, body } = await api.fhir.getConditions(ctx.patientUuid, 'problem-list-item');

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');
    const conditions = getBundleEntriesByType<ConditionEntry>(body, 'Condition');
    expect(conditions.length).toBeGreaterThan(0);
  });

  test('GET /fhir2/R4/Condition?category=problem-list-item — clinicalStatus is active', async ({ api }) => {
    const { body } = await api.fhir.getConditions(ctx.patientUuid, 'problem-list-item');
    const conditions = getBundleEntriesByType<ConditionEntry>(body, 'Condition');

    expect(conditions[0].clinicalStatus?.coding[0].code).toBe('active');
  });

  test('GET /fhir2/R4/Condition?category=problem-list-item — code.coding[0].code matches submitted problem code', async ({
    api,
  }) => {
    const { body } = await api.fhir.getConditions(ctx.patientUuid, 'problem-list-item');
    const conditions = getBundleEntriesByType<ConditionEntry>(body, 'Condition');
    const codes = conditions.map((c) => c.code.coding[0].code);

    expect(codes).toContain(CONDITION_CODES.anaemia);
  });

  // --- Category isolation (different OpenMRS DB tables) ---

  test('GET /fhir2/R4/Condition?category=problem-list-item — encounter-diagnosis does NOT appear (stored in different DB table)', async ({
    api,
  }) => {
    const { body } = await api.fhir.getConditions(ctx.patientUuid, 'problem-list-item');
    const conditions = getBundleEntriesByType<ConditionEntry>(body, 'Condition');
    const codes = conditions.map((c) => c.code.coding[0].code);

    expect(codes).not.toContain(CONDITION_CODES.malaria);
  });

  test('GET /fhir2/R4/Condition?category=encounter-diagnosis — problem-list-item does NOT appear (stored in different DB table)', async ({
    api,
  }) => {
    const { body } = await api.fhir.getConditions(ctx.patientUuid, 'encounter-diagnosis');
    const conditions = getBundleEntriesByType<ConditionEntry>(body, 'Condition');
    const codes = conditions.map((c) => c.code.coding[0].code);

    expect(codes).not.toContain(CONDITION_CODES.anaemia);
  });

  // --- Pagination / Limits ---

  test('GET /fhir2/R4/Condition?_count=100 — entry count does not exceed server page max', async ({ api }) => {
    const { body } = await api.fhir.getConditions(ctx.patientUuid, 'encounter-diagnosis', 100);

    expect(body.entry?.length ?? 0).toBeLessThanOrEqual(SERVER_PAGE_MAX);
  });

  test('GET /fhir2/R4/Condition?_count=1 — returns at most 1 entry', async ({ api }) => {
    const { body } = await api.fhir.getConditions(ctx.patientUuid, 'encounter-diagnosis', 1);

    expect(body.entry?.length ?? 0).toBeLessThanOrEqual(1);
  });

  test.afterAll(async ({ api }) => {
    await teardownConsultationContext(api, ctx);
  });
});
