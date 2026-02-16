/**
 * Admission Letter test data
 * Uses faker to generate random admission letter data
 */

// Admission letter data type
export interface AdmissionLetterData {
  referringToHospital: string;
  comments: string;
  referredToDoctor: string;
}

export const admissionLetterFaker = {
  /**
   * Generate a simple admission letter
   */
  simpleAdmissionLetter: (): AdmissionLetterData => ({
    referringToHospital: 'City General Hospital',
    comments: 'Patient requires specialized care',
    referredToDoctor: 'Dr. John Smith',
  }),
};
