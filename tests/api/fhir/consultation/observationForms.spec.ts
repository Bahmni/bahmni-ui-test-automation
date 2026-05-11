import { test, expect } from '../../../../src/api/fixtures/apiFixture';
import { getBundleEntriesByType } from '../../../../src/utils/fhir-bundle-utils';
import {
  buildAllergyBundle,
  buildHistoryExaminationBundle,
  buildVitalsBundle,
} from '../../../../test-data/api/consultationBundlePayload';
import { HE_CONCEPTS, HE_VALUES, SERVER_PAGE_MAX, VITALS_CONCEPTS } from '../../../../test-data/api/constants';
import {
  ConsultationContext,
  extractFirstUuidFromBundle,
  setupConsultationContext,
  teardownConsultationContext,
} from '../../../../src/api/helpers/consultationSetup';
import { ObservationEntry } from '../../../../src/api/types/fhir-resources.types';

const VITALS_CODES = Object.values(VITALS_CONCEPTS);
const HE_CODES = Object.values(HE_CONCEPTS);

test.describe.serial('POST /fhir2/R4/ConsultationBundle → GET /fhir2/R4/Observation (Vitals form)', () => {
  let ctx: ConsultationContext;
  let encounterUuid: string;

  test.beforeAll(async ({ api }) => {
    ctx = await setupConsultationContext(api);
    const { body: allergyResponse } = await api.fhir.submitConsultationBundle(buildAllergyBundle(ctx));
    encounterUuid = extractFirstUuidFromBundle(allergyResponse, 'Encounter');
    await api.fhir.submitConsultationBundle(buildVitalsBundle(ctx, encounterUuid));
  });

  test('GET /fhir2/R4/Observation — vitals observations are retrievable after ConsultationBundle submission', async ({
    api,
  }) => {
    const { status, body } = await api.fhir.getObservations(ctx.patientUuid, VITALS_CODES);

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');
    const observations = getBundleEntriesByType<ObservationEntry>(body, 'Observation');
    expect(observations.length).toBeGreaterThan(0);
  });

  test('GET /fhir2/R4/Observation — all vitals subject.reference contains patient UUID (reference integrity)', async ({
    api,
  }) => {
    const { body } = await api.fhir.getObservations(ctx.patientUuid, VITALS_CODES);
    const observations = getBundleEntriesByType<ObservationEntry>(body, 'Observation');

    observations.forEach((o) => expect(o.subject.reference).toContain(ctx.patientUuid));
  });

  test('GET /fhir2/R4/Observation — blood pressure group observation has hasMember references', async ({ api }) => {
    const { body } = await api.fhir.getObservations(ctx.patientUuid, VITALS_CODES);
    const observations = getBundleEntriesByType<ObservationEntry>(body, 'Observation');
    const bpGroup = observations.find((o) => o.code.coding[0].code === VITALS_CONCEPTS.bloodPressureGroup);

    expect(bpGroup).toBeDefined();
    expect(bpGroup?.hasMember).toBeDefined();
    expect(bpGroup?.hasMember?.length).toBeGreaterThan(0);
  });

  test('GET /fhir2/R4/Observation?_include=Observation:has-member — systolic and diastolic observations are bundled as members', async ({
    api,
  }) => {
    const { body } = await api.fhir.getObservations(ctx.patientUuid, VITALS_CODES);
    const observations = getBundleEntriesByType<ObservationEntry>(body, 'Observation');
    const codes = observations.map((o) => o.code.coding[0].code);

    expect(codes).toContain(VITALS_CONCEPTS.bpSystolic);
    expect(codes).toContain(VITALS_CONCEPTS.bpDiastolic);
  });

  test('GET /fhir2/R4/Observation?_include=Observation:encounter — Encounter resource is bundled alongside observations', async ({
    api,
  }) => {
    const { body } = await api.fhir.getObservations(ctx.patientUuid, VITALS_CODES);
    const encounters = getBundleEntriesByType(body, 'Encounter');

    expect(encounters.length).toBeGreaterThan(0);
  });

  test('GET /fhir2/R4/Observation?_count=100 — entry count does not exceed server page max', async ({ api }) => {
    const { body } = await api.fhir.getObservations(ctx.patientUuid, VITALS_CODES, 100);

    expect(body.entry?.length ?? 0).toBeLessThanOrEqual(SERVER_PAGE_MAX);
  });

  test('GET /fhir2/R4/Observation?_count=1 — returns at most 1 Observation entry', async ({ api }) => {
    const { body } = await api.fhir.getObservations(ctx.patientUuid, VITALS_CODES, 1);
    const observations = getBundleEntriesByType<ObservationEntry>(body, 'Observation');

    expect(observations.length).toBeLessThanOrEqual(1);
  });

  test.afterAll(async ({ api }) => {
    await teardownConsultationContext(api, ctx);
  });
});

test.describe
  .serial('POST /fhir2/R4/ConsultationBundle → GET /fhir2/R4/Observation (History & Examination form)', () => {
  let ctx: ConsultationContext;
  let encounterUuid: string;

  test.beforeAll(async ({ api }) => {
    ctx = await setupConsultationContext(api);
    const { body: allergyResponse } = await api.fhir.submitConsultationBundle(buildAllergyBundle(ctx));
    encounterUuid = extractFirstUuidFromBundle(allergyResponse, 'Encounter');
    await api.fhir.submitConsultationBundle(buildHistoryExaminationBundle(ctx, encounterUuid));
  });

  test('GET /fhir2/R4/Observation — H&E observations are retrievable after ConsultationBundle submission', async ({
    api,
  }) => {
    const { status, body } = await api.fhir.getObservations(ctx.patientUuid, HE_CODES);

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');
    const observations = getBundleEntriesByType<ObservationEntry>(body, 'Observation');
    expect(observations.length).toBeGreaterThan(0);
  });

  test('GET /fhir2/R4/Observation — chief complaint group observation has hasMember references (parent + children persisted atomically)', async ({
    api,
  }) => {
    const { body } = await api.fhir.getObservations(ctx.patientUuid, HE_CODES);
    const observations = getBundleEntriesByType<ObservationEntry>(body, 'Observation');
    const chiefComplaintGroup = observations.find((o) => o.code.coding[0].code === HE_CONCEPTS.chiefComplaintGroup);

    expect(chiefComplaintGroup).toBeDefined();
    expect(chiefComplaintGroup?.hasMember?.length).toBeGreaterThan(0);
  });

  test('GET /fhir2/R4/Observation?_include=Observation:has-member — child observations (duration, duration unit) are bundled', async ({
    api,
  }) => {
    const { body } = await api.fhir.getObservations(ctx.patientUuid, HE_CODES);
    const observations = getBundleEntriesByType<ObservationEntry>(body, 'Observation');
    const codes = observations.map((o) => o.code.coding[0].code);

    expect(codes).toContain(HE_CONCEPTS.duration);
    expect(codes).toContain(HE_CONCEPTS.durationUnit);
  });

  test('GET /fhir2/R4/Observation — history of illness observation has valueString matching submitted text', async ({
    api,
  }) => {
    const { body } = await api.fhir.getObservations(ctx.patientUuid, HE_CODES);
    const observations = getBundleEntriesByType<ObservationEntry>(body, 'Observation');
    const historyObs = observations.find((o) => o.code.coding[0].code === HE_CONCEPTS.historyOfIllness);

    expect(historyObs).toBeDefined();
    expect(historyObs?.valueString).toBe(HE_VALUES.historyText);
  });

  test('GET /fhir2/R4/Observation?_include=Observation:encounter — Encounter resource is bundled alongside H&E observations', async ({
    api,
  }) => {
    const { body } = await api.fhir.getObservations(ctx.patientUuid, HE_CODES);
    const encounters = getBundleEntriesByType(body, 'Encounter');

    expect(encounters.length).toBeGreaterThan(0);
  });

  test.afterAll(async ({ api }) => {
    await teardownConsultationContext(api, ctx);
  });
});
