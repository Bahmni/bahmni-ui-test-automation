import { test, expect } from '../../../../src/api/fixtures/apiFixture';
import { getBundleEntriesByType } from '../../../../src/utils/fhir-bundle-utils';
import {
  buildBundleWithFutureEncounterDatetime,
  buildBundleWithPreVisitEncounterDatetime,
  buildBundleWithValidAllergyAndInvalidServiceRequest,
} from '../../../../test-data/api/consultationBundlePayload';
import { ENCOUNTER_TYPES } from '../../../../test-data/api/constants';
import {
  ConsultationContext,
  setupConsultationContext,
  teardownConsultationContext,
} from '../../../../src/api/helpers/consultationSetup';

/**
 * Verifies server-enforced ConsultationBundle validations that depend on real DB state
 * (visit lifecycle, server clock, transaction semantics) and cannot be tested at the
 * module unit-test level.
 */
test.describe.serial('POST /fhir2/R4/ConsultationBundle — server-enforced validation', () => {
  let ctx: ConsultationContext;

  test.beforeAll(async ({ api }) => {
    ctx = await setupConsultationContext(api);
  });

  // --- Encounter datetime validation (Bahmni-specific business rule, not FHIR spec) ---

  test('POST /fhir2/R4/ConsultationBundle — encounter datetime in the future is rejected', async ({ api }) => {
    const { status } = await api.fhir.submitConsultationBundleRaw(buildBundleWithFutureEncounterDatetime(ctx));

    expect(status).toBe(400);
  });

  test('POST /fhir2/R4/ConsultationBundle — encounter datetime before visit start is rejected', async ({ api }) => {
    const { status } = await api.fhir.submitConsultationBundleRaw(buildBundleWithPreVisitEncounterDatetime(ctx));

    expect(status).toBe(400);
  });

  // --- Bundle transaction atomicity ---
  // FHIR `type=transaction` semantics: if any entry fails, all entries roll back.
  // Tests that a failing ServiceRequest in the middle of a bundle leaves no orphaned
  // Encounter or AllergyIntolerance behind.

  test('POST /fhir2/R4/ConsultationBundle — partial failure rolls back: no Encounter persisted', async ({ api }) => {
    const isolatedCtx = await setupConsultationContext(api);
    try {
      const { status } = await api.fhir.submitConsultationBundleRaw(
        buildBundleWithValidAllergyAndInvalidServiceRequest(isolatedCtx)
      );
      expect(status).toBe(400);

      const { body } = await api.fhir.getEncounters(isolatedCtx.patientUuid, 100);
      const consultationEncounters = getBundleEntriesByType<{ type?: Array<{ coding: Array<{ code: string }> }> }>(
        body,
        'Encounter'
      ).filter((e) => e.type?.[0]?.coding?.[0]?.code === ENCOUNTER_TYPES.consultation);

      // Visit encounter (created during setup) is allowed, but no consultation encounter should exist
      expect(consultationEncounters.length).toBe(0);
    } finally {
      await teardownConsultationContext(api, isolatedCtx);
    }
  });

  test('POST /fhir2/R4/ConsultationBundle — partial failure rolls back: no AllergyIntolerance persisted', async ({
    api,
  }) => {
    const isolatedCtx = await setupConsultationContext(api);
    try {
      const { status } = await api.fhir.submitConsultationBundleRaw(
        buildBundleWithValidAllergyAndInvalidServiceRequest(isolatedCtx)
      );
      expect(status).toBe(400);

      const { body } = await api.fhir.getAllergyIntolerances(isolatedCtx.patientUuid);
      const allergies = getBundleEntriesByType(body, 'AllergyIntolerance');

      expect(allergies.length).toBe(0);
    } finally {
      await teardownConsultationContext(api, isolatedCtx);
    }
  });

  test.afterAll(async ({ api }) => {
    await teardownConsultationContext(api, ctx);
  });
});
