export interface PatientName {
  givenName: string;
  middleName?: string;
  familyName: string;
  display: string;
  preferred: boolean;
}

export interface PatientAddress {
  address1?: string;
  address2?: string;
  cityVillage?: string;
  postalCode?: string;
  countyDistrict?: string;
  stateProvince?: string;
}

export interface PersonAttribute {
  attributeType: { uuid: string };
  value: string;
}

export interface PatientIdentifier {
  identifierSourceUuid: string;
  identifierPrefix: string;
  identifierType: string;
  preferred: boolean;
  voided: boolean;
}

export interface ManualPatientIdentifier {
  identifier: string;
  identifierType: string;
  preferred: boolean;
  voided: boolean;
}

export type PatientIdentifierEntry = PatientIdentifier | ManualPatientIdentifier;

export interface PatientRelationship {
  relationshipType: { uuid: string };
  personB: { uuid: string };
}

export interface RelationshipTypeResponse {
  results: Array<{ uuid: string; aIsToB: string; bIsToA: string }>;
}

export interface CreatePatientRequest {
  patient: {
    person: {
      names: PatientName[];
      gender: 'M' | 'F';
      birthdate: string;
      birthdateEstimated: boolean;
      birthtime: string | null;
      addresses: PatientAddress[];
      attributes: PersonAttribute[];
      deathDate: null;
      causeOfDeath: string;
    };
    identifiers: PatientIdentifierEntry[];
  };
  relationships: PatientRelationship[];
}

export interface PatientProfileResponse {
  patient: {
    uuid: string;
    display: string;
    person: {
      uuid: string;
      display: string;
      gender: string;
      birthdate: string;
      birthdateEstimated: boolean;
      names: Array<{ givenName: string; middleName?: string; familyName: string }>;
      addresses: Array<PatientAddress & { uuid: string }>;
      attributes: Array<{ uuid: string; display: string; value: string | { uuid: string; display: string } }>;
      relationships?: Array<{
        relationshipType: { uuid: string; display: string };
        personB: { uuid: string; display: string };
      }>;
    };
    identifiers: Array<{ uuid: string; identifier: string; display: string }>;
  };
}

export interface PatientSearchResponse {
  results: Array<{
    uuid: string;
    display: string;
    person: {
      gender: string;
      birthdate: string;
    };
  }>;
}
