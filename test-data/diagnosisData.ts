/**
 * Diagnosis test data
 * Uses faker to randomly select from predefined diagnosis data
 */

import { faker } from '@faker-js/faker';

const DIAGNOSES = [
  'Acute Sinusitis',
  'Amenorrhea',
  'Croupous Bronchitis',
  'Chronic Arthritis',
  'Varicose leg ulcers',
  'Chronic Rheumatic Fever',
];

export const diagnosisFaker = {
  diagnosis: () => faker.helpers.arrayElement(DIAGNOSES),
};
