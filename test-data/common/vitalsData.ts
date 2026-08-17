/**
 * Vitals test data
 * Provides normal vital sign values for use in automation tests
 */

export interface VitalsNotes {
  pulse?: string;
  temperature?: string;
  systolicBP?: string;
  diastolicBP?: string;
}

export interface VitalsData {
  pulse: string;
  oxygenSaturation: string;
  respiratoryRate: string;
  temperature: string;
  systolicBP: string;
  diastolicBP: string;
  bodyPosition: string;
  notes?: VitalsNotes;
}

export const vitalsFaker = {
  /**
   * Generate normal vitals data with notes
   */
  normalVitals: (): VitalsData => ({
    pulse: '72',
    oxygenSaturation: '98',
    respiratoryRate: '16',
    temperature: '98.6',
    systolicBP: '120',
    diastolicBP: '80',
    bodyPosition: 'sitting',
    notes: {
      pulse: 'Pulse is normal',
      temperature: 'Temperature is normal',
      systolicBP: 'Systolic BP is normal',
      diastolicBP: 'Diastolic BP is normal',
    },
  }),

  /**
   * Values used to edit a previously saved Vitals form, distinct from
   * normalVitals() so the edit test can assert the change.
   */
  editedVitals: (): VitalsData => ({
    pulse: '80',
    oxygenSaturation: '97',
    respiratoryRate: '18',
    temperature: '99.2',
    systolicBP: '118',
    diastolicBP: '76',
    bodyPosition: 'standing',
  }),

  /**
   * Pulse, temperature, and systolic BP are pushed far outside the form's
   * normal ranges (60-100, 95-99.6, 100-140 for an adult) so the view-form
   * modal renders them as abnormal (red) text regardless of the patient's
   * age - test patients get a random birthdate (1-80 years), and Bahmni
   * applies age-banded normal ranges for some vitals (e.g. a toddler's
   * normal pulse runs well above 100), so a mildly-abnormal adult value
   * like 160 bpm is not guaranteed to be flagged for a young patient.
   * Oxygen saturation is used as the "stays normal" contrast value since
   * its threshold (>95) doesn't vary by age. Notes are added for a couple
   * of the abnormal fields.
   */
  abnormalVitals: (): VitalsData => ({
    pulse: '220',
    oxygenSaturation: '98',
    respiratoryRate: '16',
    temperature: '107',
    systolicBP: '220',
    diastolicBP: '78',
    bodyPosition: 'sitting',
    notes: {
      pulse: 'Pulse is dangerously elevated - tachycardia observed',
      temperature: 'High fever noted, patient feels unwell',
    },
  }),
};
