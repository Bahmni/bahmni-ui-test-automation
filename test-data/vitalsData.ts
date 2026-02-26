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
};
