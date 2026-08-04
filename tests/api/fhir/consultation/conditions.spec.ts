import { test, expect } from '../../../../src/api/fixtures/apiFixture';
import { getBundleEntriesByType } from '../../../../src/utils/fhir-bundle-utils';
import {
  buildAllergyBundle,
  buildDiagnosisBundle,
  buildProblemListBundle,
} from '../../../../test-data/api/encounterBundlePayload';
import { CONDITION_CODES } from '../../../../test-data/api/constants';
import {
  ConsultationContext,
  extractFirstUuidFromBundle,
  setupConsultationContext,
  teardownConsultationContext,
} from '../../../../src/api/helpers/consultationSetup';
import { ConditionEntry } from '../../../../src/api/types/fhir-resources.types';

test.describe.serial('POST /fhir2/R4/EncounterBundle → GET /fhir2/R4/Condition', { tag: ['@regression'] }, () => {
  let ctx: ConsultationContext;
  let encounterUuid: string;

  test.beforeAll(async ({ api }) => {
    ctx = await setupConsultationContext(api);
    const { body: allergyResponse } = await api.fhir.submitEncounterBundle(buildAllergyBundle(ctx));
    encounterUuid = extractFirstUuidFromBundle(allergyResponse, 'Encounter');
  });

  test('POST /fhir2/R4/EncounterBundle (encounter-diagnosis only) — save diagnosis and validate response fields', async ({
    api,
  }) => {
    const { status, body } = await api.fhir.submitEncounterBundle(buildDiagnosisBundle(ctx, encounterUuid));

    expect(status).toBe(201);
    const conditions = getBundleEntriesByType<ConditionEntry>(body, 'Condition');
    expect(conditions.length).toBe(1);

    const diagnosis = conditions[0];
    expect(diagnosis.code.coding[0].code).toBe(CONDITION_CODES.malaria);
    expect(diagnosis.category[0].coding[0].code).toBe('encounter-diagnosis');
    expect(diagnosis.subject.reference).toContain(ctx.patientUuid);
    expect(diagnosis.encounter?.reference).toContain(encounterUuid);
    expect(diagnosis.recordedDate).toBeDefined();
    expect(diagnosis.recorder?.reference).toContain(ctx.userUuid);
  });

  test('POST /fhir2/R4/EncounterBundle (problem-list-item only) — save condition and validate response fields', async ({
    api,
  }) => {
    const { status, body } = await api.fhir.submitEncounterBundle(buildProblemListBundle(ctx, encounterUuid));

    expect(status).toBe(201);
    const conditions = getBundleEntriesByType<ConditionEntry & { onsetDateTime?: string }>(body, 'Condition');
    const problem = conditions.find((c) => c.code.coding[0].code === CONDITION_CODES.anaemia);

    expect(problem).toBeDefined();
    expect(problem?.category[0].coding[0].code).toBe('problem-list-item');
    expect(problem?.clinicalStatus?.coding[0].code).toBe('active');
    expect(problem?.subject.reference).toContain(ctx.patientUuid);
    expect(problem?.onsetDateTime).toBeDefined();
    expect(problem?.encounter?.reference).toContain(encounterUuid);
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

  test.afterAll(async ({ api }) => {
    await teardownConsultationContext(api, ctx);
  });
});
