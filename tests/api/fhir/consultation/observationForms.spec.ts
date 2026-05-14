import { test, expect } from '../../../../src/api/fixtures/apiFixture';
import { getBundleEntriesByType } from '../../../../src/utils/fhir-bundle-utils';
import {
  buildVitalsAndGynaecologyBundle,
  INTERPRETATION_ABNORMAL,
  VitalsAndGynaecologyBundleSpec,
  VitalsAndGynaecologySubmittedObs,
} from '../../../../test-data/api/consultationBundlePayload';
import { FORM_NAMES, FORM_NAMESPACE_EXT_URL } from '../../../../test-data/api/constants';
import {
  ConsultationContext,
  extractFirstUuidFromBundle,
  setupConsultationContext,
  teardownConsultationContext,
} from '../../../../src/api/helpers/consultationSetup';
import { ObservationEntry } from '../../../../src/api/types/fhir-resources.types';

function findObsByCode(observations: ObservationEntry[], code: string): ObservationEntry | undefined {
  return observations.find((o) => o.code.coding.some((c) => c.code === code));
}

function findObsById(observations: ObservationEntry[], reference: string): ObservationEntry | undefined {
  const id = reference.split('/').pop();
  return observations.find((o) => o.id === id);
}

function assertObsMatchesSpec(
  obs: ObservationEntry | undefined,
  spec: VitalsAndGynaecologySubmittedObs,
  allObservations: ObservationEntry[]
): void {
  expect(obs, `Observation with code ${spec.code} not found in response`).toBeDefined();
  if (!obs) return;

  expect(obs.extension?.some((e) => e.url === FORM_NAMESPACE_EXT_URL && e.valueString === spec.formNamespacePath)).toBe(
    true
  );

  if (spec.valueQuantity !== undefined) {
    expect(obs.valueQuantity?.value).toBe(spec.valueQuantity);
  }
  if (spec.valueCodeableConceptCode !== undefined) {
    expect(
      obs.valueCodeableConcept?.coding.some(
        (c) => c.code === spec.valueCodeableConceptCode && c.display === spec.valueCodeableConceptDisplay
      )
    ).toBe(true);
  }
  if (spec.valueDateTime !== undefined) {
    expect(obs.valueDateTime).toBeDefined();
    const actual = obs.valueDateTime ? new Date(obs.valueDateTime).toISOString() : '';
    expect(actual).toBe(new Date(spec.valueDateTime).toISOString());
  }
  if (spec.hasMemberCount !== undefined) {
    expect(obs.hasMember?.length).toBe(spec.hasMemberCount);
  }
  if (spec.hasMemberCodes !== undefined) {
    const resolvedCodes = (obs.hasMember ?? [])
      .map((m) => findObsById(allObservations, m.reference))
      .map((child) => child?.code.coding.find((c) => spec.hasMemberCodes?.includes(c.code))?.code);
    expect(resolvedCodes.filter((c): c is string => c !== undefined).sort()).toEqual([...spec.hasMemberCodes].sort());
  }
  if (spec.note !== undefined) {
    expect(obs.note?.[0]?.text).toBe(spec.note);
  }
  if (spec.interpretationAbnormal) {
    expect(obs.interpretation?.[0]?.coding.some((c) => c.code === INTERPRETATION_ABNORMAL.code)).toBe(true);
  }
}

test.describe.serial('POST /fhir2/R4/ConsultationBundle (Vitals + Obstetrics & Gynaecology)', () => {
  let ctx: ConsultationContext;
  let bundleSpec: VitalsAndGynaecologyBundleSpec;
  let encounterUuid: string;

  test.beforeAll(async ({ api }) => {
    ctx = await setupConsultationContext(api);
    bundleSpec = buildVitalsAndGynaecologyBundle(ctx);
  });

  test('POST /fhir2/R4/ConsultationBundle — response echoes every submitted observation with matching value, note, interpretation, and form-namespace extension', async ({
    api,
  }) => {
    const { status, body } = await api.fhir.submitConsultationBundle(bundleSpec.bundle);

    expect(status).toBe(201);
    encounterUuid = extractFirstUuidFromBundle(body, 'Encounter');

    const observations = getBundleEntriesByType<ObservationEntry>(body, 'Observation');
    expect(observations.length).toBe(bundleSpec.submittedObs.length);

    bundleSpec.submittedObs.forEach((spec) =>
      assertObsMatchesSpec(findObsByCode(observations, spec.code), spec, observations)
    );
  });

  test('GET /bahmnicore/patient/{uuid}/forms?numberOfVisits=10 — both Vitals and Obstetrics & Gynaecology forms appear for the encounter', async ({
    api,
  }) => {
    const { status, body } = await api.forms.getForms(ctx.patientUuid, 10);

    expect(status).toBe(200);
    const formsForEncounter = body.filter((f) => f.encounterUuid === encounterUuid);
    const formNames = formsForEncounter.map((f) => f.formName);

    expect(formNames).toContain(FORM_NAMES.vitals);
    expect(formNames).toContain(FORM_NAMES.obstetricsAndGynaecology);
  });

  test('GET /fhir2/R4/Observation/$fetch-all?encounter={uuid} — returns every submitted observation with values preserved', async ({
    api,
  }) => {
    const { status, body } = await api.fhir.fetchAllObservationsByEncounter(encounterUuid);

    expect(status).toBe(200);
    const observations = getBundleEntriesByType<ObservationEntry>(body, 'Observation');
    expect(observations.length).toBe(bundleSpec.submittedObs.length);

    bundleSpec.submittedObs.forEach((spec) =>
      assertObsMatchesSpec(findObsByCode(observations, spec.code), spec, observations)
    );
  });

  test.afterAll(async ({ api }) => {
    await teardownConsultationContext(api, ctx);
  });
});
