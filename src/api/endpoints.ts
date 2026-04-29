export const REST = {
  patientProfile: '/openmrs/ws/rest/v1/bahmnicore/patientprofile',
  patient: '/openmrs/ws/rest/v1/patient',
  visit: '/openmrs/ws/rest/v1/visit',
  visitType: '/openmrs/ws/rest/v1/visittype',
  visitLocation: '/openmrs/ws/rest/v1/bahmnicore/visitLocation',
  encounter: '/openmrs/ws/rest/v1/encounter',
  location: '/openmrs/ws/rest/v1/location',
  session: '/openmrs/ws/rest/v1/session',
  provider: '/openmrs/ws/rest/v1/provider',
  relationshipType: '/openmrs/ws/rest/v1/relationshiptype',
  relationship: '/openmrs/ws/rest/v1/relationship',
  patientProfileGet: '/openmrs/ws/rest/v1/patientprofile',
} as const;

export const FHIR = {
  patient: '/openmrs/ws/fhir2/R4/Patient',
  encounter: '/openmrs/ws/fhir2/R4/Encounter',
  serviceRequest: '/openmrs/ws/fhir2/R4/ServiceRequest',
  diagnosticReport: '/openmrs/ws/fhir2/R4/DiagnosticReport',
  submitBundle: '/openmrs/ws/fhir2/R4/DiagnosticReport/$submit-bundle',
  allergyIntolerance: '/openmrs/ws/fhir2/R4/AllergyIntolerance',
  condition: '/openmrs/ws/fhir2/R4/Condition',
  medicationRequest: '/openmrs/ws/fhir2/R4/MedicationRequest',
  observation: '/openmrs/ws/fhir2/R4/Observation',
  consultationBundle: '/openmrs/ws/fhir2/R4/ConsultationBundle',
  valueSet: '/openmrs/ws/fhir2/R4/ValueSet',
} as const;
