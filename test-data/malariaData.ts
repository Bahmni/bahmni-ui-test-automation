export interface MalariaData {
  malarialProphylaxis: 'Yes' | 'No';
  antiMalarialGiven: 'Yes' | 'No' | 'Unknown';
  rapidTestResult: string;
  malariaRisk: string;
  source: string;
  currentlyPregnant: 'Yes' | 'No';
  problemSeverity: string;
  treatmentStartDate: string;
}

export const malariaFaker = {
  simpleMalaria: (): MalariaData => ({
    malarialProphylaxis: 'No',
    antiMalarialGiven: 'Yes',
    rapidTestResult: 'Positive for Plasmodium falciparum',
    malariaRisk: 'High',
    source: 'PCD - Passive Case Detection',
    currentlyPregnant: 'No',
    problemSeverity: 'Moderate',
    treatmentStartDate: '2026-03-10',
  }),
};
