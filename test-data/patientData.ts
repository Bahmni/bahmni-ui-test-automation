/**
 * Patient test data generator
 * Generates random patient data for testing using Faker.js
 */

import { faker } from '@faker-js/faker';

export interface PatientData {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  middleName?: string;
  phoneNumber?: string;
  email?: string;
  address?: {
    state: string;
    district: string;
    pinCode: string;
    city: string;
    locality: string;
    houseNumber: string;
  };
  identifiers?: {
    drivingLicence: string;
    nationalId: string;
    passport: string;
  };
}

export function generatePatientData(): PatientData {
  // Remove special characters from names to avoid search issues
  const firstName = faker.person.firstName().replace(/[^a-zA-Z]/g, '');
  const lastName = faker.person.lastName().replace(/[^a-zA-Z]/g, '');
  const middleName = faker.person.middleName().replace(/[^a-zA-Z]/g, '');

  return {
    firstName,
    middleName,
    lastName,
    gender: faker.helpers.arrayElement(['Male', 'Female', 'Other']),
    dateOfBirth: (() => {
      const dob = faker.date.birthdate({ min: 18, max: 80, mode: 'age' });
      const mm = String(dob.getMonth() + 1).padStart(2, '0');
      const dd = String(dob.getDate()).padStart(2, '0');
      return `${mm}/${dd}/${dob.getFullYear()}`;
    })(),
    phoneNumber: faker.string.numeric(10),
    email: faker.internet.email({ firstName: firstName.toLowerCase(), lastName: lastName.toLowerCase() }),
    address: {
      state: 'KARNATAKA',
      district: 'BELLARY',
      pinCode: '583219',
      city: faker.location.city(),
      locality: faker.location.street(),
      houseNumber: faker.location.buildingNumber(),
    },
    identifiers: {
      drivingLicence: `DL${faker.string.numeric(10)}`,
      nationalId: `NAT${faker.string.numeric(12)}`,
      passport: `P${faker.string.numeric(8)}`,
    },
  };
}
