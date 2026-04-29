import { faker } from '@faker-js/faker';
import {
  ALLERGY_CODES,
  ALLERGY_REACTION_CODES,
  CONDITION_CODES,
  DRUG_ORDER,
  ENCOUNTER_TYPES,
  FHIR_CODED_VALUES,
  HE_CONCEPTS,
  HE_VALUES,
  LAB_CONCEPTS,
  LOCATIONS,
  VITALS_CONCEPTS,
  VITALS_VALUES,
} from './constants';
import { BundleContext } from '../../src/api/types/fhir-resources.types';

export type { BundleContext };

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------

// The server rejects encounter datetimes equal to or after the server clock,
// and local/server clocks may differ slightly. Build with a single past timestamp
// per bundle so all entries share the same effective date.
function pastTimestamp(): string {
  return new Date(Date.now() - 2 * 60 * 1000).toISOString();
}

// ---------------------------------------------------------------------------
// Encounter entry builders
// ---------------------------------------------------------------------------

function encounterResource(ctx: BundleContext, timestamp: string, extra: Record<string, unknown> = {}) {
  return {
    resourceType: 'Encounter',
    class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
    status: 'in-progress',
    meta: { tag: [{ system: 'http://fhir.openmrs.org/ext/encounter-tag', code: 'encounter', display: 'Encounter' }] },
    type: [
      {
        coding: [
          {
            code: ENCOUNTER_TYPES.consultation,
            system: 'http://fhir.openmrs.org/code-system/encounter-type',
            display: 'Consultation',
          },
        ],
      },
    ],
    subject: { reference: `Patient/${ctx.patientUuid}` },
    participant: [{ individual: { reference: `Practitioner/${ctx.practitionerUuid}`, type: 'Practitioner' } }],
    partOf: { reference: `Encounter/${ctx.visitEncounterUuid}` },
    location: [{ location: { reference: `Location/${ctx.locationUuid ?? LOCATIONS.loginLocationUuid}` } }],
    period: { start: timestamp },
    episodeOfCare: [],
    ...extra,
  };
}

/** Creates a NEW encounter (POST) — use for the first bundle submission in a patient's consultation. */
function newEncounterEntry(
  ctx: BundleContext,
  timestamp: string
): { tempUuid: string; entry: Record<string, unknown> } {
  const tempUuid = faker.string.uuid();
  return {
    tempUuid,
    entry: {
      fullUrl: `urn:uuid:${tempUuid}`,
      resource: encounterResource(ctx, timestamp),
      request: { method: 'POST', url: 'Encounter' },
    },
  };
}

/** Updates an EXISTING encounter (PUT) — use for subsequent saves on the same consultation encounter. */
function existingEncounterEntry(encounterUuid: string, ctx: BundleContext, timestamp: string): Record<string, unknown> {
  return {
    fullUrl: `Encounter/${encounterUuid}`,
    resource: { ...encounterResource(ctx, timestamp), id: encounterUuid },
    request: { method: 'PUT', url: `Encounter/${encounterUuid}` },
  };
}

// ---------------------------------------------------------------------------
// Bundle wrapper
// ---------------------------------------------------------------------------

function consultationBundle(entries: Record<string, unknown>[], timestamp: string): Record<string, unknown> {
  return {
    resourceType: 'ConsultationBundle',
    type: 'transaction',
    id: faker.string.uuid(),
    timestamp,
    entry: entries,
  };
}

// ---------------------------------------------------------------------------
// Allergy bundles
// ---------------------------------------------------------------------------

export function buildAllergyBundle(
  ctx: BundleContext,
  allergyCode: string = ALLERGY_CODES.penicillin
): Record<string, unknown> {
  const ts = pastTimestamp();
  const { tempUuid, entry: encounterEntry } = newEncounterEntry(ctx, ts);
  return consultationBundle(
    [
      encounterEntry,
      {
        fullUrl: `urn:uuid:${faker.string.uuid()}`,
        resource: {
          resourceType: 'AllergyIntolerance',
          category: ['food'],
          code: { coding: [{ code: allergyCode }] },
          patient: { reference: `Patient/${ctx.patientUuid}` },
          recorder: { reference: `Practitioner/${ctx.practitionerUuid}`, type: 'Practitioner' },
          encounter: { reference: `urn:uuid:${tempUuid}` },
          reaction: [{ manifestation: [{ coding: [{ code: ALLERGY_REACTION_CODES.rash }] }], severity: 'mild' }],
        },
        request: { method: 'POST', url: 'AllergyIntolerance' },
      },
    ],
    ts
  );
}

/**
 * Single ConsultationBundle that creates one Encounter and many AllergyIntolerance entries.
 * Used to seed >10 allergies in one round-trip for pagination testing.
 */
export function buildBundleWithMultipleAllergies(
  ctx: BundleContext,
  allergyCodes: string[]
): Record<string, unknown> {
  const ts = pastTimestamp();
  const { tempUuid, entry: encounterEntry } = newEncounterEntry(ctx, ts);
  const allergyEntries = allergyCodes.map((code) => ({
    fullUrl: `urn:uuid:${faker.string.uuid()}`,
    resource: {
      resourceType: 'AllergyIntolerance',
      category: ['food'],
      code: { coding: [{ code }] },
      patient: { reference: `Patient/${ctx.patientUuid}` },
      recorder: { reference: `Practitioner/${ctx.practitionerUuid}`, type: 'Practitioner' },
      encounter: { reference: `urn:uuid:${tempUuid}` },
      reaction: [{ manifestation: [{ coding: [{ code: ALLERGY_REACTION_CODES.rash }] }], severity: 'mild' }],
    },
    request: { method: 'POST', url: 'AllergyIntolerance' },
  }));
  return consultationBundle([encounterEntry, ...allergyEntries], ts);
}

export function buildAllergyBundleWithCode(
  ctx: BundleContext,
  encounterRef: string,
  allergyCode: string,
  category: string,
  severity: 'mild' | 'moderate' | 'severe'
): Record<string, unknown> {
  const ts = pastTimestamp();
  return consultationBundle(
    [
      existingEncounterEntry(encounterRef, ctx, ts),
      {
        fullUrl: `urn:uuid:${faker.string.uuid()}`,
        resource: {
          resourceType: 'AllergyIntolerance',
          category: [category],
          code: { coding: [{ code: allergyCode }] },
          patient: { reference: `Patient/${ctx.patientUuid}` },
          recorder: { reference: `Practitioner/${ctx.practitionerUuid}`, type: 'Practitioner' },
          encounter: { reference: `Encounter/${encounterRef}` },
          reaction: [{ manifestation: [{ coding: [{ code: ALLERGY_REACTION_CODES.rash }] }], severity }],
        },
        request: { method: 'POST', url: 'AllergyIntolerance' },
      },
    ],
    ts
  );
}

// ---------------------------------------------------------------------------
// Condition bundles
// ---------------------------------------------------------------------------

function diagnosisConditionEntry(
  ctx: BundleContext,
  encounterUuid: string,
  conceptCode: string,
  recordedDate: string
): Record<string, unknown> {
  return {
    fullUrl: `urn:uuid:${faker.string.uuid()}`,
    resource: {
      resourceType: 'Condition',
      subject: { reference: `Patient/${ctx.patientUuid}` },
      category: [
        {
          coding: [
            { system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'encounter-diagnosis' },
          ],
        },
      ],
      code: { coding: [{ code: conceptCode }] },
      clinicalStatus: {
        coding: [{ code: 'active', system: 'http://terminology.hl7.org/CodeSystem/condition-clinical' }],
      },
      verificationStatus: {
        coding: [{ code: 'confirmed', system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status' }],
      },
      encounter: { reference: `Encounter/${encounterUuid}` },
      recorder: { reference: `Practitioner/${ctx.practitionerUuid}`, type: 'Practitioner' },
      recordedDate,
    },
    request: { method: 'POST', url: 'Condition' },
  };
}

function problemListConditionEntry(
  ctx: BundleContext,
  encounterUuid: string,
  conceptCode: string,
  recordedDate: string,
  onsetDateTime: string
): Record<string, unknown> {
  return {
    fullUrl: `urn:uuid:${faker.string.uuid()}`,
    resource: {
      resourceType: 'Condition',
      subject: { reference: `Patient/${ctx.patientUuid}` },
      category: [
        {
          coding: [
            { system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'problem-list-item' },
          ],
        },
      ],
      code: { coding: [{ code: conceptCode }] },
      clinicalStatus: {
        coding: [{ code: 'active', system: 'http://terminology.hl7.org/CodeSystem/condition-clinical' }],
      },
      encounter: { reference: `Encounter/${encounterUuid}` },
      recorder: { reference: `Practitioner/${ctx.practitionerUuid}`, type: 'Practitioner' },
      recordedDate,
      onsetDateTime,
    },
    request: { method: 'POST', url: 'Condition' },
  };
}

/** Bundle with both an encounter-diagnosis and a problem-list-item Condition. */
export function buildConditionsBundle(ctx: BundleContext, encounterUuid: string): Record<string, unknown> {
  const ts = pastTimestamp();
  // Onset 5 days before recordedDate, mirroring the real-world UI payload
  const onsetDateTime = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 2 * 60 * 1000).toISOString();
  return consultationBundle(
    [
      existingEncounterEntry(encounterUuid, ctx, ts),
      diagnosisConditionEntry(ctx, encounterUuid, CONDITION_CODES.malaria, ts),
      problemListConditionEntry(ctx, encounterUuid, CONDITION_CODES.anaemia, ts, onsetDateTime),
    ],
    ts
  );
}

/** Bundle with only an encounter-diagnosis Condition. */
export function buildDiagnosisBundle(ctx: BundleContext, encounterUuid: string): Record<string, unknown> {
  const ts = pastTimestamp();
  return consultationBundle(
    [
      existingEncounterEntry(encounterUuid, ctx, ts),
      diagnosisConditionEntry(ctx, encounterUuid, CONDITION_CODES.malaria, ts),
    ],
    ts
  );
}

/** Bundle with only a problem-list-item Condition (includes onsetDateTime). */
export function buildProblemListBundle(ctx: BundleContext, encounterUuid: string): Record<string, unknown> {
  const ts = pastTimestamp();
  const onsetDateTime = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 2 * 60 * 1000).toISOString();
  return consultationBundle(
    [
      existingEncounterEntry(encounterUuid, ctx, ts),
      problemListConditionEntry(ctx, encounterUuid, CONDITION_CODES.anaemia, ts, onsetDateTime),
    ],
    ts
  );
}

// ---------------------------------------------------------------------------
// Lab order bundles
// ---------------------------------------------------------------------------

export function buildLabOrderBundle(ctx: BundleContext): Record<string, unknown> {
  const ts = pastTimestamp();
  const { tempUuid, entry: encounterEntry } = newEncounterEntry(ctx, ts);
  return consultationBundle(
    [
      encounterEntry,
      serviceRequestEntry(
        `urn:uuid:${tempUuid}`,
        ctx.patientUuid,
        ctx.practitionerUuid,
        LAB_CONCEPTS.haemoglobin,
        'stat',
        'haemoglobin test'
      ),
      serviceRequestEntry(
        `urn:uuid:${tempUuid}`,
        ctx.patientUuid,
        ctx.practitionerUuid,
        LAB_CONCEPTS.plateletCount,
        'routine',
        'platelet test'
      ),
    ],
    ts
  );
}

/**
 * Bundle that creates an Encounter and a single ServiceRequest for the Anemia panel (Panel).
 * Use this to set up an order for the DiagnosticReport $submit-bundle flow tested via
 * `FhirApiHelper.postAnemiaReport`, which expects an existing order with the anemia panel concept.
 */
export function buildAnemiaPanelOrderBundle(ctx: BundleContext): Record<string, unknown> {
  const ts = pastTimestamp();
  const { tempUuid, entry: encounterEntry } = newEncounterEntry(ctx, ts);
  return consultationBundle(
    [
      encounterEntry,
      serviceRequestEntry(
        `urn:uuid:${tempUuid}`,
        ctx.patientUuid,
        ctx.practitionerUuid,
        LAB_CONCEPTS.anemiaPanel,
        'routine',
        'anemia panel order'
      ),
    ],
    ts
  );
}

function serviceRequestEntry(
  encounterRef: string,
  patientUuid: string,
  practitionerUuid: string,
  conceptCode: string,
  priority: 'stat' | 'routine',
  note?: string
): Record<string, unknown> {
  const resource: Record<string, unknown> = {
    resourceType: 'ServiceRequest',
    status: 'active',
    intent: 'order',
    priority,
    code: { coding: [{ code: conceptCode }] },
    subject: { reference: `Patient/${patientUuid}` },
    encounter: { reference: encounterRef },
    requester: { reference: `Practitioner/${practitionerUuid}`, type: 'Practitioner' },
  };
  if (note) resource.note = [{ text: note }];
  return { fullUrl: `urn:uuid:${faker.string.uuid()}`, resource, request: { method: 'POST', url: 'ServiceRequest' } };
}

// ---------------------------------------------------------------------------
// Medication request bundle
// ---------------------------------------------------------------------------

export function buildMedicationRequestBundle(
  ctx: BundleContext,
  encounterUuid: string,
  medicationUuid: string
): Record<string, unknown> {
  const ts = pastTimestamp();
  return consultationBundle(
    [
      existingEncounterEntry(encounterUuid, ctx, ts),
      medicationRequestEntry(encounterUuid, ctx.patientUuid, ctx.practitionerUuid, medicationUuid, 'routine', ts),
    ],
    ts
  );
}

function medicationRequestEntry(
  encounterUuid: string,
  patientUuid: string,
  practitionerUuid: string,
  medicationUuid: string,
  priority: 'stat' | 'routine',
  startTimestamp: string
): Record<string, unknown> {
  return {
    fullUrl: `urn:uuid:${faker.string.uuid()}`,
    resource: {
      resourceType: 'MedicationRequest',
      status: 'active',
      intent: 'order',
      medicationReference: { reference: `Medication/${medicationUuid}`, type: 'Medication' },
      subject: { reference: `Patient/${patientUuid}` },
      encounter: { reference: `Encounter/${encounterUuid}` },
      requester: { reference: `Practitioner/${practitionerUuid}`, type: 'Practitioner' },
      dosageInstruction: [
        {
          timing: {
            repeat: {
              boundsPeriod: {
                start: startTimestamp,
                end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
              },
            },
            code: { coding: [{ code: DRUG_ORDER.frequencyImmediate }] },
          },
          asNeededBoolean: false,
          route: { coding: [{ code: DRUG_ORDER.routeOral }] },
          doseAndRate: [{ doseQuantity: { value: 1, code: DRUG_ORDER.doseUnitTablet } }],
        },
      ],
      priority,
      dispenseRequest: {
        numberOfRepeatsAllowed: 0,
        quantity: { value: 1, code: DRUG_ORDER.doseUnitTablet },
      },
    },
    request: { method: 'POST', url: 'MedicationRequest' },
  };
}

// ---------------------------------------------------------------------------
// Vitals observation bundle
// ---------------------------------------------------------------------------

export function buildVitalsBundle(ctx: BundleContext, encounterUuid: string): Record<string, unknown> {
  const ts = pastTimestamp();
  const bpSystolicUuid = faker.string.uuid();
  const bpDiastolicUuid = faker.string.uuid();
  const bpPositionUuid = faker.string.uuid();

  return consultationBundle(
    [
      existingEncounterEntry(encounterUuid, ctx, ts),
      singleObservationEntry(
        encounterUuid,
        ctx.patientUuid,
        ctx.practitionerUuid,
        VITALS_CONCEPTS.pulse,
        { value: VITALS_VALUES.pulse },
        ts
      ),
      singleObservationEntry(
        encounterUuid,
        ctx.patientUuid,
        ctx.practitionerUuid,
        VITALS_CONCEPTS.spO2,
        { value: VITALS_VALUES.spO2 },
        ts
      ),
      singleObservationEntry(
        encounterUuid,
        ctx.patientUuid,
        ctx.practitionerUuid,
        VITALS_CONCEPTS.respiratoryRate,
        { value: VITALS_VALUES.respiratoryRate },
        ts
      ),
      singleObservationEntry(
        encounterUuid,
        ctx.patientUuid,
        ctx.practitionerUuid,
        VITALS_CONCEPTS.temperature,
        { value: VITALS_VALUES.temperature },
        ts
      ),
      namedObservationEntry(
        bpSystolicUuid,
        encounterUuid,
        ctx.patientUuid,
        ctx.practitionerUuid,
        VITALS_CONCEPTS.bpSystolic,
        { value: VITALS_VALUES.bpSystolic },
        ts
      ),
      namedObservationEntry(
        bpDiastolicUuid,
        encounterUuid,
        ctx.patientUuid,
        ctx.practitionerUuid,
        VITALS_CONCEPTS.bpDiastolic,
        { value: VITALS_VALUES.bpDiastolic },
        ts
      ),
      codedObservationEntry(
        bpPositionUuid,
        encounterUuid,
        ctx.patientUuid,
        ctx.practitionerUuid,
        VITALS_CONCEPTS.bpBodyPosition,
        FHIR_CODED_VALUES.sitting.code,
        FHIR_CODED_VALUES.sitting.display,
        ts
      ),
      groupObservationEntry(
        encounterUuid,
        ctx.patientUuid,
        ctx.practitionerUuid,
        VITALS_CONCEPTS.bloodPressureGroup,
        [`urn:uuid:${bpSystolicUuid}`, `urn:uuid:${bpDiastolicUuid}`, `urn:uuid:${bpPositionUuid}`],
        ts
      ),
    ],
    ts
  );
}

// ---------------------------------------------------------------------------
// History & Examination observation bundle
// ---------------------------------------------------------------------------

export function buildHistoryExaminationBundle(ctx: BundleContext, encounterUuid: string): Record<string, unknown> {
  const ts = pastTimestamp();
  const chiefComplaintUuid = faker.string.uuid();
  const durationUuid = faker.string.uuid();
  const durationUnitUuid = faker.string.uuid();

  return consultationBundle(
    [
      existingEncounterEntry(encounterUuid, ctx, ts),
      namedObservationEntry(
        chiefComplaintUuid,
        encounterUuid,
        ctx.patientUuid,
        ctx.practitionerUuid,
        HE_CONCEPTS.chiefComplaint,
        { coding: [{ code: FHIR_CODED_VALUES.fever.code, display: FHIR_CODED_VALUES.fever.display }] },
        ts,
        true
      ),
      namedObservationEntry(
        durationUuid,
        encounterUuid,
        ctx.patientUuid,
        ctx.practitionerUuid,
        HE_CONCEPTS.duration,
        { value: HE_VALUES.durationDays },
        ts
      ),
      codedObservationEntry(
        durationUnitUuid,
        encounterUuid,
        ctx.patientUuid,
        ctx.practitionerUuid,
        HE_CONCEPTS.durationUnit,
        FHIR_CODED_VALUES.hours.code,
        FHIR_CODED_VALUES.hours.display,
        ts
      ),
      groupObservationEntry(
        encounterUuid,
        ctx.patientUuid,
        ctx.practitionerUuid,
        HE_CONCEPTS.chiefComplaintGroup,
        [`urn:uuid:${chiefComplaintUuid}`, `urn:uuid:${durationUuid}`, `urn:uuid:${durationUnitUuid}`],
        ts
      ),
      textObservationEntry(
        encounterUuid,
        ctx.patientUuid,
        ctx.practitionerUuid,
        HE_CONCEPTS.historyOfIllness,
        HE_VALUES.historyText,
        ts
      ),
    ],
    ts
  );
}

// DiagnosticReport submission for tests is handled via the proven `FhirApiHelper.postAnemiaReport`
// (see src/utils/fhir-api-helper.ts), which builds the panel-aware payload the server requires.

// ---------------------------------------------------------------------------
// Invalid bundle helpers (for negative/error tests)
// ---------------------------------------------------------------------------

/** Bundle that should fail because the encounter's period.start is in the future relative to the server clock. */
export function buildBundleWithFutureEncounterDatetime(ctx: BundleContext): Record<string, unknown> {
  const ts = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 1 day in future
  const tempUuid = faker.string.uuid();
  const encounterEntry = {
    fullUrl: `urn:uuid:${tempUuid}`,
    resource: encounterResource(ctx, ts),
    request: { method: 'POST', url: 'Encounter' },
  };
  return consultationBundle(
    [
      encounterEntry,
      {
        fullUrl: `urn:uuid:${faker.string.uuid()}`,
        resource: {
          resourceType: 'AllergyIntolerance',
          category: ['food'],
          code: { coding: [{ code: ALLERGY_CODES.penicillin }] },
          patient: { reference: `Patient/${ctx.patientUuid}` },
          encounter: { reference: `urn:uuid:${tempUuid}` },
          reaction: [{ manifestation: [{ coding: [{ code: ALLERGY_REACTION_CODES.rash }] }], severity: 'mild' }],
        },
        request: { method: 'POST', url: 'AllergyIntolerance' },
      },
    ],
    pastTimestamp()
  );
}

/** Bundle that should fail because the encounter's period.start is well before the visit's startDatetime. */
export function buildBundleWithPreVisitEncounterDatetime(ctx: BundleContext): Record<string, unknown> {
  // 1 year before the visit (visit is created 10 minutes ago)
  const ts = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
  const tempUuid = faker.string.uuid();
  const encounterEntry = {
    fullUrl: `urn:uuid:${tempUuid}`,
    resource: encounterResource(ctx, ts),
    request: { method: 'POST', url: 'Encounter' },
  };
  return consultationBundle(
    [
      encounterEntry,
      {
        fullUrl: `urn:uuid:${faker.string.uuid()}`,
        resource: {
          resourceType: 'AllergyIntolerance',
          category: ['food'],
          code: { coding: [{ code: ALLERGY_CODES.penicillin }] },
          patient: { reference: `Patient/${ctx.patientUuid}` },
          encounter: { reference: `urn:uuid:${tempUuid}` },
          reaction: [{ manifestation: [{ coding: [{ code: ALLERGY_REACTION_CODES.rash }] }], severity: 'mild' }],
        },
        request: { method: 'POST', url: 'AllergyIntolerance' },
      },
    ],
    pastTimestamp()
  );
}

/** Bundle that should fail mid-transaction: valid encounter + valid allergy + ServiceRequest with an invalid (non-existent) concept code. */
export function buildBundleWithValidAllergyAndInvalidServiceRequest(ctx: BundleContext): Record<string, unknown> {
  const ts = pastTimestamp();
  const { tempUuid, entry: encounterEntry } = newEncounterEntry(ctx, ts);
  return consultationBundle(
    [
      encounterEntry,
      {
        fullUrl: `urn:uuid:${faker.string.uuid()}`,
        resource: {
          resourceType: 'AllergyIntolerance',
          category: ['food'],
          code: { coding: [{ code: ALLERGY_CODES.penicillin }] },
          patient: { reference: `Patient/${ctx.patientUuid}` },
          encounter: { reference: `urn:uuid:${tempUuid}` },
          reaction: [{ manifestation: [{ coding: [{ code: ALLERGY_REACTION_CODES.rash }] }], severity: 'mild' }],
        },
        request: { method: 'POST', url: 'AllergyIntolerance' },
      },
      {
        fullUrl: `urn:uuid:${faker.string.uuid()}`,
        resource: {
          resourceType: 'ServiceRequest',
          status: 'active',
          intent: 'order',
          priority: 'routine',
          code: { coding: [{ code: 'invalid-concept-uuid-00000000-0000' }] },
          subject: { reference: `Patient/${ctx.patientUuid}` },
          encounter: { reference: `urn:uuid:${tempUuid}` },
          requester: { reference: `Practitioner/${ctx.practitionerUuid}`, type: 'Practitioner' },
        },
        request: { method: 'POST', url: 'ServiceRequest' },
      },
    ],
    ts
  );
}

export function buildBundleWithInvalidPatientRef(ctx: BundleContext): Record<string, unknown> {
  const ts = pastTimestamp();
  const { tempUuid, entry: encounterEntry } = newEncounterEntry(ctx, ts);
  return consultationBundle(
    [
      encounterEntry,
      {
        fullUrl: `urn:uuid:${faker.string.uuid()}`,
        resource: {
          resourceType: 'AllergyIntolerance',
          category: ['food'],
          code: { coding: [{ code: ALLERGY_CODES.penicillin }] },
          patient: { reference: 'Patient/00000000-0000-0000-0000-000000000000' },
          encounter: { reference: `urn:uuid:${tempUuid}` },
          reaction: [{ manifestation: [{ coding: [{ code: ALLERGY_REACTION_CODES.rash }] }], severity: 'mild' }],
        },
        request: { method: 'POST', url: 'AllergyIntolerance' },
      },
    ],
    ts
  );
}

// ---------------------------------------------------------------------------
// Observation entry helpers
// ---------------------------------------------------------------------------

function singleObservationEntry(
  encounterUuid: string,
  patientUuid: string,
  practitionerUuid: string,
  code: string,
  valueQuantity: { value: number; unit?: string },
  timestamp: string
): Record<string, unknown> {
  return {
    fullUrl: `urn:uuid:${faker.string.uuid()}`,
    resource: observationResource(encounterUuid, patientUuid, practitionerUuid, code, { valueQuantity }, timestamp),
    request: { method: 'POST', url: 'Observation' },
  };
}

function namedObservationEntry(
  uuid: string,
  encounterUuid: string,
  patientUuid: string,
  practitionerUuid: string,
  code: string,
  value: Record<string, unknown>,
  timestamp: string,
  isCoded = false
): Record<string, unknown> {
  const valueKey = isCoded ? 'valueCodeableConcept' : 'valueQuantity';
  return {
    fullUrl: `urn:uuid:${uuid}`,
    resource: observationResource(encounterUuid, patientUuid, practitionerUuid, code, { [valueKey]: value }, timestamp),
    request: { method: 'POST', url: 'Observation' },
  };
}

function codedObservationEntry(
  uuid: string,
  encounterUuid: string,
  patientUuid: string,
  practitionerUuid: string,
  code: string,
  valueCode: string,
  display: string,
  timestamp: string
): Record<string, unknown> {
  return {
    fullUrl: `urn:uuid:${uuid}`,
    resource: observationResource(
      encounterUuid,
      patientUuid,
      practitionerUuid,
      code,
      {
        valueCodeableConcept: { coding: [{ code: valueCode, display }] },
      },
      timestamp
    ),
    request: { method: 'POST', url: 'Observation' },
  };
}

function textObservationEntry(
  encounterUuid: string,
  patientUuid: string,
  practitionerUuid: string,
  code: string,
  text: string,
  timestamp: string
): Record<string, unknown> {
  return {
    fullUrl: `urn:uuid:${faker.string.uuid()}`,
    resource: observationResource(encounterUuid, patientUuid, practitionerUuid, code, { valueString: text }, timestamp),
    request: { method: 'POST', url: 'Observation' },
  };
}

function groupObservationEntry(
  encounterUuid: string,
  patientUuid: string,
  practitionerUuid: string,
  code: string,
  memberRefs: string[],
  timestamp: string
): Record<string, unknown> {
  return {
    fullUrl: `urn:uuid:${faker.string.uuid()}`,
    resource: observationResource(
      encounterUuid,
      patientUuid,
      practitionerUuid,
      code,
      {
        hasMember: memberRefs.map((ref) => ({ reference: ref, type: 'Observation' })),
      },
      timestamp
    ),
    request: { method: 'POST', url: 'Observation' },
  };
}

function observationResource(
  encounterUuid: string,
  patientUuid: string,
  practitionerUuid: string,
  code: string,
  value: Record<string, unknown>,
  timestamp: string
): Record<string, unknown> {
  return {
    resourceType: 'Observation',
    status: 'final',
    code: { coding: [{ code }] },
    subject: { reference: `Patient/${patientUuid}` },
    encounter: { reference: `Encounter/${encounterUuid}` },
    performer: [{ reference: `Practitioner/${practitionerUuid}`, type: 'Practitioner' }],
    effectiveDateTime: timestamp,
    ...value,
  };
}
