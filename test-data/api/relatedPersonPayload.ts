export const RELATED_PATIENT_EXT_URL = 'http://fhir.bahmni.org/ext/relatedPatient';
export const RELATIONSHIP_TYPE_SYSTEM = 'http://fhir.bahmni.org/RelationshipType';

export interface RelatedPersonInput {
  patientUuid: string;
  relatedPatientUuid: string;
  relationshipTypeUuid: string;
  periodEnd?: string;
}

// Mirrors the shape returned by GET /RelatedPerson: `patient` is the subject, the extension
// holds the other patient, and relationship.coding.code is the OpenMRS relationship type UUID.
export function buildRelatedPersonPayload(input: RelatedPersonInput): Record<string, unknown> {
  return {
    resourceType: 'RelatedPerson',
    active: true,
    patient: { reference: `Patient/${input.patientUuid}`, type: 'Patient' },
    relationship: [{ coding: [{ system: RELATIONSHIP_TYPE_SYSTEM, code: input.relationshipTypeUuid }] }],
    extension: [
      {
        url: RELATED_PATIENT_EXT_URL,
        valueReference: { reference: `Patient/${input.relatedPatientUuid}`, type: 'Patient' },
      },
    ],
    ...(input.periodEnd ? { period: { end: input.periodEnd } } : {}),
  };
}

export function daysFromNowIso(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}
