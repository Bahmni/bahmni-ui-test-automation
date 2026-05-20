/**
 * Investigation and Procedure test data
 * Uses faker to randomly select from predefined medical data
 */

import { faker } from '@faker-js/faker';

const INVESTIGATIONS_PANEL = [
  'Complete blood count (auto) (Panel)',
  'Liver function tests (Panel)',
  'Lipid panel (Panel)',
  'Bone marrow test (Panel)',
  'Cancer marker panel (Panel)',
];

const INVESTIGATIONS_SINGLE = [
  'Absolute eosinophil count',
  'White blood cells',
  'Urine bile pigment test',
  'Fasting blood glucose measurement (mg/dL)',
];

const INVESTIGATIONS_RADIOLOGY = [
  'X-ray of chest, four views',
  'X-ray of bilateral ribs, 2 views',
  'X-ray of right elbow, two views',
  'fluoroscopy, esophagus',
  'CT scan, pelvis',
];

const PROCEDURES = ['Electrocautery procedure', 'Colonoscopy', 'Extraction of cataract'];

export const medicalFaker = {
  investigation_panel: () => faker.helpers.arrayElement(INVESTIGATIONS_PANEL),
  investigation_single: () => faker.helpers.arrayElement(INVESTIGATIONS_SINGLE),
  investigation_radiology: () => faker.helpers.arrayElement(INVESTIGATIONS_RADIOLOGY),
  procedure: () => faker.helpers.arrayElement(PROCEDURES),
};
