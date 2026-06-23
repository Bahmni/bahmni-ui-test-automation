import { test, expect } from '../../../src/api/fixtures/apiFixture';
import { getBundleEntriesByType } from '../../../src/utils/fhir-bundle-utils';
import { buildAllergyBundle } from '../../../test-data/api/encounterBundlePayload';
import { ALLERGY_CODES } from '../../../test-data/api/constants';
import {
  ConsultationContext,
  setupConsultationContext,
  teardownConsultationContext,
} from '../../../src/api/helpers/consultationSetup';
import { AllergyIntoleranceEntry } from '../../../src/api/types/fhir-resources.types';

/**
 * Verifies that FHIR queries by patient UUID return only that patient's data.
 * This is a security-critical integration test: data leakage across patients would be a serious bug.
 * The module's DAO unit tests use mocks and cannot catch this.
 */
test.describe.serial(
  "Patient data isolation — FHIR queries return only the queried patient's data",
  { tag: ['@regression'] },
  () => {
    let ctxA: ConsultationContext;
    let ctxB: ConsultationContext;

    test.beforeAll(async ({ api }) => {
      ctxA = await setupConsultationContext(api);
      ctxB = await setupConsultationContext(api);

      // Patient A gets a penicillin allergy
      await api.fhir.submitEncounterBundle(buildAllergyBundle(ctxA, ALLERGY_CODES.penicillin));
      // Patient B gets an aspirin allergy
      await api.fhir.submitEncounterBundle(buildAllergyBundle(ctxB, ALLERGY_CODES.aspirin));
    });

    test("GET /fhir2/R4/AllergyIntolerance?patient={A} — returns A's allergy and never B's", async ({ api }) => {
      const { body } = await api.fhir.getAllergyIntolerances(ctxA.patientUuid);
      const allergies = getBundleEntriesByType<AllergyIntoleranceEntry>(body, 'AllergyIntolerance');

      const codes = allergies.map((a) => a.code.coding[0].code);
      const patientRefs = allergies.map((a) => a.patient.reference);

      expect(codes).toContain(ALLERGY_CODES.penicillin);
      expect(codes).not.toContain(ALLERGY_CODES.aspirin);
      patientRefs.forEach((ref) => {
        expect(ref).toContain(ctxA.patientUuid);
        expect(ref).not.toContain(ctxB.patientUuid);
      });
    });

    test("GET /fhir2/R4/AllergyIntolerance?patient={B} — returns B's allergy and never A's", async ({ api }) => {
      const { body } = await api.fhir.getAllergyIntolerances(ctxB.patientUuid);
      const allergies = getBundleEntriesByType<AllergyIntoleranceEntry>(body, 'AllergyIntolerance');

      const codes = allergies.map((a) => a.code.coding[0].code);
      const patientRefs = allergies.map((a) => a.patient.reference);

      expect(codes).toContain(ALLERGY_CODES.aspirin);
      expect(codes).not.toContain(ALLERGY_CODES.penicillin);
      patientRefs.forEach((ref) => {
        expect(ref).toContain(ctxB.patientUuid);
        expect(ref).not.toContain(ctxA.patientUuid);
      });
    });

    test('GET /fhir2/R4/Encounter?subject:Patient={A} — returns only encounters belonging to patient A', async ({
      api,
    }) => {
      const { body } = await api.fhir.getVisitEncounters(ctxA.patientUuid);
      const encounters = getBundleEntriesByType<{ subject: { reference: string } }>(body, 'Encounter');

      expect(encounters.length).toBeGreaterThan(0);
      encounters.forEach((e) => {
        expect(e.subject.reference).toContain(ctxA.patientUuid);
        expect(e.subject.reference).not.toContain(ctxB.patientUuid);
      });
    });

    test.afterAll(async ({ api }) => {
      await teardownConsultationContext(api, ctxA);
      await teardownConsultationContext(api, ctxB);
    });
  }
);
