import { faker } from '@faker-js/faker';
import {
  CreatePatientRequest,
  FhirPatientResponse,
  PatientAddress,
  UpdatePatientRequest,
} from '../../src/api/types/patient.types';
import { IDENTIFIER, LOCATIONS } from './constants';

export interface PatientInput {
  givenName?: string;
  middleName?: string;
  familyName?: string;
  gender?: 'male' | 'female';
  birthDate?: string;
  address?: PatientAddress;
  phoneNumber?: string;
  alternatePhoneNumber?: string;
  email?: string;
}

export function buildCreatePatientPayload(identifier: string, input: PatientInput = {}): CreatePatientRequest {
  const givenName = input.givenName ?? faker.person.firstName();
  const middleName = input.middleName ?? faker.person.middleName();
  const familyName = input.familyName ?? faker.person.lastName();
  const gender = input.gender ?? (faker.datatype.boolean() ? 'male' : 'female');
  const birthDate =
    input.birthDate ?? faker.date.birthdate({ min: 1, max: 80, mode: 'age' }).toISOString().split('T')[0];

  const address: PatientAddress = input.address ?? {
    address1: faker.location.streetAddress(),
    address2: faker.location.secondaryAddress(),
    cityVillage: faker.location.city(),
    postalCode: faker.location.zipCode('######'),
    countyDistrict: 'CHENNAI',
    stateProvince: 'TAMIL NADU',
  };

  const extension = [
    {
      url: 'http://fhir.bahmni.org/ext/patient/phonenumber',
      valueString: input.phoneNumber ?? faker.string.numeric(10),
    },
  ];
  if (input.alternatePhoneNumber) {
    extension.push({
      url: 'http://fhir.bahmni.org/ext/patient/alternatephonenumber',
      valueString: input.alternatePhoneNumber,
    });
  }
  if (input.email !== undefined) {
    extension.push({ url: 'http://fhir.bahmni.org/ext/patient/email', valueString: input.email });
  }

  return {
    resourceType: 'Patient',
    identifier: [
      {
        use: 'official',
        value: identifier,
        type: { coding: [{ code: IDENTIFIER.typeUuid }], text: 'Patient Identifier' },
        extension: [
          {
            url: 'http://fhir.openmrs.org/ext/patient/identifier#location',
            valueReference: { reference: `Location/${LOCATIONS.loginLocationUuid}` },
          },
        ],
      },
    ],
    name: [{ given: [givenName, middleName], family: familyName }],
    gender,
    birthDate,
    extension,
    address: [
      {
        use: 'home',
        extension: [
          {
            url: 'http://fhir.openmrs.org/ext/address',
            extension: [
              { url: 'http://fhir.openmrs.org/ext/address#address1', valueString: address.address1 ?? '' },
              { url: 'http://fhir.openmrs.org/ext/address#address2', valueString: address.address2 ?? '' },
            ],
          },
        ],
        city: address.cityVillage,
        district: address.countyDistrict,
        state: address.stateProvince,
        postalCode: address.postalCode,
      },
    ],
  };
}

export function buildUpdatePatientPayload(existing: FhirPatientResponse, input: PatientInput): UpdatePatientRequest {
  const base = buildCreatePatientPayload('unused', input);
  return {
    resourceType: 'Patient',
    id: existing.id,
    name: [{ ...base.name[0], id: existing.name[0]?.id }],
    gender: base.gender,
    birthDate: base.birthDate,
    extension: base.extension,
    address: base.address,
  };
}
