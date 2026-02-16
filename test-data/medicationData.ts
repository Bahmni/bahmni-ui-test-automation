/**
 * Medication test data
 * Uses faker to randomly select from predefined medication data
 */

import { faker } from '@faker-js/faker';

// Medication names
const MEDICATIONS = [
  'Albendazole 400 mg',
  'Labetalol',
  'Potassium permanganate',
  'Paracetamol 500 mg',
  'Prednisolone 20 mg (Tablet)- Prednisolone',
];

// Dosage units
export const DOSAGE_UNITS = {
  TABLET: 'Tablet',
  CAPSULE: 'Capsule',
  ML: 'ml',
  MG: 'mg',
  IU: 'IU',
  DROP: 'Drop',
  TABLESPOON: 'Tablespoon',
  TEASPOON: 'Teaspoon',
  UNIT: 'Unit',
  PUFF: 'Puff',
} as const;

// Frequency options
export const FREQUENCIES = {
  ONCE_A_DAY: 'Once a day',
  TWICE_A_DAY: 'Twice a day',
  THRICE_A_DAY: 'Thrice a day',
  FOUR_TIMES_A_DAY: 'Four times a day',
  FIVE_TIMES_A_DAY: 'Five times a day',
  EVERY_HOUR: 'Every Hour',
  EVERY_2_HOURS: 'Every 2 hours',
  EVERY_3_HOURS: 'Every 3 hours',
  EVERY_4_HOURS: 'Every 4 hours',
  EVERY_6_HOURS: 'Every 6 hours',
  EVERY_8_HOURS: 'Every 8 hours',
  EVERY_12_HOURS: 'Every 12 hours',
  ON_ALTERNATE_DAYS: 'On alternate days',
  ONCE_A_WEEK: 'Once a week',
  TWICE_A_WEEK: 'Twice a week',
  THRICE_A_WEEK: 'Thrice a week',
  FOUR_DAYS_A_WEEK: 'Four days a week',
  FIVE_DAYS_A_WEEK: 'Five days a week',
  SIX_DAYS_A_WEEK: 'Six days a week',
  EVERY_2_WEEKS: 'Every 2 weeks',
  EVERY_3_WEEKS: 'Every 3 weeks',
  ONCE_A_MONTH: 'Once a month',
} as const;

// Duration units
export const DURATION_UNITS = {
  MINUTES: 'Minutes',
  HOURS: 'Hours',
  DAYS: 'Days',
  WEEKS: 'Weeks',
  MONTHS: 'Months',
} as const;

// Instructions
export const INSTRUCTIONS = {
  BEFORE_MEALS: 'Before meals',
  EMPTY_STOMACH: 'Empty stomach',
  AFTER_MEALS: 'After meals',
  IN_THE_MORNING: 'In the morning',
  IN_THE_EVENING: 'In the evening',
  AT_BEDTIME: 'At bedtime',
  IMMEDIATELY: 'Immediately',
  AS_DIRECTED: 'As directed',
} as const;

// Routes
export const ROUTES = {
  INTRAMUSCULAR: 'Intramuscular',
  INTRAVENOUS: 'Intravenous',
  ORAL: 'Oral',
  PER_VAGINAL: 'Per Vaginal',
  SUB_CUTANEOUS: 'Sub Cutaneous',
  PER_RECTUM: 'Per Rectum',
  SUB_LINGUAL: 'Sub Lingual',
  NASOGASTRIC: 'Nasogastric',
  INTRADERMAL: 'Intradermal',
  INTRAPERITONEAL: 'Intraperitoneal',
  INTRATHECAL: 'Intrathecal',
  INTRAOSSEOUS: 'Intraosseous',
  TOPICAL: 'Topical',
  NASAL: 'Nasal',
  INHALATION: 'Inhalation',
} as const;

// Medication data type
export interface MedicationData {
  name: string;
  dosage: number;
  dosageUnit: string;
  frequency: string;
  duration: number;
  durationUnit: string;
  instructions: string;
  route: string;
  isStat?: boolean;
  isPrn?: boolean;
}

export const medicationFaker = {
  /**
   * Generate a complete medication prescription with random values
   */
  medication: (): MedicationData => ({
    name: faker.helpers.arrayElement(MEDICATIONS),
    dosage: faker.number.int({ min: 1, max: 3 }),
    dosageUnit: faker.helpers.arrayElement(Object.values(DOSAGE_UNITS)),
    frequency: faker.helpers.arrayElement(Object.values(FREQUENCIES)),
    duration: faker.number.int({ min: 1, max: 14 }),
    durationUnit: faker.helpers.arrayElement(Object.values(DURATION_UNITS)),
    instructions: faker.helpers.arrayElement(Object.values(INSTRUCTIONS)),
    route: faker.helpers.arrayElement(Object.values(ROUTES)),
    isStat: false,
    isPrn: false,
  }),

  /**
   * Generate a simple oral medication
   */
  oralMedication: (): MedicationData => ({
    name: faker.helpers.arrayElement(MEDICATIONS),
    dosage: faker.number.int({ min: 1, max: 2 }),
    dosageUnit: DOSAGE_UNITS.TABLET,
    frequency: FREQUENCIES.TWICE_A_DAY,
    duration: faker.number.int({ min: 3, max: 7 }),
    durationUnit: DURATION_UNITS.DAYS,
    instructions: INSTRUCTIONS.AFTER_MEALS,
    route: ROUTES.ORAL,
    isStat: false,
    isPrn: false,
  }),
};
