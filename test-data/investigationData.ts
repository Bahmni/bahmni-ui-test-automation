/**
 * Investigation and Procedure test data
 * Uses faker to randomly select from predefined medical data
 */

import { faker } from '@faker-js/faker';

const INVESTIGATIONS_PANEL = [
  'Complete blood count (auto) (Panel)',
  'Blood grouping test (Panel)',
  'Ceruloplasmin test (Panel)',
  'Alpha fetoprotein test (Panel)',
  'Diabetes panel (Panel)',
];

const INVESTIGATIONS_SINGLE = [
  'Hemoglobin in arterial blood (mass/volume)',
  'Ammonia measurement in blood',
  'Benzodiazepines screen, urine',
  'Arterial blood lactate measurement',
];

const INVESTIGATIONS_RADIOLOGY = [
  'X-ray, chest',
  'X-ray of bilateral ribs, 2 views',
  'X-ray of right elbow, two views',
  'Echocardiogram',
  'Transthoracic echocardiogram',
];

const PROCEDURES = ['Electrocautery procedure', 'Colonoscopy', 'Extraction of cataract'];

export const medicalFaker = {
  investigation_panel: () => faker.helpers.arrayElement(INVESTIGATIONS_PANEL),
  investigation_single: () => faker.helpers.arrayElement(INVESTIGATIONS_SINGLE),
  investigation_radiology: () => faker.helpers.arrayElement(INVESTIGATIONS_RADIOLOGY),
  procedure: () => faker.helpers.arrayElement(PROCEDURES),
};
