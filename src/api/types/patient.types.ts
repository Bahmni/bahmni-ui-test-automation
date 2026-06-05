export interface PatientAddress {
  address1?: string;
  address2?: string;
  cityVillage?: string;
  postalCode?: string;
  countyDistrict?: string;
  stateProvince?: string;
}

export interface FhirPatientName {
  id?: string;
  given: string[];
  family: string;
}

export interface FhirIdentifierLocationExtension {
  url: 'http://fhir.openmrs.org/ext/patient/identifier#location';
  valueReference: { reference: string };
}

export interface FhirPatientIdentifier {
  use?: 'official' | 'usual';
  value: string;
  type: { coding: Array<{ code: string }>; text: string };
  extension?: FhirIdentifierLocationExtension[];
}

export interface FhirAddressLineExtension {
  url: 'http://fhir.openmrs.org/ext/address';
  extension: Array<{ url: string; valueString: string }>;
}

export interface FhirPatientAddress {
  use?: 'home';
  extension?: FhirAddressLineExtension[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
}

export interface FhirPatientExtension {
  url: string;
  valueString?: string;
}

export interface CreatePatientRequest {
  resourceType: 'Patient';
  identifier: FhirPatientIdentifier[];
  name: FhirPatientName[];
  gender: 'male' | 'female';
  birthDate: string;
  extension?: FhirPatientExtension[];
  address?: FhirPatientAddress[];
}

export interface FhirPatientResponse extends CreatePatientRequest {
  id: string;
  meta?: { versionId: string; lastUpdated: string };
  active?: boolean;
  deceasedBoolean?: boolean;
}

export interface UpdatePatientRequest {
  resourceType: 'Patient';
  id: string;
  identifier?: FhirPatientIdentifier[];
  name: FhirPatientName[];
  gender: 'male' | 'female';
  birthDate: string;
  extension?: FhirPatientExtension[];
  address?: FhirPatientAddress[];
}

export interface FhirPatientSearchResponse {
  resourceType: 'Bundle';
  total?: number;
  entry?: Array<{ resource: FhirPatientResponse }>;
}

export interface IdgenIdentifierResponse {
  identifier: string;
}
