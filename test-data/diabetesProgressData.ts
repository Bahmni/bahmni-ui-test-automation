export interface DiabetesProgressData {
  lastPatientVisitDate: string;
  lastHbA1cDate: string;
  lastA1CResult: string;
  footExamination: string;
  lastEyeExamDate: string;
  eyeExaminationFindings: string;
}

export const diabetesProgressFaker = {
  simpleProgress: (): DiabetesProgressData => ({
    lastPatientVisitDate: '2026-03-01',
    lastHbA1cDate: '2026-02-15',
    lastA1CResult: '6.8',
    footExamination: 'Normal - no abnormalities detected',
    lastEyeExamDate: '2026-01-10',
    eyeExaminationFindings: 'No diabetic retinopathy',
  }),
};
