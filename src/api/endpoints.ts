export const REST = {
  patientProfile: '/openmrs/ws/rest/v1/bahmnicore/patientprofile',
  patient: '/openmrs/ws/rest/v1/patient',
  visit: '/openmrs/ws/rest/v1/visit',
  visitType: '/openmrs/ws/rest/v1/visittype',
  visitLocation: '/openmrs/ws/rest/v1/bahmnicore/visitLocation',
  encounter: '/openmrs/ws/rest/v1/encounter',
  location: '/openmrs/ws/rest/v1/location',
} as const;

export const FHIR = {
  patient: '/openmrs/ws/fhir2/R4/Patient',
  encounter: '/openmrs/ws/fhir2/R4/Encounter',
  serviceRequest: '/openmrs/ws/fhir2/R4/ServiceRequest',
  diagnosticReport: '/openmrs/ws/fhir2/R4/DiagnosticReport',
  submitBundle: '/openmrs/ws/fhir2/R4/DiagnosticReport/$submit-bundle',
} as const;
