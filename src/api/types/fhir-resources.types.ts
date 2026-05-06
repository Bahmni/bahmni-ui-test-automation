// Shared FHIR resource type definitions used across consultation specs.
// These are partial — only the fields we assert on are typed.

export interface BundleContext {
  patientUuid: string;
  visitEncounterUuid: string;
  practitionerUuid: string;
  locationUuid?: string;
}

export interface AllergyIntoleranceEntry {
  resourceType: string;
  id: string;
  patient: { reference: string };
  category: string[];
  code: { coding: Array<{ code: string }> };
  reaction: Array<{ manifestation: Array<{ coding: Array<{ code: string }> }>; severity: string }>;
}

export interface ConditionEntry {
  resourceType: string;
  id: string;
  subject: { reference: string };
  code: { coding: Array<{ code: string }> };
  category: Array<{ coding: Array<{ code: string }> }>;
  clinicalStatus?: { coding: Array<{ code: string }> };
  encounter?: { reference: string };
  recordedDate?: string;
  recorder?: { reference: string };
}

export interface ServiceRequestEntry {
  resourceType: string;
  id: string;
  status: string;
  intent: string;
  priority: string;
  code: { coding: Array<{ code: string; display?: string }> };
  category?: Array<{ coding: Array<{ code: string }> }>;
  subject: { reference: string };
  encounter: { reference: string };
  requester?: { reference: string };
  occurrencePeriod?: { start: string };
  note?: Array<{ text: string }>;
  extension?: Array<{ url: string; valueString?: string }>;
}

export interface MedicationRequestEntry {
  resourceType: string;
  id: string;
  status: string;
  intent: string;
  priority: string;
  medicationReference: { reference: string };
  subject: { reference: string };
  encounter: { reference: string };
  dosageInstruction: Array<{
    route: { coding: Array<{ code: string }> };
    doseAndRate: Array<{ doseQuantity: { value: number; code: string } }>;
    timing: { repeat?: { boundsPeriod?: Record<string, unknown> }; code?: { coding: Array<{ code: string }> } };
    asNeededBoolean?: boolean;
  }>;
  dispenseRequest: { numberOfRepeatsAllowed: number; quantity: { value: number } };
}

export interface ObservationEntry {
  resourceType: string;
  id: string;
  status: string;
  code: { coding: Array<{ code: string }> };
  subject: { reference: string };
  encounter: { reference: string };
  valueQuantity?: { value: number };
  valueCodeableConcept?: { coding: Array<{ code: string; display: string }> };
  valueString?: string;
  valueBoolean?: boolean;
  hasMember?: Array<{ reference: string }>;
  effectiveDateTime?: string;
  meta?: { lastUpdated?: string };
}

export interface MedicationEntry {
  resourceType: string;
  id: string;
  code: { coding: Array<{ code: string; display?: string }> };
  form?: { coding: Array<{ code: string; display?: string }> };
}

export interface DiagnosticReportEntry {
  resourceType: string;
  id: string;
  status: string;
  basedOn: Array<{ reference: string }>;
  subject: { reference: string };
  encounter?: { reference: string };
  result?: Array<{ reference: string }>;
  presentedForm?: Array<{ contentType: string; url: string; title: string; creation?: string }>;
}
