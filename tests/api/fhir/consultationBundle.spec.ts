import { test, expect } from '../../../src/api/fixtures/apiFixture';
import { buildCreatePatientPayload } from '../../../test-data/api/patientPayload';
import { buildStartVisitPayload } from '../../../test-data/api/visitPayload';
import { LOCATIONS, VISIT_TYPES } from '../../../test-data/api/constants';
import {
  buildAllergyBundle,
  buildConditionsBundle,
  buildMedicationRequestBundle,
} from '../../../test-data/api/consultationBundlePayload';
import { getBundleEntriesByType } from '../../../src/utils/fhir-bundle-utils';

test.describe.serial('ConsultationBundle - save and verify FHIR resources', () => {
  let patientUuid: string;
  let visitUuid: string;
  let encounterUuid: string;
  let practitionerUuid: string;

  test.beforeAll(async ({ api }) => {
    const { body: patientBody } = await api.patient.create(buildCreatePatientPayload());
    patientUuid = patientBody.patient.uuid;

    const { body: locationBody } = await api.location.getByName(LOCATIONS.opd1);
    const locationUuid = locationBody.results[0].uuid;

    const { body: visitTypeBody } = await api.visit.getVisitTypes();
    const opdType = visitTypeBody.results.find((vt) => vt.display.includes(VISIT_TYPES.opd));
    if (!opdType) throw new Error('OPD visit type not found');

    const { body: visitBody } = await api.visit.create(buildStartVisitPayload(patientUuid, opdType.uuid, locationUuid));
    visitUuid = visitBody.uuid;

    const { body: sessionBody } = await api.user.getSession();
    const { body: providerBody } = await api.user.getProviderByUser(sessionBody.user.uuid);
    if (!providerBody.results.length) throw new Error('No provider found for admin user');
    practitionerUuid = providerBody.results[0].uuid;

    const { body: visitEncounterBundle } = await api.fhir.getVisitEncounters(patientUuid);
    const visitEncounters = getBundleEntriesByType<{ id: string }>(visitEncounterBundle, 'Encounter');
    if (!visitEncounters.length) throw new Error('No visit encounter found');
    const visitEncounterUuid = visitEncounters[0].id;

    const ctx = { patientUuid, visitEncounterUuid, practitionerUuid };

    const { body: allergyBundleResponse } = await api.fhir.submitConsultationBundle(buildAllergyBundle(ctx));

    const createdEncounterEntry = allergyBundleResponse.entry?.find((e) => e.resource.resourceType === 'Encounter');
    if (!createdEncounterEntry) throw new Error('Encounter not returned in ConsultationBundle response');
    encounterUuid = createdEncounterEntry.resource.id;

    await api.fhir.submitConsultationBundle(buildConditionsBundle(ctx, encounterUuid));
  });

  test('GET AllergyIntolerance returns bundle with mandatory elements', async ({ api }) => {
    const { status, body } = await api.fhir.getAllergyIntolerances(patientUuid);

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');

    const allergies = getBundleEntriesByType<{
      resourceType: string;
      patient: { reference: string };
      category: string[];
      code: { coding: Array<{ code: string }> };
      reaction: Array<{ manifestation: unknown[]; severity: string }>;
    }>(body, 'AllergyIntolerance');

    expect(allergies.length).toBeGreaterThan(0);
    const allergy = allergies[0];
    expect(allergy.resourceType).toBe('AllergyIntolerance');
    expect(allergy.category).toBeDefined();
    expect(allergy.code).toBeDefined();
    expect(allergy.reaction).toBeDefined();
  });

  test('AllergyIntolerance patient reference points to correct patient', async ({ api }) => {
    const { body } = await api.fhir.getAllergyIntolerances(patientUuid);

    const allergies = getBundleEntriesByType<{
      patient: { reference: string };
    }>(body, 'AllergyIntolerance');

    expect(allergies.length).toBeGreaterThan(0);
    expect(allergies[0].patient.reference).toContain(patientUuid);
  });

  test('GET Condition returns encounter-diagnosis with mandatory elements', async ({ api }) => {
    const { status, body } = await api.fhir.getConditions(patientUuid, 'encounter-diagnosis');

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');

    const conditions = getBundleEntriesByType<{
      resourceType: string;
      subject: { reference: string };
      code: { coding: unknown[] };
      encounter: { reference: string };
    }>(body, 'Condition');

    expect(conditions.length).toBeGreaterThan(0);
    const condition = conditions[0];
    expect(condition.resourceType).toBe('Condition');
    expect(condition.code).toBeDefined();
    expect(condition.subject).toBeDefined();
    expect(condition.encounter).toBeDefined();
  });

  test('Condition subject reference points to correct patient', async ({ api }) => {
    const { body } = await api.fhir.getConditions(patientUuid, 'encounter-diagnosis');

    const conditions = getBundleEntriesByType<{
      subject: { reference: string };
      encounter: { reference: string };
    }>(body, 'Condition');

    expect(conditions.length).toBeGreaterThan(0);
    expect(conditions[0].subject.reference).toContain(patientUuid);
    expect(conditions[0].encounter.reference).toContain(encounterUuid);
  });

  test('GET Condition returns problem-list-item with mandatory elements', async ({ api }) => {
    const { status, body } = await api.fhir.getConditions(patientUuid, 'problem-list-item');

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');

    const conditions = getBundleEntriesByType<{
      subject: { reference: string };
      code: { coding: unknown[] };
      clinicalStatus: { coding: unknown[] };
    }>(body, 'Condition');

    expect(conditions.length).toBeGreaterThan(0);
    expect(conditions[0].code).toBeDefined();
    expect(conditions[0].clinicalStatus).toBeDefined();
    expect(conditions[0].subject.reference).toContain(patientUuid);
  });

  test('GET MedicationRequest with _include bundles Medication resources', async ({ api }) => {
    const { body: medBundle } = await api.fhir.searchMedication('Aspirin');
    const medications = getBundleEntriesByType<{ id: string }>(medBundle, 'Medication');

    if (!medications.length) {
      test.skip();
      return;
    }

    const medicationUuid = medications[0].id;
    const ctx = {
      patientUuid,
      visitEncounterUuid: await api.fhir
        .getVisitEncounters(patientUuid)
        .then((r) => getBundleEntriesByType<{ id: string }>(r.body, 'Encounter')[0].id),
      practitionerUuid,
    };
    await api.fhir.submitConsultationBundle(buildMedicationRequestBundle(ctx, encounterUuid, medicationUuid));

    const { status, body } = await api.fhir.getMedicationRequests(patientUuid);

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');

    const medicationRequests = getBundleEntriesByType(body, 'MedicationRequest');
    const includedMedications = getBundleEntriesByType(body, 'Medication');

    expect(medicationRequests.length).toBeGreaterThan(0);
    expect(includedMedications.length).toBeGreaterThan(0);
  });

  test.afterAll(async ({ api }) => {
    if (visitUuid) await api.visit.end(visitUuid);
    if (patientUuid) await api.patient.delete(patientUuid);
  });
});
