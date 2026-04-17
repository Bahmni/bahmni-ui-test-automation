import { faker } from '@faker-js/faker';
import { CreatePatientRequest, PatientAddress, PersonAttribute } from '../../src/api/types/patient.types';
import { IDENTIFIER, PERSON_ATTRIBUTE_TYPE } from './constants';

export interface PatientInput {
  givenName?: string;
  middleName?: string;
  familyName?: string;
  gender?: 'M' | 'F';
  birthdate?: string;
  birthtime?: string | null;
  address?: PatientAddress;
  phoneNumber?: string;
  alternatePhoneNumber?: string;
  email?: string;
}

export function buildCreatePatientPayload(input: PatientInput = {}): CreatePatientRequest {
  const givenName = input.givenName ?? faker.person.firstName();
  const middleName = input.middleName ?? faker.person.middleName();
  const familyName = input.familyName ?? faker.person.lastName();
  const gender = input.gender ?? (faker.datatype.boolean() ? 'M' : 'F');
  const birthdate =
    input.birthdate ?? faker.date.birthdate({ min: 1, max: 80, mode: 'age' }).toISOString().split('T')[0];

  const address: PatientAddress = input.address ?? {
    address1: faker.location.streetAddress(),
    address2: faker.location.secondaryAddress(),
    cityVillage: faker.location.city(),
    postalCode: faker.location.zipCode('######'),
    countyDistrict: 'CHENNAI',
    stateProvince: 'TAMIL NADU',
  };

  const attributes: PersonAttribute[] = [];
  const phone = input.phoneNumber ?? faker.string.numeric(10);
  attributes.push({ attributeType: { uuid: PERSON_ATTRIBUTE_TYPE.phoneNumber }, value: phone });

  if (input.alternatePhoneNumber) {
    attributes.push({
      attributeType: { uuid: PERSON_ATTRIBUTE_TYPE.alternatePhoneNumber },
      value: input.alternatePhoneNumber,
    });
  }

  if (input.email !== undefined) {
    attributes.push({ attributeType: { uuid: PERSON_ATTRIBUTE_TYPE.email }, value: input.email });
  }

  return {
    patient: {
      person: {
        names: [
          {
            givenName,
            middleName,
            familyName,
            display: `${givenName} ${middleName} ${familyName}`,
            preferred: false,
          },
        ],
        gender,
        birthdate,
        birthdateEstimated: false,
        birthtime: input.birthtime ?? null,
        addresses: [address],
        attributes,
        deathDate: null,
        causeOfDeath: '',
      },
      identifiers: [
        {
          identifierSourceUuid: IDENTIFIER.sourceUuid,
          identifierPrefix: IDENTIFIER.prefix,
          identifierType: IDENTIFIER.typeUuid,
          preferred: true,
          voided: false,
        },
      ],
    },
    relationships: [],
  };
}
