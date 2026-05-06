import { test, expect } from '../../../../src/api/fixtures/apiFixture';
import { getBundleEntriesByType } from '../../../../src/utils/fhir-bundle-utils';
import {
  buildAllergyBundle,
  buildAllergyBundleWithCode,
  buildBundleWithInvalidPatientRef,
} from '../../../../test-data/api/consultationBundlePayload';
import { ALLERGY_CODES, ALLERGY_REACTION_CODES } from '../../../../test-data/api/constants';
import {
  ConsultationContext,
  extractFirstUuidFromBundle,
  setupConsultationContext,
  teardownConsultationContext,
} from '../../../../src/api/helpers/consultationSetup';
import { AllergyIntoleranceEntry } from '../../../../src/api/types/fhir-resources.types';

test.describe.serial('POST /fhir2/R4/ConsultationBundle → GET /fhir2/R4/AllergyIntolerance', () => {
  let ctx: ConsultationContext;
  let encounterUuid: string;

  test.beforeAll(async ({ api }) => {
    ctx = await setupConsultationContext(api);
    const { body } = await api.fhir.submitConsultationBundle(buildAllergyBundle(ctx));
    encounterUuid = extractFirstUuidFromBundle(body, 'Encounter');
  });

  test('GET /fhir2/R4/AllergyIntolerance — saved allergy appears in patient record after ConsultationBundle submission', async ({
    api,
  }) => {
    const { status, body } = await api.fhir.getAllergyIntolerances(ctx.patientUuid);

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');

    const allergies = getBundleEntriesByType<AllergyIntoleranceEntry>(body, 'AllergyIntolerance');
    expect(allergies.length).toBeGreaterThan(0);
  });

  test('GET /fhir2/R4/AllergyIntolerance — patient.reference contains correct patient UUID (reference integrity)', async ({
    api,
  }) => {
    const { body } = await api.fhir.getAllergyIntolerances(ctx.patientUuid);
    const allergies = getBundleEntriesByType<AllergyIntoleranceEntry>(body, 'AllergyIntolerance');

    expect(allergies[0].patient.reference).toContain(ctx.patientUuid);
  });

  test('GET /fhir2/R4/AllergyIntolerance — category is a valid FHIR allergy category', async ({ api }) => {
    const { body } = await api.fhir.getAllergyIntolerances(ctx.patientUuid);
    const allergies = getBundleEntriesByType<AllergyIntoleranceEntry>(body, 'AllergyIntolerance');
    const validCategories = ['food', 'medication', 'environment', 'biologic'];

    expect(allergies[0].category).toBeDefined();
    expect(allergies[0].category.length).toBeGreaterThan(0);
    expect(validCategories).toContain(allergies[0].category[0]);
  });

  test('GET /fhir2/R4/AllergyIntolerance — code.coding[0].code matches submitted allergy concept code', async ({
    api,
  }) => {
    const { body } = await api.fhir.getAllergyIntolerances(ctx.patientUuid);
    const allergies = getBundleEntriesByType<AllergyIntoleranceEntry>(body, 'AllergyIntolerance');

    expect(allergies[0].code.coding[0].code).toBe(ALLERGY_CODES.penicillin);
  });

  test('GET /fhir2/R4/AllergyIntolerance — reaction.severity matches submitted value', async ({ api }) => {
    const { body } = await api.fhir.getAllergyIntolerances(ctx.patientUuid);
    const allergies = getBundleEntriesByType<AllergyIntoleranceEntry>(body, 'AllergyIntolerance');
    const validSeverities = ['mild', 'moderate', 'severe'];

    expect(allergies[0].reaction[0].severity).toBeDefined();
    expect(validSeverities).toContain(allergies[0].reaction[0].severity);
  });

  test('GET /fhir2/R4/AllergyIntolerance — reaction.manifestation code matches submitted code', async ({ api }) => {
    const { body } = await api.fhir.getAllergyIntolerances(ctx.patientUuid);
    const allergies = getBundleEntriesByType<AllergyIntoleranceEntry>(body, 'AllergyIntolerance');

    expect(allergies[0].reaction[0].manifestation[0].coding[0].code).toBe(ALLERGY_REACTION_CODES.rash);
  });

  test('POST /fhir2/R4/ConsultationBundle — submitting duplicate allergen for same patient returns 400 (DB uniqueness constraint)', async ({
    api,
  }) => {
    const duplicateBundle = buildAllergyBundleWithCode(
      ctx,
      encounterUuid,
      ALLERGY_CODES.penicillin,
      'food',
      'moderate'
    );
    const { status } = await api.fhir.submitConsultationBundleRaw(duplicateBundle);

    expect(status).toBe(400);
  });

  test('POST /fhir2/R4/ConsultationBundle — bundle with invalid patient reference returns 400 (FHIR validation failure)', async ({
    api,
  }) => {
    const { status } = await api.fhir.submitConsultationBundleRaw(buildBundleWithInvalidPatientRef(ctx));

    expect(status).toBe(400);
  });

  test('GET /fhir2/R4/AllergyIntolerance — _count=1 returns 1 entry, _count=2 returns 2 entries', async ({ api }) => {
    await api.fhir.submitConsultationBundle(buildAllergyBundle(ctx, ALLERGY_CODES.aspirin));

    const { body: body1 } = await api.fhir.getAllergyIntolerances(ctx.patientUuid, 1);
    expect(body1.entry?.length ?? 0).toBe(1);

    const { body: body2 } = await api.fhir.getAllergyIntolerances(ctx.patientUuid, 2);
    const allergies = getBundleEntriesByType<AllergyIntoleranceEntry>(body2, 'AllergyIntolerance');
    expect(allergies.length).toBe(2);
  });

  test.afterAll(async ({ api }) => {
    await teardownConsultationContext(api, ctx);
  });
});
