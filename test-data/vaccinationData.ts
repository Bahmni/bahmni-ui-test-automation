/**
 * Vaccination test data
 * Note: For vaccinations, STAT is enabled by default and frequency/duration fields are auto-populated and disabled
 */

import { faker } from '@faker-js/faker';
import { MedicationData, DOSAGE_UNITS, FREQUENCIES, DURATION_UNITS, INSTRUCTIONS, ROUTES } from './medicationData';

// Only include vaccinations that exist in the system
const VACCINATIONS = ['Anti-rabies vaccine', 'vitamin A 5000 IU'];

export const vaccinationFaker = {
  /**
   * Generate a complete vaccination with random values
   * Note: STAT is auto-enabled, frequency/duration are auto-populated
   */
  vaccination: (): MedicationData => ({
    name: faker.helpers.arrayElement(VACCINATIONS),
    dosage: faker.number.int({ min: 1, max: 2 }),
    dosageUnit: faker.helpers.arrayElement(Object.values(DOSAGE_UNITS)),
    // Auto-populated fields - these are set by default but not filled by addVaccination method
    frequency: FREQUENCIES.ONCE_A_DAY,
    duration: 1,
    durationUnit: DURATION_UNITS.DAYS,
    instructions: faker.helpers.arrayElement(Object.values(INSTRUCTIONS)),
    route: faker.helpers.arrayElement(Object.values(ROUTES)),
    // STAT is auto-enabled for vaccinations (reflects actual state, but not checked by addVaccination)
    isStat: true,
    isPrn: false,
  }),

  /**
   * Generate a simple intramuscular vaccination
   */
  intramuscularVaccination: (): MedicationData => ({
    name: faker.helpers.arrayElement(VACCINATIONS),
    dosage: 1,
    dosageUnit: DOSAGE_UNITS.ML,
    frequency: FREQUENCIES.ONCE_A_DAY,
    duration: 1,
    durationUnit: DURATION_UNITS.DAYS,
    instructions: INSTRUCTIONS.AS_DIRECTED,
    route: ROUTES.INTRAMUSCULAR,
    // STAT is auto-enabled for vaccinations (reflects actual state, but not checked by addVaccination)
    isStat: true,
    isPrn: false,
  }),
};
